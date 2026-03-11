I have a College LMS project built with React + Vite (frontend) and Node.js + Express 
(backend) with PostgreSQL database. I need you to implement a complete Timetable Management 
System where the HOD uploads a single Faculty Timetable PDF and the system automatically 
parses it, seeds all data, and reflects everything across all portals.

---

## EXISTING SYSTEM

- JWT auth with roles: student, staff, hod
- ProtectedRoute for role-based access
- React Router v6
- Node.js/Express backend
- PostgreSQL database with existing dummy data models
- Login currently uses username + password → MUST BE CHANGED to gmail + password

---

## TASK 0: MODIFY LOGIN SYSTEM

Change the existing login system:
- Replace username field with gmail field (must end with @gmail.com, validated)
- Update the users/staff/students table to have gmail column instead of username
- Update JWT auth middleware to look up by gmail
- Update all seed data to use gmail format
- Frontend Login.jsx: change input label and validation to gmail
- Keep password as-is (bcrypt hashed)

---

## TASK 1: DATABASE SCHEMA

Create/modify these PostgreSQL tables. Drop and recreate cleanly.

### core tables:
```sql
-- Roles enum
CREATE TYPE user_role AS ENUM ('student', 'staff', 'hod');
CREATE TYPE slot_type AS ENUM ('theory', 'practical', 'others');
CREATE TYPE day_of_week AS ENUM ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday');

-- Users (base auth table)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gmail VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role user_role NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Departments
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE
);

-- Classes (e.g., II CSE A, III AI&DS)
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  year INTEGER NOT NULL,          -- 1, 2, 3, 4
  section VARCHAR(10) NOT NULL,   -- A, B, C
  department VARCHAR(50) NOT NULL, -- CSE, AI&DS
  semester INTEGER NOT NULL,      -- 1-8
  is_combined BOOLEAN DEFAULT FALSE,
  combined_with VARCHAR(50)       -- e.g., if "IV CSE C & AI&DS", store the other class
);

-- Subjects
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) NOT NULL,
  name VARCHAR(200) NOT NULL,
  department VARCHAR(50),
  is_theory BOOLEAN DEFAULT TRUE,
  is_practical BOOLEAN DEFAULT FALSE,
  is_others BOOLEAN DEFAULT FALSE  -- TWM, LIB, SEMINAR
);

-- Staff profiles
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  staff_code VARCHAR(20) UNIQUE NOT NULL,  -- auto-generated: CSE001, CSE002...
  full_name VARCHAR(200) NOT NULL,
  designation VARCHAR(100),               -- AP/CSE, ASP/CSE, Prof & Head/CSE
  department VARCHAR(50) DEFAULT 'CSE',
  gmail VARCHAR(255) UNIQUE NOT NULL
);

-- Students
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  roll_number VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(200) NOT NULL,
  gmail VARCHAR(255) UNIQUE NOT NULL,
  class_id UUID REFERENCES classes(id),
  department VARCHAR(50),
  year INTEGER,
  section VARCHAR(10),
  semester INTEGER
);

-- Staff subject assignments (who teaches what to which class)
CREATE TABLE staff_subject_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  hours_per_week INTEGER DEFAULT 0,
  slot_type slot_type NOT NULL,
  academic_year VARCHAR(20) DEFAULT '2025-2026',
  semester VARCHAR(20) DEFAULT 'ODD',
  UNIQUE(staff_id, subject_id, class_id, slot_type)
);

-- Faculty timetable slots (individual staff schedule)
CREATE TABLE faculty_timetable_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id),
  class_id UUID REFERENCES classes(id),
  day day_of_week NOT NULL,
  hour_number INTEGER NOT NULL CHECK (hour_number BETWEEN 1 AND 7),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_type slot_type NOT NULL,
  is_practical_span BOOLEAN DEFAULT FALSE,  -- true if this is a 2-hour practical
  practical_pair_hour INTEGER,              -- the other hour in the practical pair
  is_non_teaching BOOLEAN DEFAULT FALSE,   -- true for TWM, LIB, SEMINAR
  academic_year VARCHAR(20) DEFAULT '2025-2026',
  semester VARCHAR(20) DEFAULT 'ODD'
);

-- Class timetable slots (derived from faculty timetable)
CREATE TABLE class_timetable_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES staff(id),
  subject_id UUID REFERENCES subjects(id),
  day day_of_week NOT NULL,
  hour_number INTEGER NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_type slot_type NOT NULL,
  is_non_teaching BOOLEAN DEFAULT FALSE,
  academic_year VARCHAR(20) DEFAULT '2025-2026',
  semester VARCHAR(20) DEFAULT 'ODD'
);

-- Timetable upload log
CREATE TABLE timetable_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_by UUID REFERENCES users(id),
  filename VARCHAR(255),
  uploaded_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'processing',  -- processing, success, failed
  error_log TEXT,
  staff_parsed INTEGER DEFAULT 0,
  slots_created INTEGER DEFAULT 0
);
```

---

## TASK 2: PDF PARSING ENGINE

Create `src/services/timetableParser.js` on the backend.

### PDF Structure to parse:
Each page = one staff member with:

SECTION 1 - Faculty Name line:
  Pattern: "Faculty Name: [Name], [Designation]/CSE"
  or: "Faculty Name : [Name] [Designation]/CSE"
  Extract: full_name, designation

SECTION 2 - Timetable Grid:
  Days: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday
  Hours 1-7 with fixed time mappings:
    Hour 1: 09:15 - 10:05
    Hour 2: 10:05 - 10:55
    Hour 3: 11:15 - 12:05
    Hour 4: 12:05 - 12:55
    Hour 5: 14:00 - 14:50
    Hour 6: 14:50 - 15:40
    Hour 7: 15:40 - 16:30

  Cell patterns to detect:
    - Plain subject code: "22IT403" → single hour theory slot
    - Right-start practical: "22IT403→" → practical starts here, spans to next hour
    - Left-end practical: "←22IT403" → practical ends here, started previous hour
    - Both arrows: "←22IT403→" → practical spans this and adjacent hours
    - Non-teaching: "TWM", "LIB", "SEMINAR" → is_non_teaching = true
    - Empty: no slot

SECTION 3 - Summary Table:
  Extract rows under THEORY, PRACTICAL, OTHERS sections:
  Pattern per row: [SubCode] | [Subject Name] | [Class] | [Hours]
  
  Class name patterns to handle:
    - Simple: "III CSE B", "IV AI&DS"
    - Combined: "IV CSE C & AI&DS", "III CSE A&B", "IV CSE A & B"
    - Cross-dept (SKIP for attendance, keep for display): "II ECE A", "II ECE B"
    - With parentheses (practical label): "Computer Networks (Main)" → strip "(Main)"

### Parsing algorithm:
```javascript
async function parseTimetablePDF(filePath) {
  // 1. Use pdf-parse to extract raw text
  // 2. Split text by faculty sections (detect "Faculty Name:" pattern)
  // 3. For each faculty section:
  //    a. Extract name and designation
  //    b. Parse the grid: map day+hour to subject code
  //    c. Parse summary table: get subject details per code
  //    d. Cross-reference: grid slots + summary table = complete slot info
  // 4. Return structured array of faculty objects
  
  return [
    {
      full_name: "Dr.A.Jameer Basha",
      designation: "Prof & Head/CSE",
      gmail: "jameer.basha@gmail.com",  // auto-generate from name
      staff_code: "CSE001",             // auto-increment
      slots: [
        {
          day: "Monday",
          hour: 5,
          subject_code: "22IT403",
          subject_name: "Computer Networks",
          class_name: "III CSE B",
          slot_type: "theory",
          is_practical_span: false,
          is_non_teaching: false
        }
      ],
      subjects: [
        {
          code: "22IT403",
          name: "Computer Networks",
          class_name: "III CSE B",
          hours: 4,
          type: "theory"
        }
      ]
    }
  ]
}
```

### Gmail auto-generation from name:
```javascript
function generateGmail(fullName) {
  // "Dr.A.Jameer Basha" → remove title (Dr., Mr., Ms., Mrs.)
  // → "A.Jameer Basha" → take first initial + last word + number if duplicate
  // → "jameer.basha@gmail.com"
  // if duplicate exists → "jameer.basha2@gmail.com"
}
```

### Staff code auto-generation:
- Query DB for latest staff_code with prefix CSE
- Increment: CSE001, CSE002, CSE003...

---

## TASK 3: SEEDING ENGINE

Create `src/services/timetableSeeder.js` on backend.

### Seed order (respect FK constraints):

departments (CSE, AI&DS) - upsert
classes - upsert by name
subjects - upsert by code
users (staff) - insert with hashed password "hitech@123"
staff profiles - insert with auto-generated staff_code
staff_subject_assignments - from summary table
faculty_timetable_slots - from grid parsing
class_timetable_slots - DERIVED from faculty slots:
For each faculty_timetable_slot:
→ find the class_id from class_name
→ insert into class_timetable_slots with same day/hour/subject/staff


### Combined class handling:
- "IV CSE C & AI&DS" → create TWO separate class_timetable_slots entries:
  one for IV CSE C, one for IV AI&DS
- Attendance will be tracked separately per class

### ECE class handling:
- Keep in faculty_timetable_slots (staff can see it in their timetable)
- DO NOT create class_timetable_slots for ECE classes
- DO NOT create attendance records for ECE classes
- Mark ECE slots with a flag: is_cross_dept = true

### Non-teaching slot handling (TWM, LIB, SEMINAR):
- Insert into faculty_timetable_slots with is_non_teaching = true
- Also insert into class_timetable_slots with is_non_teaching = true
- These ARE shown in timetable views
- These DO have attendance tracking (staff must mark present/absent for the session)
- But UI shows them differently (grey color, label "Non-Teaching")

### Idempotency:
- All upserts use ON CONFLICT DO UPDATE
- Re-uploading same PDF should not duplicate data
- Log everything to timetable_uploads table

---

## TASK 4: BACKEND API ROUTES

### HOD Routes:

POST /api/hod/timetable/upload
- Accept multipart/form-data with PDF file
- Use multer for file upload
- Call parseTimetablePDF() then timetableSeeder()
- Return: { success, staffParsed, slotsCreated, errors[] }
- Stream progress via SSE or return job_id for polling

GET /api/hod/timetable/status/:jobId
- Return parsing job status and progress

GET /api/hod/timetable/staff-wise
- Return all staff with their full timetable grid
- Query: ?staff_id=xxx to filter one staff

GET /api/hod/timetable/class-wise
- Return all classes with their full timetable grid
- Query: ?class_id=xxx to filter one class

GET /api/hod/timetable/upload-history
- Return list of past uploads with status and counts

### Staff Routes:

GET /api/staff/timetable/my
- Return authenticated staff's full timetable grid
- Include: day, hour, subject_name, class_name, slot_type, is_non_teaching, times

GET /api/staff/timetable/today
- Return only today's slots sorted by hour
- Include "current" flag for the slot happening right now

### Student Routes:

GET /api/student/timetable/my
- Return student's class timetable (derived from class_timetable_slots)
- Filter by student's class_id

---

## TASK 5: ATTENDANCE INTEGRATION

### Modify existing attendance system:

The Take Attendance page must now be timetable-aware:

GET /api/staff/attendance/current-slot
- Returns the current timetable slot based on:
  - Current day of week
  - Current time → match to hour_number
  - Staff's assigned slots for that day/hour
- Returns: { subject_name, class_name, hour, start_time, end_time, slot_type }
- If no slot → { message: "No class scheduled now" }

GET /api/staff/attendance/pending-today
- Returns slots from today's timetable where attendance hasn't been marked yet
- Staff can mark late attendance for missed slots

### Attendance auto-suggestion flow:
1. Staff opens Take Attendance page
2. Frontend calls /api/staff/attendance/current-slot
3. If active slot found → pre-fill subject and class dropdowns
4. Staff confirms → mark attendance as usual
5. Show "You have X more classes today" summary

---

## TASK 6: FRONTEND PAGES

### HOD Portal:

#### New Page: Timetable Management
Route: /hod/timetable
File: src/pages/hod/TimetableManagement.jsx

Sections:
A) Upload Panel:
   - Drag & drop PDF upload zone
   - Upload button with progress bar
   - Real-time parsing feedback:
     "Parsing faculty timetables... 12/28 staff processed"
   - Summary on completion:
     "✅ 28 staff parsed | 847 slots created | 42 subjects found | 0 errors"
   - Error list if any parsing failures

B) Staff-wise Timetable View:
   - Dropdown to select staff member
   - Visual grid: Days (rows) × Hours 1-7 (columns)
   - Color coding:
     Theory slots → Blue
     Practical slots → Green  
     Non-teaching (TWM/LIB) → Grey
     ECE cross-dept slots → Light purple with "ECE" badge
     Empty → White
   - Each cell shows: subject code + class name
   - Hover → tooltip with full subject name + hours/week

C) Class-wise Timetable View:
   - Dropdown to select class (II CSE A, II CSE B, etc.)
   - Same visual grid format
   - Each cell shows: subject code + faculty name
   - Matches the visual format of the uploaded PDF

D) Upload History:
   - Table of past uploads with filename, date, status, counts
   - Option to rollback/re-upload

---

#### New Page: HOD Timetable Reports  
Route: /hod/timetable/reports
Shows:
- Total hours per staff (workload analysis)
- Subjects with no staff assigned
- Classes with incomplete timetables

---

### Staff Portal:

#### New Page: My Timetable
Route: /staff/timetable
File: src/pages/staff/MyTimetable.jsx

- Visual weekly grid (same format as HOD view but personal)
- Color coded by subject
- Today's column highlighted
- Current hour slot highlighted with pulsing border
- Non-teaching slots shown in grey with label
- ECE slots shown in light purple (visible but marked cross-dept)
- Click on any slot → side panel showing:
  - Subject full name
  - Class details
  - Hours per week
  - Slot type (Theory/Practical)

#### Update: Staff Dashboard
- "Today's Schedule" section showing timeline of the day
- Current/next class highlighted
- Quick "Mark Attendance" button on current class card
- Pending attendance count badge

#### Update: My Subjects page
- Now auto-populated from timetable data
- Shows all assigned subjects with class, hours/week, type

#### Update: Take Attendance page
- Auto-detects current slot
- Pre-fills subject and class
- Shows pending slots for today

---

### Student Portal:

#### New Page: My Timetable
Route: /student/timetable
File: src/pages/student/MyTimetable.jsx

- Read-only class timetable view
- Today highlighted
- Current slot highlighted
- Shows: subject name + faculty name per slot

#### Update: Student Dashboard
- Today's classes timeline

---

## TASK 7: DASHBOARD UPDATES

### Staff Dashboard additions:
```javascript
// Today's schedule widget
{
  current_slot: { subject, class, hour, time_remaining_minutes },
  next_slot: { subject, class, hour, starts_in_minutes },
  today_slots: [...all slots today sorted by hour],
  pending_attendance: [...slots today with no attendance record]
}
```

### HOD Dashboard additions:
- Total staff count (from seeded data)
- Total classes count
- Timetable upload status (last upload date)
- Staff with no timetable assigned

---

## TASK 8: SEEDING SCRIPT

Create a standalone seed script: `scripts/seedFromPDF.js`
```bash
node scripts/seedFromPDF.js --file=timetable.pdf --year=2025-2026 --sem=ODD
```

This script:
1. Reads the PDF
2. Parses all faculty timetables
3. Seeds the entire database
4. Generates a report:
   - Staff created: 28
   - Classes found: 12
   - Subjects found: 42
   - Timetable slots created: 847
   - Errors: 0
   - Staff with auto-generated gmails: [list]
   - Default password for all staff: hitech@123

Also create: `scripts/seedStudents.js`
Students need: roll_number, full_name, gmail, class_id, year, section, semester
Accept a CSV file or generate dummy students per class (5 dummy students per class for testing)

---

## TASK 9: KNOWN PARSING CHALLENGES - HANDLE THESE

1. Faculty name variations:
   "Faculty Name: Dr.A.Jameer Basha, Prof & Head/CSE"
   "Faculty Name : Ms.D.Vidhya, AP/CSE"  ← note space before colon
   "Faculty Name:Mr.S.Sathishkumar, AP/CSE" ← no space after colon

2. Practical slot arrow patterns:
   "←22IT403→" = practical slot in middle
   "22IT403→"  = practical slot start
   "←22IT403"  = practical slot end
   "← 22IT403 →" = with spaces (handle both)

3. Combined class patterns:
   "IV CSE C & AI&DS"  → split into ["IV CSE C", "IV AI&DS"]
   "III CSE A&B"       → split into ["III CSE A", "III CSE B"]
   "IV CSE A & B"      → split into ["IV CSE A", "IV CSE B"]
   "III B CSE & AI&DS" → split into ["III CSE B", "III AI&DS"]
   "IV C&AI&DS"        → split into ["IV CSE C", "IV AI&DS"]

4. Cross-department detection:
   If class contains "ECE" → is_cross_dept = true → skip class timetable seeding

5. Subject name cleanup:
   "Computer Networks (Main)" → "Computer Networks" (strip "(Main)")
   "Clean Coding and Devops (Main)" → "Clean Coding and Devops"
   "(Main)" suffix always means practical variant of theory subject

6. Page boundary detection:
   Each new staff starts with "HINDUSTHAN INSTITUTE OF TECHNOLOGY"
   Use this as page separator when splitting PDF text

7. Empty last page:
   The PDF has a blank last page - handle gracefully, don't crash

8. HOD staff entry:
   "Dr.A.Jameer Basha, Prof & Head/CSE" is the HOD
   Create this user with role='hod' not role='staff'
   Still create staff profile for timetable purposes

---

## TASK 10: ERROR HANDLING & VALIDATION

- If a subject code in the grid doesn't appear in summary table → log warning, skip slot
- If staff name can't be parsed → log error, skip that page, continue
- If class name format is unrecognized → log warning, store raw string
- If PDF is password protected or corrupt → return clear error message to HOD
- All parsing errors collected and returned in upload response
- Never crash mid-parse — wrap each faculty section in try/catch

---

## FILE STRUCTURE TO CREATE/MODIFY

Backend:
- src/services/timetableParser.js     ← PDF parsing engine
- src/services/timetableSeeder.js     ← DB seeding engine  
- src/services/gmailGenerator.js      ← auto gmail generation
- src/routes/hod/timetable.js         ← HOD timetable routes
- src/routes/staff/timetable.js       ← Staff timetable routes
- src/routes/student/timetable.js     ← Student timetable routes
- src/routes/auth.js                  ← MODIFY: username → gmail
- src/db/schema.sql                   ← Full updated schema
- src/db/migrations/001_timetable.sql ← Migration file
- scripts/seedFromPDF.js              ← Standalone seed script
- scripts/seedStudents.js             ← Student seed script

Frontend:
- src/pages/hod/TimetableManagement.jsx   ← New
- src/pages/staff/MyTimetable.jsx         ← New
- src/pages/student/MyTimetable.jsx       ← New
- src/pages/auth/Login.jsx                ← MODIFY: gmail login
- src/pages/staff/Dashboard.jsx           ← UPDATE: today's schedule
- src/pages/hod/Dashboard.jsx             ← UPDATE: timetable stats
- src/pages/student/Dashboard.jsx         ← UPDATE: today's classes
- src/pages/staff/Attendance.jsx          ← UPDATE: auto-detect slot
- src/App.jsx                             ← Add new routes

---

## FINAL REQUIREMENTS

- Use pdf-parse npm package for PDF text extraction
- Use bcryptjs for password hashing
- All DB operations use parameterized queries (no raw string interpolation)
- All routes protected with existing JWT middleware
- Timetable upload only accessible to hod role
- Use transactions for seeding (rollback entire seed if critical error)
- Add loading states on all timetable pages (parsing can take 10-15 seconds)
- Mobile responsive timetable grid (horizontal scroll on small screens)
- Write complete working code — zero placeholder comments
- Do not break any existing features
- After implementation, run the seed script against the actual PDF and
  show me the console output confirming successful parsing