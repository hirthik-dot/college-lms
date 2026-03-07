const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { isStaff } = require('../middleware/roles');
const ctrl = require('../controllers/staff');

// All routes require authentication + staff role
router.use(authenticate, isStaff);

router.get('/dashboard', ctrl.getDashboard);

// Attendance
router.post('/attendance', ctrl.takeAttendance);
router.get('/attendance/:subjectId', ctrl.getAttendanceBySubject);

// Content
router.post('/content', ctrl.uploadContent);

// Assignments
router.post('/assignments', ctrl.createAssignment);
router.get('/assignments/:id/submissions', ctrl.getSubmissions);
router.put('/assignments/submissions/:id/grade', ctrl.gradeSubmission);

// Marks / Gradebook
router.post('/marks', ctrl.enterMarks);
router.get('/marks/:subjectId', ctrl.getMarksBySubject);

// Leave requests
router.post('/leaves', ctrl.requestLeave);
router.get('/leaves', ctrl.getMyLeaves);

// Announcements
router.post('/announcements', ctrl.createAnnouncement);

module.exports = router;
