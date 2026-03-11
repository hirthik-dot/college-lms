require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { parseTimetablePDF } = require('./src/services/timetableParser');
const { seedTimetable } = require('./src/services/timetableSeeder');
const { query } = require('./src/config/database');

async function testSeed() {
  const uploadsDir = path.join(__dirname, 'uploads', 'timetables');
  const files = fs.readdirSync(uploadsDir).filter(f => f.endsWith('.pdf'));
  if (files.length === 0) return console.log('No pdfs');
  
  const parsedData = await parseTimetablePDF(path.join(uploadsDir, files[0]));
  const res = await seedTimetable(parsedData, 1, 'test.pdf');
  console.log('Seed Report:', res);
  console.log('Seed done. Running Verifications...');
  
  // 1. No garbage class names in DB
  const r1 = await query('SELECT DISTINCT name FROM classes ORDER BY name');
  console.log('1. Classes:', r1.rows.map(r=>r.name).join(', '));
  
  // 2. II CSE B should have ~28 slots
  const r2 = await query('SELECT COUNT(*) as count FROM class_timetable_slots cts JOIN classes c ON c.id = cts.class_id WHERE c.name = $1', ['II CSE B']);
  console.log('2. II CSE B Slots:', r2.rows[0].count);
  
  // 3. II CSE B should have multiple faculty
  const r3 = await query('SELECT DISTINCT s.full_name FROM class_timetable_slots cts JOIN classes c ON c.id = cts.class_id JOIN users s ON s.id = cts.staff_id WHERE c.name = $1', ['II CSE B']);
  console.log('3. II CSE B Faculty:', r3.rows.map(r=>r.full_name).join(', '));
  
  // 4. All classes must have 15+ slots
  const r4 = await query('SELECT c.name, COUNT(*) as slots FROM class_timetable_slots cts JOIN classes c ON c.id = cts.class_id GROUP BY c.name HAVING COUNT(*) < 15 ORDER BY slots');
  console.log('4. Classes < 15 slots:', JSON.stringify(r4.rows));
  
  // 5. No class names with garbage values
  const r5 = await query('SELECT COUNT(*) as c FROM classes WHERE name LIKE $1 OR name LIKE $2 OR name LIKE $3 OR name LIKE $4', ['%(Main)%', '%Analysis%', '%Vision%', '%(%']);
  console.log('5. Garbage Classes Count:', r5.rows[0].c);

  process.exit(0);
}
testSeed();
