/**
 * College LMS — Data Access Layer
 * All SQL queries mapped to the new schema (schema.sql v2).
 */

const { query, getClient } = require('../config/database');
const { hashPassword } = require('../utils/bcrypt');

// ═══════════════════════════════════════════════════════════════
// USER QUERIES
// ═══════════════════════════════════════════════════════════════

const findUserByUsername = async (username) => {
    const result = await query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows[0] || null;
};

const findUserByEmail = async (email) => {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
};

const findUserById = async (id) => {
    const result = await query(
        `SELECT id, username, email, role, full_name, profile_photo_url,
                department_id, phone, is_active, created_at, updated_at
         FROM users WHERE id = $1`,
        [id]
    );
    return result.rows[0] || null;
};

const createUser = async ({ username, email, password, role, full_name, phone, departmentId }) => {
    const hashedPassword = await hashPassword(password);
    const result = await query(
        `INSERT INTO users (username, email, password_hash, role, full_name, phone, department_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, username, email, role, full_name, department_id, phone, is_active, created_at`,
        [username, email, hashedPassword, role, full_name, phone || null, departmentId || null]
    );
    return result.rows[0];
};

const updateUser = async (id, fields) => {
    const allowed = ['full_name', 'email', 'phone', 'profile_photo_url', 'is_active', 'department_id'];
    const keys = Object.keys(fields).filter((k) => allowed.includes(k));
    if (keys.length === 0) return findUserById(id);

    const values = keys.map((k) => fields[k]);
    const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');

    const result = await query(
        `UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = $1
         RETURNING id, username, email, role, full_name, profile_photo_url, department_id, phone, is_active, updated_at`,
        [id, ...values]
    );
    return result.rows[0] || null;
};

const findUsersByRole = async (role, departmentId = null) => {
    let sql = `SELECT id, username, email, role, full_name, profile_photo_url,
                      department_id, phone, is_active, created_at
               FROM users WHERE role = $1`;
    const params = [role];

    if (departmentId) {
        sql += ' AND department_id = $2';
        params.push(departmentId);
    }

    sql += ' ORDER BY full_name ASC';
    const result = await query(sql, params);
    return result.rows;
};

// ═══════════════════════════════════════════════════════════════
// DEPARTMENT QUERIES
// ═══════════════════════════════════════════════════════════════

const findAllDepartments = async () => {
    const result = await query('SELECT * FROM departments ORDER BY name ASC');
    return result.rows;
};

const findDepartmentById = async (id) => {
    const result = await query('SELECT * FROM departments WHERE id = $1', [id]);
    return result.rows[0] || null;
};

// ═══════════════════════════════════════════════════════════════
// SUBJECT QUERIES
// ═══════════════════════════════════════════════════════════════

const findAllSubjects = async (departmentId = null) => {
    let sql = `SELECT s.*, u.full_name AS staff_name
               FROM subjects s
               LEFT JOIN users u ON s.staff_id = u.id`;
    const params = [];
    if (departmentId) {
        sql += ' WHERE s.department_id = $1';
        params.push(departmentId);
    }
    sql += ' ORDER BY s.name ASC';
    const result = await query(sql, params);
    return result.rows;
};

const findSubjectById = async (id) => {
    const result = await query(
        `SELECT s.*, u.full_name AS staff_name
         FROM subjects s
         LEFT JOIN users u ON s.staff_id = u.id
         WHERE s.id = $1`,
        [id]
    );
    return result.rows[0] || null;
};

const findSubjectsByStaff = async (staffId) => {
    const result = await query(
        `SELECT s.*, u.full_name AS staff_name
         FROM subjects s
         LEFT JOIN users u ON s.staff_id = u.id
         WHERE s.staff_id = $1 AND s.is_active = true
         ORDER BY s.name ASC`,
        [staffId]
    );
    return result.rows;
};

const createSubject = async ({ name, code, semester, academicYear, departmentId, staffId }) => {
    const result = await query(
        `INSERT INTO subjects (name, code, semester, academic_year, department_id, staff_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [name, code, semester || null, academicYear || null, departmentId || null, staffId || null]
    );
    return result.rows[0];
};

const updateSubject = async (id, fields) => {
    const allowed = ['name', 'code', 'semester', 'academic_year', 'department_id', 'staff_id', 'is_active'];
    const keys = Object.keys(fields).filter((k) => allowed.includes(k));
    if (keys.length === 0) return findSubjectById(id);

    const values = keys.map((k) => fields[k]);
    const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');

    const result = await query(
        `UPDATE subjects SET ${setClause} WHERE id = $1 RETURNING *`,
        [id, ...values]
    );
    return result.rows[0] || null;
};

// ═══════════════════════════════════════════════════════════════
// STUDENT / STAFF PROFILE QUERIES
// ═══════════════════════════════════════════════════════════════

const createStudentProfile = async ({ userId, rollNumber, batch, yearOfStudy, phone, parentPhone }) => {
    const result = await query(
        `INSERT INTO student_profiles (user_id, roll_number, batch, year_of_study, phone, parent_phone)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [userId, rollNumber, batch || null, yearOfStudy || null, phone || null, parentPhone || null]
    );
    return result.rows[0];
};

const findStudentProfile = async (userId) => {
    const result = await query('SELECT * FROM student_profiles WHERE user_id = $1', [userId]);
    return result.rows[0] || null;
};

const createStaffProfile = async ({ userId, employeeId, designation, phone }) => {
    const result = await query(
        `INSERT INTO staff_profiles (user_id, employee_id, designation, phone)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [userId, employeeId, designation || null, phone || null]
    );
    return result.rows[0];
};

const findStaffProfile = async (userId) => {
    const result = await query('SELECT * FROM staff_profiles WHERE user_id = $1', [userId]);
    return result.rows[0] || null;
};

// ═══════════════════════════════════════════════════════════════
// SUBJECT ENROLLMENT QUERIES
// ═══════════════════════════════════════════════════════════════

const findEnrolledSubjects = async (studentId) => {
    const result = await query(
        `SELECT s.*, u.full_name AS staff_name, se.enrolled_at
         FROM subject_enrollments se
         JOIN subjects s ON se.subject_id = s.id
         LEFT JOIN users u ON s.staff_id = u.id
         WHERE se.student_id = $1 AND s.is_active = true
         ORDER BY s.name ASC`,
        [studentId]
    );
    return result.rows;
};

const findEnrolledStudents = async (subjectId) => {
    const result = await query(
        `SELECT u.id, u.username, u.email, u.full_name, u.profile_photo_url,
                sp.roll_number, sp.batch, sp.year_of_study, se.enrolled_at
         FROM subject_enrollments se
         JOIN users u ON se.student_id = u.id
         LEFT JOIN student_profiles sp ON sp.user_id = u.id
         WHERE se.subject_id = $1
         ORDER BY u.full_name ASC`,
        [subjectId]
    );
    return result.rows;
};

const bulkEnrollStudents = async (subjectId, studentIds) => {
    const client = await getClient();
    try {
        await client.query('BEGIN');
        const results = [];
        for (const studentId of studentIds) {
            const r = await client.query(
                `INSERT INTO subject_enrollments (subject_id, student_id)
                 VALUES ($1, $2)
                 ON CONFLICT (subject_id, student_id) DO NOTHING
                 RETURNING *`,
                [subjectId, studentId]
            );
            if (r.rows[0]) results.push(r.rows[0]);
        }
        await client.query('COMMIT');
        return results;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

// ═══════════════════════════════════════════════════════════════
// ATTENDANCE QUERIES
// ═══════════════════════════════════════════════════════════════

const createAttendanceSession = async ({ subjectId, staffId, sessionDate, sessionType, records }) => {
    const client = await getClient();
    try {
        await client.query('BEGIN');

        // Create session
        const sResult = await client.query(
            `INSERT INTO attendance_sessions (subject_id, staff_id, session_date, session_type)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [subjectId, staffId, sessionDate, sessionType]
        );
        const session = sResult.rows[0];

        // Insert records
        const attendanceRecords = [];
        for (const r of records) {
            const rr = await client.query(
                `INSERT INTO attendance_records (session_id, student_id, status)
                 VALUES ($1, $2, $3) RETURNING *`,
                [session.id, r.studentId, r.status]
            );
            attendanceRecords.push(rr.rows[0]);
        }

        await client.query('COMMIT');
        return { session, records: attendanceRecords };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

const findAttendanceSessionsBySubject = async (subjectId) => {
    const result = await query(
        `SELECT ats.*, u.full_name AS staff_name,
                (SELECT COUNT(*) FROM attendance_records WHERE session_id = ats.id AND status = 'present') AS present_count,
                (SELECT COUNT(*) FROM attendance_records WHERE session_id = ats.id AND status = 'absent') AS absent_count,
                (SELECT COUNT(*) FROM attendance_records WHERE session_id = ats.id AND status = 'late') AS late_count,
                (SELECT COUNT(*) FROM attendance_records WHERE session_id = ats.id) AS total_count
         FROM attendance_sessions ats
         JOIN users u ON ats.staff_id = u.id
         WHERE ats.subject_id = $1
         ORDER BY ats.session_date DESC, ats.created_at DESC`,
        [subjectId]
    );
    return result.rows;
};

const findAttendanceRecordsBySession = async (sessionId) => {
    const result = await query(
        `SELECT ar.*, u.full_name AS student_name, u.username,
                sp.roll_number
         FROM attendance_records ar
         JOIN users u ON ar.student_id = u.id
         LEFT JOIN student_profiles sp ON sp.user_id = u.id
         WHERE ar.session_id = $1
         ORDER BY u.full_name ASC`,
        [sessionId]
    );
    return result.rows;
};

const updateAttendanceSession = async (sessionId, records) => {
    const client = await getClient();
    try {
        await client.query('BEGIN');

        // Delete existing records and re-insert
        await client.query('DELETE FROM attendance_records WHERE session_id = $1', [sessionId]);

        const attendanceRecords = [];
        for (const r of records) {
            const rr = await client.query(
                `INSERT INTO attendance_records (session_id, student_id, status)
                 VALUES ($1, $2, $3) RETURNING *`,
                [sessionId, r.studentId, r.status]
            );
            attendanceRecords.push(rr.rows[0]);
        }

        await client.query('COMMIT');
        return attendanceRecords;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

const getStudentAttendanceSummary = async (studentId) => {
    const result = await query(
        `SELECT s.id AS subject_id, s.name AS subject_name, s.code AS subject_code,
                COUNT(ar.id) AS total_classes,
                COUNT(*) FILTER (WHERE ar.status = 'present') AS present,
                COUNT(*) FILTER (WHERE ar.status = 'absent') AS absent,
                COUNT(*) FILTER (WHERE ar.status = 'late') AS late,
                ROUND(
                  COUNT(*) FILTER (WHERE ar.status IN ('present', 'late'))::numeric /
                  NULLIF(COUNT(ar.id), 0) * 100, 2
                ) AS percentage
         FROM subject_enrollments se
         JOIN subjects s ON se.subject_id = s.id
         LEFT JOIN attendance_sessions ats ON ats.subject_id = s.id
         LEFT JOIN attendance_records ar ON ar.session_id = ats.id AND ar.student_id = $1
         WHERE se.student_id = $1
         GROUP BY s.id, s.name, s.code
         ORDER BY s.name`,
        [studentId]
    );
    return result.rows;
};

const getStudentAttendanceDetail = async (studentId, subjectId) => {
    const result = await query(
        `SELECT ats.id AS session_id, ats.session_date, ats.session_type,
                ar.status, ar.marked_at
         FROM attendance_sessions ats
         LEFT JOIN attendance_records ar ON ar.session_id = ats.id AND ar.student_id = $1
         WHERE ats.subject_id = $2
         ORDER BY ats.session_date DESC`,
        [studentId, subjectId]
    );
    return result.rows;
};

// ═══════════════════════════════════════════════════════════════
// ASSIGNMENT QUERIES
// ═══════════════════════════════════════════════════════════════

const createAssignment = async ({ subjectId, title, description, dueDate, maxMarks, allowedFileTypes, createdBy }) => {
    const result = await query(
        `INSERT INTO assignments (subject_id, title, description, due_date, max_marks, allowed_file_types, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [subjectId, title, description || null, dueDate, maxMarks, allowedFileTypes || null, createdBy]
    );
    return result.rows[0];
};

const findAssignmentsBySubject = async (subjectId) => {
    const result = await query(
        `SELECT a.*, u.full_name AS created_by_name
         FROM assignments a
         JOIN users u ON a.created_by = u.id
         WHERE a.subject_id = $1
         ORDER BY a.due_date DESC`,
        [subjectId]
    );
    return result.rows;
};

const findAssignmentById = async (id) => {
    const result = await query(
        `SELECT a.*, u.full_name AS created_by_name, s.name AS subject_name, s.code AS subject_code
         FROM assignments a
         JOIN users u ON a.created_by = u.id
         JOIN subjects s ON a.subject_id = s.id
         WHERE a.id = $1`,
        [id]
    );
    return result.rows[0] || null;
};

const findStudentAssignments = async (studentId) => {
    const result = await query(
        `SELECT a.*, s.name AS subject_name, s.code AS subject_code,
                u.full_name AS created_by_name,
                sub.id AS submission_id, sub.file_url AS submission_file,
                sub.submitted_at, sub.marks_obtained, sub.feedback, sub.is_late
         FROM subject_enrollments se
         JOIN assignments a ON a.subject_id = se.subject_id AND a.is_active = true
         JOIN subjects s ON a.subject_id = s.id
         JOIN users u ON a.created_by = u.id
         LEFT JOIN assignment_submissions sub ON sub.assignment_id = a.id AND sub.student_id = $1
         WHERE se.student_id = $1
         ORDER BY a.due_date DESC`,
        [studentId]
    );
    return result.rows;
};

const submitAssignment = async ({ assignmentId, studentId, fileUrl }) => {
    // Check if late
    const assignment = await findAssignmentById(assignmentId);
    const isLate = assignment && new Date() > new Date(assignment.due_date);

    const result = await query(
        `INSERT INTO assignment_submissions (assignment_id, student_id, file_url, is_late)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (assignment_id, student_id)
         DO UPDATE SET file_url = $3, submitted_at = NOW(), is_late = $4
         RETURNING *`,
        [assignmentId, studentId, fileUrl, isLate]
    );
    return result.rows[0];
};

const findSubmissionsByAssignment = async (assignmentId) => {
    const result = await query(
        `SELECT sub.*, u.full_name AS student_name, u.username,
                sp.roll_number
         FROM assignment_submissions sub
         JOIN users u ON sub.student_id = u.id
         LEFT JOIN student_profiles sp ON sp.user_id = u.id
         WHERE sub.assignment_id = $1
         ORDER BY sub.submitted_at DESC`,
        [assignmentId]
    );
    return result.rows;
};

const gradeSubmission = async (submissionId, { marksObtained, feedback, gradedBy }) => {
    const result = await query(
        `UPDATE assignment_submissions
         SET marks_obtained = $2, feedback = $3, graded_by = $4, graded_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [submissionId, marksObtained, feedback || null, gradedBy]
    );
    return result.rows[0] || null;
};

const findSubmissionById = async (id) => {
    const result = await query('SELECT * FROM assignment_submissions WHERE id = $1', [id]);
    return result.rows[0] || null;
};

// ═══════════════════════════════════════════════════════════════
// ASSESSMENT QUERIES
// ═══════════════════════════════════════════════════════════════

const createAssessment = async ({ subjectId, name, maxMarks, assessmentType, conductedDate, createdBy }) => {
    const result = await query(
        `INSERT INTO assessments (subject_id, name, max_marks, assessment_type, conducted_date, created_by)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [subjectId, name, maxMarks, assessmentType, conductedDate || null, createdBy]
    );
    return result.rows[0];
};

const findAssessmentsBySubject = async (subjectId) => {
    const result = await query(
        `SELECT a.*, u.full_name AS created_by_name
         FROM assessments a
         JOIN users u ON a.created_by = u.id
         WHERE a.subject_id = $1
         ORDER BY a.conducted_date DESC NULLS LAST, a.created_at DESC`,
        [subjectId]
    );
    return result.rows;
};

const findAssessmentById = async (id) => {
    const result = await query('SELECT * FROM assessments WHERE id = $1', [id]);
    return result.rows[0] || null;
};

const upsertAssessmentMarks = async (assessmentId, marks, enteredBy) => {
    const client = await getClient();
    try {
        await client.query('BEGIN');
        const results = [];
        for (const m of marks) {
            const r = await client.query(
                `INSERT INTO assessment_marks (assessment_id, student_id, marks_obtained, entered_by)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (assessment_id, student_id)
                 DO UPDATE SET marks_obtained = $3, entered_by = $4, entered_at = NOW()
                 RETURNING *`,
                [assessmentId, m.studentId, m.marksObtained, enteredBy]
            );
            results.push(r.rows[0]);
        }
        await client.query('COMMIT');
        return results;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

const publishAssessmentMarks = async (assessmentId) => {
    const result = await query(
        `UPDATE assessment_marks SET is_published = true WHERE assessment_id = $1 RETURNING *`,
        [assessmentId]
    );
    return result.rows;
};

const findStudentMarks = async (studentId) => {
    const result = await query(
        `SELECT am.*, a.name AS assessment_name, a.max_marks, a.assessment_type,
                s.name AS subject_name, s.code AS subject_code
         FROM assessment_marks am
         JOIN assessments a ON am.assessment_id = a.id
         JOIN subjects s ON a.subject_id = s.id
         WHERE am.student_id = $1 AND am.is_published = true
         ORDER BY s.name, a.assessment_type, a.conducted_date DESC NULLS LAST`,
        [studentId]
    );
    return result.rows;
};

// ═══════════════════════════════════════════════════════════════
// COURSE CONTENT QUERIES
// ═══════════════════════════════════════════════════════════════

const createContent = async ({ subjectId, title, description, contentType, fileUrl, weekNumber, topic, uploadedBy }) => {
    const result = await query(
        `INSERT INTO course_content (subject_id, title, description, content_type, file_url, week_number, topic, uploaded_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [subjectId, title, description || null, contentType, fileUrl || null, weekNumber || null, topic || null, uploadedBy]
    );
    return result.rows[0];
};

const findContentBySubject = async (subjectId, visibleOnly = false) => {
    let sql = `SELECT cc.*, u.full_name AS uploaded_by_name
               FROM course_content cc
               JOIN users u ON cc.uploaded_by = u.id
               WHERE cc.subject_id = $1`;
    if (visibleOnly) sql += ' AND cc.is_visible = true';
    sql += ' ORDER BY cc.week_number ASC NULLS LAST, cc.uploaded_at DESC';
    const result = await query(sql, [subjectId]);
    return result.rows;
};

const findContentById = async (id) => {
    const result = await query('SELECT * FROM course_content WHERE id = $1', [id]);
    return result.rows[0] || null;
};

const deleteContent = async (id) => {
    const result = await query('DELETE FROM course_content WHERE id = $1 RETURNING id', [id]);
    return result.rowCount > 0;
};

// ═══════════════════════════════════════════════════════════════
// ANNOUNCEMENT QUERIES
// ═══════════════════════════════════════════════════════════════

const createAnnouncement = async ({ title, body, targetAudience, postedBy, subjectId, departmentId, isPinned, sendEmail }) => {
    const result = await query(
        `INSERT INTO announcements (title, body, target_audience, posted_by, subject_id, department_id, is_pinned, send_email)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [title, body, targetAudience, postedBy, subjectId || null, departmentId || null, isPinned || false, sendEmail || false]
    );
    return result.rows[0];
};

const findAnnouncements = async ({ departmentId, role, subjectIds }) => {
    // Students see 'all' + 'students'; staff see 'all' + 'staff'; hod sees all
    let audienceFilter;
    if (role === 'student') audienceFilter = `a.target_audience IN ('all', 'students')`;
    else if (role === 'staff') audienceFilter = `a.target_audience IN ('all', 'staff')`;
    else audienceFilter = '1=1'; // hod sees everything

    let sql = `SELECT a.*, u.full_name AS posted_by_name,
                      s.name AS subject_name
               FROM announcements a
               JOIN users u ON a.posted_by = u.id
               LEFT JOIN subjects s ON a.subject_id = s.id
               WHERE ${audienceFilter}`;
    const params = [];

    if (departmentId) {
        params.push(departmentId);
        sql += ` AND (a.department_id = $${params.length} OR a.department_id IS NULL)`;
    }

    sql += ' ORDER BY a.is_pinned DESC, a.created_at DESC';
    const result = await query(sql, params);
    return result.rows;
};

const findAllAnnouncements = async (departmentId = null) => {
    let sql = `SELECT a.*, u.full_name AS posted_by_name,
                      s.name AS subject_name
               FROM announcements a
               JOIN users u ON a.posted_by = u.id
               LEFT JOIN subjects s ON a.subject_id = s.id`;
    const params = [];
    if (departmentId) {
        sql += ' WHERE (a.department_id = $1 OR a.department_id IS NULL)';
        params.push(departmentId);
    }
    sql += ' ORDER BY a.is_pinned DESC, a.created_at DESC';
    const result = await query(sql, params);
    return result.rows;
};

const findAnnouncementById = async (id) => {
    const result = await query('SELECT * FROM announcements WHERE id = $1', [id]);
    return result.rows[0] || null;
};

const deleteAnnouncement = async (id) => {
    const result = await query('DELETE FROM announcements WHERE id = $1 RETURNING id', [id]);
    return result.rowCount > 0;
};

// ═══════════════════════════════════════════════════════════════
// LEAVE REQUEST QUERIES
// ═══════════════════════════════════════════════════════════════

const createLeaveRequest = async ({ staffId, leaveType, startDate, endDate, reason, documentUrl }) => {
    const result = await query(
        `INSERT INTO leave_requests (staff_id, leave_type, start_date, end_date, reason, document_url)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [staffId, leaveType, startDate, endDate, reason, documentUrl || null]
    );
    return result.rows[0];
};

const findLeavesByStaff = async (staffId) => {
    const result = await query(
        `SELECT lr.*, rev.full_name AS reviewed_by_name
         FROM leave_requests lr
         LEFT JOIN users rev ON lr.reviewed_by = rev.id
         WHERE lr.staff_id = $1
         ORDER BY lr.created_at DESC`,
        [staffId]
    );
    return result.rows;
};

const findLeavesByDepartment = async (departmentId) => {
    const result = await query(
        `SELECT lr.*, u.full_name AS staff_name, u.username AS staff_username,
                rev.full_name AS reviewed_by_name
         FROM leave_requests lr
         JOIN users u ON lr.staff_id = u.id
         LEFT JOIN users rev ON lr.reviewed_by = rev.id
         WHERE u.department_id = $1
         ORDER BY
           CASE WHEN lr.status = 'pending' THEN 0 ELSE 1 END,
           lr.created_at DESC`,
        [departmentId]
    );
    return result.rows;
};

const findLeaveById = async (id) => {
    const result = await query('SELECT * FROM leave_requests WHERE id = $1', [id]);
    return result.rows[0] || null;
};

const updateLeaveStatus = async (id, { status, reviewedBy, reviewComment }) => {
    const result = await query(
        `UPDATE leave_requests
         SET status = $2, reviewed_by = $3, review_comment = $4, reviewed_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [id, status, reviewedBy, reviewComment || null]
    );
    return result.rows[0] || null;
};

// ═══════════════════════════════════════════════════════════════
// DASHBOARD / REPORT QUERIES
// ═══════════════════════════════════════════════════════════════

const getDepartmentStats = async (departmentId) => {
    const result = await query(
        `SELECT
           (SELECT COUNT(*) FROM users WHERE department_id = $1 AND role = 'student' AND is_active = true) AS total_students,
           (SELECT COUNT(*) FROM users WHERE department_id = $1 AND role = 'staff' AND is_active = true) AS total_staff,
           (SELECT COUNT(*) FROM subjects WHERE department_id = $1 AND is_active = true) AS total_subjects,
           (SELECT COUNT(*) FROM leave_requests WHERE staff_id IN
             (SELECT id FROM users WHERE department_id = $1) AND status = 'pending') AS pending_leaves,
           (SELECT COUNT(*) FROM announcements WHERE department_id = $1) AS total_announcements`,
        [departmentId]
    );
    return result.rows[0];
};

const getStaffDashboardStats = async (staffId) => {
    const result = await query(
        `SELECT
           (SELECT COUNT(*) FROM subjects WHERE staff_id = $1 AND is_active = true) AS total_subjects,
           (SELECT COUNT(*) FROM attendance_sessions WHERE staff_id = $1 AND session_date = CURRENT_DATE) AS today_sessions,
           (SELECT COUNT(*) FROM assignments a
            JOIN subjects s ON a.subject_id = s.id
            WHERE s.staff_id = $1 AND a.is_active = true AND a.due_date > NOW()) AS active_assignments,
           (SELECT COUNT(*) FROM assignment_submissions sub
            JOIN assignments a ON sub.assignment_id = a.id
            JOIN subjects s ON a.subject_id = s.id
            WHERE s.staff_id = $1 AND sub.graded_at IS NULL) AS ungraded_submissions`,
        [staffId]
    );
    return result.rows[0];
};

const getStudentDashboardData = async (studentId) => {
    // Today's subjects
    const subjects = await findEnrolledSubjects(studentId);

    // Pending assignments
    const pendingResult = await query(
        `SELECT a.*, s.name AS subject_name, s.code AS subject_code
         FROM subject_enrollments se
         JOIN assignments a ON a.subject_id = se.subject_id AND a.is_active = true
         JOIN subjects s ON a.subject_id = s.id
         LEFT JOIN assignment_submissions sub ON sub.assignment_id = a.id AND sub.student_id = $1
         WHERE se.student_id = $1 AND sub.id IS NULL AND a.due_date > NOW()
         ORDER BY a.due_date ASC
         LIMIT 10`,
        [studentId]
    );

    return {
        subjects,
        pendingAssignments: pendingResult.rows,
    };
};

// ── Report queries ───────────────────────────────────────────

const getAttendanceReport = async ({ departmentId, subjectId, startDate, endDate, belowThreshold }) => {
    let sql = `
        SELECT u.id AS student_id, u.full_name, u.username, sp.roll_number,
               s.id AS subject_id, s.name AS subject_name, s.code AS subject_code,
               COUNT(ar.id) AS total_classes,
               COUNT(*) FILTER (WHERE ar.status IN ('present', 'late')) AS attended,
               ROUND(
                 COUNT(*) FILTER (WHERE ar.status IN ('present', 'late'))::numeric /
                 NULLIF(COUNT(ar.id), 0) * 100, 2
               ) AS percentage
        FROM users u
        JOIN subject_enrollments se ON se.student_id = u.id
        JOIN subjects s ON se.subject_id = s.id
        LEFT JOIN attendance_sessions ats ON ats.subject_id = s.id
        LEFT JOIN attendance_records ar ON ar.session_id = ats.id AND ar.student_id = u.id
        LEFT JOIN student_profiles sp ON sp.user_id = u.id
        WHERE u.role = 'student' AND u.department_id = $1`;
    const params = [departmentId];
    let paramIdx = 2;

    if (subjectId) {
        sql += ` AND s.id = $${paramIdx}`;
        params.push(subjectId);
        paramIdx++;
    }
    if (startDate) {
        sql += ` AND ats.session_date >= $${paramIdx}`;
        params.push(startDate);
        paramIdx++;
    }
    if (endDate) {
        sql += ` AND ats.session_date <= $${paramIdx}`;
        params.push(endDate);
        paramIdx++;
    }

    sql += ` GROUP BY u.id, u.full_name, u.username, sp.roll_number, s.id, s.name, s.code`;

    if (belowThreshold) {
        sql += ` HAVING ROUND(
                   COUNT(*) FILTER (WHERE ar.status IN ('present', 'late'))::numeric /
                   NULLIF(COUNT(ar.id), 0) * 100, 2
                 ) < $${paramIdx}`;
        params.push(belowThreshold);
    }

    sql += ` ORDER BY s.name, u.full_name`;

    const result = await query(sql, params);
    return result.rows;
};

const getMarksReport = async (departmentId) => {
    const result = await query(
        `SELECT u.id AS student_id, u.full_name, sp.roll_number,
                s.name AS subject_name, s.code AS subject_code,
                a.name AS assessment_name, a.assessment_type, a.max_marks,
                am.marks_obtained
         FROM assessment_marks am
         JOIN assessments a ON am.assessment_id = a.id
         JOIN subjects s ON a.subject_id = s.id
         JOIN users u ON am.student_id = u.id
         LEFT JOIN student_profiles sp ON sp.user_id = u.id
         WHERE s.department_id = $1 AND am.is_published = true
         ORDER BY s.name, a.assessment_type, u.full_name`,
        [departmentId]
    );
    return result.rows;
};

const getAssignmentCompletionReport = async (departmentId) => {
    const result = await query(
        `SELECT s.id AS subject_id, s.name AS subject_name, s.code AS subject_code,
                a.id AS assignment_id, a.title AS assignment_title, a.due_date,
                (SELECT COUNT(*) FROM subject_enrollments WHERE subject_id = s.id) AS total_students,
                (SELECT COUNT(*) FROM assignment_submissions WHERE assignment_id = a.id) AS submitted_count,
                (SELECT COUNT(*) FROM assignment_submissions WHERE assignment_id = a.id AND graded_at IS NOT NULL) AS graded_count
         FROM assignments a
         JOIN subjects s ON a.subject_id = s.id
         WHERE s.department_id = $1
         ORDER BY s.name, a.due_date DESC`,
        [departmentId]
    );
    return result.rows;
};

const getStaffActivityReport = async (departmentId) => {
    const result = await query(
        `SELECT u.id, u.full_name, u.username,
                (SELECT COUNT(*) FROM attendance_sessions WHERE staff_id = u.id) AS total_sessions,
                (SELECT COUNT(*) FROM course_content WHERE uploaded_by = u.id) AS total_uploads,
                (SELECT COUNT(*) FROM assignments a JOIN subjects s ON a.subject_id = s.id WHERE a.created_by = u.id) AS total_assignments,
                (SELECT MAX(ats.session_date) FROM attendance_sessions ats WHERE ats.staff_id = u.id) AS last_session_date
         FROM users u
         WHERE u.department_id = $1 AND u.role IN ('staff', 'hod') AND u.is_active = true
         ORDER BY u.full_name`,
        [departmentId]
    );
    return result.rows;
};

module.exports = {
    // Users
    findUserByUsername,
    findUserByEmail,
    findUserById,
    createUser,
    updateUser,
    findUsersByRole,
    // Departments
    findAllDepartments,
    findDepartmentById,
    // Subjects
    findAllSubjects,
    findSubjectById,
    findSubjectsByStaff,
    createSubject,
    updateSubject,
    // Profiles
    createStudentProfile,
    findStudentProfile,
    createStaffProfile,
    findStaffProfile,
    // Enrollments
    findEnrolledSubjects,
    findEnrolledStudents,
    bulkEnrollStudents,
    // Attendance
    createAttendanceSession,
    findAttendanceSessionsBySubject,
    findAttendanceRecordsBySession,
    updateAttendanceSession,
    getStudentAttendanceSummary,
    getStudentAttendanceDetail,
    // Assignments
    createAssignment,
    findAssignmentsBySubject,
    findAssignmentById,
    findStudentAssignments,
    submitAssignment,
    findSubmissionsByAssignment,
    gradeSubmission,
    findSubmissionById,
    // Assessments
    createAssessment,
    findAssessmentsBySubject,
    findAssessmentById,
    upsertAssessmentMarks,
    publishAssessmentMarks,
    findStudentMarks,
    // Content
    createContent,
    findContentBySubject,
    findContentById,
    deleteContent,
    // Announcements
    createAnnouncement,
    findAnnouncements,
    findAllAnnouncements,
    findAnnouncementById,
    deleteAnnouncement,
    // Leave Requests
    createLeaveRequest,
    findLeavesByStaff,
    findLeavesByDepartment,
    findLeaveById,
    updateLeaveStatus,
    // Dashboard / Reports
    getDepartmentStats,
    getStaffDashboardStats,
    getStudentDashboardData,
    getAttendanceReport,
    getMarksReport,
    getAssignmentCompletionReport,
    getStaffActivityReport,
};
