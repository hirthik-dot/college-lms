const db = require('../models/db');
const { createError } = require('../middleware/errorHandler');
const { validateAttendance, validateAssignment } = require('../utils/validators');

/**
 * GET /api/staff/dashboard
 */
const getDashboard = async (req, res, next) => {
    try {
        const user = await db.findUserById(req.user.id);
        if (!user) throw createError('Staff not found.', 404);

        const subjects = await db.findSubjectsByDepartment(user.department_id);
        const mySubjects = subjects.filter((s) => s.staff_id === req.user.id);
        const announcements = await db.findAnnouncements(user.department_id, 'staff');

        res.status(200).json({
            success: true,
            data: { user, mySubjects, announcements },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/staff/attendance
 */
const takeAttendance = async (req, res, next) => {
    try {
        const { subjectId, date, records } = req.body;

        if (!subjectId || !date || !Array.isArray(records) || records.length === 0) {
            throw createError('Subject ID, date, and attendance records are required.', 400);
        }

        const attendanceRecords = records.map((r) => ({
            studentId: r.studentId,
            subjectId,
            date,
            status: r.status,
        }));

        // Validate each record
        for (const record of attendanceRecords) {
            const validation = validateAttendance(record);
            if (!validation.valid) {
                throw createError(validation.errors.join(' '), 400);
            }
        }

        const result = await db.createBulkAttendance(attendanceRecords, req.user.id);

        res.status(201).json({
            success: true,
            message: `Attendance recorded for ${result.length} students.`,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/staff/attendance/:subjectId
 */
const getAttendanceBySubject = async (req, res, next) => {
    try {
        const { subjectId } = req.params;
        const { date } = req.query;

        if (!date) throw createError('Date query parameter is required.', 400);

        const attendance = await db.findAttendanceBySubjectAndDate(subjectId, date);
        res.status(200).json({ success: true, data: attendance });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/staff/content
 */
const uploadContent = async (req, res, next) => {
    try {
        const { title, description, subjectId, fileUrl, contentType } = req.body;

        if (!title || !subjectId) {
            throw createError('Title and subject ID are required.', 400);
        }

        const content = await db.createContent({
            title,
            description,
            subjectId,
            fileUrl,
            contentType,
            uploadedBy: req.user.id,
        });

        res.status(201).json({ success: true, data: content });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/staff/assignments
 */
const createAssignment = async (req, res, next) => {
    try {
        const { title, description, subjectId, dueDate, maxMarks } = req.body;

        const validation = validateAssignment({ title, subjectId, dueDate });
        if (!validation.valid) {
            return res.status(400).json({ success: false, errors: validation.errors });
        }

        const assignment = await db.createAssignment({
            title,
            description,
            subjectId,
            dueDate,
            maxMarks,
            createdBy: req.user.id,
        });

        res.status(201).json({ success: true, data: assignment });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/staff/assignments/:id/submissions
 */
const getSubmissions = async (req, res, next) => {
    try {
        const { id } = req.params;
        const submissions = await db.findSubmissionsByAssignment(id);
        res.status(200).json({ success: true, data: submissions });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/staff/assignments/submissions/:id/grade
 */
const gradeSubmission = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { marks, feedback } = req.body;

        if (marks === undefined || marks === null) {
            throw createError('Marks are required.', 400);
        }

        const submission = await db.gradeSubmission(id, {
            marks,
            feedback,
            gradedBy: req.user.id,
        });

        if (!submission) throw createError('Submission not found.', 404);

        res.status(200).json({ success: true, data: submission });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/staff/marks
 */
const enterMarks = async (req, res, next) => {
    try {
        const { studentId, subjectId, examType, marks, maxMarks } = req.body;

        const mark = await db.createMark({
            studentId,
            subjectId,
            examType,
            marks,
            maxMarks,
            enteredBy: req.user.id,
        });

        res.status(201).json({ success: true, data: mark });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/staff/marks/:subjectId
 */
const getMarksBySubject = async (req, res, next) => {
    try {
        const { subjectId } = req.params;
        const { examType } = req.query;
        const marks = await db.findMarksBySubject(subjectId, examType || null);
        res.status(200).json({ success: true, data: marks });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/staff/leaves
 */
const requestLeave = async (req, res, next) => {
    try {
        const { leaveType, startDate, endDate, reason } = req.body;

        if (!leaveType || !startDate || !endDate) {
            throw createError('Leave type, start date, and end date are required.', 400);
        }

        const leave = await db.createLeaveRequest({
            userId: req.user.id,
            leaveType,
            startDate,
            endDate,
            reason,
        });

        res.status(201).json({ success: true, data: leave });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/staff/leaves
 */
const getMyLeaves = async (req, res, next) => {
    try {
        const leaves = await db.findLeavesByUser(req.user.id);
        res.status(200).json({ success: true, data: leaves });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/staff/announcements
 */
const createAnnouncement = async (req, res, next) => {
    try {
        const { title, content, targetRole } = req.body;

        if (!title || !content) {
            throw createError('Title and content are required.', 400);
        }

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

module.exports = {
    getDashboard,
    takeAttendance,
    getAttendanceBySubject,
    uploadContent,
    createAssignment,
    getSubmissions,
    gradeSubmission,
    enterMarks,
    getMarksBySubject,
    requestLeave,
    getMyLeaves,
    createAnnouncement,
};
