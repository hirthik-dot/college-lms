const db = require('../models/db');
const { createError } = require('../middleware/errorHandler');
const { validateAttendance } = require('../utils/validators');

/**
 * POST /api/attendance
 */
const recordAttendance = async (req, res, next) => {
    try {
        const { studentId, subjectId, date, status } = req.body;

        const validation = validateAttendance({ studentId, subjectId, date, status });
        if (!validation.valid) {
            return res.status(400).json({ success: false, errors: validation.errors });
        }

        const record = await db.createAttendanceRecord({
            studentId,
            subjectId,
            date,
            status,
            markedBy: req.user.id,
        });

        res.status(201).json({ success: true, data: record });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/attendance/bulk
 */
const recordBulkAttendance = async (req, res, next) => {
    try {
        const { subjectId, date, records } = req.body;

        if (!subjectId || !date || !Array.isArray(records)) {
            throw createError('Subject ID, date, and records array are required.', 400);
        }

        const attendanceRecords = records.map((r) => ({
            studentId: r.studentId,
            subjectId,
            date,
            status: r.status,
        }));

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
 * GET /api/attendance/student/:studentId
 */
const getStudentAttendance = async (req, res, next) => {
    try {
        const { studentId } = req.params;
        const { subjectId } = req.query;

        const records = await db.findAttendanceByStudent(studentId, subjectId || null);
        res.status(200).json({ success: true, data: records });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/attendance/subject/:subjectId
 */
const getSubjectAttendance = async (req, res, next) => {
    try {
        const { subjectId } = req.params;
        const { date } = req.query;

        if (!date) throw createError('Date query parameter is required.', 400);

        const records = await db.findAttendanceBySubjectAndDate(subjectId, date);
        res.status(200).json({ success: true, data: records });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/attendance/summary/:studentId/:subjectId
 */
const getAttendanceSummary = async (req, res, next) => {
    try {
        const { studentId, subjectId } = req.params;
        const summary = await db.getAttendanceSummary(studentId, subjectId);
        res.status(200).json({ success: true, data: summary });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    recordAttendance,
    recordBulkAttendance,
    getStudentAttendance,
    getSubjectAttendance,
    getAttendanceSummary,
};
