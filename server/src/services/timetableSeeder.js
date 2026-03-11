/**
 * Timetable Seeder
 * Takes parsed timetable data and seeds the database.
 * Handles upserts, class creation, subject creation, and timetable slot insertion.
 */

const { query, getClient } = require('../config/database');
const { hashPassword } = require('../utils/bcrypt');
const { parseClassName, yearToSemester, yearToInt, isCrossDept } = require('./timetableParser');

const DEFAULT_PASSWORD = 'hitech@123';

/**
 * Seed the entire timetable from parsed PDF data.
 * @param {Object} parsedData — output from parseTimetablePDF
 * @param {number} uploadedBy — user ID of the HOD
 * @param {string} filename — original filename
 * @returns {Object} seeding report
 */
async function seedTimetable(parsedData, uploadedBy, filename) {
    const client = await getClient();
    const report = {
        staffCreated: 0,
        staffUpdated: 0,
        classesCreated: 0,
        subjectsCreated: 0,
        slotsCreated: 0,
        assignmentsCreated: 0,
        errors: [],
        staffGmails: [],
    };

    let uploadId;

    try {
        await client.query('BEGIN');

        // Ensure class_timetable_slots has is_practical_span (migration safety)
        await client.query(`
            ALTER TABLE class_timetable_slots ADD COLUMN IF NOT EXISTS is_practical_span BOOLEAN DEFAULT FALSE
        `).catch(() => {});
        await client.query(`
            ALTER TABLE class_timetable_slots ADD COLUMN IF NOT EXISTS practical_pair_hour INTEGER
        `).catch(() => {});

        // Create upload log
        const uploadResult = await client.query(
            `INSERT INTO timetable_uploads (uploaded_by, filename, status)
             VALUES ($1, $2, 'processing') RETURNING id`,
            [uploadedBy, filename]
        );
        uploadId = uploadResult.rows[0].id;

        // Ensure CSE department exists
        await ensureDepartment(client, 'CSE', 'Computer Science and Engineering');
        await ensureDepartment(client, 'AI&DS', 'Artificial Intelligence and Data Science');

        // Get department ID for CSE
        const deptResult = await client.query("SELECT id FROM departments WHERE code = 'CSE'");
        const cseDeptId = deptResult.rows[0]?.id;

        // Track created entities
        const classCache = {}; // name → id
        const subjectCache = {}; // code → id
        const staffCache = {}; // gmail → user id

        // Clear previous timetable data for this academic year
        await client.query('DELETE FROM faculty_timetable_slots WHERE academic_year = $1', ['2025-2026']);
        await client.query('DELETE FROM class_timetable_slots WHERE academic_year = $1', ['2025-2026']);
        await client.query('DELETE FROM staff_subject_assignments WHERE academic_year = $1', ['2025-2026']);

        const textLabelMap = await buildTextLabelMap(client);

        // Process each faculty
        for (let fi = 0; fi < parsedData.faculty.length; fi++) {
            const faculty = parsedData.faculty[fi];
            try {
                // 1. Create/find user account
                const userId = await ensureStaffUser(
                    client, faculty, cseDeptId, report
                );
                staffCache[faculty.gmail] = userId;
                report.staffGmails.push({
                    name: faculty.full_name,
                    gmail: faculty.gmail,
                    staffCode: faculty.staff_code,
                    isHod: faculty.isHod,
                });

                // 2. Process subjects from summary
                for (const subj of faculty.subjects) {
                    const subjId = await ensureSubject(
                        client, subj, cseDeptId, userId, report
                    );
                    subjectCache[subj.code.toUpperCase()] = subjId;

                    // 3. Process class assignments
                    const classNames = parseClassName(subj.class_name);
                    for (const cls of classNames) {
                        if (isCrossDept(cls.name)) continue; // Skip cross-dept for assignments

                        const classId = await ensureClass(
                            client, cls, report
                        );
                        classCache[cls.name.toUpperCase()] = classId;

                        // Create subject assignment
                        await ensureAssignment(
                            client, userId, subjId, classId, subj, report
                        );
                    }
                }

                // 4. Create timetable slots
                for (const slot of faculty.slots) {
                    // BUG 4 FIX: Resolve text-based subjects
                    if (textLabelMap[slot.subject_code.toUpperCase()]) {
                        slot.subject_code = textLabelMap[slot.subject_code.toUpperCase()];
                    }
                    const subjId = subjectCache[slot.subject_code.toUpperCase()];

                    // Find all matching classes for this subject
                    let classNames = [];
                    if (slot.class_name) {
                        classNames = parseClassName(slot.class_name);
                    } else {
                        // Look up from subject summary - ALL matching rows to cover multiple classes
                        const matchingSubjects = faculty.subjects.filter(
                            s => s.code.toUpperCase() === slot.subject_code.toUpperCase()
                        );
                        matchingSubjects.forEach(subjInfo => {
                            if (subjInfo.class_name) {
                                classNames.push(...parseClassName(subjInfo.class_name));
                            }
                        });
                    }

                    // For non-teaching slots, find classes if we can
                    if (slot.is_non_teaching && classNames.length === 0) {
                        // Non-teaching slots don't need a specific class
                    }

                    // Insert faculty timetable slot
                    let classId = null;
                    const crossDept = classNames.length > 0 && classNames.every(c => isCrossDept(c.name));

                    if (classNames.length > 0 && !crossDept) {
                        const firstClass = classNames[0];
                        classId = classCache[firstClass.name.toUpperCase()] || null;
                        if (!classId) {
                            const cId = await ensureClass(client, firstClass, report);
                            classCache[firstClass.name.toUpperCase()] = cId;
                            classId = cId;
                        }
                    }

                    // Handle non-teaching: use a default subject entry
                    let slotSubjId = subjId;
                    if (slot.is_non_teaching && !slotSubjId) {
                        slotSubjId = await ensureSubject(client, {
                            code: slot.subject_code.toUpperCase(),
                            name: slot.subject_code.toUpperCase(),
                            type: 'others',
                            hours: 0,
                            class_name: '',
                        }, cseDeptId, null, report);
                        subjectCache[slot.subject_code.toUpperCase()] = slotSubjId;
                    }

                    try {
                        await client.query(
                            `INSERT INTO faculty_timetable_slots
                             (staff_id, subject_id, class_id, day, hour_number,
                              start_time, end_time, slot_type, is_practical_span,
                              practical_pair_hour, is_non_teaching, is_cross_dept,
                              raw_class_name, academic_year, semester)
                             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
                             ON CONFLICT (staff_id, day, hour_number, academic_year, semester)
                             DO UPDATE SET subject_id = EXCLUDED.subject_id,
                                           class_id = EXCLUDED.class_id,
                                           slot_type = EXCLUDED.slot_type,
                                           is_practical_span = EXCLUDED.is_practical_span,
                                           is_non_teaching = EXCLUDED.is_non_teaching,
                                           is_cross_dept = EXCLUDED.is_cross_dept`,
                            [
                                userId, slotSubjId || null, classId, slot.day, slot.hour,
                                slot.start_time, slot.end_time, slot.slot_type || 'theory',
                                slot.is_practical_span || false,
                                slot.practical_pair_hour || null,
                                slot.is_non_teaching || false,
                                crossDept || false,
                                slot.class_name || (classNames[0]?.name || ''),
                                '2025-2026', 'ODD',
                            ]
                        );
                        report.slotsCreated++;
                    } catch (e) {
                         console.warn('FTS Insert Error:', e.message);
                    }

                }
            } catch (err) {
                console.log('FATAL SEED ERROR:', err); throw err;
            }
        }

        // 5. Derive all Class Timetable Slots globally
        await deriveAllClassTimetables(client);

        // Update upload log
        await client.query(
            `UPDATE timetable_uploads SET status = 'success',
             staff_parsed = $2, slots_created = $3,
             subjects_found = $4, classes_found = $5
             WHERE id = $1`,
            [uploadId, report.staffCreated + report.staffUpdated,
                report.slotsCreated,
                Object.keys(subjectCache).length,
                Object.keys(classCache).length]
        );

        await client.query('COMMIT');

        return {
            success: true,
            uploadId,
            ...report,
        };
    } catch (err) {
        await client.query('ROLLBACK').catch(() => { });

        // Update upload log as failed (use new client since transaction is dead)
        if (uploadId) {
            try {
                const altClient = await getClient();
                await altClient.query(
                    `UPDATE timetable_uploads SET status = 'failed', error_log = $2 WHERE id = $1`,
                    [uploadId, err.message]
                );
                altClient.release();
            } catch { } // ignore
        }

        return {
            success: false,
            uploadId,
            error: err.message,
            ...report,
        };
    } finally {
        client.release();
    }
}

// ── Helper: ensure department exists ──────────────────────────
async function ensureDepartment(client, code, name) {
    await client.query(
        `INSERT INTO departments (name, code)
         VALUES ($1, $2)
         ON CONFLICT (code) DO NOTHING`,
        [name, code]
    );
}

// ── Helper: ensure staff user exists ──────────────────────────
async function ensureStaffUser(client, faculty, deptId, report) {
    // Check if user exists by gmail
    const existing = await client.query(
        'SELECT id FROM users WHERE gmail = $1 OR email = $1',
        [faculty.gmail]
    );

    if (existing.rows.length > 0) {
        const userId = existing.rows[0].id;
        const safeStaffCode = 'CSE_EMP_' + String(userId).padStart(3, '0');

        // Update staff profile if needed, without overwriting existing employee_id/staff_code
        // We provide safeStaffCode for VALUES just in case the row doesn't exist yet
        await client.query(
            `INSERT INTO staff_profiles (user_id, employee_id, designation, staff_code)
             VALUES ($1, $2, $3, $2)
             ON CONFLICT (user_id) DO UPDATE SET
               designation = COALESCE(EXCLUDED.designation, staff_profiles.designation)`,
            [userId, safeStaffCode, faculty.designation]
        );

        report.staffUpdated++;
        return userId;
    }

    // Create new user
    const hashedPwd = await hashPassword(DEFAULT_PASSWORD);
    const role = faculty.isHod ? 'hod' : 'staff';

    const userResult = await client.query(
        `INSERT INTO users (username, email, gmail, password_hash, role, full_name, department_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [
            faculty.gmail.split('@')[0], // username from gmail prefix
            faculty.gmail,
            faculty.gmail,
            hashedPwd,
            role,
            faculty.full_name,
            deptId,
        ]
    );
    const userId = userResult.rows[0].id;

    // Generate safe unique staff code derived from user ID
    const safeStaffCode = 'CSE_EMP_' + String(userId).padStart(3, '0');

    // Create staff profile
    await client.query(
        `INSERT INTO staff_profiles (user_id, employee_id, designation, staff_code)
         VALUES ($1, $2, $3, $2)
         ON CONFLICT (user_id) DO UPDATE SET
           designation = EXCLUDED.designation`,
        [userId, safeStaffCode, faculty.designation]
    );

    // If HOD, update department
    if (faculty.isHod) {
        await client.query(
            `UPDATE departments SET hod_id = $1 WHERE id = $2`,
            [userId, deptId]
        );
    }

    report.staffCreated++;
    return userId;
}

// ── Helper: ensure subject exists ─────────────────────────────
async function ensureSubject(client, subj, deptId, staffId, report) {
    const existing = await client.query(
        'SELECT id FROM subjects WHERE code = $1',
        [subj.code]
    );

    if (existing.rows.length > 0) {
        return existing.rows[0].id;
    }

    const result = await client.query(
        `INSERT INTO subjects (name, code, department_id, staff_id)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (code) DO UPDATE SET
           name = COALESCE(EXCLUDED.name, subjects.name),
           staff_id = COALESCE(EXCLUDED.staff_id, subjects.staff_id)
         RETURNING id`,
        [subj.name, subj.code, deptId, staffId]
    );

    report.subjectsCreated++;
    return result.rows[0].id;
}

// ── Helper: ensure class exists ───────────────────────────────
async function ensureClass(client, cls, report) {
    // Normalize name
    const name = cls.name.trim();

    const existing = await client.query(
        'SELECT id FROM classes WHERE name = $1',
        [name]
    );

    if (existing.rows.length > 0) {
        return existing.rows[0].id;
    }

    const yearInt = yearToInt(cls.year);
    const semester = yearToSemester(yearInt);

    const result = await client.query(
        `INSERT INTO classes (name, year, section, department, semester)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (name) DO UPDATE SET
           year = EXCLUDED.year,
           section = EXCLUDED.section,
           department = EXCLUDED.department
         RETURNING id`,
        [name, yearInt, cls.section || '', cls.department || 'CSE', semester]
    );

    report.classesCreated++;
    return result.rows[0].id;
}

// ── Helper: ensure staff-subject assignment ───────────────────
async function ensureAssignment(client, staffId, subjectId, classId, subj, report) {
    await client.query(
        `INSERT INTO staff_subject_assignments
         (staff_id, subject_id, class_id, hours_per_week, slot_type, academic_year, semester)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (staff_id, subject_id, class_id, slot_type)
         DO UPDATE SET hours_per_week = EXCLUDED.hours_per_week`,
        [
            staffId, subjectId, classId,
            subj.hours || 0,
            subj.type || 'theory',
            '2025-2026', 'ODD',
        ]
    );
    report.assignmentsCreated++;
}

// ── BUG 4: buildTextLabelMap ───────────────────────────────────────
async function buildTextLabelMap(db) {
  const { rows } = await db.query(`
    SELECT code, name FROM subjects
  `);
  
  const map = {};
  
  for (const subject of rows) {
    if (!subject.name) continue;
    const nameLower = subject.name.toLowerCase();
    
    // Java Programming → JAVA
    if (nameLower.includes('java')) map['JAVA'] = subject.code;
    
    // Data Structures → DS, DATA STRUCTURES, DATASTRUCTURES
    if (nameLower.includes('data structure')) {
      map['DS'] = subject.code;
      map['DATA STRUCTURES'] = subject.code;
      map['DATASTRUCTURES'] = subject.code;
      map['DATA STRUCTURE'] = subject.code;
    }
    
    // Python
    if (nameLower.includes('python')) map['PYTHON'] = subject.code;
    
    // C Programming  
    if (nameLower.includes('programming in c') || nameLower.includes('problem solving')) {
      map['C PROGRAMMING'] = subject.code;
      map['C'] = subject.code;
    }
  }
  
  return map;
}

// ── Helper: derive class timetable from ALL faculty slots ─────────────
async function deriveAllClassTimetables(db) {
  console.log('Starting class timetable derivation...');
  
  // Step 1: Clear existing class timetable slots
  await db.query('DELETE FROM class_timetable_slots');
  
  let inserted = 0;
  let conflicts = 0;

  const { rows: facultySlots } = await db.query(`
    SELECT 
      fts.class_id, fts.staff_id, fts.subject_id, fts.day, fts.hour_number,
      fts.start_time, fts.end_time, fts.slot_type, fts.is_non_teaching,
      fts.is_practical_span, fts.practical_pair_hour, fts.academic_year, fts.semester,
      fts.raw_class_name
    FROM faculty_timetable_slots fts
    WHERE fts.is_cross_dept = false
  `);

  for (const slot of facultySlots) {
      const classIdsToInsert = [];
      if (slot.class_id) classIdsToInsert.push(slot.class_id);

      // Handle combined classes from raw_class_name
      if (slot.raw_class_name && slot.raw_class_name.includes('&')) {
          const parsed = parseClassName(slot.raw_class_name);
          if (parsed.length > 1) {
              for (let i = 1; i < parsed.length; i++) {
                  if (isCrossDept(parsed[i].name)) continue;
                  const cRes = await db.query('SELECT id FROM classes WHERE name = $1', [parsed[i].name.trim()]);
                  if (cRes.rows.length > 0) {
                      classIdsToInsert.push(cRes.rows[0].id);
                  }
              }
          }
      }

      for (const cid of classIdsToInsert) {
          try {
              await db.query(`
                  INSERT INTO class_timetable_slots (
                    class_id, staff_id, subject_id, day, hour_number,
                    start_time, end_time, slot_type, is_non_teaching,
                    is_practical_span, practical_pair_hour, academic_year, semester
                  ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
                  ON CONFLICT (class_id, day, hour_number, academic_year, semester)
                  DO UPDATE SET
                    staff_id = COALESCE(class_timetable_slots.staff_id, EXCLUDED.staff_id),
                    subject_id = EXCLUDED.subject_id,
                    slot_type = EXCLUDED.slot_type,
                    is_non_teaching = EXCLUDED.is_non_teaching,
                    is_practical_span = EXCLUDED.is_practical_span
              `, [
                  cid, slot.staff_id, slot.subject_id, slot.day, slot.hour_number,
                  slot.start_time, slot.end_time, slot.slot_type, slot.is_non_teaching,
                  slot.is_practical_span, slot.practical_pair_hour, slot.academic_year, slot.semester
              ]);
              inserted++;
          } catch (e) {
              conflicts++;
          }
      }
  }

  // Step 4: Verify results
  const { rows: verification } = await db.query(`
    SELECT c.name, COUNT(*) as slot_count
    FROM class_timetable_slots cts
    JOIN classes c ON c.id = cts.class_id
    GROUP BY c.name
    ORDER BY c.name
  `);
  
  console.log('Class slot counts:');
  verification.forEach(r => {
    const status = r.slot_count < 15 ? '⚠️ LOW' : '✅';
    console.log(`  ${status} ${r.name}: ${r.slot_count} slots`);
  });
  
  return { inserted, conflicts, verification };
}

module.exports = { seedTimetable };
