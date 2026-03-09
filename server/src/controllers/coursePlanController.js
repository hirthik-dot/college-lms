/**
 * Course Plan Controller
 * Handles all course-plan-related API logic for faculty, HOD, and students.
 */

const path = require('path');
const fs = require('fs');
const { query, getClient } = require('../config/database');
const { parseCoursePlan } = require('../utils/coursePlanParser');

// ═══════════════════════════════════════════════════════════════
// FACULTY ENDPOINTS
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/faculty/course-plan/upload
 * Upload a .docx course plan, parse it, and save to DB.
 */
const uploadCoursePlan = async (req, res) => {
    const client = await getClient();
    try {
        const facultyId = req.user.id;
        const { subjectId } = req.body;

        if (!subjectId) {
            return res.status(400).json({ success: false, message: 'subjectId is required.' });
        }
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded. Please upload a .docx file.' });
        }

        // Validate faculty is assigned to this subject
        const subjectCheck = await query(
            'SELECT id, name, code FROM subjects WHERE id = $1 AND staff_id = $2',
            [subjectId, facultyId]
        );
        if (subjectCheck.rows.length === 0) {
            return res.status(403).json({ success: false, message: 'You are not assigned to this subject.' });
        }

        // Parse the document
        let parsed;
        try {
            parsed = await parseCoursePlan(req.file.buffer || fs.readFileSync(req.file.path));
        } catch (parseErr) {
            const msg = parseErr.message;
            if (msg === 'COURSE_PLAN_NOT_FOUND') {
                return res.status(400).json({
                    success: false,
                    message: 'Course Plan table not found. Please upload a Course Information Sheet document.',
                });
            }
            if (msg === 'INSUFFICIENT_TOPICS') {
                return res.status(400).json({
                    success: false,
                    message: 'Fewer than 5 topics found in the document. Please check the file format.',
                });
            }
            return res.status(400).json({
                success: false,
                message: 'Failed to parse document: ' + msg,
            });
        }

        // Save file to disk
        const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'course-plans');
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

        const fileName = `${facultyId}_${subjectId}_${Date.now()}${path.extname(req.file.originalname)}`;
        const filePath = path.join(uploadsDir, fileName);

        if (req.file.buffer) {
            fs.writeFileSync(filePath, req.file.buffer);
        } else if (req.file.path) {
            fs.renameSync(req.file.path, filePath);
        }

        const fileUrl = `/uploads/course-plans/${fileName}`;

        // Begin transaction
        await client.query('BEGIN');

        // Deactivate previous uploads for this faculty+subject
        await client.query(
            'UPDATE course_plan_uploads SET is_active = false WHERE faculty_id = $1 AND subject_id = $2 AND is_active = true',
            [facultyId, subjectId]
        );

        // Insert course_plan_uploads
        const uploadResult = await client.query(
            `INSERT INTO course_plan_uploads
             (faculty_id, subject_id, original_filename, file_url, academic_year, subject_code, subject_name, total_theory_hours, total_lab_hours)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
            [
                facultyId, subjectId, req.file.originalname, fileUrl,
                parsed.academicYear, parsed.subjectCode, parsed.subjectName,
                parsed.totalTheoryHours, parsed.totalLabHours,
            ]
        );
        const uploadId = uploadResult.rows[0].id;

        // Insert course_plan_topics
        for (const unit of parsed.units) {
            for (const topic of unit.topics) {
                await client.query(
                    `INSERT INTO course_plan_topics
                     (upload_id, faculty_id, subject_id, unit_name, unit_target_hours, sno, periods_required, topic_name, reference_book, teaching_method, co_bloom, display_order)
                     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
                    [
                        uploadId, facultyId, subjectId,
                        unit.unitName, unit.targetHours,
                        topic.sno, topic.periodsRequired, topic.topicName,
                        topic.referenceBook, topic.teachingMethod, topic.coBloom,
                        topic.displayOrder,
                    ]
                );
            }
        }

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            data: {
                uploadId,
                totalTopics: parsed.totalTopics,
                units: parsed.units.map(u => ({ unitName: u.unitName, topicCount: u.topics.length })),
                parseErrors: parsed.parseErrors,
            },
        });
    } catch (error) {
        await client.query('ROLLBACK').catch(() => { });
        console.error('uploadCoursePlan error:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    } finally {
        client.release();
    }
};

/**
 * GET /api/faculty/course-plan/:subjectId
 * Get active course plan for this faculty + subject.
 */
const getCoursePlan = async (req, res) => {
    try {
        const facultyId = req.user.id;
        const { subjectId } = req.params;

        // Get active upload
        const uploadResult = await query(
            `SELECT * FROM course_plan_uploads
             WHERE faculty_id = $1 AND subject_id = $2 AND is_active = true
             ORDER BY uploaded_at DESC LIMIT 1`,
            [facultyId, subjectId]
        );

        if (uploadResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'No course plan uploaded yet.' });
        }

        const upload = uploadResult.rows[0];

        // Get all topics
        const topicsResult = await query(
            `SELECT cpt.*,
                    thr.id AS report_id, thr.submitted_at AS report_submitted_at,
                    (SELECT COUNT(*) FROM topic_materials tm WHERE tm.topic_id = cpt.id) AS materials_count
             FROM course_plan_topics cpt
             LEFT JOIN topic_hour_reports thr ON thr.topic_id = cpt.id
             WHERE cpt.upload_id = $1
             ORDER BY cpt.display_order`,
            [upload.id]
        );

        // Group by unit
        const unitMap = new Map();
        for (const topic of topicsResult.rows) {
            if (!unitMap.has(topic.unit_name)) {
                unitMap.set(topic.unit_name, {
                    unitName: topic.unit_name,
                    targetHours: topic.unit_target_hours,
                    topics: [],
                    completed: 0,
                    total: 0,
                });
            }
            const unit = unitMap.get(topic.unit_name);
            unit.topics.push(topic);
            unit.total++;
            if (topic.status === 'completed') unit.completed++;
        }

        const units = Array.from(unitMap.values());
        const totalCompleted = units.reduce((s, u) => s + u.completed, 0);
        const totalTopics = units.reduce((s, u) => s + u.total, 0);

        res.json({
            success: true,
            data: {
                upload,
                units,
                stats: {
                    completed: totalCompleted,
                    pending: totalTopics - totalCompleted,
                    total: totalTopics,
                    percentage: totalTopics > 0 ? Math.round((totalCompleted / totalTopics) * 100) : 0,
                },
            },
        });
    } catch (error) {
        console.error('getCoursePlan error:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

/**
 * GET /api/faculty/course-plan/topic/:topicId
 * Get single topic full details.
 */
const getTopicDetails = async (req, res) => {
    try {
        const facultyId = req.user.id;
        const { topicId } = req.params;

        const topicResult = await query(
            `SELECT cpt.*,
                    cpu.subject_name, cpu.subject_code, cpu.academic_year
             FROM course_plan_topics cpt
             JOIN course_plan_uploads cpu ON cpu.id = cpt.upload_id
             WHERE cpt.id = $1 AND cpt.faculty_id = $2`,
            [topicId, facultyId]
        );

        if (topicResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Topic not found or not yours.' });
        }

        const topic = topicResult.rows[0];

        // Get materials
        const materialsResult = await query(
            'SELECT * FROM topic_materials WHERE topic_id = $1 ORDER BY uploaded_at',
            [topicId]
        );

        // Get report if completed
        let report = null;
        if (topic.status === 'completed') {
            const reportResult = await query(
                'SELECT * FROM topic_hour_reports WHERE topic_id = $1',
                [topicId]
            );
            if (reportResult.rows.length > 0) report = reportResult.rows[0];
        }

        res.json({
            success: true,
            data: {
                topic,
                materials: materialsResult.rows,
                report,
            },
        });
    } catch (error) {
        console.error('getTopicDetails error:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

/**
 * POST /api/faculty/course-plan/topic/:topicId/report
 * Submit hour report for a topic — marks as completed and releases materials.
 */
const submitTopicReport = async (req, res) => {
    const client = await getClient();
    try {
        const facultyId = req.user.id;
        const { topicId } = req.params;
        const { whatWasCovered } = req.body;

        if (!whatWasCovered || whatWasCovered.trim().length < 20) {
            return res.status(400).json({
                success: false,
                message: 'Please describe what was covered (at least 20 characters).',
            });
        }
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Proof image is required.' });
        }

        // Validate topic belongs to faculty and is pending
        const topicResult = await query(
            'SELECT * FROM course_plan_topics WHERE id = $1 AND faculty_id = $2',
            [topicId, facultyId]
        );
        if (topicResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Topic not found or not yours.' });
        }
        const topic = topicResult.rows[0];
        if (topic.status === 'completed') {
            return res.status(400).json({ success: false, message: 'This topic has already been submitted.' });
        }

        // Save proof image
        const proofDir = path.join(__dirname, '..', '..', 'uploads', 'proof-images');
        if (!fs.existsSync(proofDir)) fs.mkdirSync(proofDir, { recursive: true });

        const proofName = `proof_${topicId}_${Date.now()}${path.extname(req.file.originalname)}`;
        const proofPath = path.join(proofDir, proofName);

        if (req.file.buffer) {
            fs.writeFileSync(proofPath, req.file.buffer);
        } else if (req.file.path) {
            fs.renameSync(req.file.path, proofPath);
        }

        const proofImageUrl = `/uploads/proof-images/${proofName}`;

        await client.query('BEGIN');

        // Insert hour report
        await client.query(
            `INSERT INTO topic_hour_reports (topic_id, faculty_id, subject_id, what_was_covered, proof_image_url)
             VALUES ($1, $2, $3, $4, $5)`,
            [topicId, facultyId, topic.subject_id, whatWasCovered.trim(), proofImageUrl]
        );

        // Mark topic as completed
        await client.query(
            `UPDATE course_plan_topics SET status = 'completed', completed_at = NOW() WHERE id = $1`,
            [topicId]
        );

        // Release unreleased materials
        const releasedMats = await client.query(
            `UPDATE topic_materials SET is_released = true, released_at = NOW()
             WHERE topic_id = $1 AND is_released = false
             RETURNING *`,
            [topicId]
        );
        const materialsReleased = releasedMats.rows.length;

        // Find enrolled students
        const studentsResult = await client.query(
            `SELECT u.id, u.full_name, u.email
             FROM subject_enrollments se
             JOIN users u ON u.id = se.student_id
             WHERE se.subject_id = $1`,
            [topic.subject_id]
        );
        const studentsNotified = studentsResult.rows.length;

        // Create notifications for each student × each material
        for (const student of studentsResult.rows) {
            for (const material of releasedMats.rows) {
                await client.query(
                    `INSERT INTO student_material_notifications (topic_id, student_id, material_id)
                     VALUES ($1, $2, $3)`,
                    [topicId, student.id, material.id]
                );
            }
        }

        await client.query('COMMIT');

        // Send emails asynchronously (fire and forget)
        try {
            const { sendMaterialReleasedEmail } = require('../utils/emailService');
            const subjectResult = await query('SELECT name FROM subjects WHERE id = $1', [topic.subject_id]);
            const subjectName = subjectResult.rows[0]?.name || '';

            for (const student of studentsResult.rows) {
                sendMaterialReleasedEmail(
                    student.email,
                    student.full_name,
                    req.user.full_name,
                    topic.topic_name,
                    subjectName,
                    materialsReleased,
                    process.env.APP_URL || 'http://localhost:5173'
                ).catch(err => console.error('Email send error:', err.message));
            }
        } catch (emailErr) {
            console.warn('Email service not configured:', emailErr.message);
        }

        res.json({
            success: true,
            data: { materialsReleased, studentsNotified },
            message: `Hour submitted. ${materialsReleased} materials released to ${studentsNotified} students.`,
        });
    } catch (error) {
        await client.query('ROLLBACK').catch(() => { });
        console.error('submitTopicReport error:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    } finally {
        client.release();
    }
};

/**
 * POST /api/faculty/course-plan/topic/:topicId/materials
 * Add a material (pre-linked) to a topic.
 */
const addTopicMaterial = async (req, res) => {
    try {
        const facultyId = req.user.id;
        const { topicId } = req.params;
        const { title, description, materialType, url } = req.body;

        if (!title || title.trim().length === 0) {
            return res.status(400).json({ success: false, message: 'Title is required.' });
        }

        // Validate topic belongs to faculty
        const topicResult = await query(
            'SELECT * FROM course_plan_topics WHERE id = $1 AND faculty_id = $2',
            [topicId, facultyId]
        );
        if (topicResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Topic not found or not yours.' });
        }

        let fileUrl = url || '';
        const addedWhen = req.body.addedWhen || 'pre_linked';

        // If file uploaded, save it
        if (req.file) {
            const matDir = path.join(__dirname, '..', '..', 'uploads', 'topic-materials');
            if (!fs.existsSync(matDir)) fs.mkdirSync(matDir, { recursive: true });

            const matName = `mat_${topicId}_${Date.now()}${path.extname(req.file.originalname)}`;
            const matPath = path.join(matDir, matName);

            if (req.file.buffer) {
                fs.writeFileSync(matPath, req.file.buffer);
            } else if (req.file.path) {
                fs.renameSync(req.file.path, matPath);
            }

            fileUrl = `/uploads/topic-materials/${matName}`;
        }

        if (!fileUrl) {
            return res.status(400).json({ success: false, message: 'File or URL is required.' });
        }

        const result = await query(
            `INSERT INTO topic_materials
             (topic_id, faculty_id, subject_id, title, description, material_type, file_url, added_when)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [
                topicId, facultyId, topicResult.rows[0].subject_id,
                title.trim(), description || '', materialType || 'other',
                fileUrl, addedWhen,
            ]
        );

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('addTopicMaterial error:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

/**
 * DELETE /api/faculty/course-plan/material/:materialId
 * Delete an unreleased material.
 */
const deleteMaterial = async (req, res) => {
    try {
        const facultyId = req.user.id;
        const { materialId } = req.params;

        const matResult = await query(
            'SELECT * FROM topic_materials WHERE id = $1 AND faculty_id = $2',
            [materialId, facultyId]
        );
        if (matResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Material not found.' });
        }

        const material = matResult.rows[0];
        if (material.is_released) {
            return res.status(400).json({ success: false, message: 'Cannot delete released material.' });
        }

        // Delete file from disk
        if (material.file_url && material.file_url.startsWith('/uploads/')) {
            const filePath = path.join(__dirname, '..', '..', material.file_url);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        await query('DELETE FROM topic_materials WHERE id = $1', [materialId]);

        res.json({ success: true, message: 'Material deleted.' });
    } catch (error) {
        console.error('deleteMaterial error:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

// ═══════════════════════════════════════════════════════════════
// HOD ENDPOINTS
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/hod/course-plan/reports
 * Paginated list of submitted topic_hour_reports with filters.
 */
const getHodReports = async (req, res) => {
    try {
        const { facultyId, subjectId, unitName, startDate, endDate, status, page = 1, limit = 20 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let whereConditions = [];
        let params = [];
        let paramIndex = 1;

        if (facultyId) {
            whereConditions.push(`thr.faculty_id = $${paramIndex++}`);
            params.push(facultyId);
        }
        if (subjectId) {
            whereConditions.push(`thr.subject_id = $${paramIndex++}`);
            params.push(subjectId);
        }
        if (unitName) {
            whereConditions.push(`cpt.unit_name ILIKE $${paramIndex++}`);
            params.push(`%${unitName}%`);
        }
        if (startDate) {
            whereConditions.push(`thr.submitted_at >= $${paramIndex++}`);
            params.push(startDate);
        }
        if (endDate) {
            whereConditions.push(`thr.submitted_at <= $${paramIndex++}`);
            params.push(endDate + ' 23:59:59');
        }

        const whereClause = whereConditions.length > 0
            ? 'WHERE ' + whereConditions.join(' AND ')
            : "WHERE thr.submitted_at >= NOW() - INTERVAL '30 days'";

        // Count query
        const countSql = `
            SELECT COUNT(*) AS total
            FROM topic_hour_reports thr
            JOIN course_plan_topics cpt ON cpt.id = thr.topic_id
            ${whereClause}`;
        const countResult = await query(countSql, params);
        const total = parseInt(countResult.rows[0].total);

        // Data query
        const dataSql = `
            SELECT thr.*, cpt.topic_name, cpt.unit_name, cpt.sno, cpt.periods_required,
                   cpt.co_bloom, cpt.teaching_method, cpt.reference_book,
                   u.full_name AS faculty_name,
                   s.name AS subject_name, s.code AS subject_code,
                   (SELECT json_agg(json_build_object('id', tm.id, 'title', tm.title, 'material_type', tm.material_type, 'file_url', tm.file_url, 'released_at', tm.released_at))
                    FROM topic_materials tm WHERE tm.topic_id = cpt.id AND tm.is_released = true) AS materials
            FROM topic_hour_reports thr
            JOIN course_plan_topics cpt ON cpt.id = thr.topic_id
            JOIN users u ON u.id = thr.faculty_id
            JOIN subjects s ON s.id = thr.subject_id
            ${whereClause}
            ORDER BY thr.submitted_at DESC
            LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        params.push(parseInt(limit), offset);

        const dataResult = await query(dataSql, params);

        res.json({
            success: true,
            data: {
                reports: dataResult.rows,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / parseInt(limit)),
                },
            },
        });
    } catch (error) {
        console.error('getHodReports error:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

/**
 * GET /api/hod/course-plan/summary
 * Department-wide course plan stats.
 */
const getHodSummary = async (req, res) => {
    try {
        // Overall stats
        const overallResult = await query(`
            SELECT
                COUNT(*) AS total_topics,
                COUNT(*) FILTER (WHERE cpt.status = 'completed') AS completed_topics,
                COALESCE(SUM(cpt.periods_required), 0) AS total_planned_hours,
                COALESCE(SUM(cpt.periods_required) FILTER (WHERE cpt.status = 'completed'), 0) AS completed_hours
            FROM course_plan_topics cpt
            JOIN course_plan_uploads cpu ON cpu.id = cpt.upload_id AND cpu.is_active = true
        `);

        const overall = overallResult.rows[0];
        const totalPlannedHours = parseInt(overall.total_planned_hours);
        const completedHours = parseInt(overall.completed_hours);

        // Per-subject breakdown
        const perSubjectResult = await query(`
            SELECT s.name AS subject_name, s.code AS subject_code,
                   u.full_name AS faculty_name,
                   COUNT(*) AS total_topics,
                   COUNT(*) FILTER (WHERE cpt.status = 'completed') AS completed_topics,
                   COALESCE(SUM(cpt.periods_required), 0) AS planned_hours,
                   COALESCE(SUM(cpt.periods_required) FILTER (WHERE cpt.status = 'completed'), 0) AS completed_hours
            FROM course_plan_topics cpt
            JOIN course_plan_uploads cpu ON cpu.id = cpt.upload_id AND cpu.is_active = true
            JOIN subjects s ON s.id = cpt.subject_id
            JOIN users u ON u.id = cpt.faculty_id
            GROUP BY s.id, s.name, s.code, u.full_name
            ORDER BY s.name
        `);

        // Active counts
        const activeResult = await query(`
            SELECT
                COUNT(DISTINCT cpu.subject_id) AS active_subjects,
                COUNT(DISTINCT cpu.faculty_id) AS active_faculty
            FROM course_plan_uploads cpu WHERE cpu.is_active = true
        `);

        res.json({
            success: true,
            data: {
                totalPlannedHours,
                totalCompletedHours: completedHours,
                totalPendingHours: totalPlannedHours - completedHours,
                completionPercentage: totalPlannedHours > 0 ? Math.round((completedHours / totalPlannedHours) * 100) : 0,
                activeSubjects: parseInt(activeResult.rows[0].active_subjects),
                activeFaculty: parseInt(activeResult.rows[0].active_faculty),
                subjects: perSubjectResult.rows.map(row => ({
                    subjectName: row.subject_name,
                    subjectCode: row.subject_code,
                    facultyName: row.faculty_name,
                    planned: parseInt(row.planned_hours),
                    completed: parseInt(row.completed_hours),
                    percentage: parseInt(row.planned_hours) > 0
                        ? Math.round((parseInt(row.completed_hours) / parseInt(row.planned_hours)) * 100) : 0,
                })),
            },
        });
    } catch (error) {
        console.error('getHodSummary error:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

// ═══════════════════════════════════════════════════════════════
// STUDENT ENDPOINTS
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/student/materials/:subjectId
 * Get all released topic_materials for a subject the student is enrolled in.
 */
const getStudentMaterials = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { subjectId } = req.params;

        // Check enrollment
        const enrollCheck = await query(
            'SELECT id FROM subject_enrollments WHERE student_id = $1 AND subject_id = $2',
            [studentId, subjectId]
        );
        if (enrollCheck.rows.length === 0) {
            return res.status(403).json({ success: false, message: 'You are not enrolled in this subject.' });
        }

        const result = await query(
            `SELECT tm.*, cpt.topic_name, cpt.unit_name,
                    CASE WHEN tm.released_at > NOW() - INTERVAL '24 hours' THEN true ELSE false END AS is_new
             FROM topic_materials tm
             JOIN course_plan_topics cpt ON cpt.id = tm.topic_id
             WHERE tm.subject_id = $1 AND tm.is_released = true
             ORDER BY cpt.display_order, tm.uploaded_at`,
            [subjectId]
        );

        // Group by topic
        const grouped = {};
        for (const mat of result.rows) {
            if (!grouped[mat.topic_name]) {
                grouped[mat.topic_name] = {
                    topicName: mat.topic_name,
                    unitName: mat.unit_name,
                    materials: [],
                };
            }
            grouped[mat.topic_name].materials.push(mat);
        }

        res.json({ success: true, data: Object.values(grouped) });
    } catch (error) {
        console.error('getStudentMaterials error:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

/**
 * GET /api/student/notifications/materials
 * Get unread material notifications.
 */
const getStudentNotifications = async (req, res) => {
    try {
        const studentId = req.user.id;

        const result = await query(
            `SELECT smn.*, cpt.topic_name, s.name AS subject_name, s.id AS subject_id,
                    tm.title AS material_title, tm.material_type
             FROM student_material_notifications smn
             JOIN course_plan_topics cpt ON cpt.id = smn.topic_id
             JOIN topic_materials tm ON tm.id = smn.material_id
             JOIN subjects s ON s.id = cpt.subject_id
             WHERE smn.student_id = $1
             ORDER BY smn.notified_at DESC
             LIMIT 50`,
            [studentId]
        );

        const unreadCount = result.rows.filter(n => !n.is_read).length;

        res.json({
            success: true,
            data: {
                notifications: result.rows,
                unreadCount,
            },
        });
    } catch (error) {
        console.error('getStudentNotifications error:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

/**
 * PUT /api/student/notifications/:notificationId/read
 * Mark notification as read.
 */
const markNotificationRead = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { notificationId } = req.params;

        const result = await query(
            'UPDATE student_material_notifications SET is_read = true WHERE id = $1 AND student_id = $2 RETURNING *',
            [notificationId, studentId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Notification not found.' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('markNotificationRead error:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

/**
 * PUT /api/student/notifications/mark-all-read
 * Mark all notifications as read for this student.
 */
const markAllNotificationsRead = async (req, res) => {
    try {
        const studentId = req.user.id;

        await query(
            'UPDATE student_material_notifications SET is_read = true WHERE student_id = $1 AND is_read = false',
            [studentId]
        );

        res.json({ success: true, message: 'All notifications marked as read.' });
    } catch (error) {
        console.error('markAllNotificationsRead error:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

module.exports = {
    uploadCoursePlan,
    getCoursePlan,
    getTopicDetails,
    submitTopicReport,
    addTopicMaterial,
    deleteMaterial,
    getHodReports,
    getHodSummary,
    getStudentMaterials,
    getStudentNotifications,
    markNotificationRead,
    markAllNotificationsRead,
};
