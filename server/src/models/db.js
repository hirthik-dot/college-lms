const { query, getClient } = require('../config/database');
const { hashPassword } = require('../utils/bcrypt');

// ─── User Queries ─────────────────────────────────────────

const findUserByEmail = async (email) => {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
};

const findUserById = async (id) => {
    const result = await query(
        'SELECT id, name, email, role, department_id, phone, created_at FROM users WHERE id = $1',
        [id]
    );
    return result.rows[0] || null;
};

const createUser = async ({ name, email, password, role, departmentId, phone }) => {
    const hashedPassword = await hashPassword(password);
    const result = await query(
        `INSERT INTO users (name, email, password, role, department_id, phone)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, name, email, role, department_id, phone, created_at`,
        [name, email, hashedPassword, role, departmentId, phone]
    );
    return result.rows[0];
};

const updateUser = async (id, fields) => {
    const keys = Object.keys(fields);
    const values = Object.values(fields);
    const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');

    const result = await query(
        `UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = $1
     RETURNING id, name, email, role, department_id, phone, updated_at`,
        [id, ...values]
    );
    return result.rows[0] || null;
};

const deleteUser = async (id) => {
    const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    return result.rowCount > 0;
};

const findUsersByRole = async (role, departmentId = null) => {
    let sql = 'SELECT id, name, email, role, department_id, phone, created_at FROM users WHERE role = $1';
    const params = [role];

    if (departmentId) {
        sql += ' AND department_id = $2';
        params.push(departmentId);
    }

    sql += ' ORDER BY name ASC';
    const result = await query(sql, params);
    return result.rows;
};

// ─── Department Queries ───────────────────────────────────

const findAllDepartments = async () => {
    const result = await query('SELECT * FROM departments ORDER BY name ASC');
    return result.rows;
};

const findDepartmentById = async (id) => {
    const result = await query('SELECT * FROM departments WHERE id = $1', [id]);
    return result.rows[0] || null;
};

// ─── Subject Queries ──────────────────────────────────────

const findSubjectsByDepartment = async (departmentId) => {
    const result = await query(
        `SELECT s.*, u.name as staff_name
     FROM subjects s
     LEFT JOIN users u ON s.staff_id = u.id
     WHERE s.department_id = $1
     ORDER BY s.name ASC`,
        [departmentId]
    );
    return result.rows;
};

const findSubjectById = async (id) => {
    const result = await query(
        `SELECT s.*, u.name as staff_name
     FROM subjects s
     LEFT JOIN users u ON s.staff_id = u.id
     WHERE s.id = $1`,
        [id]
    );
    return result.rows[0] || null;
};

const createSubject = async ({ name, code, departmentId, staffId, semester }) => {
    const result = await query(
        `INSERT INTO subjects (name, code, department_id, staff_id, semester)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
        [name, code, departmentId, staffId, semester]
    );
    return result.rows[0];
};

const updateSubject = async (id, fields) => {
    const keys = Object.keys(fields);
    const values = Object.values(fields);
    const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(', ');

    const result = await query(
        `UPDATE subjects SET ${setClause} WHERE id = $1 RETURNING *`,
        [id, ...values]
    );
    return result.rows[0] || null;
};

const deleteSubject = async (id) => {
    const result = await query('DELETE FROM subjects WHERE id = $1 RETURNING id', [id]);
    return result.rowCount > 0;
};

// ─── Attendance Queries ───────────────────────────────────

const createAttendanceRecord = async ({ studentId, subjectId, date, status, markedBy }) => {
    const result = await query(
        `INSERT INTO attendance (student_id, subject_id, date, status, marked_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
        [studentId, subjectId, date, status, markedBy]
    );
    return result.rows[0];
};

const createBulkAttendance = async (records, markedBy) => {
    const client = await getClient();
    try {
        await client.query('BEGIN');

        const results = [];
        for (const record of records) {
            const result = await client.query(
                `INSERT INTO attendance (student_id, subject_id, date, status, marked_by)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (student_id, subject_id, date)
         DO UPDATE SET status = $4, marked_by = $5
         RETURNING *`,
                [record.studentId, record.subjectId, record.date, record.status, markedBy]
            );
            results.push(result.rows[0]);
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

const findAttendanceByStudent = async (studentId, subjectId = null) => {
    let sql = `
    SELECT a.*, s.name as subject_name, s.code as subject_code
    FROM attendance a
    JOIN subjects s ON a.subject_id = s.id
    WHERE a.student_id = $1`;
    const params = [studentId];

    if (subjectId) {
        sql += ' AND a.subject_id = $2';
        params.push(subjectId);
    }

    sql += ' ORDER BY a.date DESC';
    const result = await query(sql, params);
    return result.rows;
};

const findAttendanceBySubjectAndDate = async (subjectId, date) => {
    const result = await query(
        `SELECT a.*, u.name as student_name, u.email as student_email
     FROM attendance a
     JOIN users u ON a.student_id = u.id
     WHERE a.subject_id = $1 AND a.date = $2
     ORDER BY u.name ASC`,
        [subjectId, date]
    );
    return result.rows;
};

const getAttendanceSummary = async (studentId, subjectId) => {
    const result = await query(
        `SELECT
       COUNT(*) as total_classes,
       COUNT(*) FILTER (WHERE status = 'present') as present,
       COUNT(*) FILTER (WHERE status = 'absent') as absent,
       COUNT(*) FILTER (WHERE status = 'late') as late,
       COUNT(*) FILTER (WHERE status = 'excused') as excused,
       ROUND(
         COUNT(*) FILTER (WHERE status IN ('present', 'late'))::numeric /
         NULLIF(COUNT(*), 0) * 100, 2
       ) as percentage
     FROM attendance
     WHERE student_id = $1 AND subject_id = $2`,
        [studentId, subjectId]
    );
    return result.rows[0];
};

// ─── Assignment Queries ───────────────────────────────────

const createAssignment = async ({ title, description, subjectId, dueDate, maxMarks, createdBy }) => {
    const result = await query(
        `INSERT INTO assignments (title, description, subject_id, due_date, max_marks, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
        [title, description, subjectId, dueDate, maxMarks, createdBy]
    );
    return result.rows[0];
};

const findAssignmentsBySubject = async (subjectId) => {
    const result = await query(
        `SELECT a.*, u.name as created_by_name
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
        `SELECT a.*, u.name as created_by_name, s.name as subject_name
     FROM assignments a
     JOIN users u ON a.created_by = u.id
     JOIN subjects s ON a.subject_id = s.id
     WHERE a.id = $1`,
        [id]
    );
    return result.rows[0] || null;
};

const submitAssignment = async ({ assignmentId, studentId, content, fileUrl }) => {
    const result = await query(
        `INSERT INTO assignment_submissions (assignment_id, student_id, content, file_url)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (assignment_id, student_id)
     DO UPDATE SET content = $3, file_url = $4, submitted_at = NOW()
     RETURNING *`,
        [assignmentId, studentId, content, fileUrl]
    );
    return result.rows[0];
};

const gradeSubmission = async (submissionId, { marks, feedback, gradedBy }) => {
    const result = await query(
        `UPDATE assignment_submissions
     SET marks = $2, feedback = $3, graded_by = $4, graded_at = NOW()
     WHERE id = $1
     RETURNING *`,
        [submissionId, marks, feedback, gradedBy]
    );
    return result.rows[0] || null;
};

const findSubmissionsByAssignment = async (assignmentId) => {
    const result = await query(
        `SELECT sub.*, u.name as student_name, u.email as student_email
     FROM assignment_submissions sub
     JOIN users u ON sub.student_id = u.id
     WHERE sub.assignment_id = $1
     ORDER BY sub.submitted_at DESC`,
        [assignmentId]
    );
    return result.rows;
};

// ─── Marks Queries ────────────────────────────────────────

const createMark = async ({ studentId, subjectId, examType, marks, maxMarks, enteredBy }) => {
    const result = await query(
        `INSERT INTO marks (student_id, subject_id, exam_type, marks, max_marks, entered_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
        [studentId, subjectId, examType, marks, maxMarks, enteredBy]
    );
    return result.rows[0];
};

const findMarksByStudent = async (studentId) => {
    const result = await query(
        `SELECT m.*, s.name as subject_name, s.code as subject_code
     FROM marks m
     JOIN subjects s ON m.subject_id = s.id
     WHERE m.student_id = $1
     ORDER BY s.name, m.exam_type`,
        [studentId]
    );
    return result.rows;
};

const findMarksBySubject = async (subjectId, examType = null) => {
    let sql = `
    SELECT m.*, u.name as student_name
    FROM marks m
    JOIN users u ON m.student_id = u.id
    WHERE m.subject_id = $1`;
    const params = [subjectId];

    if (examType) {
        sql += ' AND m.exam_type = $2';
        params.push(examType);
    }

    sql += ' ORDER BY u.name ASC';
    const result = await query(sql, params);
    return result.rows;
};

// ─── Announcement Queries ─────────────────────────────────

const createAnnouncement = async ({ title, content, departmentId, targetRole, createdBy }) => {
    const result = await query(
        `INSERT INTO announcements (title, content, department_id, target_role, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
        [title, content, departmentId, targetRole, createdBy]
    );
    return result.rows[0];
};

const findAnnouncements = async (departmentId, role) => {
    const result = await query(
        `SELECT a.*, u.name as author_name
     FROM announcements a
     JOIN users u ON a.created_by = u.id
     WHERE a.department_id = $1
       AND (a.target_role IS NULL OR a.target_role = $2)
     ORDER BY a.created_at DESC`,
        [departmentId, role]
    );
    return result.rows;
};

const deleteAnnouncement = async (id) => {
    const result = await query('DELETE FROM announcements WHERE id = $1 RETURNING id', [id]);
    return result.rowCount > 0;
};

// ─── Leave Queries ────────────────────────────────────────

const createLeaveRequest = async ({ userId, leaveType, startDate, endDate, reason }) => {
    const result = await query(
        `INSERT INTO leaves (user_id, leave_type, start_date, end_date, reason)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
        [userId, leaveType, startDate, endDate, reason]
    );
    return result.rows[0];
};

const findLeavesByUser = async (userId) => {
    const result = await query(
        'SELECT * FROM leaves WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
    );
    return result.rows;
};

const findLeavesByDepartment = async (departmentId, status = null) => {
    let sql = `
    SELECT l.*, u.name as user_name, u.role as user_role
    FROM leaves l
    JOIN users u ON l.user_id = u.id
    WHERE u.department_id = $1`;
    const params = [departmentId];

    if (status) {
        sql += ' AND l.status = $2';
        params.push(status);
    }

    sql += ' ORDER BY l.created_at DESC';
    const result = await query(sql, params);
    return result.rows;
};

const updateLeaveStatus = async (id, { status, approvedBy, remarks }) => {
    const result = await query(
        `UPDATE leaves
     SET status = $2, approved_by = $3, remarks = $4, updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
        [id, status, approvedBy, remarks]
    );
    return result.rows[0] || null;
};

// ─── Content Queries ──────────────────────────────────────

const createContent = async ({ title, description, subjectId, fileUrl, contentType, uploadedBy }) => {
    const result = await query(
        `INSERT INTO content (title, description, subject_id, file_url, content_type, uploaded_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
        [title, description, subjectId, fileUrl, contentType, uploadedBy]
    );
    return result.rows[0];
};

const findContentBySubject = async (subjectId) => {
    const result = await query(
        `SELECT c.*, u.name as uploaded_by_name
     FROM content c
     JOIN users u ON c.uploaded_by = u.id
     WHERE c.subject_id = $1
     ORDER BY c.created_at DESC`,
        [subjectId]
    );
    return result.rows;
};

const deleteContent = async (id) => {
    const result = await query('DELETE FROM content WHERE id = $1 RETURNING id', [id]);
    return result.rowCount > 0;
};

// ─── Dashboard / Report Queries ───────────────────────────

const getDepartmentStats = async (departmentId) => {
    const result = await query(
        `SELECT
       (SELECT COUNT(*) FROM users WHERE department_id = $1 AND role = 'student') as total_students,
       (SELECT COUNT(*) FROM users WHERE department_id = $1 AND role = 'staff') as total_staff,
       (SELECT COUNT(*) FROM subjects WHERE department_id = $1) as total_subjects,
       (SELECT COUNT(*) FROM leaves WHERE user_id IN
         (SELECT id FROM users WHERE department_id = $1) AND status = 'pending') as pending_leaves`,
        [departmentId]
    );
    return result.rows[0];
};

module.exports = {
    // Users
    findUserByEmail,
    findUserById,
    createUser,
    updateUser,
    deleteUser,
    findUsersByRole,
    // Departments
    findAllDepartments,
    findDepartmentById,
    // Subjects
    findSubjectsByDepartment,
    findSubjectById,
    createSubject,
    updateSubject,
    deleteSubject,
    // Attendance
    createAttendanceRecord,
    createBulkAttendance,
    findAttendanceByStudent,
    findAttendanceBySubjectAndDate,
    getAttendanceSummary,
    // Assignments
    createAssignment,
    findAssignmentsBySubject,
    findAssignmentById,
    submitAssignment,
    gradeSubmission,
    findSubmissionsByAssignment,
    // Marks
    createMark,
    findMarksByStudent,
    findMarksBySubject,
    // Announcements
    createAnnouncement,
    findAnnouncements,
    deleteAnnouncement,
    // Leaves
    createLeaveRequest,
    findLeavesByUser,
    findLeavesByDepartment,
    updateLeaveStatus,
    // Content
    createContent,
    findContentBySubject,
    deleteContent,
    // Dashboard
    getDepartmentStats,
};
