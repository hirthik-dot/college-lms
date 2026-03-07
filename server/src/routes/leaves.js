const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { isStaffOrHod, isHod, isAnyRole } = require('../middleware/roles');
const ctrl = require('../controllers/leaves');

router.use(authenticate);

router.post('/', isStaffOrHod, ctrl.createLeave);
router.get('/my', isAnyRole, ctrl.getMyLeaves);
router.get('/department', isHod, ctrl.getDepartmentLeaves);
router.put('/:id/status', isHod, ctrl.updateLeaveStatus);

module.exports = router;
