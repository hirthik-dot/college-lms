const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const ctrl = require('../controllers/auth');

// POST /api/auth/login
router.post('/login', authLimiter, ctrl.login);

// POST /api/auth/logout
router.post('/logout', authenticate, ctrl.logout);

// GET /api/auth/me  (protected)
router.get('/me', authenticate, ctrl.getProfile);

module.exports = router;
