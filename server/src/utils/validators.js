/**
 * Validation helpers. Each returns { valid, errors } where
 * `errors` is an array of human-readable messages.
 */

const isEmail = (value) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(value).toLowerCase());
};

const isStrongPassword = (value) => {
    // At least 8 chars, one uppercase, one lowercase, one digit
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return re.test(value);
};

/**
 * Validate login payload.
 */
const validateLogin = ({ email, password }) => {
    const errors = [];

    if (!email || !email.trim()) errors.push('Email is required.');
    else if (!isEmail(email)) errors.push('Invalid email format.');

    if (!password) errors.push('Password is required.');

    return { valid: errors.length === 0, errors };
};

/**
 * Validate user registration / creation payload.
 */
const validateUserCreate = ({ email, password, name, role }) => {
    const errors = [];

    if (!name || !name.trim()) errors.push('Name is required.');
    if (!email || !email.trim()) errors.push('Email is required.');
    else if (!isEmail(email)) errors.push('Invalid email format.');

    if (!password) errors.push('Password is required.');
    else if (!isStrongPassword(password))
        errors.push('Password must be at least 8 characters with uppercase, lowercase, and a digit.');

    const validRoles = ['student', 'staff', 'hod'];
    if (!role) errors.push('Role is required.');
    else if (!validRoles.includes(role)) errors.push(`Role must be one of: ${validRoles.join(', ')}.`);

    return { valid: errors.length === 0, errors };
};

/**
 * Validate attendance record.
 */
const validateAttendance = ({ studentId, subjectId, date, status }) => {
    const errors = [];

    if (!studentId) errors.push('Student ID is required.');
    if (!subjectId) errors.push('Subject ID is required.');
    if (!date) errors.push('Date is required.');

    const validStatuses = ['present', 'absent', 'late', 'excused'];
    if (!status) errors.push('Status is required.');
    else if (!validStatuses.includes(status))
        errors.push(`Status must be one of: ${validStatuses.join(', ')}.`);

    return { valid: errors.length === 0, errors };
};

/**
 * Validate assignment creation.
 */
const validateAssignment = ({ title, subjectId, dueDate }) => {
    const errors = [];

    if (!title || !title.trim()) errors.push('Title is required.');
    if (!subjectId) errors.push('Subject ID is required.');
    if (!dueDate) errors.push('Due date is required.');

    return { valid: errors.length === 0, errors };
};

/**
 * Validate marks entry.
 */
const validateMarks = ({ studentId, subjectId, marks, maxMarks }) => {
    const errors = [];

    if (!studentId) errors.push('Student ID is required.');
    if (!subjectId) errors.push('Subject ID is required.');
    if (marks === undefined || marks === null) errors.push('Marks are required.');
    if (maxMarks === undefined || maxMarks === null) errors.push('Max marks are required.');
    if (typeof marks === 'number' && typeof maxMarks === 'number' && marks > maxMarks)
        errors.push('Marks cannot exceed max marks.');

    return { valid: errors.length === 0, errors };
};

/**
 * Generic pagination params from query string.
 */
const parsePagination = (query) => {
    let page = parseInt(query.page, 10) || 1;
    let limit = parseInt(query.limit, 10) || 20;

    if (page < 1) page = 1;
    if (limit < 1) limit = 1;
    if (limit > 100) limit = 100;

    const offset = (page - 1) * limit;

    return { page, limit, offset };
};

module.exports = {
    isEmail,
    isStrongPassword,
    validateLogin,
    validateUserCreate,
    validateAttendance,
    validateAssignment,
    validateMarks,
    parsePagination,
};
