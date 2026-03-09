-- ============================================================
-- College LMS — Complete PostgreSQL Database Schema
-- Generated: 2026-03-07
-- ============================================================
-- Run this file against a fresh database:
--   psql -U postgres -d college_lms -f schema.sql
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 0. DROP existing objects (for dev re-runs)
-- ────────────────────────────────────────────────────────────
DROP TABLE IF EXISTS leave_requests        CASCADE;
DROP TABLE IF EXISTS announcements         CASCADE;
DROP TABLE IF EXISTS course_content        CASCADE;
DROP TABLE IF EXISTS assessment_marks      CASCADE;
DROP TABLE IF EXISTS assessments           CASCADE;
DROP TABLE IF EXISTS assignment_submissions CASCADE;
DROP TABLE IF EXISTS assignments           CASCADE;
DROP TABLE IF EXISTS attendance_records    CASCADE;
DROP TABLE IF EXISTS attendance_sessions   CASCADE;
DROP TABLE IF EXISTS subject_enrollments   CASCADE;
DROP TABLE IF EXISTS staff_profiles        CASCADE;
DROP TABLE IF EXISTS student_profiles      CASCADE;
DROP TABLE IF EXISTS subjects              CASCADE;
DROP TABLE IF EXISTS departments           CASCADE;
DROP TABLE IF EXISTS users                 CASCADE;

DROP TYPE IF EXISTS user_role              CASCADE;
DROP TYPE IF EXISTS attendance_status      CASCADE;
DROP TYPE IF EXISTS content_type           CASCADE;
DROP TYPE IF EXISTS announcement_audience  CASCADE;
DROP TYPE IF EXISTS leave_type             CASCADE;
DROP TYPE IF EXISTS leave_status           CASCADE;

-- ────────────────────────────────────────────────────────────
-- 0b. Custom ENUM types
-- ────────────────────────────────────────────────────────────
CREATE TYPE user_role             AS ENUM ('student', 'staff', 'hod');
CREATE TYPE attendance_status     AS ENUM ('present', 'absent', 'late');
CREATE TYPE content_type          AS ENUM ('pdf', 'ppt', 'video', 'link', 'doc');
CREATE TYPE announcement_audience AS ENUM ('all', 'students', 'staff');
CREATE TYPE leave_type            AS ENUM ('casual', 'medical', 'duty', 'other');
CREATE TYPE leave_status          AS ENUM ('pending', 'approved', 'rejected');

-- ============================================================
-- 1. USERS
-- ============================================================
CREATE TABLE users (
    id                SERIAL        PRIMARY KEY,
    username          VARCHAR(100)  UNIQUE NOT NULL,
    email             VARCHAR(255)  UNIQUE NOT NULL,
    password_hash     VARCHAR(255)  NOT NULL,
    role              user_role     NOT NULL,
    full_name         VARCHAR(255)  NOT NULL,
    profile_photo_url VARCHAR(500),
    department_id     INT,                          -- set via FK after departments created
    phone             VARCHAR(20),
    is_active         BOOLEAN       DEFAULT true,
    created_at        TIMESTAMP     DEFAULT NOW(),
    updated_at        TIMESTAMP     DEFAULT NOW()
);

-- ============================================================
-- 2. DEPARTMENTS
-- ============================================================
CREATE TABLE departments (
    id          SERIAL        PRIMARY KEY,
    name        VARCHAR(255)  NOT NULL,
    code        VARCHAR(20)   UNIQUE NOT NULL,
    hod_id      INT           REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMP     DEFAULT NOW()
);

-- Now add the FK from users → departments
ALTER TABLE users
    ADD CONSTRAINT fk_users_department
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;

-- ============================================================
-- 3. SUBJECTS
-- ============================================================
CREATE TABLE subjects (
    id              SERIAL        PRIMARY KEY,
    name            VARCHAR(255)  NOT NULL,
    code            VARCHAR(50)   UNIQUE NOT NULL,
    semester        INT           CHECK (semester BETWEEN 1 AND 8),
    academic_year   VARCHAR(20),
    department_id   INT           REFERENCES departments(id) ON DELETE CASCADE,
    staff_id        INT           REFERENCES users(id) ON DELETE SET NULL,
    is_active       BOOLEAN       DEFAULT true,
    created_at      TIMESTAMP     DEFAULT NOW()
);

-- ============================================================
-- 4. STUDENT PROFILES
-- ============================================================
CREATE TABLE student_profiles (
    id              SERIAL        PRIMARY KEY,
    user_id         INT           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    roll_number     VARCHAR(50)   UNIQUE NOT NULL,
    batch           VARCHAR(20),
    year_of_study   INT           CHECK (year_of_study BETWEEN 1 AND 5),
    phone           VARCHAR(20),
    parent_phone    VARCHAR(20),
    CONSTRAINT uq_student_user UNIQUE (user_id)
);

-- ============================================================
-- 5. STAFF PROFILES
-- ============================================================
CREATE TABLE staff_profiles (
    id              SERIAL        PRIMARY KEY,
    user_id         INT           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    employee_id     VARCHAR(50)   UNIQUE NOT NULL,
    designation     VARCHAR(100),
    phone           VARCHAR(20),
    CONSTRAINT uq_staff_user UNIQUE (user_id)
);

-- ============================================================
-- 6. SUBJECT ENROLLMENTS
-- ============================================================
CREATE TABLE subject_enrollments (
    id              SERIAL        PRIMARY KEY,
    subject_id      INT           NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    student_id      INT           NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    enrolled_at     TIMESTAMP     DEFAULT NOW(),
    CONSTRAINT uq_enrollment UNIQUE (subject_id, student_id)
);

-- ============================================================
-- 7. ATTENDANCE SESSIONS
-- ============================================================
CREATE TABLE attendance_sessions (
    id              SERIAL        PRIMARY KEY,
    subject_id      INT           NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    staff_id        INT           NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    session_date    DATE          NOT NULL,
    session_type    VARCHAR(20)   NOT NULL CHECK (session_type IN ('lecture', 'lab', 'tutorial')),
    created_at      TIMESTAMP     DEFAULT NOW()
);

-- ============================================================
-- 8. ATTENDANCE RECORDS
-- ============================================================
CREATE TABLE attendance_records (
    id              SERIAL             PRIMARY KEY,
    session_id      INT                NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id      INT                NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status          attendance_status  NOT NULL,
    marked_at       TIMESTAMP          DEFAULT NOW(),
    CONSTRAINT uq_attendance UNIQUE (session_id, student_id)
);

-- ============================================================
-- 9. ASSIGNMENTS
-- ============================================================
CREATE TABLE assignments (
    id                  SERIAL        PRIMARY KEY,
    subject_id          INT           NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    title               VARCHAR(255)  NOT NULL,
    description         TEXT,
    due_date            TIMESTAMP     NOT NULL,
    max_marks           INT           NOT NULL,
    allowed_file_types  VARCHAR(255),
    created_by          INT           REFERENCES users(id) ON DELETE SET NULL,
    is_active           BOOLEAN       DEFAULT true,
    created_at          TIMESTAMP     DEFAULT NOW()
);

-- ============================================================
-- 10. ASSIGNMENT SUBMISSIONS
-- ============================================================
CREATE TABLE assignment_submissions (
    id              SERIAL        PRIMARY KEY,
    assignment_id   INT           NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id      INT           NOT NULL REFERENCES users(id)      ON DELETE CASCADE,
    file_url        VARCHAR(500),
    submitted_at    TIMESTAMP     DEFAULT NOW(),
    marks_obtained  DECIMAL(5,2),
    feedback        TEXT,
    graded_by       INT           REFERENCES users(id) ON DELETE SET NULL,
    graded_at       TIMESTAMP,
    is_late         BOOLEAN       DEFAULT false,
    CONSTRAINT uq_submission UNIQUE (assignment_id, student_id)
);

-- ============================================================
-- 11. ASSESSMENTS
-- ============================================================
CREATE TABLE assessments (
    id               SERIAL        PRIMARY KEY,
    subject_id       INT           NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    name             VARCHAR(255)  NOT NULL,
    max_marks        INT           NOT NULL,
    assessment_type  VARCHAR(30)   NOT NULL CHECK (assessment_type IN ('internal', 'midterm', 'practical', 'viva')),
    conducted_date   DATE,
    created_by       INT           REFERENCES users(id) ON DELETE SET NULL,
    created_at       TIMESTAMP     DEFAULT NOW()
);

-- ============================================================
-- 12. ASSESSMENT MARKS
-- ============================================================
CREATE TABLE assessment_marks (
    id              SERIAL        PRIMARY KEY,
    assessment_id   INT           NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    student_id      INT           NOT NULL REFERENCES users(id)      ON DELETE CASCADE,
    marks_obtained  DECIMAL(5,2),
    is_published    BOOLEAN       DEFAULT false,
    entered_by      INT           REFERENCES users(id) ON DELETE SET NULL,
    entered_at      TIMESTAMP     DEFAULT NOW(),
    CONSTRAINT uq_assessment_mark UNIQUE (assessment_id, student_id)
);

-- ============================================================
-- 13. COURSE CONTENT
-- ============================================================
CREATE TABLE course_content (
    id              SERIAL        PRIMARY KEY,
    subject_id      INT           NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    title           VARCHAR(255)  NOT NULL,
    description     TEXT,
    content_type    content_type  NOT NULL,
    file_url        VARCHAR(500),
    week_number     INT,
    topic           VARCHAR(255),
    uploaded_by     INT           REFERENCES users(id) ON DELETE SET NULL,
    uploaded_at     TIMESTAMP     DEFAULT NOW(),
    is_visible      BOOLEAN       DEFAULT true
);

-- ============================================================
-- 14. ANNOUNCEMENTS
-- ============================================================
CREATE TABLE announcements (
    id               SERIAL                 PRIMARY KEY,
    title            VARCHAR(255)           NOT NULL,
    body             TEXT                   NOT NULL,
    target_audience  announcement_audience  NOT NULL DEFAULT 'all',
    posted_by        INT                    REFERENCES users(id) ON DELETE SET NULL,
    subject_id       INT                    REFERENCES subjects(id) ON DELETE CASCADE,
    department_id    INT                    REFERENCES departments(id) ON DELETE CASCADE,
    is_pinned        BOOLEAN                DEFAULT false,
    send_email       BOOLEAN                DEFAULT false,
    created_at       TIMESTAMP              DEFAULT NOW()
);

-- ============================================================
-- 15. LEAVE REQUESTS
-- ============================================================
CREATE TABLE leave_requests (
    id              SERIAL        PRIMARY KEY,
    staff_id        INT           NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    leave_type      leave_type    NOT NULL,
    start_date      DATE          NOT NULL,
    end_date        DATE          NOT NULL,
    reason          TEXT,
    document_url    VARCHAR(500),
    status          leave_status  DEFAULT 'pending',
    reviewed_by     INT           REFERENCES users(id) ON DELETE SET NULL,
    review_comment  TEXT,
    created_at      TIMESTAMP     DEFAULT NOW(),
    reviewed_at     TIMESTAMP,
    CONSTRAINT chk_leave_dates CHECK (end_date >= start_date)
);


-- ============================================================
-- INDEXES  (performance)
-- ============================================================

-- users
CREATE INDEX idx_users_role          ON users(role);
CREATE INDEX idx_users_department    ON users(department_id);
CREATE INDEX idx_users_is_active     ON users(is_active);

-- departments
CREATE INDEX idx_departments_hod     ON departments(hod_id);

-- subjects
CREATE INDEX idx_subjects_staff      ON subjects(staff_id);
CREATE INDEX idx_subjects_department ON subjects(department_id);
CREATE INDEX idx_subjects_semester   ON subjects(semester);
CREATE INDEX idx_subjects_active     ON subjects(is_active);

-- student_profiles
CREATE INDEX idx_stuprofile_user     ON student_profiles(user_id);

-- staff_profiles
CREATE INDEX idx_staffprofile_user   ON staff_profiles(user_id);

-- subject_enrollments
CREATE INDEX idx_enrollment_subject  ON subject_enrollments(subject_id);
CREATE INDEX idx_enrollment_student  ON subject_enrollments(student_id);

-- attendance_sessions
CREATE INDEX idx_attsess_subject     ON attendance_sessions(subject_id);
CREATE INDEX idx_attsess_staff       ON attendance_sessions(staff_id);
CREATE INDEX idx_attsess_date        ON attendance_sessions(session_date);

-- attendance_records
CREATE INDEX idx_attrec_session      ON attendance_records(session_id);
CREATE INDEX idx_attrec_student      ON attendance_records(student_id);
CREATE INDEX idx_attrec_status       ON attendance_records(status);

-- assignments
CREATE INDEX idx_assign_subject      ON assignments(subject_id);
CREATE INDEX idx_assign_creator      ON assignments(created_by);
CREATE INDEX idx_assign_duedate      ON assignments(due_date);

-- assignment_submissions
CREATE INDEX idx_asub_assignment     ON assignment_submissions(assignment_id);
CREATE INDEX idx_asub_student        ON assignment_submissions(student_id);

-- assessments
CREATE INDEX idx_assessment_subject  ON assessments(subject_id);
CREATE INDEX idx_assessment_type     ON assessments(assessment_type);

-- assessment_marks
CREATE INDEX idx_amark_assessment    ON assessment_marks(assessment_id);
CREATE INDEX idx_amark_student       ON assessment_marks(student_id);

-- course_content
CREATE INDEX idx_content_subject     ON course_content(subject_id);
CREATE INDEX idx_content_week        ON course_content(week_number);
CREATE INDEX idx_content_visible     ON course_content(is_visible);

-- announcements
CREATE INDEX idx_announce_audience   ON announcements(target_audience);
CREATE INDEX idx_announce_subject    ON announcements(subject_id);
CREATE INDEX idx_announce_dept       ON announcements(department_id);
CREATE INDEX idx_announce_pinned     ON announcements(is_pinned);
CREATE INDEX idx_announce_posted_by  ON announcements(posted_by);

-- leave_requests
CREATE INDEX idx_leave_staff         ON leave_requests(staff_id);
CREATE INDEX idx_leave_status        ON leave_requests(status);
CREATE INDEX idx_leave_reviewer      ON leave_requests(reviewed_by);
CREATE INDEX idx_leave_dates         ON leave_requests(start_date, end_date);


-- ============================================================
-- TRIGGER: auto-update updated_at on users
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- Done!  Schema ready.
-- Next step:  psql -U postgres -d college_lms -f seed.sql
-- ============================================================

-- Run migrations/001_course_plan.sql for Course Plan feature
