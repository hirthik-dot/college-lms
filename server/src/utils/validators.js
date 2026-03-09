/**
 * Validation helpers for the college LMS.
 * Each validator returns { valid: boolean, errors: string[] }.
 */

// ── Primitives ───────────────────────────────────────────────

const isEmail = (value) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(value).toLowerCase());
};

const isStrongPassword = (value) => {
    // At least 6 chars (relaxed for seed accounts)
    return typeof value === 'string' && value.length >= 6;
};

const isPositiveInt = (v) => Number.isInteger(Number(v)) && Number(v) > 0;

const isDateString = (v) => !isNaN(Date.parse(v));

// ── Auth ─────────────────────────────────────────────────────

const validateLogin = ({ username, password }) => {
    const errors = [];
    if (!username || !String(username).trim()) errors.push('Username is required.');
    if (!password) errors.push('Password is required.');
    return { valid: errors.length === 0, errors };
};

// ── Users ────────────────────────────────────────────────────

const validateUserCreate = ({ username, email, password, full_name, role }) => {
    const errors = [];

    if (!username || !String(username).trim()) errors.push('Username is required.');
    if (!full_name || !String(full_name).trim()) errors.push('Full name is required.');
    if (!email || !String(email).trim()) errors.push('Email is required.');
    else if (!isEmail(email)) errors.push('Invalid email format.');

    if (!password) errors.push('Password is required.');
    else if (!isStrongPassword(password))
        errors.push('Password must be at least 6 characters.');

    const validRoles = ['student', 'staff', 'hod'];
    if (!role) errors.push('Role is required.');
    else if (!validRoles.includes(role))
        errors.push(`Role must be one of: ${validRoles.join(', ')}.`);

    return { valid: errors.length === 0, errors };
};

// ── Attendance ───────────────────────────────────────────────

const validateAttendanceSession = ({ subjectId, sessionDate, sessionType, records }) => {
    const errors = [];

    if (!subjectId) errors.push('Subject ID is required.');
    if (!sessionDate) errors.push('Session date is required.');
    else if (!isDateString(sessionDate)) errors.push('Invalid session date format.');

    const validTypes = ['lecture', 'lab', 'tutorial'];
    if (!sessionType) errors.push('Session type is required.');
    else if (!validTypes.includes(sessionType))
        errors.push(`Session type must be one of: ${validTypes.join(', ')}.`);

    if (!records || !Array.isArray(records) || records.length === 0)
        errors.push('At least one attendance record is required.');
    else {
        const validStatuses = ['present', 'absent', 'late'];
        records.forEach((r, i) => {
            if (!r.studentId) errors.push(`Record ${i + 1}: studentId is required.`);
            if (!r.status || !validStatuses.includes(r.status))
                errors.push(`Record ${i + 1}: status must be one of: ${validStatuses.join(', ')}.`);
        });
    }

    return { valid: errors.length === 0, errors };
};

// ── Assignments ──────────────────────────────────────────────

const validateAssignment = ({ title, subjectId, dueDate, maxMarks }) => {
    const errors = [];

    if (!title || !String(title).trim()) errors.push('Title is required.');
    if (!subjectId) errors.push('Subject ID is required.');
    if (!dueDate) errors.push('Due date is required.');
    else if (!isDateString(dueDate)) errors.push('Invalid due date format.');
    if (maxMarks === undefined || maxMarks === null) errors.push('Max marks is required.');
    else if (!isPositiveInt(maxMarks)) errors.push('Max marks must be a positive integer.');

    return { valid: errors.length === 0, errors };
};

const validateSubmission = ({ fileUrl }) => {
    const errors = [];
    if (!fileUrl || !String(fileUrl).trim()) errors.push('File URL is required.');
    return { valid: errors.length === 0, errors };
};

const validateGrading = ({ marksObtained, feedback }) => {
    const errors = [];
    if (marksObtained === undefined || marksObtained === null)
        errors.push('Marks obtained is required.');
    else if (Number(marksObtained) < 0)
        errors.push('Marks cannot be negative.');
    // feedback is optional
    return { valid: errors.length === 0, errors };
};

// ── Assessments ──────────────────────────────────────────────

const validateAssessment = ({ subjectId, name, maxMarks, assessmentType }) => {
    const errors = [];

    if (!name || !String(name).trim()) errors.push('Assessment name is required.');
    if (!subjectId) errors.push('Subject ID is required.');
    if (maxMarks === undefined || maxMarks === null) errors.push('Max marks is required.');
    else if (!isPositiveInt(maxMarks)) errors.push('Max marks must be a positive integer.');

    const validTypes = ['internal', 'midterm', 'practical', 'viva'];
    if (!assessmentType) errors.push('Assessment type is required.');
    else if (!validTypes.includes(assessmentType))
        errors.push(`Assessment type must be one of: ${validTypes.join(', ')}.`);

    return { valid: errors.length === 0, errors };
};

const validateAssessmentMarks = ({ marks }) => {
    const errors = [];

    if (!marks || !Array.isArray(marks) || marks.length === 0)
        errors.push('At least one mark entry is required.');
    else {
        marks.forEach((m, i) => {
            if (!m.studentId) errors.push(`Mark ${i + 1}: studentId is required.`);
            if (m.marksObtained === undefined || m.marksObtained === null)
                errors.push(`Mark ${i + 1}: marksObtained is required.`);
        });
    }

    return { valid: errors.length === 0, errors };
};

// ── Content ──────────────────────────────────────────────────

const validateContent = ({ title, subjectId, contentType }) => {
    const errors = [];

    if (!title || !String(title).trim()) errors.push('Title is required.');
    if (!subjectId) errors.push('Subject ID is required.');

    const validTypes = ['pdf', 'ppt', 'video', 'link', 'doc'];
    if (!contentType) errors.push('Content type is required.');
    else if (!validTypes.includes(contentType))
        errors.push(`Content type must be one of: ${validTypes.join(', ')}.`);

    return { valid: errors.length === 0, errors };
};

// ── Announcements ────────────────────────────────────────────

const validateAnnouncement = ({ title, body, targetAudience }) => {
    const errors = [];

    if (!title || !String(title).trim()) errors.push('Title is required.');
    if (!body || !String(body).trim()) errors.push('Body is required.');

    const validAudiences = ['all', 'students', 'staff'];
    if (!targetAudience) errors.push('Target audience is required.');
    else if (!validAudiences.includes(targetAudience))
        errors.push(`Target audience must be one of: ${validAudiences.join(', ')}.`);

    return { valid: errors.length === 0, errors };
};

// ── Leave Requests ───────────────────────────────────────────

const validateLeaveRequest = ({ leaveType, startDate, endDate, reason }) => {
    const errors = [];

    const validTypes = ['casual', 'medical', 'duty', 'other'];
    if (!leaveType) errors.push('Leave type is required.');
    else if (!validTypes.includes(leaveType))
        errors.push(`Leave type must be one of: ${validTypes.join(', ')}.`);

    if (!startDate) errors.push('Start date is required.');
    else if (!isDateString(startDate)) errors.push('Invalid start date format.');

    if (!endDate) errors.push('End date is required.');
    else if (!isDateString(endDate)) errors.push('Invalid end date format.');

    if (startDate && endDate && new Date(endDate) < new Date(startDate))
        errors.push('End date must be on or after start date.');

    if (!reason || !String(reason).trim()) errors.push('Reason is required.');

    return { valid: errors.length === 0, errors };
};

// ── Subjects ─────────────────────────────────────────────────

const validateSubject = ({ name, code, semester }) => {
    const errors = [];

    if (!name || !String(name).trim()) errors.push('Subject name is required.');
    if (!code || !String(code).trim()) errors.push('Subject code is required.');
    if (semester !== undefined && semester !== null) {
        const s = Number(semester);
        if (!Number.isInteger(s) || s < 1 || s > 8)
            errors.push('Semester must be an integer between 1 and 8.');
    }

    return { valid: errors.length === 0, errors };
};

// ── Pagination helper ────────────────────────────────────────

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
    isPositiveInt,
    isDateString,
    validateLogin,
    validateUserCreate,
    validateAttendanceSession,
    validateAssignment,
    validateSubmission,
    validateGrading,
    validateAssessment,
    validateAssessmentMarks,
    validateContent,
    validateAnnouncement,
    validateLeaveRequest,
    validateSubject,
    parsePagination,
};
