require('dotenv').config();
const { query } = require('./src/config/database');

async function clean() {
  await query("DELETE FROM class_timetable_slots");
  await query("DELETE FROM faculty_timetable_slots");
  await query("DELETE FROM staff_subject_assignments");
  await query("DELETE FROM classes");
  console.log('Cleaned old garbage classes completely');
  process.exit(0);
}
clean();
