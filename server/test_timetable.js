require('dotenv').config();
const { pool } = require('./src/config/database');

async function testTimetable() {
    try {
        console.log('--- RUNNING TIMETABLE SEED TESTS ---');

        // Test 1
        const res1 = await pool.query(`
            SELECT COUNT(*) FROM faculty_timetable_slots fts
            JOIN users s ON s.id = fts.staff_id
            WHERE s.full_name NOT ILIKE '%dummy%' AND s.full_name ILIKE '%Ramasamy%';
        `);
        console.log('Test 1 - Ramasamy Slots:', res1.rows[0].count);

        // Test 2
        const res2 = await pool.query(`
            SELECT DISTINCT s.full_name 
            FROM class_timetable_slots cts
            JOIN users s ON s.id = cts.staff_id
            JOIN classes c ON c.id = cts.class_id
            WHERE c.name ILIKE '%II CSE A%';
        `);
        console.log('Test 2 - II CSE A Faculty count:', res2.rows.length);
        console.log('  ->', res2.rows.map(r => r.full_name).join(', '));

        // Test 3
        const res3 = await pool.query(`
            SELECT c.name, COUNT(*) as slot_count
            FROM class_timetable_slots cts
            JOIN classes c ON c.id = cts.class_id
            GROUP BY c.name
            HAVING COUNT(*) < 10;
        `);
        console.log('Test 3 - Classes with < 10 slots:', res3.rows.length);
        if (res3.rows.length > 0) {
            console.log(res3.rows);
        }

        // Test 4
        const res4 = await pool.query(`
            SELECT staff_id, day, hour_number, practical_pair_hour
            FROM faculty_timetable_slots
            WHERE is_practical_span = true
            ORDER BY staff_id, day, hour_number
        `);
        console.log('Test 4 - Total Practical Spans:', res4.rows.length);

        const sample = res4.rows.slice(0, 4);
        console.log('Test 4 - Sample pairs:', sample.map(r => `day=${r.day} hr=${r.hour_number} pair=${r.practical_pair_hour}`).join('; '));

        console.log('\n--- VERIFICATION SUMMARY ---');
        console.log('Expected: Dr.Ramasamy ~15 slots, II CSE A >=5 faculty, no class <10 slots, practical pairs exist');
        console.log('Tests finished.');
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
testTimetable();
