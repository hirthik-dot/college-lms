/**
 * Format a date string to a locale-friendly display.
 * @param {string|Date} dateStr
 * @param {object} options  Intl.DateTimeFormat options
 * @returns {string}
 */
export const formatDate = (dateStr, options = {}) => {
    const defaults = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString('en-IN', { ...defaults, ...options });
};

/**
 * Format a date string to include time.
 */
export const formatDateTime = (dateStr) => {
    return new Date(dateStr).toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

/**
 * Get initials from a name.
 * @param {string} name
 * @returns {string}
 */
export const getInitials = (name) => {
    if (!name) return '??';
    return name
        .split(' ')
        .map((word) => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

/**
 * Capitalise the first letter of a string.
 */
export const capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Truncate a string to a given length.
 */
export const truncate = (str, maxLength = 80) => {
    if (!str || str.length <= maxLength) return str;
    return str.slice(0, maxLength) + '…';
};

/**
 * Calculate percentage.
 */
export const percentage = (value, total) => {
    if (!total) return 0;
    return Math.round((value / total) * 100);
};

/**
 * Get a color class for attendance percentage.
 */
export const attendanceColor = (pct) => {
    if (pct >= 90) return 'text-accent-600';
    if (pct >= 75) return 'text-primary-600';
    if (pct >= 60) return 'text-warning-500';
    return 'text-danger-500';
};

/**
 * Get a badge variant for leave status.
 */
export const leaveStatusVariant = (status) => {
    const map = { pending: 'warning', approved: 'success', rejected: 'danger' };
    return map[status] || 'default';
};

/**
 * Delay helper for async flows.
 */
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Parse API error to a user-friendly string.
 */
export const parseApiError = (error) => {
    if (error.response?.data?.message) return error.response.data.message;
    if (error.response?.data?.errors) return error.response.data.errors.join(' ');
    if (error.message) return error.message;
    return 'An unexpected error occurred.';
};
