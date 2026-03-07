-- College LMS — PostgreSQL Database Schema

-- 1. Departments Table
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Users Table (Students, Staff, HOD)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'staff', 'hod')),
    department_id INT REFERENCES departments(id) ON DELETE SET NULL,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Subjects Table
CREATE TABLE subjects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    department_id INT REFERENCES departments(id) ON DELETE CASCADE,
    staff_id INT REFERENCES users(id) ON DELETE SET NULL,
    semester INT CHECK (semester BETWEEN 1 AND 8),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Attendance Table
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES users(id) ON DELETE CASCADE,
    subject_id INT REFERENCES subjects(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
    marked_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (student_id, subject_id, date)
);

-- 5. Assignments Table
CREATE TABLE assignments (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject_id INT REFERENCES subjects(id) ON DELETE CASCADE,
    due_date TIMESTAMP NOT NULL,
    max_marks INT NOT NULL,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 6. Assignment Submissions Table
CREATE TABLE assignment_submissions (
    id SERIAL PRIMARY KEY,
    assignment_id INT REFERENCES assignments(id) ON DELETE CASCADE,
    student_id INT REFERENCES users(id) ON DELETE CASCADE,
    content TEXT,
    file_url TEXT,
    marks INT,
    feedback TEXT,
    graded_by INT REFERENCES users(id) ON DELETE SET NULL,
    graded_at TIMESTAMP,
    submitted_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (assignment_id, student_id)
);

-- 7. Marks Table
CREATE TABLE marks (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES users(id) ON DELETE CASCADE,
    subject_id INT REFERENCES subjects(id) ON DELETE CASCADE,
    exam_type VARCHAR(50) NOT NULL,
    marks INT NOT NULL,
    max_marks INT NOT NULL,
    entered_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 8. Announcements Table
CREATE TABLE announcements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    department_id INT REFERENCES departments(id) ON DELETE CASCADE,
    target_role VARCHAR(20) CHECK (target_role IN ('student', 'staff', 'hod')),
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 9. Leave Requests Table
CREATE TABLE leaves (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    leave_type VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    remarks TEXT,
    approved_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 10. Study Content Table
CREATE TABLE content (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    subject_id INT REFERENCES subjects(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    content_type VARCHAR(50),
    uploaded_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Initial Seeding (Optional but recommended)
-- Inserting a default Computer Science department and an HOD user
INSERT INTO departments (name) VALUES ('Computer Science Engineering');

-- Password is 'admin123'
INSERT INTO users (name, email, password, role, department_id, phone)
VALUES ('Admin HOD', 'hod@college.edu', '$2a$12$tlUj3p48RvCm.b21k9hWfuzZBcq1d/J0hf0y4jFHrGOsvrz9P4pd2', 'hod', 1, '9000000001');
