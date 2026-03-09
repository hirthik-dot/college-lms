const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { isHod } = require('../middleware/roles');
const ctrl = require('../controllers/hod');

// All routes require authentication + HOD role
router.use(authenticate, isHod);

// Dashboard
router.get('/dashboard', ctrl.getDashboard);

// Staff management
router.get('/staff', ctrl.getStaff);
router.post('/staff', ctrl.createStaff);
router.put('/staff/:id', ctrl.updateStaff);

// Student management
router.get('/students', ctrl.getStudents);
router.post('/students', ctrl.createStudent);
router.put('/students/:id', ctrl.updateStudent);

// Subject management
router.get('/subjects', ctrl.getSubjects);
router.post('/subjects', ctrl.createSubject);
router.put('/subjects/:id', ctrl.updateSubject);
router.post('/subjects/:id/enroll', ctrl.bulkEnroll);

// Reports
router.get('/reports/attendance', ctrl.getAttendanceReport);
router.get('/reports/marks', ctrl.getMarksReport);
router.get('/reports/assignments', ctrl.getAssignmentReport);
router.get('/reports/staff-activity', ctrl.getStaffActivityReport);

// Leave management
router.get('/leaves', ctrl.getLeaves);
router.put('/leaves/:id', ctrl.reviewLeave);
router.put('/leaves/:id/status', ctrl.reviewLeave);  // frontend uses /status suffix

// Announcements
router.post('/announcements', ctrl.createAnnouncement);
router.get('/announcements', ctrl.getAnnouncements);

module.exports = router;
