/**
 * Course Plan Document Parser
 * Extracts structured course plan data from .docx files using mammoth.
 *
 * The Word document contains multiple tables:
 *   TABLE 0 — Course information (academic year, subject code, contact hours etc.)
 *   TABLE 2 — The Course Plan table with unit headers and topic rows
 */

const mammoth = require('mammoth');
const JSZip = require('jszip');

// ─────────────────────────────────────────────────────────────
// XML Helper — parse <w:tbl> elements from the docx word/document.xml
// ─────────────────────────────────────────────────────────────

/**
 * Strip all XML tags and return text content.
 */
function stripXml(xml) {
    return xml.replace(/<[^>]+>/g, '').trim();
}

/**
 * Extract all cell text values from a <w:tr> row.
 */
function extractCellsFromRow(rowXml) {
    const cells = [];
    const cellRegex = /<w:tc[\s>]([\s\S]*?)<\/w:tc>/g;
    let cellMatch;
    while ((cellMatch = cellRegex.exec(rowXml)) !== null) {
        cells.push(stripXml(cellMatch[1]));
    }
    return cells;
}

/**
 * Extract all rows from a <w:tbl> table.
 */
function extractRowsFromTable(tableXml) {
    const rows = [];
    const rowRegex = /<w:tr[\s>]([\s\S]*?)<\/w:tr>/g;
    let rowMatch;
    while ((rowMatch = rowRegex.exec(tableXml)) !== null) {
        rows.push(extractCellsFromRow(rowMatch[1]));
    }
    return rows;
}

/**
 * Extract all tables from the document XML.
 */
function extractAllTables(docXml) {
    const tables = [];
    const tableRegex = /<w:tbl[\s>]([\s\S]*?)<\/w:tbl>/g;
    let tableMatch;
    while ((tableMatch = tableRegex.exec(docXml)) !== null) {
        tables.push(extractRowsFromTable(tableMatch[1]));
    }
    return tables;
}

// ─────────────────────────────────────────────────────────────
// Main Parser
// ─────────────────────────────────────────────────────────────

/**
 * Parse a .docx buffer and extract the structured course plan.
 *
 * @param {Buffer} fileBuffer  The .docx file as a Buffer
 * @returns {Promise<Object>}  The parsed course plan object
 */
async function parseCoursePlan(fileBuffer) {
    const parseErrors = [];

    // ── 1  Unzip and read word/document.xml ──────────────────
    let docXml;
    try {
        // jszip is a dependency of mammoth — reuse it
        let zip;
        try {
            const JSZipLib = require('jszip');
            zip = await JSZipLib.loadAsync(fileBuffer);
        } catch (_zipErr) {
            // Fallback: mammoth ships jszip internally; try a manual approach
            const AdmZip = require('adm-zip');
            const admZip = new AdmZip(fileBuffer);
            docXml = admZip.readAsText('word/document.xml');
        }
        if (zip) {
            const docFile = zip.file('word/document.xml');
            if (!docFile) throw new Error('Invalid DOCX: word/document.xml not found');
            docXml = await docFile.async('text');
        }
    } catch (err) {
        throw new Error('INVALID_DOCX: ' + err.message);
    }

    // ── 2  Extract all tables ────────────────────────────────
    const tables = extractAllTables(docXml);

    if (tables.length === 0) {
        throw new Error('COURSE_PLAN_NOT_FOUND');
    }

    // ── 3  Extract course metadata from TABLE 0 ─────────────
    let academicYear = '';
    let subjectCode = '';
    let subjectName = '';
    let totalTheoryHours = 0;
    let totalLabHours = 0;

    if (tables.length > 0) {
        const infoTable = tables[0];
        for (const row of infoTable) {
            if (row.length === 0) continue;
            const firstCell = (row[0] || '').toLowerCase().trim();
            const valueCell = row.length >= 3 ? row[2] : row[1] || '';

            if (firstCell.includes('academic year') || firstCell.includes('academic  year')) {
                academicYear = (valueCell || '').trim();
            }
            if (firstCell.includes('course code and title') || firstCell.includes('course code')) {
                const fullText = (valueCell || '').trim();
                // Try to split "22AD402 - Python for Data Science" or similar
                const dashIdx = fullText.indexOf('-');
                const spaceIdx = fullText.indexOf(' ');
                if (dashIdx > 0) {
                    subjectCode = fullText.substring(0, dashIdx).trim();
                    subjectName = fullText.substring(dashIdx + 1).trim();
                } else if (spaceIdx > 0 && spaceIdx < 15) {
                    subjectCode = fullText.substring(0, spaceIdx).trim();
                    subjectName = fullText.substring(spaceIdx + 1).trim();
                } else {
                    subjectName = fullText;
                }
            }
            if (firstCell.includes('contact hours') || firstCell.includes('contact  hours')) {
                const hoursText = (valueCell || '').trim();
                // Formats: "Theory: 3, Lab: 2" or "3+2" or just "3"
                const theoryMatch = hoursText.match(/theory[:\s]*(\d+)/i);
                const labMatch = hoursText.match(/lab[:\s]*(\d+)/i);
                const plusMatch = hoursText.match(/(\d+)\s*\+\s*(\d+)/);
                if (theoryMatch) totalTheoryHours = parseInt(theoryMatch[1]);
                if (labMatch) totalLabHours = parseInt(labMatch[1]);
                if (!theoryMatch && !labMatch && plusMatch) {
                    totalTheoryHours = parseInt(plusMatch[1]);
                    totalLabHours = parseInt(plusMatch[2]);
                }
                if (!theoryMatch && !labMatch && !plusMatch) {
                    const singleNum = hoursText.match(/(\d+)/);
                    if (singleNum) totalTheoryHours = parseInt(singleNum[1]);
                }
            }
            // Also check for 'Sub Code & Name' format
            if (firstCell.includes('sub code') || firstCell.includes('subject code')) {
                const fullText = (valueCell || '').trim();
                const dashIdx = fullText.indexOf('-');
                const spaceIdx = fullText.indexOf(' ');
                if (dashIdx > 0) {
                    subjectCode = fullText.substring(0, dashIdx).trim();
                    subjectName = fullText.substring(dashIdx + 1).trim();
                } else if (spaceIdx > 0 && spaceIdx < 15) {
                    subjectCode = fullText.substring(0, spaceIdx).trim();
                    subjectName = fullText.substring(spaceIdx + 1).trim();
                } else {
                    subjectName = fullText;
                }
            }
        }
    }

    // ── 4  Find the Course Plan table ────────────────────────
    let coursePlanTable = null;

    for (let i = 0; i < tables.length; i++) {
        const table = tables[i];
        for (const row of table) {
            const rowText = row.join(' ').toLowerCase();
            if (rowText.includes('course plan')) {
                coursePlanTable = table;
                break;
            }
        }
        if (coursePlanTable) break;
    }

    if (!coursePlanTable) {
        throw new Error('COURSE_PLAN_NOT_FOUND');
    }

    // ── 5  Parse units and topics ────────────────────────────
    const units = [];
    let currentUnit = null;
    let globalDisplayOrder = 0;

    for (const row of coursePlanTable) {
        if (row.length === 0) continue;

        const firstCell = (row[0] || '').trim();
        const firstCellLower = firstCell.toLowerCase();
        const rowText = row.join(' ').toLowerCase();

        // Skip: Title row ('Course Plan')
        if (firstCellLower.includes('course plan') && !firstCellLower.includes('unit')) {
            continue;
        }

        // Skip: Total hours rows
        if (rowText.includes('total hours') || rowText.includes('total hrs')) {
            continue;
        }

        // Skip: Column header row ('S. No' / 'S.No' / 'Sl.No' / 'SNO')
        if (firstCellLower === 's. no' || firstCellLower === 's.no' ||
            firstCellLower === 'sl.no' || firstCellLower === 'sno' ||
            firstCellLower === 'sl. no' || firstCellLower === 's no') {
            continue;
        }

        // Unit header row: contains 'UNIT' and 'Target Hours' or 'Hrs'
        if (firstCellLower.includes('unit') ||
            (rowText.includes('unit') && (rowText.includes('target') || rowText.includes('hrs') || rowText.includes('hours')))) {
            // Extract unit name
            let unitName = '';
            let targetHours = 0;

            for (const cell of row) {
                const cellLower = (cell || '').toLowerCase().trim();
                if (cellLower.includes('unit')) {
                    unitName = (cell || '').trim();
                }
                // Try to extract hours
                const hoursMatch = (cell || '').match(/(\d+)\s*(hrs|hours|hour)/i);
                if (hoursMatch) {
                    targetHours = parseInt(hoursMatch[1]);
                }
                // Also check for standalone number after Target Hours label
                if (cellLower.includes('target')) {
                    const numMatch = (cell || '').match(/(\d+)/);
                    if (numMatch) targetHours = parseInt(numMatch[1]);
                }
            }

            // If target hours not found in cells, check for a pure number cell
            if (targetHours === 0) {
                for (const cell of row) {
                    const trimmed = (cell || '').trim();
                    if (/^\d+$/.test(trimmed) && parseInt(trimmed) > 0) {
                        targetHours = parseInt(trimmed);
                        break;
                    }
                }
            }

            if (!unitName) unitName = firstCell;

            currentUnit = {
                unitName,
                targetHours,
                topics: [],
            };
            units.push(currentUnit);
            continue;
        }

        // Topic data row: first cell is a number (1, 2, 3, ...)
        const sno = parseInt(firstCell);
        if (!isNaN(sno) && sno > 0 && currentUnit) {
            globalDisplayOrder++;

            // Dynamic column mapping — handle merged cells gracefully
            const periodsRequired = parseInt(row[1]) || 1;

            // Find topic_name: take the longest cell among candidates
            let topicName = '';
            let referenceBook = '';
            let teachingMethod = '';
            let coBloom = '';

            if (row.length >= 7) {
                // Standard 7-column layout: sno, periods, topic, ref, method, co_bloom, (sometimes extra)
                topicName = (row[2] || '').trim();
                referenceBook = (row[3] || '').trim();
                teachingMethod = (row[4] || '').trim();
                coBloom = (row[5] || '').trim();
            } else if (row.length === 6) {
                topicName = (row[2] || '').trim();
                referenceBook = (row[3] || '').trim();
                teachingMethod = (row[4] || '').trim();
                coBloom = (row[5] || '').trim();
            } else if (row.length === 5) {
                topicName = (row[2] || '').trim();
                referenceBook = (row[3] || '').trim();
                teachingMethod = (row[4] || '').trim();
            } else if (row.length >= 3) {
                // Merged — use longer cell for topic name
                const candidates = row.slice(1);
                candidates.sort((a, b) => (b || '').length - (a || '').length);
                topicName = (candidates[0] || '').trim();
            }

            // If topicName looks like a number, it's probably periods; use next
            if (/^\d+$/.test(topicName) && row[3]) {
                topicName = (row[3] || '').trim();
            }

            if (!topicName) {
                parseErrors.push(`Row with S.No ${sno}: could not extract topic name`);
                continue;
            }

            currentUnit.topics.push({
                sno,
                periodsRequired,
                topicName,
                referenceBook,
                teachingMethod,
                coBloom,
                displayOrder: globalDisplayOrder,
            });
        }
    }

    // ── 6  Validate ──────────────────────────────────────────
    const totalTopics = units.reduce((sum, u) => sum + u.topics.length, 0);

    if (totalTopics < 5) {
        throw new Error('INSUFFICIENT_TOPICS');
    }

    // If no units were found but we got here, something went wrong
    if (units.length === 0) {
        throw new Error('COURSE_PLAN_NOT_FOUND');
    }

    return {
        academicYear,
        subjectCode,
        subjectName,
        totalTheoryHours,
        totalLabHours,
        units,
        totalTopics,
        parseErrors,
    };
}

module.exports = { parseCoursePlan };
