const db = require('../models/db');
const { createError } = require('../middleware/errorHandler');
const { validateUserCreate } = require('../utils/validators');
const { ROLES } = require('../config/constants');

/**
 * GET /api/hod/dashboard
 */
const getDashboard = async (req, res, next) => {
    try {
        const user = await db.findUserById(req.user.id);
        if (!user) throw createError('HOD not found.', 404);

        const stats = await db.getDepartmentStats(user.department_id);
        const announcements = await db.findAnnouncements(user.department_id, 'hod');

        res.status(200).json({
            success: true,
            data: { user, stats, announcements },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/hod/staff
 */
const getStaff = async (req, res, next) => {
    try {
        const staff = await db.findUsersByRole(ROLES.STAFF, req.user.departmentId);
        res.status(200).json({ success: true, data: staff });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/hod/staff
 */
const addStaff = async (req, res, next) => {
    try {
        const { name, email, password, phone } = req.body;

        const validation = validateUserCreate({ name, email, password, role: ROLES.STAFF });
        if (!validation.valid) {
            return res.status(400).json({ success: false, errors: validation.errors });
        }

        const existing = await db.findUserByEmail(email.toLowerCase().trim());
        if (existing) throw createError('A user with this email already exists.', 409);

        const staff = await db.createUser({
            name,
            email: email.toLowerCase().trim(),
            password,
            role: ROLES.STAFF,
            departmentId: req.user.departmentId,
            phone,
        });

        res.status(201).json({ success: true, data: staff });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/hod/staff/:id
 */
const updateStaff = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, phone } = req.body;

        const updated = await db.updateUser(id, { name, phone });
        if (!updated) throw createError('Staff member not found.', 404);

        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/hod/staff/:id
 */
const removeStaff = async (req, res, next) => {
    try {
        const { id } = req.params;
        const deleted = await db.deleteUser(id);
        if (!deleted) throw createError('Staff member not found.', 404);

        res.status(200).json({ success: true, message: 'Staff member removed.' });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/hod/students
 */
const getStudents = async (req, res, next) => {
    try {
        const students = await db.findUsersByRole(ROLES.STUDENT, req.user.departmentId);
        res.status(200).json({ success: true, data: students });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/hod/students
 */
const addStudent = async (req, res, next) => {
    try {
        const { name, email, password, phone } = req.body;

        const validation = validateUserCreate({ name, email, password, role: ROLES.STUDENT });
        if (!validation.valid) {
            return res.status(400).json({ success: false, errors: validation.errors });
        }

        const existing = await db.findUserByEmail(email.toLowerCase().trim());
        if (existing) throw createError('A user with this email already exists.', 409);

        const student = await db.createUser({
            name,
            email: email.toLowerCase().trim(),
            password,
            role: ROLES.STUDENT,
            departmentId: req.user.departmentId,
            phone,
        });

        res.status(201).json({ success: true, data: student });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/hod/students/:id
 */
const updateStudent = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, phone } = req.body;

        const updated = await db.updateUser(id, { name, phone });
        if (!updated) throw createError('Student not found.', 404);

        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/hod/students/:id
 */
const removeStudent = async (req, res, next) => {
    try {
        const { id } = req.params;
        const deleted = await db.deleteUser(id);
        if (!deleted) throw createError('Student not found.', 404);

        res.status(200).json({ success: true, message: 'Student removed.' });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/hod/subjects
 */
const getSubjects = async (req, res, next) => {
    try {
        const subjects = await db.findSubjectsByDepartment(req.user.departmentId);
        res.status(200).json({ success: true, data: subjects });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/hod/subjects
 */
const addSubject = async (req, res, next) => {
    try {
        const { name, code, staffId, semester } = req.body;

        if (!name || !code) throw createError('Subject name and code are required.', 400);

        const subject = await db.createSubject({
            name,
            code,
            departmentId: req.user.departmentId,
            staffId,
            semester,
        });

        res.status(201).json({ success: true, data: subject });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/hod/subjects/:id
 */
const updateSubject = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, code, staffId, semester } = req.body;

        const updated = await db.updateSubject(id, { name, code, staff_id: staffId, semester });
        if (!updated) throw createError('Subject not found.', 404);

        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/hod/subjects/:id
 */
const removeSubject = async (req, res, next) => {
    try {
        const { id } = req.params;
        const deleted = await db.deleteSubject(id);
        if (!deleted) throw createError('Subject not found.', 404);

        res.status(200).json({ success: true, message: 'Subject removed.' });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/hod/attendance-reports
 */
const getAttendanceReports = async (req, res, next) => {
    try {
        const students = await db.findUsersByRole(ROLES.STUDENT, req.user.departmentId);
        const subjects = await db.findSubjectsByDepartment(req.user.departmentId);

        const reports = [];
        for (const student of students) {
            const studentReport = { student: { id: student.id, name: student.name }, subjects: [] };
            for (const subject of subjects) {
                const summary = await db.getAttendanceSummary(student.id, subject.id);
                studentReport.subjects.push({
                    subjectId: subject.id,
                    subjectName: subject.name,
                    ...summary,
                });
            }
            reports.push(studentReport);
        }

        res.status(200).json({ success: true, data: reports });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/hod/marks-reports
 */
const getMarksReports = async (req, res, next) => {
    try {
        const subjects = await db.findSubjectsByDepartment(req.user.departmentId);

        const reports = [];
        for (const subject of subjects) {
            const marks = await db.findMarksBySubject(subject.id);
            reports.push({
                subject: { id: subject.id, name: subject.name, code: subject.code },
                marks,
            });
        }

        res.status(200).json({ success: true, data: reports });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/hod/leaves
 */
const getLeaves = async (req, res, next) => {
    try {
        const { status } = req.query;
        const leaves = await db.findLeavesByDepartment(req.user.departmentId, status || null);
        res.status(200).json({ success: true, data: leaves });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/hod/leaves/:id
 */
const approveOrRejectLeave = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status, remarks } = req.body;

        if (!['approved', 'rejected'].includes(status)) {
            throw createError('Status must be "approved" or "rejected".', 400);
        }

        const leave = await db.updateLeaveStatus(id, {
            status,
            approvedBy: req.user.id,
            remarks,
        });

        if (!leave) throw createError('Leave request not found.', 404);

        res.status(200).json({ success: true, data: leave });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/hod/announcements
 */
const createAnnouncement = async (req, res, next) => {
    try {
        const { title, content, targetRole } = req.body;

        if (!title || !content) throw createError('Title and content are required.', 400);

        const user = await db.findUserById(req.user.id);
        const announcement = await db.createAnnouncement({
            title,
            content,
            departmentId: user.department_id,
            targetRole: targetRole || null,
            createdBy: req.user.id,
        });

        res.status(201).json({ success: true, data: announcement });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/hod/department-reports
 */
const getDepartmentReports = async (req, res, next) => {
    try {
        const stats = await db.getDepartmentStats(req.user.departmentId);
        const subjects = await db.findSubjectsByDepartment(req.user.departmentId);
        const staff = await db.findUsersByRole(ROLES.STAFF, req.user.departmentId);
        const students = await db.findUsersByRole(ROLES.STUDENT, req.user.departmentId);

        res.status(200).json({
            success: true,
            data: { stats, subjects, staff, students },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDashboard,
    getStaff,
    addStaff,
    updateStaff,
    removeStaff,
    getStudents,
    addStudent,
    updateStudent,
    removeStudent,
    getSubjects,
    addSubject,
    updateSubject,
    removeSubject,
    getAttendanceReports,
    getMarksReports,
    getLeaves,
    approveOrRejectLeave,
    createAnnouncement,
    getDepartmentReports,
};
