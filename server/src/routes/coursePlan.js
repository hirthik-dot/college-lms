/**
 * Course Plan Routes
 * Exports faculty, hod, student, and notifications routers.
 */

const express = require('express');
const multer = require('multer');
const ctrl = require('../controllers/coursePlanController');

// ─── Multer setup (memory storage for parsing, then we save manually) ───
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
    fileFilter: (req, file, cb) => {
        if (file.fieldname === 'file') {
            // Only .docx for course plan uploads
            const ext = file.originalname.toLowerCase().split('.').pop();
            if (ext !== 'docx') {
                return cb(new Error('Only .docx files are allowed.'), false);
            }
        }
        cb(null, true);
    },
});

// ═══════════════════════════════════════════════════════════════
// Faculty Router — mounted at /api/faculty/course-plan
// ═══════════════════════════════════════════════════════════════
const facultyRouter = express.Router();

facultyRouter.post('/upload', upload.single('file'), ctrl.uploadCoursePlan);
facultyRouter.get('/topic/:topicId', ctrl.getTopicDetails);
facultyRouter.post('/topic/:topicId/report', upload.single('proofImage'), ctrl.submitTopicReport);
facultyRouter.post('/topic/:topicId/materials', upload.single('file'), ctrl.addTopicMaterial);
facultyRouter.delete('/material/:materialId', ctrl.deleteMaterial);
facultyRouter.get('/:subjectId', ctrl.getCoursePlan);

// ═══════════════════════════════════════════════════════════════
// HOD Router — mounted at /api/hod/course-plan
// ═══════════════════════════════════════════════════════════════
const hodRouter = express.Router();

hodRouter.get('/reports', ctrl.getHodReports);
hodRouter.get('/summary', ctrl.getHodSummary);

// ═══════════════════════════════════════════════════════════════
// Student Materials Router — mounted at /api/student/materials
// ═══════════════════════════════════════════════════════════════
const studentRouter = express.Router();

studentRouter.get('/:subjectId', ctrl.getStudentMaterials);

// ═══════════════════════════════════════════════════════════════
// Student Notifications Router — mounted at /api/student/notifications
// ═══════════════════════════════════════════════════════════════
const notificationsRouter = express.Router();

notificationsRouter.get('/materials', ctrl.getStudentNotifications);
notificationsRouter.put('/mark-all-read', ctrl.markAllNotificationsRead);
notificationsRouter.put('/:notificationId/read', ctrl.markNotificationRead);

module.exports = {
    faculty: facultyRouter,
    hod: hodRouter,
    student: studentRouter,
    notifications: notificationsRouter,
};
