const fs = require('fs');
const { parseTimetablePDF } = require('./src/services/timetableParser');
require('dotenv').config();

async function run() {
    const res = await parseTimetablePDF('uploads/timetables/timetable_1773136595717.pdf');
    const r = res.faculty.find(f => f.full_name.includes('Ramasamy'));
    console.log(r ? r.slots : 'Not found');
}
run();
