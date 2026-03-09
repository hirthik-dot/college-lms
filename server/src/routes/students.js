const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { isStudent } = require('../middleware/roles');
const ctrl = require('../controllers/students');

// All routes require authentication + student role
router.use(authenticate, isStudent);

// Dashboard
router.get('/dashboard', ctrl.getDashboard);

// Subjects
router.get('/subjects', ctrl.getSubjects);

// Attendance
router.get('/attendance', ctrl.getAttendance);
router.get('/attendance/:subjectId', ctrl.getAttendanceBySubject);

// Assignments
router.get('/assignments', ctrl.getAssignments);
router.get('/assignments/:id', ctrl.getAssignmentDetail);
router.post('/assignments/:id/submit', ctrl.submitAssignment);

// Marks
router.get('/marks', ctrl.getMarks);

// Study content
router.get('/content/:subjectId', ctrl.getContent);

// Announcements
router.get('/announcements', ctrl.getAnnouncements);

module.exports = router;
