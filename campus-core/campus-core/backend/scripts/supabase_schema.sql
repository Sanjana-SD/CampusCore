-- Supabase PostgreSQL Schema DDL
-- For CampusCore Smart Campus & AI Mentor Modules

-- ==========================================
-- 1. COLLEGE MANAGEMENT TABLES
-- ==========================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL UNIQUE,
    code VARCHAR(10) NOT NULL UNIQUE,
    head_of_dept VARCHAR(150),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Courses Table
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(15) NOT NULL UNIQUE,
    degree VARCHAR(50) NOT NULL, -- BE, BTech, MTech, MBA, MCA, PhD
    credits INT NOT NULL DEFAULT 4,
    duration_years INT NOT NULL DEFAULT 4,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Faculty Profiles Table (Links to users)
CREATE TABLE IF NOT EXISTS faculty (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(20),
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    designation VARCHAR(100) DEFAULT 'Assistant Professor',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Events & Announcements Table
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location VARCHAR(200) DEFAULT 'Main Campus Auditorium',
    image_url VARCHAR(500),
    posted_by UUID, -- REFERENCES users(id)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Placements Table (Records placement reports/statistics)
CREATE TABLE IF NOT EXISTS placements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_name VARCHAR(150) NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    company_name VARCHAR(150) NOT NULL,
    package_lpa DECIMAL(5, 2) NOT NULL, -- Package in Lakhs Per Annum
    placed_year INT NOT NULL,
    job_role VARCHAR(150) DEFAULT 'Software Engineer Intern',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Login/Credentials Log table (Required by 6)
CREATE TABLE IF NOT EXISTS login (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,
    login_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success', 'failed'))
);


-- ==========================================
-- 2. CAMPUSCORE AI MENTOR TABLES (c360_*)
-- ==========================================

-- C360 Users (Sync profile for AI module)
CREATE TABLE IF NOT EXISTS c360_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL, -- REFERENCES students(id) / users(id)
    target_career VARCHAR(150) DEFAULT 'Software Engineer',
    preferred_level VARCHAR(20) DEFAULT 'Beginner' CHECK (preferred_level IN ('Beginner', 'Intermediate', 'Advanced')),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Quiz Scores Table (0-50 pts)
CREATE TABLE IF NOT EXISTS c360_quiz_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL, -- REFERENCES users(id)
    score INT NOT NULL CHECK (score BETWEEN 0 AND 50),
    target_career VARCHAR(150) NOT NULL,
    answers_json JSONB NOT NULL, -- Records the quiz inputs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Resume Skills Table (0-30 pts)
CREATE TABLE IF NOT EXISTS c360_resume_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL, -- REFERENCES users(id)
    skills_json JSONB NOT NULL, -- Extracted skills list
    score INT NOT NULL CHECK (score BETWEEN 0 AND 30),
    file_name VARCHAR(255) DEFAULT 'pasted_text.txt',
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Skill Gap Scores Table (0-20 pts)
CREATE TABLE IF NOT EXISTS c360_skill_gap (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL, -- REFERENCES users(id)
    target_career VARCHAR(150) NOT NULL,
    missing_skills_json JSONB NOT NULL,
    gap_score INT NOT NULL CHECK (gap_score BETWEEN 0 AND 20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Performance Scores Table (Total 0-100 pts)
CREATE TABLE IF NOT EXISTS c360_performance_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL UNIQUE, -- REFERENCES users(id)
    quiz_score INT NOT NULL DEFAULT 0,
    resume_score INT NOT NULL DEFAULT 0,
    skill_gap_score INT NOT NULL DEFAULT 0,
    total_score INT GENERATED ALWAYS AS (quiz_score + resume_score + skill_gap_score) STORED,
    classification VARCHAR(20) NOT NULL, -- Beginner, Intermediate, Advanced
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Roadmap Table
CREATE TABLE IF NOT EXISTS c360_roadmap (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL, -- REFERENCES users(id)
    target_career VARCHAR(150) NOT NULL,
    level VARCHAR(20) NOT NULL, -- Beginner, Intermediate, Advanced
    steps_json JSONB NOT NULL, -- Complete roadmap tree
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, target_career)
);

-- Progress Table
CREATE TABLE IF NOT EXISTS c360_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL UNIQUE, -- REFERENCES users(id)
    completed_steps_json JSONB NOT NULL, -- List of step IDs completed
    percentage INT DEFAULT 0 CHECK (percentage BETWEEN 0 AND 100),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Admin & Placement Logs Table
CREATE TABLE IF NOT EXISTS c360_admin_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action_type VARCHAR(100) NOT NULL,
    student_id UUID,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_c360_quiz_student ON c360_quiz_scores(student_id);
CREATE INDEX IF NOT EXISTS idx_c360_resume_student ON c360_resume_skills(student_id);
CREATE INDEX IF NOT EXISTS idx_c360_perf_student ON c360_performance_scores(student_id);
CREATE INDEX IF NOT EXISTS idx_c360_road_student ON c360_roadmap(student_id);

-- Job Postings Table
CREATE TABLE IF NOT EXISTS c360_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(150) NOT NULL,
    role VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    package_lpa DECIMAL(5, 2) NOT NULL,
    skills_required JSONB NOT NULL, -- List of required skill keywords
    location VARCHAR(150) DEFAULT 'Remote',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Job Applications Table
CREATE TABLE IF NOT EXISTS c360_job_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES c360_jobs(id) ON DELETE CASCADE,
    student_id UUID NOT NULL,
    status VARCHAR(50) DEFAULT 'applied' CHECK (status IN ('applied', 'reviewing', 'shortlisted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_c360_jobs_company ON c360_jobs(company_name);
CREATE INDEX IF NOT EXISTS idx_c360_apps_student ON c360_job_applications(student_id);
