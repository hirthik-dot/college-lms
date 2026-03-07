const db = require('../models/db');
const { createError } = require('../middleware/errorHandler');

/**
 * GET /api/announcements
 */
const getAnnouncements = async (req, res, next) => {
    try {
        const user = await db.findUserById(req.user.id);
        const announcements = await db.findAnnouncements(user.department_id, req.user.role);
        res.status(200).json({ success: true, data: announcements });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/announcements
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

/**
 * DELETE /api/announcements/:id
 */
const deleteAnnouncement = async (req, res, next) => {
    try {
        const deleted = await db.deleteAnnouncement(req.params.id);
        if (!deleted) throw createError('Announcement not found.', 404);

        res.status(200).json({ success: true, message: 'Announcement deleted.' });
    } catch (error) {
        next(error);
    }
};

module.exports = { getAnnouncements, createAnnouncement, deleteAnnouncement };
