-- TABLE 1: course_plan_uploads
CREATE TABLE IF NOT EXISTS course_plan_uploads (
    id SERIAL PRIMARY KEY,
    faculty_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    original_filename VARCHAR(500) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    academic_year VARCHAR(50),
    subject_code VARCHAR(50),
    subject_name VARCHAR(500),
    total_theory_hours INTEGER DEFAULT 0,
    total_lab_hours INTEGER DEFAULT 0,
    uploaded_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- UNIQUE(faculty_id, subject_id) WHERE is_active = true
CREATE UNIQUE INDEX IF NOT EXISTS unq_active_course_plan_upload 
ON course_plan_uploads (faculty_id, subject_id) WHERE is_active = true;

-- TABLE 2: course_plan_topics
CREATE TABLE IF NOT EXISTS course_plan_topics (
    id SERIAL PRIMARY KEY,
    upload_id INTEGER NOT NULL REFERENCES course_plan_uploads(id) ON DELETE CASCADE,
    faculty_id INTEGER NOT NULL REFERENCES users(id),
    subject_id INTEGER NOT NULL REFERENCES subjects(id),
    unit_name VARCHAR(500) NOT NULL,
    unit_target_hours INTEGER DEFAULT 0,
    sno INTEGER NOT NULL,
    periods_required INTEGER DEFAULT 1,
    topic_name TEXT NOT NULL,
    reference_book VARCHAR(500),
    teaching_method TEXT,
    co_bloom VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    display_order INTEGER NOT NULL,
    completed_at TIMESTAMP
);

-- TABLE 3: topic_hour_reports
CREATE TABLE IF NOT EXISTS topic_hour_reports (
    id SERIAL PRIMARY KEY,
    topic_id INTEGER NOT NULL UNIQUE REFERENCES course_plan_topics(id),
    faculty_id INTEGER NOT NULL REFERENCES users(id),
    subject_id INTEGER NOT NULL REFERENCES subjects(id),
    what_was_covered TEXT NOT NULL,
    proof_image_url VARCHAR(500) NOT NULL,
    submitted_at TIMESTAMP DEFAULT NOW()
);

-- TABLE 4: topic_materials
CREATE TABLE IF NOT EXISTS topic_materials (
    id SERIAL PRIMARY KEY,
    topic_id INTEGER NOT NULL REFERENCES course_plan_topics(id) ON DELETE CASCADE,
    faculty_id INTEGER NOT NULL REFERENCES users(id),
    subject_id INTEGER NOT NULL REFERENCES subjects(id),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    material_type VARCHAR(20) CHECK (material_type IN ('pdf', 'ppt', 'doc', 'video', 'link', 'image', 'other')),
    file_url VARCHAR(500) NOT NULL,
    is_released BOOLEAN DEFAULT false,
    released_at TIMESTAMP,
    added_when VARCHAR(20) DEFAULT 'pre_linked' CHECK (added_when IN ('pre_linked', 'at_submission')),
    uploaded_at TIMESTAMP DEFAULT NOW()
);

-- TABLE 5: student_material_notifications
CREATE TABLE IF NOT EXISTS student_material_notifications (
    id SERIAL PRIMARY KEY,
    topic_id INTEGER NOT NULL REFERENCES course_plan_topics(id),
    student_id INTEGER NOT NULL REFERENCES users(id),
    material_id INTEGER NOT NULL REFERENCES topic_materials(id),
    notified_at TIMESTAMP DEFAULT NOW(),
    notification_type VARCHAR(20) DEFAULT 'in_app',
    is_read BOOLEAN DEFAULT false
);

-- Additional non-unique Indexes on frequently queried columns and foreign keys

-- course_plan_uploads
CREATE INDEX IF NOT EXISTS idx_cpu_faculty_id ON course_plan_uploads(faculty_id);
CREATE INDEX IF NOT EXISTS idx_cpu_subject_id ON course_plan_uploads(subject_id);

-- course_plan_topics
CREATE INDEX IF NOT EXISTS idx_cpt_upload_id ON course_plan_topics(upload_id);
CREATE INDEX IF NOT EXISTS idx_cpt_faculty_id ON course_plan_topics(faculty_id);
CREATE INDEX IF NOT EXISTS idx_cpt_subject_id ON course_plan_topics(subject_id);
CREATE INDEX IF NOT EXISTS idx_cpt_status ON course_plan_topics(status);

-- topic_hour_reports
CREATE INDEX IF NOT EXISTS idx_thr_topic_id ON topic_hour_reports(topic_id);
CREATE INDEX IF NOT EXISTS idx_thr_faculty_id ON topic_hour_reports(faculty_id);
CREATE INDEX IF NOT EXISTS idx_thr_subject_id ON topic_hour_reports(subject_id);

-- topic_materials
CREATE INDEX IF NOT EXISTS idx_tm_topic_id ON topic_materials(topic_id);
CREATE INDEX IF NOT EXISTS idx_tm_faculty_id ON topic_materials(faculty_id);
CREATE INDEX IF NOT EXISTS idx_tm_subject_id ON topic_materials(subject_id);
CREATE INDEX IF NOT EXISTS idx_tm_is_released ON topic_materials(is_released);

-- student_material_notifications
CREATE INDEX IF NOT EXISTS idx_smn_topic_id ON student_material_notifications(topic_id);
CREATE INDEX IF NOT EXISTS idx_smn_student_id ON student_material_notifications(student_id);
CREATE INDEX IF NOT EXISTS idx_smn_material_id ON student_material_notifications(material_id);
CREATE INDEX IF NOT EXISTS idx_smn_is_read ON student_material_notifications(is_read);
