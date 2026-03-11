/**
 * Timetable Controller
 * Handles all timetable-related API endpoints for HOD, Staff, and Students.
 */

const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { query } = require('../config/database');
const { parseTimetablePDF, HOUR_TIMES, DAYS } = require('../services/timetableParser');
const { seedTimetable } = require('../services/timetableSeeder');

// ═══════════════════════════════════════════════════════════════
// HOD ENDPOINTS
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/hod/timetable/upload
 * Upload and parse a timetable PDF.
 */
const uploadTimetable = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No PDF file uploaded. Please upload a timetable PDF.',
            });
        }

        const hodId = req.user.id;
        const filename = req.file.originalname;

        // Save file to disk
        const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'timetables');
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

        const savedName = `timetable_${Date.now()}${path.extname(filename)}`;
        const savedPath = path.join(uploadsDir, savedName);

        if (req.file.buffer) {
            fs.writeFileSync(savedPath, req.file.buffer);
        } else if (req.file.path) {
            fs.copyFileSync(req.file.path, savedPath);
        }

        // Parse PDF
        const buffer = req.file.buffer || fs.readFileSync(savedPath);
        const parsedData = await parseTimetablePDF(buffer);

        if (!parsedData.faculty || parsedData.faculty.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No faculty timetables found in the PDF. Please check the file format.',
                errors: parsedData.errors,
            });
        }

        // Seed database
        const seedResult = await seedTimetable(parsedData, hodId, filename);

        if (!seedResult.success) {
            return res.status(500).json({
                success: false,
                message: 'Timetable parsing succeeded but database seeding failed.',
                error: seedResult.error,
                parsedStaff: parsedData.totalStaff,
            });
        }

        res.json({
            success: true,
            message: `✅ ${seedResult.staffCreated + seedResult.staffUpdated} staff parsed | ${seedResult.slotsCreated} slots created | ${seedResult.subjectsCreated} subjects found | ${seedResult.errors.length} errors`,
            data: {
                uploadId: seedResult.uploadId,
                staffParsed: seedResult.staffCreated + seedResult.staffUpdated,
                staffCreated: seedResult.staffCreated,
                staffUpdated: seedResult.staffUpdated,
                slotsCreated: seedResult.slotsCreated,
                classesCreated: seedResult.classesCreated,
                subjectsCreated: seedResult.subjectsCreated,
                assignmentsCreated: seedResult.assignmentsCreated,
                errors: seedResult.errors,
                staffGmails: seedResult.staffGmails,
                defaultPassword: 'hitech@123',
            },
        });
    } catch (error) {
        console.error('uploadTimetable error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process timetable PDF: ' + error.message,
        });
    }
};

/**
 * GET /api/hod/timetable/staff-wise
 * Return all staff with their timetable grids.
 */
const getStaffWiseTimetable = async (req, res) => {
    try {
        const { staff_id } = req.query;

        let sql = `
            SELECT fts.*, 
                   u.full_name AS staff_name,
                   s.name AS subject_name, s.code AS subject_code,
                   c.name AS class_name,
                   sp.staff_code, sp.designation
            FROM faculty_timetable_slots fts
            JOIN users u ON u.id = fts.staff_id
            LEFT JOIN subjects s ON s.id = fts.subject_id
            LEFT JOIN classes c ON c.id = fts.class_id
            LEFT JOIN staff_profiles sp ON sp.user_id = fts.staff_id
            WHERE fts.academic_year = '2025-2026'`;
        const params = [];

        if (staff_id) {
            sql += ` AND fts.staff_id = $1`;
            params.push(staff_id);
        }

        sql += ` ORDER BY u.full_name, 
                 CASE fts.day WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 
                      WHEN 'Wednesday' THEN 3 WHEN 'Thursday' THEN 4 
                      WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6 END,
                 fts.hour_number`;

        const result = await query(sql, params);

        // Group by staff
        const staffMap = {};
        for (const row of result.rows) {
            if (!staffMap[row.staff_id]) {
                staffMap[row.staff_id] = {
                    id: row.staff_id,
                    name: row.staff_name,
                    staff_code: row.staff_code,
                    designation: row.designation,
                    slots: [],
                };
            }
            staffMap[row.staff_id].slots.push({
                day: row.day,
                hour: row.hour_number,
                start_time: row.start_time,
                end_time: row.end_time,
                subject_code: row.subject_code || row.raw_class_name || '',
                subject_name: row.subject_name || '',
                class_name: row.class_name || row.raw_class_name || '',
                slot_type: row.slot_type,
                is_non_teaching: row.is_non_teaching,
                is_cross_dept: row.is_cross_dept,
                is_practical_span: row.is_practical_span,
                practical_pair_hour: row.practical_pair_hour,
            });
        }

        res.json({
            success: true,
            data: Object.values(staffMap),
        });
    } catch (error) {
        console.error('getStaffWiseTimetable error:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

/**
 * GET /api/hod/timetable/class-wise
 * Return all classes with their timetable grids.
 */
const getClassWiseTimetable = async (req, res) => {
    try {
        const { class_id } = req.query;

        let sql = `
            SELECT cts.*,
                   c.name AS class_name, c.year, c.section, c.department,
                   u.full_name AS staff_name,
                   s.name AS subject_name, s.code AS subject_code,
                   sp.staff_code
            FROM class_timetable_slots cts
            JOIN classes c ON c.id = cts.class_id
            LEFT JOIN users u ON u.id = cts.staff_id
            LEFT JOIN subjects s ON s.id = cts.subject_id
            LEFT JOIN staff_profiles sp ON sp.user_id = cts.staff_id
            WHERE cts.academic_year = '2025-2026'`;
        const params = [];

        if (class_id) {
            sql += ` AND cts.class_id = $1`;
            params.push(class_id);
        }

        sql += ` ORDER BY c.name,
                 CASE cts.day WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2
                      WHEN 'Wednesday' THEN 3 WHEN 'Thursday' THEN 4
                      WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6 END,
                 cts.hour_number`;

        const result = await query(sql, params);

        // Group by class
        const classMap = {};
        for (const row of result.rows) {
            if (!classMap[row.class_id]) {
                classMap[row.class_id] = {
                    id: row.class_id,
                    name: row.class_name,
                    year: row.year,
                    section: row.section,
                    department: row.department,
                    slots: [],
                };
            }
            classMap[row.class_id].slots.push({
                day: row.day,
                hour: row.hour_number,
                start_time: row.start_time,
                end_time: row.end_time,
                subject_code: row.subject_code || '',
                subject_name: row.subject_name || '',
                staff_name: row.staff_name || '',
                staff_code: row.staff_code || '',
                slot_type: row.slot_type,
                is_non_teaching: row.is_non_teaching,
            });
        }

        res.json({
            success: true,
            data: Object.values(classMap),
        });
    } catch (error) {
        console.error('getClassWiseTimetable error:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

/**
 * GET /api/hod/timetable/upload-history
 */
const getUploadHistory = async (req, res) => {
    try {
        const result = await query(
            `SELECT tu.*, u.full_name AS uploaded_by_name
             FROM timetable_uploads tu
             LEFT JOIN users u ON u.id = tu.uploaded_by
             ORDER BY tu.uploaded_at DESC
             LIMIT 20`
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('getUploadHistory error:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

/**
 * GET /api/hod/timetable/classes
 * Return list of all classes for dropdown.
 */
const getAllClasses = async (req, res) => {
    try {
        const result = await query(
            'SELECT * FROM classes ORDER BY year, department, section'
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('getAllClasses error:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

/**
 * GET /api/hod/timetable/staff-list
 * Return list of all staff for dropdown.
 */
const getStaffList = async (req, res) => {
    try {
        const result = await query(
            `SELECT u.id, u.full_name, u.gmail, sp.staff_code, sp.designation
             FROM users u
             LEFT JOIN staff_profiles sp ON sp.user_id = u.id
             WHERE u.role IN ('staff', 'hod') AND u.is_active = true
             ORDER BY u.full_name`
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('getStaffList error:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

// ═══════════════════════════════════════════════════════════════
// STAFF ENDPOINTS
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/staff/timetable/my
 * Return authenticated staff's full weekly timetable.
 */
const getMyTimetable = async (req, res) => {
    try {
        const staffId = req.user.id;

        const result = await query(
            `SELECT fts.*,
                    s.name AS subject_name, s.code AS subject_code,
                    c.name AS class_name
             FROM faculty_timetable_slots fts
             LEFT JOIN subjects s ON s.id = fts.subject_id
             LEFT JOIN classes c ON c.id = fts.class_id
             WHERE fts.staff_id = $1 AND fts.academic_year = '2025-2026'
             ORDER BY CASE fts.day WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2
                          WHEN 'Wednesday' THEN 3 WHEN 'Thursday' THEN 4
                          WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6 END,
                      fts.hour_number`,
            [staffId]
        );

        res.json({
            success: true,
            data: {
                slots: result.rows.map(r => ({
                    day: r.day,
                    hour: r.hour_number,
                    start_time: r.start_time,
                    end_time: r.end_time,
                    subject_code: r.subject_code || '',
                    subject_name: r.subject_name || r.raw_class_name || '',
                    class_name: r.class_name || r.raw_class_name || '',
                    slot_type: r.slot_type,
                    is_non_teaching: r.is_non_teaching,
                    is_cross_dept: r.is_cross_dept,
                    is_practical_span: r.is_practical_span,
                    practical_pair_hour: r.practical_pair_hour,
                })),
                hourTimes: HOUR_TIMES,
                days: DAYS,
            },
        });
    } catch (error) {
        console.error('getMyTimetable error:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

/**
 * GET /api/staff/timetable/today
 * Return today's slots for the authenticated staff.
 */
const getTodaySlots = async (req, res) => {
    try {
        const staffId = req.user.id;
        const now = new Date();
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const today = dayNames[now.getDay()];

        if (today === 'Sunday') {
            return res.json({
                success: true,
                data: { slots: [], today, message: 'No classes on Sunday.' },
            });
        }

        const result = await query(
            `SELECT fts.*,
                    s.name AS subject_name, s.code AS subject_code,
                    c.name AS class_name
             FROM faculty_timetable_slots fts
             LEFT JOIN subjects s ON s.id = fts.subject_id
             LEFT JOIN classes c ON c.id = fts.class_id
             WHERE fts.staff_id = $1 AND fts.day = $2 AND fts.academic_year = '2025-2026'
             ORDER BY fts.hour_number`,
            [staffId, today]
        );

        // Determine current slot
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTimeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

        const slots = result.rows.map(r => {
            const isCurrent = currentTimeStr >= r.start_time.substring(0, 5) &&
                currentTimeStr < r.end_time.substring(0, 5);
            return {
                ...r,
                subject_code: r.subject_code || '',
                subject_name: r.subject_name || r.raw_class_name || '',
                class_name: r.class_name || r.raw_class_name || '',
                is_current: isCurrent,
            };
        });

        res.json({
            success: true,
            data: { slots, today },
        });
    } catch (error) {
        console.error('getTodaySlots error:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

/**
 * GET /api/staff/timetable/current-slot
 * Return the current active slot for attendance.
 */
const getCurrentSlot = async (req, res) => {
    try {
        const staffId = req.user.id;
        const now = new Date();
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const today = dayNames[now.getDay()];

        if (today === 'Sunday') {
            return res.json({
                success: true,
                data: null,
                message: 'No class scheduled now (Sunday).',
            });
        }

        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}:00`;

        const result = await query(
            `SELECT fts.*,
                    s.name AS subject_name, s.code AS subject_code, s.id AS sub_id,
                    c.name AS class_name, c.id AS cls_id
             FROM faculty_timetable_slots fts
             LEFT JOIN subjects s ON s.id = fts.subject_id
             LEFT JOIN classes c ON c.id = fts.class_id
             WHERE fts.staff_id = $1 AND fts.day = $2
                   AND fts.start_time <= $3 AND fts.end_time > $3
                   AND fts.academic_year = '2025-2026'
             LIMIT 1`,
            [staffId, today, timeStr]
        );

        if (result.rows.length === 0) {
            return res.json({
                success: true,
                data: null,
                message: 'No class scheduled right now.',
            });
        }

        const row = result.rows[0];
        res.json({
            success: true,
            data: {
                subject_id: row.sub_id,
                subject_name: row.subject_name || '',
                subject_code: row.subject_code || '',
                class_id: row.cls_id,
                class_name: row.class_name || '',
                hour: row.hour_number,
                start_time: row.start_time,
                end_time: row.end_time,
                slot_type: row.slot_type,
                is_non_teaching: row.is_non_teaching,
            },
        });
    } catch (error) {
        console.error('getCurrentSlot error:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

// ═══════════════════════════════════════════════════════════════
// STUDENT ENDPOINTS
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/student/timetable/my
 * Return the student's class timetable.
 */
const getStudentTimetable = async (req, res) => {
    try {
        const studentId = req.user.id;

        // Find student's class
        const profileResult = await query(
            `SELECT sp.*, u.full_name
             FROM student_profiles sp
             JOIN users u ON u.id = sp.user_id
             WHERE sp.user_id = $1`,
            [studentId]
        );

        if (profileResult.rows.length === 0) {
            return res.json({
                success: true,
                data: { slots: [], hourTimes: HOUR_TIMES, days: DAYS, className: '' },
                message: 'No class profile found. Contact your department.',
            });
        }

        // Try to find class by student's batch/year info
        // For now, try matching by student's batch field or any enrolled subject's class
        const enrolledResult = await query(
            `SELECT DISTINCT cts.class_id, c.name AS class_name
             FROM class_timetable_slots cts
             JOIN classes c ON c.id = cts.class_id
             JOIN subjects s ON s.id = cts.subject_id
             JOIN subject_enrollments se ON se.subject_id = s.id AND se.student_id = $1
             WHERE cts.academic_year = '2025-2026'
             LIMIT 1`,
            [studentId]
        );

        if (enrolledResult.rows.length === 0) {
            return res.json({
                success: true,
                data: { slots: [], hourTimes: HOUR_TIMES, days: DAYS, className: '' },
                message: 'No timetable found for your class.',
            });
        }

        const classId = enrolledResult.rows[0].class_id;
        const className = enrolledResult.rows[0].class_name;

        const result = await query(
            `SELECT cts.*,
                    s.name AS subject_name, s.code AS subject_code,
                    u.full_name AS staff_name
             FROM class_timetable_slots cts
             LEFT JOIN subjects s ON s.id = cts.subject_id
             LEFT JOIN users u ON u.id = cts.staff_id
             WHERE cts.class_id = $1 AND cts.academic_year = '2025-2026'
             ORDER BY CASE cts.day WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2
                          WHEN 'Wednesday' THEN 3 WHEN 'Thursday' THEN 4
                          WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6 END,
                      cts.hour_number`,
            [classId]
        );

        res.json({
            success: true,
            data: {
                className,
                slots: result.rows.map(r => ({
                    day: r.day,
                    hour: r.hour_number,
                    start_time: r.start_time,
                    end_time: r.end_time,
                    subject_code: r.subject_code || '',
                    subject_name: r.subject_name || '',
                    staff_name: r.staff_name || '',
                    slot_type: r.slot_type,
                    is_non_teaching: r.is_non_teaching,
                })),
                hourTimes: HOUR_TIMES,
                days: DAYS,
            },
        });
    } catch (error) {
        console.error('getStudentTimetable error:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

module.exports = {
    // HOD
    uploadTimetable,
    getStaffWiseTimetable,
    getClassWiseTimetable,
    getUploadHistory,
    getAllClasses,
    getStaffList,
    // Staff
    getMyTimetable,
    getTodaySlots,
    getCurrentSlot,
    // Student
    getStudentTimetable,
};
