const db = require('../models/db');
const { createError } = require('../middleware/errorHandler');
const { validateMarks } = require('../utils/validators');

/**
 * POST /api/marks
 */
const addMarks = async (req, res, next) => {
    try {
        const { studentId, subjectId, examType, marks, maxMarks } = req.body;

        const validation = validateMarks({ studentId, subjectId, marks, maxMarks });
        if (!validation.valid) {
            return res.status(400).json({ success: false, errors: validation.errors });
        }

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
 * GET /api/marks/student/:studentId
 */
const getStudentMarks = async (req, res, next) => {
    try {
        const marks = await db.findMarksByStudent(req.params.studentId);
        res.status(200).json({ success: true, data: marks });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/marks/subject/:subjectId
 */
const getSubjectMarks = async (req, res, next) => {
    try {
        const { examType } = req.query;
        const marks = await db.findMarksBySubject(req.params.subjectId, examType || null);
        res.status(200).json({ success: true, data: marks });
    } catch (error) {
        next(error);
    }
};

module.exports = { addMarks, getStudentMarks, getSubjectMarks };
