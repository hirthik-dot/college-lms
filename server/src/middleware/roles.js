const { ROLES } = require('../config/constants');

/**
 * Role-based access control middleware factory.
 *
 * Usage:
 *   router.get('/admin-only', authenticate, authorize(ROLES.HOD), handler);
 *   router.get('/staff-or-hod', authenticate, authorize(ROLES.STAFF, ROLES.HOD), handler);
 *
 * @param  {...string} allowedRoles  One or more role strings that may access the route.
 * @returns {Function} Express middleware
 */
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.',
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required role(s): ${allowedRoles.join(', ')}. Your role: ${req.user.role}.`,
            });
        }

        next();
    };
};

/**
 * Convenience pre-built middleware for common role checks.
 */
const isStudent = authorize(ROLES.STUDENT);
const isStaff = authorize(ROLES.STAFF);
const isHod = authorize(ROLES.HOD);
const isStaffOrHod = authorize(ROLES.STAFF, ROLES.HOD);
const isAnyRole = authorize(ROLES.STUDENT, ROLES.STAFF, ROLES.HOD);

module.exports = {
    authorize,
    isStudent,
    isStaff,
    isHod,
    isStaffOrHod,
    isAnyRole,
};
