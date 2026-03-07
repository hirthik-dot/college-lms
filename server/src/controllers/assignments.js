const db = require('../models/db');
const { createError } = require('../middleware/errorHandler');
const { validateAssignment } = require('../utils/validators');

/**
 * POST /api/assignments
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
 * GET /api/assignments/subject/:subjectId
 */
const getAssignmentsBySubject = async (req, res, next) => {
    try {
        const assignments = await db.findAssignmentsBySubject(req.params.subjectId);
        res.status(200).json({ success: true, data: assignments });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/assignments/:id
 */
const getAssignmentById = async (req, res, next) => {
    try {
        const assignment = await db.findAssignmentById(req.params.id);
        if (!assignment) throw createError('Assignment not found.', 404);

        res.status(200).json({ success: true, data: assignment });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/assignments/:id/submit
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
 * GET /api/assignments/:id/submissions
 */
const getSubmissions = async (req, res, next) => {
    try {
        const submissions = await db.findSubmissionsByAssignment(req.params.id);
        res.status(200).json({ success: true, data: submissions });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/assignments/submissions/:id/grade
 */
const gradeSubmission = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { marks, feedback } = req.body;

        if (marks === undefined || marks === null) {
            throw createError('Marks are required for grading.', 400);
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

module.exports = {
    createAssignment,
    getAssignmentsBySubject,
    getAssignmentById,
    submitAssignment,
    getSubmissions,
    gradeSubmission,
};
