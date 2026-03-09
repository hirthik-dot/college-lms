const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * Generate an access token (8 h default).
 * Payload contains: id, role, full_name, username
 * @param {{ id: number, role: string, full_name: string, username: string }} payload
 * @returns {string}
 */
const generateAccessToken = (payload) => {
    return jwt.sign(
        {
            id: payload.id,
            role: payload.role,
            full_name: payload.full_name,
            username: payload.username,
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
