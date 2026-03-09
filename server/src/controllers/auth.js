const db = require('../models/db');
const { comparePassword } = require('../utils/bcrypt');
const { generateAccessToken } = require('../utils/jwt');
const { validateLogin } = require('../utils/validators');

/**
 * POST /api/auth/login
 * Body: { username, password }
 */
const login = async (req, res, next) => {
    try {
        const { username, password } = req.body;

        // Validate input
        const { valid, errors } = validateLogin({ username, password });
        if (!valid) {
            return res.status(400).json({ success: false, message: 'Validation failed.', errors });
        }

        // Find user by username
        const user = await db.findUserByUsername(username.trim());
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password.',
            });
        }

        // Check active status
        if (!user.is_active) {
            return res.status(401).json({
                success: false,
                message: 'Your account has been deactivated. Contact your administrator.',
            });
        }

        // Verify password
        const isMatch = await comparePassword(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password.',
            });
        }

        // Generate JWT (8 h expiry)
        const token = generateAccessToken({
            id: user.id,
            role: user.role,
            full_name: user.full_name,
            username: user.username,
        });

        return res.status(200).json({
            success: true,
            message: 'Login successful.',
            token,
            user: {
                id: user.id,
                role: user.role,
                full_name: user.full_name,
                username: user.username,
                profile_photo_url: user.profile_photo_url,
            },
        });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/auth/logout
 * Client-side token invalidation — just return success.
 */
const logout = async (req, res) => {
    return res.status(200).json({
        success: true,
        message: 'Logged out successfully. Please discard the token.',
    });
};

/**
 * GET /api/auth/me
 * Returns the current user from the JWT.
 */
const getProfile = async (req, res, next) => {
    try {
        const user = await db.findUserById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.',
            });
        }

        return res.status(200).json({
            success: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                full_name: user.full_name,
                profile_photo_url: user.profile_photo_url,
                department_id: user.department_id,
                phone: user.phone,
                is_active: user.is_active,
                created_at: user.created_at,
            },
        });
    } catch (err) {
        next(err);
    }
};

module.exports = { login, logout, getProfile };
