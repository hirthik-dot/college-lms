const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/students');

// GET /api/subjects — returns subjects for the authenticated user
// Used by student pages that call '/subjects' standalone
router.get('/', authenticate, ctrl.getSubjects);

module.exports = router;
