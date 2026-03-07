const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { isStaffOrHod } = require('../middleware/roles');
const ctrl = require('../controllers/subjects');

router.use(authenticate);

router.get('/', ctrl.getSubjects);
router.get('/:id', ctrl.getSubjectById);
router.post('/', isStaffOrHod, ctrl.createSubject);
router.put('/:id', isStaffOrHod, ctrl.updateSubject);
router.delete('/:id', isStaffOrHod, ctrl.deleteSubject);

module.exports = router;
