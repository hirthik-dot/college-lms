-- ============================================================
-- Timetable Management System — Migration
-- Adds gmail support to users + all timetable tables
-- Run: psql -U postgres -d college_lms -f 003_timetable.sql
-- ============================================================

-- ── 0. Add gmail column to users (keep username for backward compat) ──
ALTER TABLE users ADD COLUMN IF NOT EXISTS gmail VARCHAR(255);

-- Populate gmail from existing email for existing rows
UPDATE users SET gmail = email WHERE gmail IS NULL;

-- Create unique index (allow nulls until all populated)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_gmail ON users(gmail) WHERE gmail IS NOT NULL;

-- ── 1. Custom ENUM types ──────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE slot_type AS ENUM ('theory', 'practical', 'others');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE day_of_week AS ENUM ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 2. Classes ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS classes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  year INTEGER NOT NULL,
  section VARCHAR(10) NOT NULL DEFAULT '',
  department VARCHAR(50) NOT NULL DEFAULT 'CSE',
  semester INTEGER NOT NULL DEFAULT 1,
  is_combined BOOLEAN DEFAULT FALSE,
  combined_with VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ── 3. Staff subject assignments ──────────────────────────────
CREATE TABLE IF NOT EXISTS staff_subject_assignments (
  id SERIAL PRIMARY KEY,
  staff_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
  hours_per_week INTEGER DEFAULT 0,
  slot_type slot_type NOT NULL DEFAULT 'theory',
  academic_year VARCHAR(20) DEFAULT '2025-2026',
  semester VARCHAR(20) DEFAULT 'ODD',
  UNIQUE(staff_id, subject_id, class_id, slot_type)
);

-- ── 4. Faculty timetable slots ────────────────────────────────
CREATE TABLE IF NOT EXISTS faculty_timetable_slots (
  id SERIAL PRIMARY KEY,
  staff_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
  class_id INTEGER REFERENCES classes(id) ON DELETE SET NULL,
  day day_of_week NOT NULL,
  hour_number INTEGER NOT NULL CHECK (hour_number BETWEEN 1 AND 7),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_type slot_type NOT NULL DEFAULT 'theory',
  is_practical_span BOOLEAN DEFAULT FALSE,
  practical_pair_hour INTEGER,
  is_non_teaching BOOLEAN DEFAULT FALSE,
  is_cross_dept BOOLEAN DEFAULT FALSE,
  raw_class_name VARCHAR(100),
  academic_year VARCHAR(20) DEFAULT '2025-2026',
  semester VARCHAR(20) DEFAULT 'ODD',
  UNIQUE(staff_id, day, hour_number, academic_year, semester)
);

-- ── 5. Class timetable slots ──────────────────────────────────
CREATE TABLE IF NOT EXISTS class_timetable_slots (
  id SERIAL PRIMARY KEY,
  class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  staff_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
  day day_of_week NOT NULL,
  hour_number INTEGER NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_type slot_type NOT NULL DEFAULT 'theory',
  is_non_teaching BOOLEAN DEFAULT FALSE,
  is_practical_span BOOLEAN DEFAULT FALSE,
  academic_year VARCHAR(20) DEFAULT '2025-2026',
  semester VARCHAR(20) DEFAULT 'ODD',
  UNIQUE(class_id, day, hour_number, academic_year, semester)
);

-- ── 6. Timetable upload log ──────────────────────────────────
CREATE TABLE IF NOT EXISTS timetable_uploads (
  id SERIAL PRIMARY KEY,
  uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  filename VARCHAR(255),
  uploaded_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'processing',
  error_log TEXT,
  staff_parsed INTEGER DEFAULT 0,
  slots_created INTEGER DEFAULT 0,
  subjects_found INTEGER DEFAULT 0,
  classes_found INTEGER DEFAULT 0
);

-- ── 7. Add staff_code to staff_profiles if not present ────────
ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS staff_code VARCHAR(20);
CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_code ON staff_profiles(staff_code) WHERE staff_code IS NOT NULL;

-- ── 8. INDEXES ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_fts_staff ON faculty_timetable_slots(staff_id);
CREATE INDEX IF NOT EXISTS idx_fts_day ON faculty_timetable_slots(day);
CREATE INDEX IF NOT EXISTS idx_fts_subject ON faculty_timetable_slots(subject_id);
CREATE INDEX IF NOT EXISTS idx_cts_class ON class_timetable_slots(class_id);
CREATE INDEX IF NOT EXISTS idx_cts_day ON class_timetable_slots(day);
CREATE INDEX IF NOT EXISTS idx_cts_staff ON class_timetable_slots(staff_id);
CREATE INDEX IF NOT EXISTS idx_ssa_staff ON staff_subject_assignments(staff_id);
CREATE INDEX IF NOT EXISTS idx_ssa_subject ON staff_subject_assignments(subject_id);
CREATE INDEX IF NOT EXISTS idx_ssa_class ON staff_subject_assignments(class_id);
