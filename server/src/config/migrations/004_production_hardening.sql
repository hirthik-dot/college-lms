-- ============================================================
-- Migration 004: Production Hardening
-- ============================================================

-- 1.1 — Switch to UUID Primary Keys
ALTER TABLE users ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid();
UPDATE users SET uuid = gen_random_uuid() WHERE uuid IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_uuid ON users(uuid);
COMMENT ON COLUMN users.uuid IS 'Use uuid for all new API endpoints';

ALTER TABLE departments ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid();
UPDATE departments SET uuid = gen_random_uuid() WHERE uuid IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_departments_uuid ON departments(uuid);
COMMENT ON COLUMN departments.uuid IS 'Use uuid for all new API endpoints';

ALTER TABLE subjects ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid();
UPDATE subjects SET uuid = gen_random_uuid() WHERE uuid IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_subjects_uuid ON subjects(uuid);
COMMENT ON COLUMN subjects.uuid IS 'Use uuid for all new API endpoints';

ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid();
UPDATE student_profiles SET uuid = gen_random_uuid() WHERE uuid IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_student_profiles_uuid ON student_profiles(uuid);
COMMENT ON COLUMN student_profiles.uuid IS 'Use uuid for all new API endpoints';

ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid();
UPDATE staff_profiles SET uuid = gen_random_uuid() WHERE uuid IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_profiles_uuid ON staff_profiles(uuid);
COMMENT ON COLUMN staff_profiles.uuid IS 'Use uuid for all new API endpoints';

ALTER TABLE subject_enrollments ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid();
UPDATE subject_enrollments SET uuid = gen_random_uuid() WHERE uuid IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_subject_enrollments_uuid ON subject_enrollments(uuid);
COMMENT ON COLUMN subject_enrollments.uuid IS 'Use uuid for all new API endpoints';

ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid();
UPDATE attendance_sessions SET uuid = gen_random_uuid() WHERE uuid IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_sessions_uuid ON attendance_sessions(uuid);
COMMENT ON COLUMN attendance_sessions.uuid IS 'Use uuid for all new API endpoints';

ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid();
UPDATE attendance_records SET uuid = gen_random_uuid() WHERE uuid IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_records_uuid ON attendance_records(uuid);
COMMENT ON COLUMN attendance_records.uuid IS 'Use uuid for all new API endpoints';

ALTER TABLE assignments ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid();
UPDATE assignments SET uuid = gen_random_uuid() WHERE uuid IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_assignments_uuid ON assignments(uuid);
COMMENT ON COLUMN assignments.uuid IS 'Use uuid for all new API endpoints';

ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid();
UPDATE assignment_submissions SET uuid = gen_random_uuid() WHERE uuid IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_assignment_submissions_uuid ON assignment_submissions(uuid);
COMMENT ON COLUMN assignment_submissions.uuid IS 'Use uuid for all new API endpoints';

ALTER TABLE assessments ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid();
UPDATE assessments SET uuid = gen_random_uuid() WHERE uuid IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_assessments_uuid ON assessments(uuid);
COMMENT ON COLUMN assessments.uuid IS 'Use uuid for all new API endpoints';

ALTER TABLE assessment_marks ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid();
UPDATE assessment_marks SET uuid = gen_random_uuid() WHERE uuid IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_assessment_marks_uuid ON assessment_marks(uuid);
COMMENT ON COLUMN assessment_marks.uuid IS 'Use uuid for all new API endpoints';

ALTER TABLE course_content ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid();
UPDATE course_content SET uuid = gen_random_uuid() WHERE uuid IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_course_content_uuid ON course_content(uuid);
COMMENT ON COLUMN course_content.uuid IS 'Use uuid for all new API endpoints';

ALTER TABLE announcements ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid();
UPDATE announcements SET uuid = gen_random_uuid() WHERE uuid IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_announcements_uuid ON announcements(uuid);
COMMENT ON COLUMN announcements.uuid IS 'Use uuid for all new API endpoints';

ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid();
UPDATE leave_requests SET uuid = gen_random_uuid() WHERE uuid IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_leave_requests_uuid ON leave_requests(uuid);
COMMENT ON COLUMN leave_requests.uuid IS 'Use uuid for all new API endpoints';

ALTER TABLE course_plan_uploads ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid();
UPDATE course_plan_uploads SET uuid = gen_random_uuid() WHERE uuid IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_course_plan_uploads_uuid ON course_plan_uploads(uuid);
COMMENT ON COLUMN course_plan_uploads.uuid IS 'Use uuid for all new API endpoints';

ALTER TABLE course_plan_topics ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid();
UPDATE course_plan_topics SET uuid = gen_random_uuid() WHERE uuid IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_course_plan_topics_uuid ON course_plan_topics(uuid);
COMMENT ON COLUMN course_plan_topics.uuid IS 'Use uuid for all new API endpoints';

ALTER TABLE topic_hour_reports ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid();
UPDATE topic_hour_reports SET uuid = gen_random_uuid() WHERE uuid IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_topic_hour_reports_uuid ON topic_hour_reports(uuid);
COMMENT ON COLUMN topic_hour_reports.uuid IS 'Use uuid for all new API endpoints';

ALTER TABLE topic_materials ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid();
UPDATE topic_materials SET uuid = gen_random_uuid() WHERE uuid IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_topic_materials_uuid ON topic_materials(uuid);
COMMENT ON COLUMN topic_materials.uuid IS 'Use uuid for all new API endpoints';

ALTER TABLE student_material_notifications ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid();
UPDATE student_material_notifications SET uuid = gen_random_uuid() WHERE uuid IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_student_material_notifications_uuid ON student_material_notifications(uuid);
COMMENT ON COLUMN student_material_notifications.uuid IS 'Use uuid for all new API endpoints';

ALTER TABLE classes ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid();
UPDATE classes SET uuid = gen_random_uuid() WHERE uuid IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_classes_uuid ON classes(uuid);
COMMENT ON COLUMN classes.uuid IS 'Use uuid for all new API endpoints';

ALTER TABLE staff_subject_assignments ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid();
UPDATE staff_subject_assignments SET uuid = gen_random_uuid() WHERE uuid IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_staff_subject_assignments_uuid ON staff_subject_assignments(uuid);
COMMENT ON COLUMN staff_subject_assignments.uuid IS 'Use uuid for all new API endpoints';

ALTER TABLE faculty_timetable_slots ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid();
UPDATE faculty_timetable_slots SET uuid = gen_random_uuid() WHERE uuid IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_faculty_timetable_slots_uuid ON faculty_timetable_slots(uuid);
COMMENT ON COLUMN faculty_timetable_slots.uuid IS 'Use uuid for all new API endpoints';

ALTER TABLE class_timetable_slots ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid();
UPDATE class_timetable_slots SET uuid = gen_random_uuid() WHERE uuid IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_class_timetable_slots_uuid ON class_timetable_slots(uuid);
COMMENT ON COLUMN class_timetable_slots.uuid IS 'Use uuid for all new API endpoints';

ALTER TABLE timetable_uploads ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid();
UPDATE timetable_uploads SET uuid = gen_random_uuid() WHERE uuid IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_timetable_uploads_uuid ON timetable_uploads(uuid);
COMMENT ON COLUMN timetable_uploads.uuid IS 'Use uuid for all new API endpoints';

-- 1.2 — Add updated_at to ALL tables
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
DROP TRIGGER IF EXISTS set_updated_at ON users;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE departments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
DROP TRIGGER IF EXISTS set_updated_at ON departments;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON departments
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE subjects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
DROP TRIGGER IF EXISTS set_updated_at ON subjects;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON subjects
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
DROP TRIGGER IF EXISTS set_updated_at ON student_profiles;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON student_profiles
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
DROP TRIGGER IF EXISTS set_updated_at ON staff_profiles;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON staff_profiles
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE subject_enrollments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
DROP TRIGGER IF EXISTS set_updated_at ON subject_enrollments;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON subject_enrollments
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
DROP TRIGGER IF EXISTS set_updated_at ON attendance_sessions;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON attendance_sessions
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
DROP TRIGGER IF EXISTS set_updated_at ON attendance_records;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON attendance_records
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE assignments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
DROP TRIGGER IF EXISTS set_updated_at ON assignments;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON assignments
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
DROP TRIGGER IF EXISTS set_updated_at ON assignment_submissions;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON assignment_submissions
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE assessments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
DROP TRIGGER IF EXISTS set_updated_at ON assessments;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON assessments
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE assessment_marks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
DROP TRIGGER IF EXISTS set_updated_at ON assessment_marks;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON assessment_marks
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE course_content ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
DROP TRIGGER IF EXISTS set_updated_at ON course_content;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON course_content
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE announcements ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
DROP TRIGGER IF EXISTS set_updated_at ON announcements;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
DROP TRIGGER IF EXISTS set_updated_at ON leave_requests;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON leave_requests
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE course_plan_uploads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
DROP TRIGGER IF EXISTS set_updated_at ON course_plan_uploads;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON course_plan_uploads
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE course_plan_topics ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
DROP TRIGGER IF EXISTS set_updated_at ON course_plan_topics;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON course_plan_topics
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE topic_hour_reports ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
DROP TRIGGER IF EXISTS set_updated_at ON topic_hour_reports;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON topic_hour_reports
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE topic_materials ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
DROP TRIGGER IF EXISTS set_updated_at ON topic_materials;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON topic_materials
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE student_material_notifications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
DROP TRIGGER IF EXISTS set_updated_at ON student_material_notifications;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON student_material_notifications
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE classes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
DROP TRIGGER IF EXISTS set_updated_at ON classes;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON classes
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE staff_subject_assignments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
DROP TRIGGER IF EXISTS set_updated_at ON staff_subject_assignments;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON staff_subject_assignments
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE faculty_timetable_slots ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
DROP TRIGGER IF EXISTS set_updated_at ON faculty_timetable_slots;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON faculty_timetable_slots
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE class_timetable_slots ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
DROP TRIGGER IF EXISTS set_updated_at ON class_timetable_slots;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON class_timetable_slots
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE timetable_uploads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
DROP TRIGGER IF EXISTS set_updated_at ON timetable_uploads;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON timetable_uploads
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- 1.3 — Add Soft Delete to ALL tables
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_by INTEGER REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(id) WHERE is_deleted = FALSE;
CREATE OR REPLACE VIEW active_users AS SELECT * FROM users WHERE is_deleted = FALSE;

ALTER TABLE departments ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_by INTEGER REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_departments_active ON departments(id) WHERE is_deleted = FALSE;
CREATE OR REPLACE VIEW active_departments AS SELECT * FROM departments WHERE is_deleted = FALSE;

ALTER TABLE subjects ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_by INTEGER REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_subjects_active ON subjects(id) WHERE is_deleted = FALSE;
CREATE OR REPLACE VIEW active_subjects AS SELECT * FROM subjects WHERE is_deleted = FALSE;

ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_by INTEGER REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_active ON student_profiles(id) WHERE is_deleted = FALSE;
CREATE OR REPLACE VIEW active_student_profiles AS SELECT * FROM student_profiles WHERE is_deleted = FALSE;

ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_by INTEGER REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_active ON staff_profiles(id) WHERE is_deleted = FALSE;
CREATE OR REPLACE VIEW active_staff_profiles AS SELECT * FROM staff_profiles WHERE is_deleted = FALSE;

ALTER TABLE subject_enrollments ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_by INTEGER REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_subject_enrollments_active ON subject_enrollments(id) WHERE is_deleted = FALSE;
CREATE OR REPLACE VIEW active_subject_enrollments AS SELECT * FROM subject_enrollments WHERE is_deleted = FALSE;

ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_by INTEGER REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_active ON attendance_sessions(id) WHERE is_deleted = FALSE;
CREATE OR REPLACE VIEW active_attendance_sessions AS SELECT * FROM attendance_sessions WHERE is_deleted = FALSE;

ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_by INTEGER REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_active ON attendance_records(id) WHERE is_deleted = FALSE;
CREATE OR REPLACE VIEW active_attendance_records AS SELECT * FROM attendance_records WHERE is_deleted = FALSE;

ALTER TABLE assignments ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_by INTEGER REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_assignments_active ON assignments(id) WHERE is_deleted = FALSE;
CREATE OR REPLACE VIEW active_assignments AS SELECT * FROM assignments WHERE is_deleted = FALSE;

ALTER TABLE assignment_submissions ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_by INTEGER REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_active ON assignment_submissions(id) WHERE is_deleted = FALSE;
CREATE OR REPLACE VIEW active_assignment_submissions AS SELECT * FROM assignment_submissions WHERE is_deleted = FALSE;

ALTER TABLE assessments ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_by INTEGER REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_assessments_active ON assessments(id) WHERE is_deleted = FALSE;
CREATE OR REPLACE VIEW active_assessments AS SELECT * FROM assessments WHERE is_deleted = FALSE;

ALTER TABLE assessment_marks ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_by INTEGER REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_assessment_marks_active ON assessment_marks(id) WHERE is_deleted = FALSE;
CREATE OR REPLACE VIEW active_assessment_marks AS SELECT * FROM assessment_marks WHERE is_deleted = FALSE;

ALTER TABLE course_content ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_by INTEGER REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_course_content_active ON course_content(id) WHERE is_deleted = FALSE;
CREATE OR REPLACE VIEW active_course_content AS SELECT * FROM course_content WHERE is_deleted = FALSE;

ALTER TABLE announcements ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_by INTEGER REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(id) WHERE is_deleted = FALSE;
CREATE OR REPLACE VIEW active_announcements AS SELECT * FROM announcements WHERE is_deleted = FALSE;

ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_by INTEGER REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_active ON leave_requests(id) WHERE is_deleted = FALSE;
CREATE OR REPLACE VIEW active_leave_requests AS SELECT * FROM leave_requests WHERE is_deleted = FALSE;

ALTER TABLE course_plan_uploads ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_by INTEGER REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_course_plan_uploads_active ON course_plan_uploads(id) WHERE is_deleted = FALSE;
CREATE OR REPLACE VIEW active_course_plan_uploads AS SELECT * FROM course_plan_uploads WHERE is_deleted = FALSE;

ALTER TABLE course_plan_topics ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_by INTEGER REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_course_plan_topics_active ON course_plan_topics(id) WHERE is_deleted = FALSE;
CREATE OR REPLACE VIEW active_course_plan_topics AS SELECT * FROM course_plan_topics WHERE is_deleted = FALSE;

ALTER TABLE topic_hour_reports ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_by INTEGER REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_topic_hour_reports_active ON topic_hour_reports(id) WHERE is_deleted = FALSE;
CREATE OR REPLACE VIEW active_topic_hour_reports AS SELECT * FROM topic_hour_reports WHERE is_deleted = FALSE;

ALTER TABLE topic_materials ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_by INTEGER REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_topic_materials_active ON topic_materials(id) WHERE is_deleted = FALSE;
CREATE OR REPLACE VIEW active_topic_materials AS SELECT * FROM topic_materials WHERE is_deleted = FALSE;

ALTER TABLE student_material_notifications ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_by INTEGER REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_student_material_notifications_active ON student_material_notifications(id) WHERE is_deleted = FALSE;
CREATE OR REPLACE VIEW active_student_material_notifications AS SELECT * FROM student_material_notifications WHERE is_deleted = FALSE;

ALTER TABLE classes ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_by INTEGER REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_classes_active ON classes(id) WHERE is_deleted = FALSE;
CREATE OR REPLACE VIEW active_classes AS SELECT * FROM classes WHERE is_deleted = FALSE;

ALTER TABLE staff_subject_assignments ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_by INTEGER REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_staff_subject_assignments_active ON staff_subject_assignments(id) WHERE is_deleted = FALSE;
CREATE OR REPLACE VIEW active_staff_subject_assignments AS SELECT * FROM staff_subject_assignments WHERE is_deleted = FALSE;

ALTER TABLE faculty_timetable_slots ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_by INTEGER REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_faculty_timetable_slots_active ON faculty_timetable_slots(id) WHERE is_deleted = FALSE;
CREATE OR REPLACE VIEW active_faculty_timetable_slots AS SELECT * FROM faculty_timetable_slots WHERE is_deleted = FALSE;

ALTER TABLE class_timetable_slots ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_by INTEGER REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_class_timetable_slots_active ON class_timetable_slots(id) WHERE is_deleted = FALSE;
CREATE OR REPLACE VIEW active_class_timetable_slots AS SELECT * FROM class_timetable_slots WHERE is_deleted = FALSE;

ALTER TABLE timetable_uploads ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_by INTEGER REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_timetable_uploads_active ON timetable_uploads(id) WHERE is_deleted = FALSE;
CREATE OR REPLACE VIEW active_timetable_uploads AS SELECT * FROM timetable_uploads WHERE is_deleted = FALSE;

-- 1.4 — Add Academic Year to classes table
ALTER TABLE classes 
  ADD COLUMN IF NOT EXISTS academic_year VARCHAR(20) DEFAULT '2025-2026',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

ALTER TABLE classes DROP CONSTRAINT IF EXISTS classes_name_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_classes_name_year 
  ON classes(name, academic_year) WHERE is_deleted = FALSE;

-- 1.5 — Fix topic_hour_reports UNIQUE constraint
ALTER TABLE topic_hour_reports DROP CONSTRAINT IF EXISTS topic_hour_reports_topic_id_key;
ALTER TABLE topic_hour_reports 
  ADD COLUMN IF NOT EXISTS report_status VARCHAR(20) DEFAULT 'active'
    CHECK (report_status IN ('active', 'superseded', 'rejected')),
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS superseded_by INTEGER REFERENCES topic_hour_reports(id),
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS rejected_by INTEGER REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS unq_active_report_per_topic
  ON topic_hour_reports(topic_id) WHERE report_status = 'active';

-- 1.6 — Normalize teaching_methods
CREATE TABLE IF NOT EXISTS teaching_method_options (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS teaching_aid_options (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO teaching_method_options (name) VALUES
  ('Lecture'), ('Discussion'), ('Demonstration'),
  ('Problem Solving'), ('Lab Work'), ('Flipped Classroom'),
  ('Case Study'), ('Group Activity'), ('Seminar'), ('Project Based')
ON CONFLICT (name) DO NOTHING;

INSERT INTO teaching_aid_options (name) VALUES
  ('Whiteboard'), ('PPT/Slides'), ('Video'), ('Lab Equipment'),
  ('Worksheet'), ('Online Platform'), ('Physical Models'),
  ('Projector'), ('Smart Board'), ('Reference Books')
ON CONFLICT (name) DO NOTHING;

CREATE TABLE IF NOT EXISTS topic_teaching_methods (
  topic_id INTEGER NOT NULL REFERENCES course_plan_topics(id) ON DELETE CASCADE,
  method_id INTEGER NOT NULL REFERENCES teaching_method_options(id),
  PRIMARY KEY (topic_id, method_id)
);

CREATE TABLE IF NOT EXISTS topic_teaching_aids (
  topic_id INTEGER NOT NULL REFERENCES course_plan_topics(id) ON DELETE CASCADE,
  aid_id INTEGER NOT NULL REFERENCES teaching_aid_options(id),
  PRIMARY KEY (topic_id, aid_id)
);

CREATE TABLE IF NOT EXISTS report_teaching_methods (
  report_id INTEGER NOT NULL REFERENCES topic_hour_reports(id) ON DELETE CASCADE,
  method_id INTEGER NOT NULL REFERENCES teaching_method_options(id),
  PRIMARY KEY (report_id, method_id)
);

CREATE TABLE IF NOT EXISTS report_teaching_aids (
  report_id INTEGER NOT NULL REFERENCES topic_hour_reports(id) ON DELETE CASCADE,
  aid_id INTEGER NOT NULL REFERENCES teaching_aid_options(id),
  PRIMARY KEY (report_id, aid_id)
);

-- 1.7 — Fix Gmail duplication
ALTER TABLE users ALTER COLUMN gmail SET NOT NULL;

UPDATE staff_profiles sp
SET gmail = u.gmail
FROM users u
WHERE u.id = sp.user_id
  AND sp.gmail IS NOT NULL;

ALTER TABLE staff_profiles DROP COLUMN IF EXISTS gmail;

CREATE OR REPLACE VIEW staff_with_gmail AS
SELECT 
  sp.*,
  u.gmail,
  u.email,
  u.role,
  u.is_active
FROM staff_profiles sp
JOIN users u ON u.id = sp.user_id
WHERE u.is_deleted = FALSE;

-- 1.8 — Add AI verification validation
ALTER TABLE topic_hour_reports 
  ADD CONSTRAINT chk_ai_score_range 
    CHECK (ai_score IS NULL OR (ai_score >= 0 AND ai_score <= 100));

COMMENT ON COLUMN topic_hour_reports.ai_layer_scores IS 
'Expected JSON structure: {
  "text_match": 0-100,
  "ocr_match": 0-100, 
  "scene_match": 0-100,
  "aids_consistency": 0-100,
  "overall": 0-100,
  "details": {
    "ocr_text": "extracted text",
    "tf_labels": ["label1", "label2"],
    "matched_keywords": ["kw1", "kw2"],
    "missing_keywords": ["kw3"]
  }
}';

ALTER TABLE topic_hour_reports ALTER COLUMN ai_layer_scores SET DEFAULT '{}';

-- 1.9 — Create Audit Log System
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  uuid UUID DEFAULT gen_random_uuid(),
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  user_role VARCHAR(50),
  action VARCHAR(50) NOT NULL 
    CHECK (action IN ('CREATE','UPDATE','DELETE','SOFT_DELETE',
                      'RESTORE','LOGIN','LOGOUT','UPLOAD',
                      'APPROVE','REJECT','VIEW_SENSITIVE')),
  table_name VARCHAR(100) NOT NULL,
  record_id VARCHAR(100),
  record_uuid VARCHAR(100),
  old_values JSONB,
  new_values JSONB,
  changed_fields TEXT[],
  ip_address INET,
  user_agent TEXT,
  request_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_table_record ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_uuid ON audit_logs(uuid);

COMMENT ON TABLE audit_logs IS 
'NAAC/NBA compliance audit trail. 
DO NOT DELETE rows from this table.
Archive rows older than 2 years to audit_logs_archive instead.
This table will grow to millions of rows - the indexes handle this.';

CREATE OR REPLACE FUNCTION create_audit_trigger(target_table TEXT)
RETURNS void AS $$
BEGIN
  EXECUTE format('
    DROP TRIGGER IF EXISTS audit_%I ON %I;
    CREATE TRIGGER audit_%I
    AFTER INSERT OR UPDATE OR DELETE ON %I
    FOR EACH ROW EXECUTE FUNCTION log_audit_event();
  ', target_table, target_table, target_table, target_table);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
DECLARE
  v_action VARCHAR(50);
  v_old JSONB;
  v_new JSONB;
  v_changed TEXT[];
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'CREATE';
    v_new := to_jsonb(NEW);
    v_old := NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_deleted = FALSE AND NEW.is_deleted = TRUE THEN
      v_action := 'SOFT_DELETE';
    ELSE
      v_action := 'UPDATE';
    END IF;
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);
    SELECT array_agg(key) INTO v_changed
    FROM jsonb_each(v_old) o
    JOIN jsonb_each(v_new) n USING (key)
    WHERE o.value != n.value;
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'DELETE';
    v_old := to_jsonb(OLD);
    v_new := NULL;
  END IF;

  INSERT INTO audit_logs (
    table_name, record_id, action,
    old_values, new_values, changed_fields,
    created_at
  ) VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id::TEXT, OLD.id::TEXT),
    v_action,
    v_old, v_new, v_changed,
    NOW()
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

SELECT create_audit_trigger('users');
SELECT create_audit_trigger('course_plan_topics');
SELECT create_audit_trigger('topic_hour_reports');
SELECT create_audit_trigger('staff_subject_assignments');
SELECT create_audit_trigger('classes');
SELECT create_audit_trigger('subjects');

-- 1.10 — Add Missing Compound Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_thr_faculty_subject_status
  ON topic_hour_reports(faculty_id, subject_id, report_status)
  WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_thr_ai_full
  ON topic_hour_reports(ai_flagged, ai_low_confidence, ai_verified, ai_score)
  WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_thr_submitted_desc
  ON topic_hour_reports(submitted_at DESC)
  WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_cpt_upload_order
  ON course_plan_topics(upload_id, display_order)
  WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_fts_staff_day_hour
  ON faculty_timetable_slots(staff_id, day, hour_number)
  WHERE is_cross_dept = FALSE;

CREATE INDEX IF NOT EXISTS idx_cts_class_day_hour
  ON class_timetable_slots(class_id, day, hour_number);

CREATE INDEX IF NOT EXISTS idx_ssa_staff_class
  ON staff_subject_assignments(staff_id, class_id)
  WHERE is_deleted = FALSE;

CREATE INDEX IF NOT EXISTS idx_fts_day_hour_time
  ON faculty_timetable_slots(day, hour_number, start_time, end_time);

-- 1.11 — Add Table and Column Comments for Future Developers
COMMENT ON TABLE users IS 
'Base authentication table. All roles (student/staff/hod) have a record here.
Gmail is the login identifier. Do NOT store passwords in plain text.
Use uuid column for all API responses, never expose integer id.';

COMMENT ON TABLE course_plan_topics IS
'Individual topics within a course plan upload.
display_order determines sequence shown to students.
status: pending=not yet taught, completed=hour report submitted.
Use is_deleted=TRUE instead of DELETE for soft delete.';

COMMENT ON TABLE topic_hour_reports IS
'Submitted by staff after teaching a topic.
One ACTIVE report per topic (enforced by partial unique index).
ai_score 0-100: >=70 verified, 40-69 low confidence, <40 flagged.
report_status: active=current, superseded=replaced by newer version.';

COMMENT ON TABLE faculty_timetable_slots IS
'Individual hour slots in a staff member''s weekly timetable.
Populated by PDF upload parser. is_cross_dept=TRUE for ECE classes
(shown in staff view but excluded from attendance tracking).
is_non_teaching=TRUE for TWM/LIB/SEMINAR slots.';

COMMENT ON TABLE audit_logs IS
'Immutable audit trail for NAAC/NBA compliance.
NEVER delete or update rows in this table.
Archive to audit_logs_archive after 2 years.
user_id may be NULL for system-generated events.';

COMMENT ON COLUMN course_plan_topics.co_bloom IS
'Combined CO (Course Outcome) and Bloom taxonomy level.
Format: "CO1-L2" where L1=Remember, L2=Understand, L3=Apply,
L4=Analyze, L5=Evaluate, L6=Create';

COMMENT ON COLUMN faculty_timetable_slots.practical_pair_hour IS
'For practical slots that span 2 hours, stores the paired hour number.
Example: if hour 3 and 4 are a practical pair,
hour 3 has practical_pair_hour=4 and hour 4 has practical_pair_hour=3';

COMMENT ON COLUMN topic_hour_reports.ai_score IS
'AI verification score 0-100. 
>=70: Verified (green), 40-69: Low confidence (orange), <40: Flagged (red).
NULL means verification was not run or failed.';

-- 1.12 — Create Helper Functions for Common Queries
CREATE OR REPLACE FUNCTION get_current_slot(p_staff_id INTEGER)
RETURNS TABLE (
  slot_id INTEGER,
  subject_name VARCHAR,
  subject_code VARCHAR,
  class_name VARCHAR,
  hour_number INTEGER,
  start_time TIME,
  end_time TIME,
  slot_type slot_type,
  is_non_teaching BOOLEAN
) AS $$
DECLARE
  v_day day_of_week;
  v_time TIME;
BEGIN
  v_day := INITCAP(TO_CHAR(NOW(), 'Day'))::day_of_week;
  v_time := NOW()::TIME;
  
  RETURN QUERY
  SELECT 
    fts.id,
    sub.name::VARCHAR,
    sub.code::VARCHAR,
    c.name::VARCHAR,
    fts.hour_number,
    fts.start_time,
    fts.end_time,
    fts.slot_type,
    fts.is_non_teaching
  FROM faculty_timetable_slots fts
  LEFT JOIN subjects sub ON sub.id = fts.subject_id
  LEFT JOIN classes c ON c.id = fts.class_id
  WHERE fts.staff_id = p_staff_id
    AND fts.day = v_day
    AND fts.start_time <= v_time
    AND fts.end_time >= v_time
    AND fts.academic_year = '2025-2026'
    AND fts.semester = 'ODD'
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_staff_workload(p_staff_id INTEGER)
RETURNS TABLE (
  total_hours_per_week BIGINT,
  theory_hours BIGINT,
  practical_hours BIGINT,
  non_teaching_hours BIGINT,
  unique_subjects BIGINT,
  unique_classes BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_hours_per_week,
    COUNT(*) FILTER (WHERE slot_type = 'theory') as theory_hours,
    COUNT(*) FILTER (WHERE slot_type = 'practical') as practical_hours,
    COUNT(*) FILTER (WHERE is_non_teaching = TRUE) as non_teaching_hours,
    COUNT(DISTINCT subject_id) as unique_subjects,
    COUNT(DISTINCT class_id) as unique_classes
  FROM faculty_timetable_slots
  WHERE staff_id = p_staff_id
    AND academic_year = '2025-2026'
    AND semester = 'ODD'
    AND is_deleted = FALSE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_course_plan_progress(p_upload_id INTEGER)
RETURNS TABLE (
  total_topics INTEGER,
  completed_topics INTEGER,
  pending_topics INTEGER,
  completion_percentage NUMERIC,
  total_planned_hours INTEGER,
  completed_hours INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER as total_topics,
    COUNT(*) FILTER (WHERE status = 'completed')::INTEGER as completed_topics,
    COUNT(*) FILTER (WHERE status = 'pending')::INTEGER as pending_topics,
    ROUND(
      COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC / 
      NULLIF(COUNT(*), 0) * 100, 2
    ) as completion_percentage,
    SUM(periods_required)::INTEGER as total_planned_hours,
    SUM(periods_required) FILTER (WHERE status = 'completed')::INTEGER as completed_hours
  FROM course_plan_topics
  WHERE upload_id = p_upload_id
    AND is_deleted = FALSE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION soft_delete(
  p_table TEXT,
  p_id INTEGER,
  p_deleted_by INTEGER
) RETURNS BOOLEAN AS $$
BEGIN
  EXECUTE format(
    'UPDATE %I SET 
      is_deleted = TRUE, 
      deleted_at = NOW(), 
      deleted_by = $1
     WHERE id = $2 AND is_deleted = FALSE',
    p_table
  ) USING p_deleted_by, p_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 1.13 — Create Useful Views for Common Dashboard Queries
CREATE OR REPLACE VIEW hod_dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM users WHERE role = 'staff' AND is_deleted = FALSE) as total_staff,
  (SELECT COUNT(*) FROM users WHERE role = 'student' AND is_deleted = FALSE) as total_students,
  (SELECT COUNT(*) FROM classes WHERE is_deleted = FALSE AND is_active = TRUE) as total_classes,
  (SELECT COUNT(*) FROM subjects WHERE is_deleted = FALSE) as total_subjects,
  (SELECT COUNT(*) FROM topic_hour_reports 
   WHERE ai_flagged = TRUE AND ai_manually_reviewed = FALSE 
   AND is_deleted = FALSE) as pending_flagged_reports,
  (SELECT COUNT(*) FROM topic_hour_reports 
   WHERE ai_low_confidence = TRUE AND is_deleted = FALSE) as low_confidence_reports,
  (SELECT uploaded_at FROM timetable_uploads 
   WHERE status = 'success' ORDER BY uploaded_at DESC LIMIT 1) as last_timetable_upload;

CREATE OR REPLACE VIEW staff_course_plan_summary AS
SELECT
  cpu.faculty_id,
  u.name as faculty_name,
  sub.name as subject_name,
  sub.code as subject_code,
  c.name as class_name,
  cpu.id as upload_id,
  cpu.academic_year,
  COUNT(cpt.id) as total_topics,
  COUNT(cpt.id) FILTER (WHERE cpt.status = 'completed') as completed_topics,
  ROUND(
    COUNT(cpt.id) FILTER (WHERE cpt.status = 'completed')::NUMERIC /
    NULLIF(COUNT(cpt.id), 0) * 100, 1
  ) as completion_pct,
  COUNT(thr.id) FILTER (WHERE thr.ai_flagged = TRUE) as flagged_reports,
  COUNT(thr.id) FILTER (WHERE thr.ai_low_confidence = TRUE) as low_conf_reports
FROM course_plan_uploads cpu
JOIN users u ON u.id = cpu.faculty_id
JOIN subjects sub ON sub.id = cpu.subject_id
LEFT JOIN staff_subject_assignments ssa 
  ON ssa.staff_id = cpu.faculty_id AND ssa.subject_id = cpu.subject_id
LEFT JOIN classes c ON c.id = ssa.class_id
LEFT JOIN course_plan_topics cpt 
  ON cpt.upload_id = cpu.id AND cpt.is_deleted = FALSE
LEFT JOIN topic_hour_reports thr 
  ON thr.topic_id = cpt.id AND thr.is_deleted = FALSE
WHERE cpu.is_active = TRUE AND cpu.is_deleted = FALSE
GROUP BY cpu.faculty_id, u.name, sub.name, sub.code, c.name, cpu.id, cpu.academic_year;

CREATE OR REPLACE VIEW ai_verification_summary AS
SELECT
  thr.id as report_id,
  thr.uuid as report_uuid,
  cpt.topic_name,
  cpt.unit_name,
  sub.name as subject_name,
  sub.code as subject_code,
  u.name as faculty_name,
  c.name as class_name,
  thr.ai_score,
  thr.ai_verified,
  thr.ai_flagged,
  thr.ai_low_confidence,
  thr.ai_reason,
  thr.ai_layer_scores,
  thr.ai_manually_reviewed,
  thr.staff_confirmed_flag,
  thr.submitted_at,
  CASE 
    WHEN thr.ai_score >= 70 THEN 'verified'
    WHEN thr.ai_score >= 40 THEN 'low_confidence'
    WHEN thr.ai_score < 40 THEN 'flagged'
    ELSE 'not_verified'
  END as verification_status
FROM topic_hour_reports thr
JOIN course_plan_topics cpt ON cpt.id = thr.topic_id
JOIN subjects sub ON sub.id = thr.subject_id
JOIN users u ON u.id = thr.faculty_id
LEFT JOIN staff_subject_assignments ssa 
  ON ssa.staff_id = thr.faculty_id AND ssa.subject_id = thr.subject_id
LEFT JOIN classes c ON c.id = ssa.class_id
WHERE thr.is_deleted = FALSE
  AND thr.report_status = 'active';

-- VERIFICATION QUERIES
DO $$
DECLARE
  v_errors TEXT[] := '{}';
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'uuid'
  ) THEN
    v_errors := v_errors || 'FAIL: users.uuid column missing';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'set_updated_at' AND event_object_table = 'users'
  ) THEN
    v_errors := v_errors || 'FAIL: updated_at trigger missing on users';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'is_deleted'
  ) THEN
    v_errors := v_errors || 'FAIL: is_deleted column missing from users';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'audit_logs'
  ) THEN
    v_errors := v_errors || 'FAIL: audit_logs table missing';
  END IF;
  
  IF (SELECT COUNT(*) FROM teaching_method_options) < 5 THEN
    v_errors := v_errors || 'FAIL: teaching_method_options not seeded';
  END IF;
  
  IF array_length(v_errors, 1) > 0 THEN
    RAISE EXCEPTION 'Migration verification FAILED: %', 
      array_to_string(v_errors, E'\n');
  ELSE
    RAISE NOTICE '✅ Migration 004 verified successfully!';
    RAISE NOTICE '✅ UUID columns: present';
    RAISE NOTICE '✅ Soft delete: present';
    RAISE NOTICE '✅ Audit logs: present';
    RAISE NOTICE '✅ Updated_at triggers: present';
    RAISE NOTICE '✅ Teaching method lookup tables: seeded';
  END IF;
END $$;
