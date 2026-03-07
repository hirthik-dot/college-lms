const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

/**
 * Generate an access token.
 * @param {{ id: number, email: string, role: string, departmentId?: number }} payload
 * @returns {string}
 */
const generateAccessToken = (payload) => {
    return jwt.sign(
        {
            id: payload.id,
            email: payload.email,
            role: payload.role,
            departmentId: payload.departmentId,
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};

/**
 * Generate a refresh token with a longer expiry.
 * @param {{ id: number }} payload
 * @returns {string}
 */
const generateRefreshToken = (payload) => {
    return jwt.sign(
        { id: payload.id },
        JWT_SECRET,
        { expiresIn: JWT_REFRESH_EXPIRES_IN }
    );
};

/**
 * Verify and decode a token.
 * @param {string} token
 * @returns {object}
 */
const verifyToken = (token) => {
    return jwt.verify(token, JWT_SECRET);
};

module.exports = { generateAccessToken, generateRefreshToken, verifyToken };
