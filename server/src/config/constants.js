/**
 * Application-wide constants.
 */

const ROLES = Object.freeze({
    STUDENT: 'student',
    STAFF: 'staff',
    HOD: 'hod',
});

const LEAVE_STATUS = Object.freeze({
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
});

const ASSIGNMENT_STATUS = Object.freeze({
    OPEN: 'open',
    CLOSED: 'closed',
    GRADED: 'graded',
});

const ATTENDANCE_STATUS = Object.freeze({
    PRESENT: 'present',
    ABSENT: 'absent',
    LATE: 'late',
    EXCUSED: 'excused',
});

const PAGINATION = Object.freeze({
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
});

module.exports = {
    ROLES,
    LEAVE_STATUS,
    ASSIGNMENT_STATUS,
    ATTENDANCE_STATUS,
    PAGINATION,
};
