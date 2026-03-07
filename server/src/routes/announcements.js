const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { isStaffOrHod, isAnyRole } = require('../middleware/roles');
const ctrl = require('../controllers/announcements');

router.use(authenticate);

router.get('/', isAnyRole, ctrl.getAnnouncements);
router.post('/', isStaffOrHod, ctrl.createAnnouncement);
router.delete('/:id', isStaffOrHod, ctrl.deleteAnnouncement);

module.exports = router;
