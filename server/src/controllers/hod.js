const db = require('../models/db');
const { hashPassword } = require('../utils/bcrypt');
const {
    validateUserCreate,
    validateSubject,
    validateAnnouncement,
} = require('../utils/validators');

// ── Helper: get HOD's department ────────────────────────────
const getHodDeptId = async (userId) => {
    const user = await db.findUserById(userId);
    return user ? user.department_id : null;
};

/**
 * GET /api/hod/dashboard
 */
const getDashboard = async (req, res, next) => {
    try {
        const deptId = await getHodDeptId(req.user.id);
        const stats = await db.getDepartmentStats(deptId);
        const announcements = await db.findAllAnnouncements(deptId);

        return res.status(200).json({
            success: true,
            data: {
                stats,
                recentAnnouncements: announcements.slice(0, 5),
            },
        });
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// STAFF MANAGEMENT
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/hod/staff
 */
const getStaff = async (req, res, next) => {
    try {
        const deptId = await getHodDeptId(req.user.id);
        const staff = await db.findUsersByRole('staff', deptId);
        return res.status(200).json({ success: true, data: staff });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/hod/staff
 * Body: { username, email, password, full_name, phone, employeeId, designation }
 */
const createStaff = async (req, res, next) => {
    try {
        const { username, email, password, full_name, phone, employeeId, designation } = req.body;

        const { valid, errors } = validateUserCreate({ username, email, password, full_name, role: 'staff' });
        if (!valid) {
            return res.status(400).json({ success: false, message: 'Validation failed.', errors });
        }

        // Check duplicate username/email
        const existingUsername = await db.findUserByUsername(username);
        if (existingUsername) {
            return res.status(409).json({ success: false, message: 'Username already taken.' });
        }
        const existingEmail = await db.findUserByEmail(email);
        if (existingEmail) {
            return res.status(409).json({ success: false, message: 'Email already in use.' });
        }

        const deptId = await getHodDeptId(req.user.id);

        const user = await db.createUser({
            username,
            email,
            password,
            role: 'staff',
            full_name,
            phone,
            departmentId: deptId,
        });

        // Create staff profile if employeeId provided
        let profile = null;
        if (employeeId) {
            profile = await db.createStaffProfile({
                userId: user.id,
                employeeId,
                designation,
                phone,
            });
        }

        return res.status(201).json({
            success: true,
            message: 'Staff account created.',
            data: { ...user, profile },
        });
    } catch (err) {
        next(err);
    }
};

/**
 * PUT /api/hod/staff/:id
 * Body: { full_name, email, phone, is_active, … }
 */
const updateStaff = async (req, res, next) => {
    try {
        const staffId = req.params.id;
        const user = await db.findUserById(staffId);

        if (!user || user.role !== 'staff') {
            return res.status(404).json({ success: false, message: 'Staff member not found.' });
        }

        const updated = await db.updateUser(staffId, req.body);

        return res.status(200).json({
            success: true,
            message: 'Staff member updated.',
            data: updated,
        });
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// STUDENT MANAGEMENT
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/hod/students
 */
const getStudents = async (req, res, next) => {
    try {
        const deptId = await getHodDeptId(req.user.id);
        const students = await db.findUsersByRole('student', deptId);
        return res.status(200).json({ success: true, data: students });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/hod/students
 * Body: { username, email, password, full_name, phone, rollNumber, batch, yearOfStudy, parentPhone }
 */
const createStudent = async (req, res, next) => {
    try {
        const { username, email, password, full_name, phone, rollNumber, batch, yearOfStudy, parentPhone } = req.body;

        const { valid, errors } = validateUserCreate({ username, email, password, full_name, role: 'student' });
        if (!valid) {
            return res.status(400).json({ success: false, message: 'Validation failed.', errors });
        }

        const existingUsername = await db.findUserByUsername(username);
        if (existingUsername) {
            return res.status(409).json({ success: false, message: 'Username already taken.' });
        }
        const existingEmail = await db.findUserByEmail(email);
        if (existingEmail) {
            return res.status(409).json({ success: false, message: 'Email already in use.' });
        }

        const deptId = await getHodDeptId(req.user.id);

        const user = await db.createUser({
            username,
            email,
            password,
            role: 'student',
            full_name,
            phone,
            departmentId: deptId,
        });

        // Create student profile if rollNumber provided
        let profile = null;
        if (rollNumber) {
            profile = await db.createStudentProfile({
                userId: user.id,
                rollNumber,
                batch,
                yearOfStudy,
                phone,
                parentPhone,
            });
        }

        return res.status(201).json({
            success: true,
            message: 'Student account created.',
            data: { ...user, profile },
        });
    } catch (err) {
        next(err);
    }
};

/**
 * PUT /api/hod/students/:id
 */
const updateStudent = async (req, res, next) => {
    try {
        const studentId = req.params.id;
        const user = await db.findUserById(studentId);

        if (!user || user.role !== 'student') {
            return res.status(404).json({ success: false, message: 'Student not found.' });
        }

        const updated = await db.updateUser(studentId, req.body);

        return res.status(200).json({
            success: true,
            message: 'Student updated.',
            data: updated,
        });
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// SUBJECT MANAGEMENT
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/hod/subjects
 */
const getSubjects = async (req, res, next) => {
    try {
        const deptId = await getHodDeptId(req.user.id);
        const subjects = await db.findAllSubjects(deptId);
        return res.status(200).json({ success: true, data: subjects });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/hod/subjects
 * Body: { name, code, semester, academicYear, staffId }
 */
const createSubject = async (req, res, next) => {
    try {
        const { name, code, semester, academicYear, staffId } = req.body;

        const { valid, errors } = validateSubject({ name, code, semester });
        if (!valid) {
            return res.status(400).json({ success: false, message: 'Validation failed.', errors });
        }

        const deptId = await getHodDeptId(req.user.id);

        const subject = await db.createSubject({
            name,
            code,
            semester,
            academicYear,
            departmentId: deptId,
            staffId: staffId || null,
        });

        return res.status(201).json({
            success: true,
            message: 'Subject created.',
            data: subject,
        });
    } catch (err) {
        next(err);
    }
};

/**
 * PUT /api/hod/subjects/:id
 */
const updateSubject = async (req, res, next) => {
    try {
        const subject = await db.findSubjectById(req.params.id);
        if (!subject) {
            return res.status(404).json({ success: false, message: 'Subject not found.' });
        }

        const updated = await db.updateSubject(req.params.id, req.body);

        return res.status(200).json({
            success: true,
            message: 'Subject updated.',
            data: updated,
        });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/hod/subjects/:id/enroll
 * Body: { studentIds: [1, 2, 3, …] }
 */
const bulkEnroll = async (req, res, next) => {
    try {
        const { studentIds } = req.body;
        const subjectId = req.params.id;

        if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({ success: false, message: 'studentIds array is required.' });
        }

        const subject = await db.findSubjectById(subjectId);
        if (!subject) {
            return res.status(404).json({ success: false, message: 'Subject not found.' });
        }

        const enrolled = await db.bulkEnrollStudents(subjectId, studentIds);

        return res.status(201).json({
            success: true,
            message: `${enrolled.length} student(s) enrolled.`,
            data: enrolled,
        });
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// REPORTS
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/hod/reports/attendance
 * Query: subjectId, startDate, endDate, belowThreshold
 */
const getAttendanceReport = async (req, res, next) => {
    try {
        const deptId = await getHodDeptId(req.user.id);
        const { subjectId, startDate, endDate, belowThreshold } = req.query;

        const report = await db.getAttendanceReport({
            departmentId: deptId,
            subjectId: subjectId || null,
            startDate: startDate || null,
            endDate: endDate || null,
            belowThreshold: belowThreshold ? Number(belowThreshold) : null,
        });

        return res.status(200).json({ success: true, data: report });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/hod/reports/marks
 */
const getMarksReport = async (req, res, next) => {
    try {
        const deptId = await getHodDeptId(req.user.id);
        const report = await db.getMarksReport(deptId);
        return res.status(200).json({ success: true, data: report });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/hod/reports/assignments
 */
const getAssignmentReport = async (req, res, next) => {
    try {
        const deptId = await getHodDeptId(req.user.id);
        const report = await db.getAssignmentCompletionReport(deptId);
        return res.status(200).json({ success: true, data: report });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/hod/reports/staff-activity
 */
const getStaffActivityReport = async (req, res, next) => {
    try {
        const deptId = await getHodDeptId(req.user.id);
        const report = await db.getStaffActivityReport(deptId);
        return res.status(200).json({ success: true, data: report });
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// LEAVE MANAGEMENT
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/hod/leaves
 */
const getLeaves = async (req, res, next) => {
    try {
        const deptId = await getHodDeptId(req.user.id);
        const leaves = await db.findLeavesByDepartment(deptId);
        return res.status(200).json({ success: true, data: leaves });
    } catch (err) {
        next(err);
    }
};

/**
 * PUT /api/hod/leaves/:id
 * Body: { status: 'approved'|'rejected', reviewComment }
 */
const reviewLeave = async (req, res, next) => {
    try {
        const { status, reviewComment } = req.body;

        if (!status || !['approved', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Status must be "approved" or "rejected".',
            });
        }

        const leave = await db.findLeaveById(req.params.id);
        if (!leave) {
            return res.status(404).json({ success: false, message: 'Leave request not found.' });
        }

        if (leave.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `This leave request has already been ${leave.status}.`,
            });
        }

        const updated = await db.updateLeaveStatus(req.params.id, {
            status,
            reviewedBy: req.user.id,
            reviewComment,
        });

        return res.status(200).json({
            success: true,
            message: `Leave request ${status}.`,
            data: updated,
        });
    } catch (err) {
        next(err);
    }
};

// ═══════════════════════════════════════════════════════════════
// ANNOUNCEMENTS
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/hod/announcements
 * Body: { title, body, targetAudience, isPinned, sendEmail }
 */
const createAnnouncement = async (req, res, next) => {
    try {
        const { title, body, targetAudience, isPinned, sendEmail } = req.body;

        const { valid, errors } = validateAnnouncement({ title, body, targetAudience });
        if (!valid) {
            return res.status(400).json({ success: false, message: 'Validation failed.', errors });
        }

        const deptId = await getHodDeptId(req.user.id);

        const announcement = await db.createAnnouncement({
            title,
            body,
            targetAudience,
            postedBy: req.user.id,
            subjectId: null,
            departmentId: deptId,
            isPinned: isPinned || false,
            sendEmail: sendEmail || false,
        });

        return res.status(201).json({
            success: true,
            message: 'Announcement posted.',
            data: announcement,
        });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/hod/announcements
 */
const getAnnouncements = async (req, res, next) => {
    try {
        const deptId = await getHodDeptId(req.user.id);
        const announcements = await db.findAllAnnouncements(deptId);
        return res.status(200).json({ success: true, data: announcements });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getDashboard,
    // Staff management
    getStaff,
    createStaff,
    updateStaff,
    // Student management
    getStudents,
    createStudent,
    updateStudent,
    // Subjects
    getSubjects,
    createSubject,
    updateSubject,
    bulkEnroll,
    // Reports
    getAttendanceReport,
    getMarksReport,
    getAssignmentReport,
    getStaffActivityReport,
    // Leaves
    getLeaves,
    reviewLeave,
    // Announcements
    createAnnouncement,
    getAnnouncements,
};
