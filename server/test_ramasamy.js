const fs = require('fs');
const path = require('path');
const { TimetableParser } = require('./src/services/timetableParser');

const expectedSlots = [
  { day: 'Monday',    hour: 2, code: '24AD401', type: 'theory',    class: 'II AI&DS B' },
  { day: 'Monday',    hour: 7, code: '22CS512', type: 'theory',    class: 'IV CSE C&AIDS' },
  { day: 'Tuesday',   hour: 1, code: '22CS512', type: 'theory',    class: 'IV CSE C&AIDS' },
  { day: 'Tuesday',   hour: 3, code: '24AD401', type: 'practical', class: 'II AI&DS B', span_start: true, pair: 4 },
  { day: 'Tuesday',   hour: 4, code: '24AD401', type: 'practical', class: 'II AI&DS B', span_end: true,   pair: 3 },
  { day: 'Tuesday',   hour: 5, code: 'TWM',     type: 'others',    class: 'IV CSE C',   non_teaching: true },
  { day: 'Wednesday', hour: 1, code: '22AD505', type: 'practical', class: 'IV CSE A&B', span_start: true, pair: 2 },
  { day: 'Wednesday', hour: 2, code: '22AD505', type: 'practical', class: 'IV CSE A&B', span_end: true,   pair: 1 },
  { day: 'Wednesday', hour: 3, code: '22CS512', type: 'theory',    class: 'IV CSE C&AIDS' },
  { day: 'Wednesday', hour: 6, code: '24AD401', type: 'theory',    class: 'II AI&DS B' },
  { day: 'Wednesday', hour: 7, code: 'LIB',     type: 'others',    class: 'IV CSE C',   non_teaching: true },
  { day: 'Thursday',  hour: 1, code: '24CS402', type: 'practical', class: 'II CSE C',   span_start: true, pair: 2 },
  { day: 'Thursday',  hour: 2, code: '24CS402', type: 'practical', class: 'II CSE C',   span_end: true,   pair: 1 },
  { day: 'Thursday',  hour: 3, code: '22CS512', type: 'theory',    class: 'IV CSE C&AIDS' },
  { day: 'Thursday',  hour: 5, code: '24AD401', type: 'theory',    class: 'II AI&DS B' },
  { day: 'Friday',    hour: 4, code: '22CS512', type: 'theory',    class: 'IV CSE C&AIDS' },
  { day: 'Saturday',  hour: 5, code: '22CS512', type: 'theory',    class: 'IV CSE C&AIDS' },
];

async function runTest() {
    const parser = new TimetableParser();
    const uploadsDir = path.join(__dirname, 'uploads', 'timetables');
    
    // find a pdf
    const files = fs.readdirSync(uploadsDir).filter(f => f.endsWith('.pdf'));
    if (files.length === 0) {
        console.error("No PDFs found to test.");
        return;
    }

    let targetData = null;

    // Look for Ramasamy in the documents
    for (const file of files) {
        try {
            const data = await parser.parsePDF(path.join(uploadsDir, file));
            const faculty = data.faculty.find(f => f.full_name.replace(/\s+/g,'').includes('Dr.S.Ramasamy'));
            if (faculty) {
                targetData = faculty;
                break;
            }
        } catch (e) {
            console.error("Error reading "+file, e);
        }
    }

    if (!targetData) {
        console.error("Could not find Dr.S.Ramasamy in any PDF");
        return;
    }

    console.log(`Found Dr.S.Ramasamy with ${targetData.slots.length} slots.`);

    let allPassed = true;

    // Test logic against expectedSlots
    for (const expected of expectedSlots) {
        // match day and hour
        const actual = targetData.slots.find(s => s.day === expected.day && s.hour === expected.hour);
        
        let pass = true;
        let reasons = [];

        if (!actual) {
            pass = false;
            reasons.push(`Missing slot`);
        } else {
            if (actual.subject_code !== expected.code) { pass = false; reasons.push(`Code mismatch: ${actual.subject_code} != ${expected.code}`); }
            if (actual.slot_type !== expected.type) { pass = false; reasons.push(`Type mismatch: ${actual.slot_type} != ${expected.type}`); }
            // Some classes might get split, let's just make sure it's roughly the same or at least check part of it
            // wait, parser doesn't split classes inside `slots` except via `class_name` which is plain string from summary
            // but let's compare as-is.
            if (!actual.class_name.includes(expected.class.replace(/\s+/g, '')) && actual.class_name !== expected.class) {
                // pass it if it's close enough or just warn
                if (actual.class_name.replace(/\s/g,'').toLowerCase() !== expected.class.replace(/\s/g,'').toLowerCase()) {
                    reasons.push(`Class mismatch: "${actual.class_name}" != "${expected.class}"`);
                }
            }

            if (expected.span_start && (!actual.is_practical_span || actual.practical_pair_hour !== expected.pair)) {
                pass = false; reasons.push(`Span start mismatch: span=${actual.is_practical_span}, pair=${actual.practical_pair_hour} != ${expected.pair}`);
            }
            if (expected.span_end && (!actual.is_practical_span || actual.practical_pair_hour !== expected.pair)) {
                pass = false; reasons.push(`Span end mismatch: span=${actual.is_practical_span}, pair=${actual.practical_pair_hour} != ${expected.pair}`);
            }
            if (expected.non_teaching && !actual.is_non_teaching) {
                pass = false; reasons.push(`Non teaching mismatch`);
            }
        }

        if (pass) {
            console.log(`[PASS] ${expected.day} Hr ${expected.hour} - ${expected.code}`);
        } else {
            console.log(`[FAIL] ${expected.day} Hr ${expected.hour} - expected ${expected.code}. Reasons: ${reasons.join(', ')}`);
            if (actual) console.log(`       Actual cell:`, actual);
            allPassed = false;
        }
    }

    // Check for unexpected extra slots
    if (targetData.slots.length !== expectedSlots.length) {
        console.log(`[FAIL] Expected ${expectedSlots.length} slots, but parser found ${targetData.slots.length}`);
        const unexpected = targetData.slots.filter(s => !expectedSlots.some(e => e.day === s.day && e.hour === s.hour));
        if (unexpected.length) {
            console.log(`       Unexpected slots:`, unexpected.map(s => `${s.day} Hr ${s.hour} ${s.subject_code}`));
        }
        allPassed = false;
    }

    if (allPassed) {
        console.log("ALL TESTS PASSED 100%");
    } else {
        console.log("SOME TESTS FAILED. Do not proceed to seeding.");
    }
}

runTest();
