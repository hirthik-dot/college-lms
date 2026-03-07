const db = require('../models/db');
const { createError } = require('../middleware/errorHandler');

/**
 * GET /api/students/dashboard
 */
const getDashboard = async (req, res, next) => {
    try {
        const user = await db.findUserById(req.user.id);
        if (!user) throw createError('Student not found.', 404);

        const subjects = await db.findSubjectsByDepartment(user.department_id);
        const announcements = await db.findAnnouncements(user.department_id, 'student');

        res.status(200).json({
            success: true,
            data: { user, subjects, announcements },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/students/attendance
 */
const getAttendance = async (req, res, next) => {
    try {
        const { subjectId } = req.query;
        const records = await db.findAttendanceByStudent(req.user.id, subjectId || null);

        let summary = null;
        if (subjectId) {
            summary = await db.getAttendanceSummary(req.user.id, subjectId);
        }

        res.status(200).json({ success: true, data: { records, summary } });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/students/assignments
 */
const getAssignments = async (req, res, next) => {
    try {
        const { subjectId } = req.query;
        if (!subjectId) throw createError('Subject ID is required.', 400);

        const assignments = await db.findAssignmentsBySubject(subjectId);
        res.status(200).json({ success: true, data: assignments });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/students/assignments/:id/submit
 */
const submitAssignment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { content, fileUrl } = req.body;

        const assignment = await db.findAssignmentById(id);
        if (!assignment) throw createError('Assignment not found.', 404);

        const submission = await db.submitAssignment({
            assignmentId: id,
            studentId: req.user.id,
            content,
            fileUrl,
        });

        res.status(201).json({ success: true, data: submission });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/students/marks
 */
const getMarks = async (req, res, next) => {
    try {
        const marks = await db.findMarksByStudent(req.user.id);
        res.status(200).json({ success: true, data: marks });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/students/content
 */
const getContent = async (req, res, next) => {
    try {
        const { subjectId } = req.query;
        if (!subjectId) throw createError('Subject ID is required.', 400);

        const content = await db.findContentBySubject(subjectId);
        res.status(200).json({ success: true, data: content });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/students/announcements
 */
const getAnnouncements = async (req, res, next) => {
    try {
        const user = await db.findUserById(req.user.id);
        const announcements = await db.findAnnouncements(user.department_id, 'student');
        res.status(200).json({ success: true, data: announcements });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDashboard,
    getAttendance,
    getAssignments,
    submitAssignment,
    getMarks,
    getContent,
    getAnnouncements,
};
