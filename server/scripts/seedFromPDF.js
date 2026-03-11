const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') }); // Adjust path to point to your .env file
const fs = require('fs');
const { parseTimetablePDF } = require('../src/services/timetableParser');
const { seedTimetable } = require('../src/services/timetableSeeder');
const { pool } = require('../src/config/database');

async function seedPdf() {
    console.log('--- College LMS Timetable Seeding ---');

    console.log('Ensuring database pool connects...');
    try {
        await pool.query('SELECT 1');
    } catch (err) {
        console.error('Failed to connect to the database. Ensure your .env has correct DATABASE_URL:', err.message);
        process.exit(1);
    }

    const pdfPath = process.argv[2];

    if (!pdfPath) {
        console.error('Usage: node seedFromPDF.js <path-to-pdf>');
        console.error('Example: node seedFromPDF.js ./sample-timetable.pdf');
        process.exit(1);
    }

    const resolvedPath = path.resolve(pdfPath);
    if (!fs.existsSync(resolvedPath)) {
        console.error(`Error: File not found at path: ${resolvedPath}`);
        process.exit(1);
    }

    console.log(`Loading PDF from: ${resolvedPath}`);

    try {
        console.log('Parsing PDF and extracting structured data... (this might take a few seconds)');
        const parsedData = await parseTimetablePDF(resolvedPath);

        console.log('\n--- Parse Results ---');
        console.log(`Faculty parsed  : ${parsedData.totalStaff}`);
        console.log(`Slots found     : ${parsedData.totalSlots}`);
        console.log(`Subjects found  : ${parsedData.totalSubjects}`);
        if (parsedData.errors.length > 0) {
            console.log(`Errors encountered : ${parsedData.errors.length}`);
            parsedData.errors.forEach(e => console.log(`  - Page ${e.page} (${e.staff || 'Unknown'}): ${e.error}`));
        }

        if (parsedData.totalStaff === 0) {
            console.log('\nNo faculty parsed. Check if the PDF matches the expected format. Exiting.');
            process.exit(0);
        }

        console.log('\n--- Seeding Database ---');
        console.log('Seeding timetable and managing accounts... (this might take a minute)');

        // Use a dummy HOD ID (e.g., 1) or let the parser handle it
        const hodId = 1;
        const seedResult = await seedTimetable(parsedData, hodId, path.basename(resolvedPath));

        console.log('\n--- Seed Results ---');
        if (seedResult.success) {
            console.log('✅ Success!');
            console.log(`Staff created    : ${seedResult.staffCreated}`);
            console.log(`Staff updated    : ${seedResult.staffUpdated}`);
            console.log(`Classes created  : ${seedResult.classesCreated}`);
            console.log(`Subjects matched : ${seedResult.subjectsCreated}`);
            console.log(`Slots inserted   : ${seedResult.slotsCreated}`);
            console.log(`Subj Assignments : ${seedResult.assignmentsCreated}`);

            if (seedResult.staffGmails && seedResult.staffGmails.length > 0) {
                console.log('\n--- Staff Accounts Auto-Generated ---');
                console.log('Note: Default password is "hitech@123". Inform staff members.');
                seedResult.staffGmails.slice(0, 5).forEach((s) => {
                    console.log(`- ${s.name} (${s.staffCode}) -> ${s.gmail} ${s.isHod ? '[HOD]' : ''}`);
                });
                if (seedResult.staffGmails.length > 5) {
                    console.log(`... and ${seedResult.staffGmails.length - 5} more.`);
                }
            }
        } else {
            console.log('❌ Failed.');
            console.error('Error:', seedResult.error);
        }

    } catch (err) {
        console.error('Unhandled script error:', err);
    } finally {
        // Shutdown gracefully
        await pool.end();
        console.log('\nDone.');
        process.exit(0);
    }
}

seedPdf();
