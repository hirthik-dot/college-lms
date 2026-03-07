const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { isStudent } = require('../middleware/roles');
const ctrl = require('../controllers/students');

// All routes require authentication + student role
router.use(authenticate, isStudent);

router.get('/dashboard', ctrl.getDashboard);
router.get('/attendance', ctrl.getAttendance);
router.get('/assignments', ctrl.getAssignments);
router.post('/assignments/:id/submit', ctrl.submitAssignment);
router.get('/marks', ctrl.getMarks);
router.get('/content', ctrl.getContent);
router.get('/announcements', ctrl.getAnnouncements);

module.exports = router;
