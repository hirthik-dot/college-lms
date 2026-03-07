const db = require('../models/db');
const { createError } = require('../middleware/errorHandler');

/**
 * GET /api/subjects
 */
const getSubjects = async (req, res, next) => {
    try {
        const { departmentId } = req.query;
        const deptId = departmentId || req.user.departmentId;

        const subjects = await db.findSubjectsByDepartment(deptId);
        res.status(200).json({ success: true, data: subjects });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/subjects/:id
 */
const getSubjectById = async (req, res, next) => {
    try {
        const subject = await db.findSubjectById(req.params.id);
        if (!subject) throw createError('Subject not found.', 404);

        res.status(200).json({ success: true, data: subject });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/subjects
 */
const createSubject = async (req, res, next) => {
    try {
        const { name, code, departmentId, staffId, semester } = req.body;

        if (!name || !code) throw createError('Name and code are required.', 400);

        const subject = await db.createSubject({
            name,
            code,
            departmentId: departmentId || req.user.departmentId,
            staffId,
            semester,
        });

        res.status(201).json({ success: true, data: subject });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/subjects/:id
 */
const updateSubject = async (req, res, next) => {
    try {
        const { name, code, staffId, semester } = req.body;

        const updated = await db.updateSubject(req.params.id, {
            name,
            code,
            staff_id: staffId,
            semester,
        });

        if (!updated) throw createError('Subject not found.', 404);

        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/subjects/:id
 */
const deleteSubject = async (req, res, next) => {
    try {
        const deleted = await db.deleteSubject(req.params.id);
        if (!deleted) throw createError('Subject not found.', 404);

        res.status(200).json({ success: true, message: 'Subject deleted.' });
    } catch (error) {
        next(error);
    }
};

module.exports = { getSubjects, getSubjectById, createSubject, updateSubject, deleteSubject };
