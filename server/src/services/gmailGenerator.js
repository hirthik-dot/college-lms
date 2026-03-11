/**
 * Gmail Generator — auto-creates gmail addresses from faculty names.
 * Used during timetable PDF parsing/seeding.
 */

/**
 * Generate a gmail address from a full name.
 * "Dr.A.Jameer Basha" → "jameer.basha@gmail.com"
 * "Ms.D.Vidhya" → "d.vidhya@gmail.com"
 * "Mr.S.Sathishkumar" → "s.sathishkumar@gmail.com"
 * 
 * @param {string} fullName  — raw name from PDF
 * @param {string[]} existingGmails — array of already-used gmails to avoid duplicates
 * @returns {string} generated gmail address
 */
function generateGmail(fullName, existingGmails = []) {
    if (!fullName) return '';

    let cleaned = fullName.trim();

    // Remove titles: Dr., Mr., Ms., Mrs., Prof.
    cleaned = cleaned.replace(/^(Dr\.|Mr\.|Ms\.|Mrs\.|Prof\.)\s*/i, '');

    // Split by dots and spaces
    const parts = cleaned
        .split(/[\.\s]+/)
        .map(p => p.trim())
        .filter(p => p.length > 0);

    if (parts.length === 0) return '';

    let gmailLocal;

    if (parts.length === 1) {
        // Single name: "Vidhya" → "vidhya"
        gmailLocal = parts[0].toLowerCase();
    } else if (parts.length === 2) {
        // Two parts: "A Jameer" or "D Vidhya"
        if (parts[0].length === 1) {
            // Initial + name: "D Vidhya" → "d.vidhya"
            gmailLocal = `${parts[0].toLowerCase()}.${parts[1].toLowerCase()}`;
        } else {
            // Two words: "Jameer Basha" → "jameer.basha"
            gmailLocal = `${parts[0].toLowerCase()}.${parts[1].toLowerCase()}`;
        }
    } else {
        // Three or more parts: take last two meaningful parts
        // "A Jameer Basha" → "jameer.basha"
        // Filter out single initials except the first one
        const meaningful = parts.filter(p => p.length > 1);
        if (meaningful.length >= 2) {
            gmailLocal = `${meaningful[meaningful.length - 2].toLowerCase()}.${meaningful[meaningful.length - 1].toLowerCase()}`;
        } else if (meaningful.length === 1) {
            const initial = parts.find(p => p.length === 1);
            gmailLocal = initial
                ? `${initial.toLowerCase()}.${meaningful[0].toLowerCase()}`
                : meaningful[0].toLowerCase();
        } else {
            gmailLocal = parts.join('.').toLowerCase();
        }
    }

    // Clean up any special characters
    gmailLocal = gmailLocal.replace(/[^a-z0-9.]/g, '');

    // Ensure uniqueness
    let candidate = `${gmailLocal}@gmail.com`;
    let counter = 2;
    const lowerExisting = existingGmails.map(g => g.toLowerCase());

    while (lowerExisting.includes(candidate.toLowerCase())) {
        candidate = `${gmailLocal}${counter}@gmail.com`;
        counter++;
    }

    return candidate;
}

/**
 * Generate a staff code with the given prefix.
 * @param {string} prefix — e.g. "CSE"
 * @param {number} index — 1-based index
 * @returns {string} e.g. "CSE001"
 */
function generateStaffCode(prefix, index) {
    return `${prefix}${String(index).padStart(3, '0')}`;
}

module.exports = { generateGmail, generateStaffCode };
