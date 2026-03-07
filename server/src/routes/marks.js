const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { isStaffOrHod, isAnyRole } = require('../middleware/roles');
const ctrl = require('../controllers/marks');

router.use(authenticate);

router.post('/', isStaffOrHod, ctrl.addMarks);
router.get('/student/:studentId', isAnyRole, ctrl.getStudentMarks);
router.get('/subject/:subjectId', isStaffOrHod, ctrl.getSubjectMarks);

module.exports = router;
