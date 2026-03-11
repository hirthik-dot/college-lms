/**
 * Timetable Routes
 * Exports separate routers for HOD, Staff, and Student timetable endpoints.
 */

const express = require('express');
const multer = require('multer');
const ctrl = require('../controllers/timetableController');

// Multer config for PDF uploads (memory storage)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed.'), false);
        }
    },
});

// ═══════════════════════════════════════════════════════════════
// HOD TIMETABLE ROUTES
// ═══════════════════════════════════════════════════════════════
const hodRouter = express.Router();

hodRouter.post('/upload', upload.single('file'), ctrl.uploadTimetable);
hodRouter.get('/staff-wise', ctrl.getStaffWiseTimetable);
hodRouter.get('/class-wise', ctrl.getClassWiseTimetable);
hodRouter.get('/upload-history', ctrl.getUploadHistory);
hodRouter.get('/classes', ctrl.getAllClasses);
hodRouter.get('/staff-list', ctrl.getStaffList);

// ═══════════════════════════════════════════════════════════════
// STAFF TIMETABLE ROUTES
// ═══════════════════════════════════════════════════════════════
const staffRouter = express.Router();

staffRouter.get('/my', ctrl.getMyTimetable);
staffRouter.get('/today', ctrl.getTodaySlots);
staffRouter.get('/current-slot', ctrl.getCurrentSlot);

// ═══════════════════════════════════════════════════════════════
// STUDENT TIMETABLE ROUTES
// ═══════════════════════════════════════════════════════════════
const studentRouter = express.Router();

studentRouter.get('/my', ctrl.getStudentTimetable);

module.exports = {
    hod: hodRouter,
    staff: staffRouter,
    student: studentRouter,
};
