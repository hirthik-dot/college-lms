const db = require('../models/db');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const { comparePassword } = require('../utils/bcrypt');
const { validateLogin } = require('../utils/validators');
const { createError } = require('../middleware/errorHandler');

/**
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const validation = validateLogin({ email, password });
        if (!validation.valid) {
            return res.status(400).json({ success: false, errors: validation.errors });
        }

        const user = await db.findUserByEmail(email.toLowerCase().trim());
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const isPasswordValid = await comparePassword(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const tokenPayload = {
            id: user.id,
            email: user.email,
            role: user.role,
            departmentId: user.department_id,
        };

        const accessToken = generateAccessToken(tokenPayload);
        const refreshToken = generateRefreshToken({ id: user.id });

        res.status(200).json({
            success: true,
            message: 'Login successful.',
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    departmentId: user.department_id,
                },
                accessToken,
                refreshToken,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/auth/me
 */
const getProfile = async (req, res, next) => {
    try {
        const user = await db.findUserById(req.user.id);
        if (!user) {
            throw createError('User not found.', 404);
        }

        res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { login, getProfile };
