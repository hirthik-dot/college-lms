const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { isStaff } = require('../middleware/roles');
const ctrl = require('../controllers/staff');

// All routes require authentication + staff role
router.use(authenticate, isStaff);

// Dashboard
router.get('/dashboard', ctrl.getDashboard);

// Subjects
router.get('/subjects', ctrl.getSubjects);
router.get('/subjects/:id/students', ctrl.getSubjectStudents);

// Attendance
router.post('/attendance', ctrl.createAttendance);
router.get('/attendance/:subjectId', ctrl.getAttendanceBySubject);
router.put('/attendance/session/:sessionId', ctrl.updateAttendanceSession);

// Content
router.post('/content', ctrl.uploadContent);
router.get('/content/:subjectId', ctrl.getContent);
router.delete('/content/:id', ctrl.deleteContent);

// Assignments
router.post('/assignments', ctrl.createAssignment);
router.get('/assignments/:subjectId', ctrl.getAssignments);
router.get('/assignments/:id/submissions', ctrl.getSubmissions);
router.put('/assignments/:submissionId/grade', ctrl.gradeSubmission);

// Assessments
router.post('/assessments', ctrl.createAssessment);
router.get('/assessments/:subjectId', ctrl.getAssessments);

// Marks
router.post('/marks', ctrl.enterMarks);
router.put('/marks/:assessmentId/publish', ctrl.publishMarks);

// Announcements
router.post('/announcements', ctrl.createAnnouncement);
router.get('/announcements', ctrl.getAnnouncements);
router.delete('/announcements/:id', ctrl.deleteAnnouncement);

// Leave requests
router.post('/leave', ctrl.submitLeave);
router.get('/leave', ctrl.getMyLeaves);
router.post('/leaves', ctrl.submitLeave);   // plural alias used by frontend
router.get('/leaves', ctrl.getMyLeaves);     // plural alias used by frontend

module.exports = router;
