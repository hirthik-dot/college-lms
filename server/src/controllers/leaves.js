const db = require('../models/db');
const { createError } = require('../middleware/errorHandler');

/**
 * POST /api/leaves
 */
const createLeave = async (req, res, next) => {
    try {
        const { leaveType, startDate, endDate, reason } = req.body;

        if (!leaveType || !startDate || !endDate) {
            throw createError('Leave type, start date, and end date are required.', 400);
        }

        if (new Date(startDate) > new Date(endDate)) {
            throw createError('Start date cannot be after end date.', 400);
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
 * GET /api/leaves/my
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
 * GET /api/leaves/department
 */
const getDepartmentLeaves = async (req, res, next) => {
    try {
        const { status } = req.query;
        const leaves = await db.findLeavesByDepartment(req.user.departmentId, status || null);
        res.status(200).json({ success: true, data: leaves });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/leaves/:id/status
 */
const updateLeaveStatus = async (req, res, next) => {
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

module.exports = { createLeave, getMyLeaves, getDepartmentLeaves, updateLeaveStatus };
