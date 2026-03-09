const db = require('../models/db');

/**
 * GET /api/student/dashboard
 * Today's subjects, pending assignments, recent announcements
 */
const getDashboard = async (req, res, next) => {
    try {
        const studentId = req.user.id;

        const dashData = await db.getStudentDashboardData(studentId);
        const user = await db.findUserById(studentId);

        // Recent announcements (top 5)
        const announcements = await db.findAnnouncements({
            departmentId: user.department_id,
            role: 'student',
        });

        return res.status(200).json({
            success: true,
            data: {
                subjects: dashData.subjects,
                pendingAssignments: dashData.pendingAssignments,
                announcements: announcements.slice(0, 5),
            },
        });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/student/subjects
 * All enrolled subjects with staff name
 */
const getSubjects = async (req, res, next) => {
    try {
        const subjects = await db.findEnrolledSubjects(req.user.id);
        return res.status(200).json({ success: true, data: subjects });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/student/attendance
 * Attendance percentage per subject + overall summary
 */
const getAttendance = async (req, res, next) => {
    try {
        const summary = await db.getStudentAttendanceSummary(req.user.id);
        return res.status(200).json({ success: true, data: summary });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/student/attendance/:subjectId
 * Detailed attendance for a specific subject
 */
const getAttendanceBySubject = async (req, res, next) => {
    try {
        const { subjectId } = req.params;
        const detail = await db.getStudentAttendanceDetail(req.user.id, subjectId);
        const summary = await db.getStudentAttendanceSummary(req.user.id);
        const subjectSummary = summary.find((s) => String(s.subject_id) === String(subjectId));

        return res.status(200).json({
            success: true,
            data: {
                summary: subjectSummary || null,
                sessions: detail,
            },
        });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/student/assignments
 * All assignments across enrolled subjects
 */
const getAssignments = async (req, res, next) => {
    try {
        const assignments = await db.findStudentAssignments(req.user.id);
        return res.status(200).json({ success: true, data: assignments });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/student/assignments/:id
 * Single assignment detail
 */
const getAssignmentDetail = async (req, res, next) => {
    try {
        const assignment = await db.findAssignmentById(req.params.id);
        if (!assignment) {
            return res.status(404).json({ success: false, message: 'Assignment not found.' });
        }
        return res.status(200).json({ success: true, data: assignment });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/student/assignments/:id/submit
 * Body: { fileUrl }
 */
const submitAssignment = async (req, res, next) => {
    try {
        const assignmentId = req.params.id;
        const { fileUrl } = req.body;

        if (!fileUrl || !String(fileUrl).trim()) {
            return res.status(400).json({ success: false, message: 'File URL is required.' });
        }

        // Check assignment exists
        const assignment = await db.findAssignmentById(assignmentId);
        if (!assignment) {
            return res.status(404).json({ success: false, message: 'Assignment not found.' });
        }

        if (!assignment.is_active) {
            return res.status(400).json({ success: false, message: 'This assignment is no longer active.' });
        }

        const submission = await db.submitAssignment({
            assignmentId,
            studentId: req.user.id,
            fileUrl: fileUrl.trim(),
        });

        return res.status(201).json({
            success: true,
            message: submission.is_late ? 'Assignment submitted (late).' : 'Assignment submitted successfully.',
            data: submission,
        });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/student/marks
 * All published assessment marks
 */
const getMarks = async (req, res, next) => {
    try {
        const marks = await db.findStudentMarks(req.user.id);
        return res.status(200).json({ success: true, data: marks });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/student/content/:subjectId
 * Study materials for a subject (visible only)
 */
const getContent = async (req, res, next) => {
    try {
        const content = await db.findContentBySubject(req.params.subjectId, true);
        return res.status(200).json({ success: true, data: content });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/student/announcements
 * All announcements relevant to students
 */
const getAnnouncements = async (req, res, next) => {
    try {
        const user = await db.findUserById(req.user.id);
        const announcements = await db.findAnnouncements({
            departmentId: user.department_id,
            role: 'student',
        });
        return res.status(200).json({ success: true, data: announcements });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getDashboard,
    getSubjects,
    getAttendance,
    getAttendanceBySubject,
    getAssignments,
    getAssignmentDetail,
    submitAssignment,
    getMarks,
    getContent,
    getAnnouncements,
};
