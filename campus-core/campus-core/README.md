# CampusCore — Educational Management System (ERP)

**CampusCore** is an enterprise-grade Educational Management System built on the modern MERN/Next.js stack, using Next.js 15 (App Router), TypeScript, Tailwind CSS, and Supabase (Auth, PostgreSQL DB, and RLS).

---

## Technical Stack

* **Frontend:** Next.js 15 App Router, TypeScript, Tailwind CSS, Lucide React, Recharts.
* **Backend:** Next.js Route Handlers & Server Actions.
* **Database & Auth:** Supabase PostgreSQL, Row-Level Security (RLS) policies, and Supabase Auth.
* **AI Engine:** Pre-configured with dual-mode (OpenAI GPT-4 / local NLP keyword parsing) for Resume Parsing and Skill Gap Roadmaps.

---

## Directory Structures

* `/src/app` - App router endpoints, routes, and views.
  * `/setup` - First startup bootstrapping page.
  * `/login` - Role-based portal entrance.
  * `/admin/dashboard` - Admin control dashboard with CSV roster utilities.
  * `/faculty/dashboard` - Student attendance lists, grading sheets, assignment managers.
  * `/student/dashboard` - Attendance percentages, visual roadmaps checklist, placement boards, and real-time messaging.
  * `/api` - API route endpoints (setup, users, stats, batch attendance, marks upserts, AI mentor).
* `/src/utils/supabase` - Client and server helpers.
* `/supabase/migrations` - PostgreSQL schema.sql.
* `/backend-express` - Archived Express API (preserved for reference).
* `/frontend-vite` - Archived Vite frontend (preserved for reference).

---

## Database Schema Installation

The database schema is fully documented inside [supabase_schema.sql](file:///c:/Users/USER/.gemini/antigravity/scratch/campus-core/supabase/migrations/schema.sql). Simply execute this DDL query inside the Supabase SQL editor:
1. Creates profiles, departments, courses, subjects, timetables, attendance, assignments, submissions, marks, jobs, applications, and logs.
2. Synchronizes auth metadata registers to database profile tables.
3. Sets up RLS policies.

---

## Quick Start Configuration

1. **Configure Environment Variables:**
   Create a `.env.local` file inside the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-url.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-secret-key
   OPENAI_API_KEY=mock
   ```

2. **Install Packages:**
   ```bash
   npm install
   ```

3. **Start Development Server:**
   ```bash
   npm run dev
   ```

4. **Initialize Administrator:**
   Open the browser to `http://localhost:3000/setup` (if no admin profile is recorded). Create the initial account to permanently unlock login portals.
