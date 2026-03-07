const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { isStaffOrHod, isAnyRole } = require('../middleware/roles');
const ctrl = require('../controllers/attendance');

router.use(authenticate);

// Record attendance (staff/hod only)
router.post('/', isStaffOrHod, ctrl.recordAttendance);
router.post('/bulk', isStaffOrHod, ctrl.recordBulkAttendance);

// View attendance (any role)
router.get('/student/:studentId', isAnyRole, ctrl.getStudentAttendance);
router.get('/subject/:subjectId', isStaffOrHod, ctrl.getSubjectAttendance);
router.get('/summary/:studentId/:subjectId', isAnyRole, ctrl.getAttendanceSummary);

module.exports = router;
