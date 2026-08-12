-- MySQL Database Schema DDL
-- For CampusCore Smart Campus & AI Mentor Modules
-- Contains both College Management Tables and CampusCore AI Mentor tables (c360_*)

-- CREATE DATABASE IF NOT EXISTS campuscore;
-- USE campuscore;

-- ==========================================
-- 1. COLLEGE MANAGEMENT TABLES
-- ==========================================

-- Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    code VARCHAR(10) NOT NULL UNIQUE,
    head_of_dept VARCHAR(150),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Courses Table
CREATE TABLE IF NOT EXISTS courses (
    id VARCHAR(36) PRIMARY KEY,
    department_id VARCHAR(36),
    name VARCHAR(200) NOT NULL,
    code VARCHAR(15) NOT NULL UNIQUE,
    degree VARCHAR(50) NOT NULL, -- BE, BTech, MTech, MBA, MCA, PhD
    credits INT NOT NULL DEFAULT 4,
    duration_years INT NOT NULL DEFAULT 4,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Faculty Profiles Table
CREATE TABLE IF NOT EXISTS faculty (
    id VARCHAR(36) PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(20),
    department_id VARCHAR(36),
    designation VARCHAR(100) DEFAULT 'Assistant Professor',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Students Details Table
CREATE TABLE IF NOT EXISTS students (
    id VARCHAR(36) PRIMARY KEY,
    rfid_uid VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(20),
    parent_name VARCHAR(150),
    parent_email VARCHAR(150),
    parent_phone VARCHAR(20),
    parent_user_id VARCHAR(36),
    class_id VARCHAR(36),
    enrollment_status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Events & Announcements Table
CREATE TABLE IF NOT EXISTS events (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    event_date DATETIME NOT NULL,
    location VARCHAR(200) DEFAULT 'Main Campus Auditorium',
    image_url VARCHAR(500),
    posted_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Placements Table
CREATE TABLE IF NOT EXISTS placements (
    id VARCHAR(36) PRIMARY KEY,
    student_name VARCHAR(150) NOT NULL,
    department_id VARCHAR(36),
    company_name VARCHAR(150) NOT NULL,
    package_lpa DECIMAL(5, 2) NOT NULL,
    placed_year INT NOT NULL,
    job_role VARCHAR(150) DEFAULT 'Software Engineer Intern',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Login / Audit Log table
CREATE TABLE IF NOT EXISTS login (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'success'
) ENGINE=InnoDB;


-- ==========================================
-- 2. CAMPUSCORE AI MENTOR TABLES
-- ==========================================

-- C360 Users (Sync profile for AI module)
CREATE TABLE IF NOT EXISTS c360_users (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL,
    target_career VARCHAR(150) DEFAULT 'Software Engineer',
    preferred_level VARCHAR(20) DEFAULT 'Beginner',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Quiz Scores Table (0-50 pts)
CREATE TABLE IF NOT EXISTS c360_quiz_scores (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL,
    score INT NOT NULL,
    target_career VARCHAR(150) NOT NULL,
    answers_json JSON NOT NULL, -- MySQL 5.7+ JSON datatype
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Resume Skills Table (0-30 pts)
CREATE TABLE IF NOT EXISTS c360_resume_skills (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL,
    skills_json JSON NOT NULL,
    score INT NOT NULL,
    file_name VARCHAR(255) DEFAULT 'pasted_text.txt',
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Skill Gap Scores Table (0-20 pts)
CREATE TABLE IF NOT EXISTS c360_skill_gap (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL,
    target_career VARCHAR(150) NOT NULL,
    missing_skills_json JSON NOT NULL,
    gap_score INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Performance Scores Table (Total 0-100 pts)
CREATE TABLE IF NOT EXISTS c360_performance_scores (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL UNIQUE,
    quiz_score INT NOT NULL DEFAULT 0,
    resume_score INT NOT NULL DEFAULT 0,
    skill_gap_score INT NOT NULL DEFAULT 0,
    total_score INT GENERATED ALWAYS AS (quiz_score + resume_score + skill_gap_score) STORED,
    classification VARCHAR(20) NOT NULL, -- Beginner, Intermediate, Advanced
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Roadmap Table
CREATE TABLE IF NOT EXISTS c360_roadmap (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL,
    target_career VARCHAR(150) NOT NULL,
    level VARCHAR(20) NOT NULL,
    steps_json JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY (student_id, target_career),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Progress Table
CREATE TABLE IF NOT EXISTS c360_progress (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) NOT NULL UNIQUE,
    completed_steps_json JSON NOT NULL,
    percentage INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Admin & Placement Logs Table
CREATE TABLE IF NOT EXISTS c360_admin_logs (
    id VARCHAR(36) PRIMARY KEY,
    action_type VARCHAR(100) NOT NULL,
    student_id VARCHAR(36),
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Add indexes
CREATE INDEX idx_c360_quiz_student ON c360_quiz_scores(student_id);
CREATE INDEX idx_c360_resume_student ON c360_resume_skills(student_id);
CREATE INDEX idx_c360_perf_student ON c360_performance_scores(student_id);
CREATE INDEX idx_c360_road_student ON c360_roadmap(student_id);

-- Job Postings Table
CREATE TABLE IF NOT EXISTS c360_jobs (
    id VARCHAR(36) PRIMARY KEY,
    company_name VARCHAR(150) NOT NULL,
    role VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    package_lpa DECIMAL(5, 2) NOT NULL,
    skills_required JSON NOT NULL, -- MySQL JSON field
    location VARCHAR(150) DEFAULT 'Remote',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Job Applications Table
CREATE TABLE IF NOT EXISTS c360_job_applications (
    id VARCHAR(36) PRIMARY KEY,
    job_id VARCHAR(36) NOT NULL,
    student_id VARCHAR(36) NOT NULL,
    status VARCHAR(50) DEFAULT 'applied',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES c360_jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_c360_jobs_company ON c360_jobs(company_name);
CREATE INDEX idx_c360_apps_student ON c360_job_applications(student_id);
