const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { isStaffOrHod, isStudent, isAnyRole } = require('../middleware/roles');
const ctrl = require('../controllers/assignments');

router.use(authenticate);

// CRUD
router.post('/', isStaffOrHod, ctrl.createAssignment);
router.get('/subject/:subjectId', isAnyRole, ctrl.getAssignmentsBySubject);
router.get('/:id', isAnyRole, ctrl.getAssignmentById);

// Submissions
router.post('/:id/submit', isStudent, ctrl.submitAssignment);
router.get('/:id/submissions', isStaffOrHod, ctrl.getSubmissions);
router.put('/submissions/:id/grade', isStaffOrHod, ctrl.gradeSubmission);

module.exports = router;
