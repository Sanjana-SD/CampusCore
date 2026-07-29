-- Supabase PostgreSQL Schema Migrations
-- Database Name: CampusCore

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. DEPARTMENTS & ACADEMICS
-- ==========================================

CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    head_of_dept TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    degree TEXT NOT NULL, -- BE, BTech, MTech, MBA, MCA, PhD
    credits INT NOT NULL DEFAULT 4,
    duration_years INT NOT NULL DEFAULT 4,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    credits INT NOT NULL DEFAULT 4,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 2. USER PROFILES (EXTENDS Supabase auth.users)
-- ==========================================

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'faculty', 'student', 'placement_officer')),
    usn_emp_id TEXT UNIQUE, -- USN for Student, Employee ID for Faculty
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    semester INT CHECK (semester BETWEEN 1 AND 8),
    section TEXT CHECK (section IN ('A', 'B', 'C', 'D')),
    phone_number TEXT,
    profile_photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 3. TIMETABLES, ATTENDANCE & ACADEMIC RECORDS
-- ==========================================

CREATE TABLE IF NOT EXISTS timetables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    semester INT NOT NULL CHECK (semester BETWEEN 1 AND 8),
    section TEXT NOT NULL CHECK (section IN ('A', 'B', 'C', 'D')),
    day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')),
    period_1_subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    period_2_subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    period_3_subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    period_4_subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    period_5_subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'leave')),
    marked_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    semester INT NOT NULL CHECK (semester BETWEEN 1 AND 8),
    section TEXT NOT NULL CHECK (section IN ('A', 'B', 'C', 'D')),
    attachment_url TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    marks_obtained DECIMAL(5,2),
    feedback TEXT,
    status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (assignment_id, student_id)
);

CREATE TABLE IF NOT EXISTS marks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    exam_type TEXT NOT NULL CHECK (exam_type IN ('internal_1', 'internal_2', 'internal_3', 'semester')),
    marks_obtained DECIMAL(5,2) NOT NULL,
    max_marks DECIMAL(5,2) NOT NULL DEFAULT 50,
    graded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (student_id, subject_id, exam_type)
);

-- ==========================================
-- 4. PLACEMENT & JOBS MODULE
-- ==========================================

CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    role TEXT NOT NULL,
    description TEXT NOT NULL,
    package_lpa DECIMAL(5,2) NOT NULL,
    skills_required JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of skills required
    location TEXT DEFAULT 'Remote',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'applied' CHECK (status IN ('applied', 'reviewing', 'shortlisted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (job_id, student_id)
);

-- ==========================================
-- 5. AI CAREER MENTOR TIMELINES
-- ==========================================

CREATE TABLE IF NOT EXISTS c360_roadmap (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    target_career TEXT NOT NULL,
    roadmap_json JSONB NOT NULL, -- 30/60/90 days plan details
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 6. COMMUNICATION, NOTIFICATIONS & LOGS
-- ==========================================

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    role_target TEXT DEFAULT 'all' CHECK (role_target IN ('all', 'faculty', 'student')),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type TEXT NOT NULL,
    message TEXT NOT NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- 7. TRIGGERS & UTILITY FUNCTIONS
-- ==========================================

-- Trigger to automatically create a profile row for new Supabase auth users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  role_val TEXT;
  name_val TEXT;
BEGIN
  -- Extract metadata defaults if present
  role_val := COALESCE(new.raw_user_meta_data->>'role', 'student');
  name_val := COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
  
  INSERT INTO public.profiles (id, full_name, email, role, usn_emp_id, department_id, semester, section, phone_number, profile_photo_url)
  VALUES (
    new.id,
    name_val,
    new.email,
    role_val,
    new.raw_user_meta_data->>'usn_emp_id',
    (new.raw_user_meta_data->>'department_id')::UUID,
    (new.raw_user_meta_data->>'semester')::INT,
    new.raw_user_meta_data->>'section',
    new.raw_user_meta_data->>'phone_number',
    new.raw_user_meta_data->>'profile_photo_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- 8. INDEXES FOR PERFORMANCE
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_attendance_student_subject ON attendance(student_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_marks_student_subject ON marks(student_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_announcements_target ON announcements(role_target);

-- ==========================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetables ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE c360_roadmap ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- Dynamic helper functions for checking current user roles
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Profiles Policies
CREATE POLICY "Profiles are readable by everyone authenticated" ON profiles
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage profiles" ON profiles
    FOR ALL TO authenticated USING (public.get_auth_role() = 'admin');

CREATE POLICY "Users can update their own phone and photo" ON profiles
    FOR UPDATE TO authenticated USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Departments Policies
CREATE POLICY "Departments are readable by all authenticated" ON departments
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage departments" ON departments
    FOR ALL TO authenticated USING (public.get_auth_role() = 'admin');

-- Courses Policies
CREATE POLICY "Courses are readable by all authenticated" ON courses
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage courses" ON courses
    FOR ALL TO authenticated USING (public.get_auth_role() = 'admin');

-- Subjects Policies
CREATE POLICY "Subjects are readable by all authenticated" ON subjects
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage subjects" ON subjects
    FOR ALL TO authenticated USING (public.get_auth_role() = 'admin');

-- Timetables Policies
CREATE POLICY "Timetables are readable by all authenticated" ON timetables
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage timetables" ON timetables
    FOR ALL TO authenticated USING (public.get_auth_role() = 'admin');

-- Attendance Policies
CREATE POLICY "Students can read their own attendance" ON attendance
    FOR SELECT TO authenticated USING (auth.uid() = student_id);

CREATE POLICY "Faculty can manage attendance" ON attendance
    FOR ALL TO authenticated USING (public.get_auth_role() = 'faculty' OR public.get_auth_role() = 'admin');

-- Assignments Policies
CREATE POLICY "Assignments readable by all authenticated" ON assignments
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Faculty can manage assignments" ON assignments
    FOR ALL TO authenticated USING (public.get_auth_role() = 'faculty' OR public.get_auth_role() = 'admin');

-- Submissions Policies
CREATE POLICY "Students can CRUD their own submissions" ON submissions
    FOR ALL TO authenticated USING (auth.uid() = student_id);

CREATE POLICY "Faculty/Admins can read/grade submissions" ON submissions
    FOR ALL TO authenticated USING (public.get_auth_role() = 'faculty' OR public.get_auth_role() = 'admin');

-- Marks Policies
CREATE POLICY "Students can read their own marks" ON marks
    FOR SELECT TO authenticated USING (auth.uid() = student_id);

CREATE POLICY "Faculty can manage marks" ON marks
    FOR ALL TO authenticated USING (public.get_auth_role() = 'faculty' OR public.get_auth_role() = 'admin');

-- Jobs Policies
CREATE POLICY "Jobs readable by all authenticated" ON jobs
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage jobs" ON jobs
    FOR ALL TO authenticated USING (public.get_auth_role() = 'admin' OR public.get_auth_role() = 'placement_officer');

-- Applications Policies
CREATE POLICY "Students can select/insert their applications" ON applications
    FOR ALL TO authenticated USING (auth.uid() = student_id);

CREATE POLICY "Admins/Faculty can read/update application status" ON applications
    FOR ALL TO authenticated USING (public.get_auth_role() = 'admin' OR public.get_auth_role() = 'faculty' OR public.get_auth_role() = 'placement_officer');

-- Roadmap Policies
CREATE POLICY "Students can CRUD their own roadmaps" ON c360_roadmap
    FOR ALL TO authenticated USING (auth.uid() = student_id);

CREATE POLICY "Admins/Faculty can view roadmaps" ON c360_roadmap
    FOR SELECT TO authenticated USING (public.get_auth_role() = 'admin' OR public.get_auth_role() = 'faculty');

-- Messages Policies
CREATE POLICY "Users can CRUD their own messages" ON messages
    FOR ALL TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Announcements Policies
CREATE POLICY "Announcements readable by targeted roles" ON announcements
    FOR SELECT TO authenticated USING (
        role_target = 'all' OR
        role_target = public.get_auth_role() OR
        public.get_auth_role() = 'admin'
    );

CREATE POLICY "Admins can manage announcements" ON announcements
    FOR ALL TO authenticated USING (public.get_auth_role() = 'admin');

-- Admin Logs Policies
CREATE POLICY "Admins can view logs" ON admin_logs
    FOR SELECT TO authenticated USING (public.get_auth_role() = 'admin');
    
CREATE POLICY "System can insert logs" ON admin_logs
    FOR INSERT TO authenticated WITH CHECK (true);
