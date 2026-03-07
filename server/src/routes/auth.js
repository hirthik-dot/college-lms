const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const authController = require('../controllers/auth');

// POST /api/auth/login
router.post('/login', authLimiter, authController.login);

// GET /api/auth/me  (protected)
router.get('/me', authenticate, authController.getProfile);

module.exports = router;
