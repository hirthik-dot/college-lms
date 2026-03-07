const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { isHod } = require('../middleware/roles');
const ctrl = require('../controllers/hod');

// All routes require authentication + HOD role
router.use(authenticate, isHod);

router.get('/dashboard', ctrl.getDashboard);

// Staff management
router.get('/staff', ctrl.getStaff);
router.post('/staff', ctrl.addStaff);
router.put('/staff/:id', ctrl.updateStaff);
router.delete('/staff/:id', ctrl.removeStaff);

// Student management
router.get('/students', ctrl.getStudents);
router.post('/students', ctrl.addStudent);
router.put('/students/:id', ctrl.updateStudent);
router.delete('/students/:id', ctrl.removeStudent);

// Subject management
router.get('/subjects', ctrl.getSubjects);
router.post('/subjects', ctrl.addSubject);
router.put('/subjects/:id', ctrl.updateSubject);
router.delete('/subjects/:id', ctrl.removeSubject);

// Reports
router.get('/attendance-reports', ctrl.getAttendanceReports);
router.get('/marks-reports', ctrl.getMarksReports);
router.get('/department-reports', ctrl.getDepartmentReports);

// Leave approvals
router.get('/leaves', ctrl.getLeaves);
router.put('/leaves/:id', ctrl.approveOrRejectLeave);

// Announcements
router.post('/announcements', ctrl.createAnnouncement);

module.exports = router;
