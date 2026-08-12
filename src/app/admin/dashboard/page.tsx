'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { 
  Users, Award, ClipboardList, Database, ShieldAlert, Search, RefreshCw, BarChart2, 
  CheckCircle2, TrendingUp, HelpCircle, Sparkles, Target, Star, Briefcase, Plus, Trash2, 
  ListChecks, LogOut, Building2, BookOpen, GraduationCap, Download, Upload, Settings
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Lists state
  const [students, setStudents] = useState<any[]>([]);
  const [faculty, setFaculty] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  
  // User Forms
  const [userForm, setUserForm] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'student',
    usn_emp_id: '',
    department_id: '',
    semester: '1',
    section: 'A',
    phone_number: '',
    profile_photo_url: ''
  });

  // Academic Forms
  const [deptForm, setDeptForm] = useState({ name: '', code: '', head_of_dept: '', description: '' });
  const [courseForm, setCourseForm] = useState({ name: '', code: '', degree: 'BE', credits: '4', duration_years: '4', department_id: '' });
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', credits: '4', course_id: '' });
  const [jobForm, setJobForm] = useState({ company_name: '', role: '', description: '', package_lpa: '', skills_required: '', location: '' });

  // Notifications
  const [feedback, setFeedback] = useState({ text: '', error: false });

  const showFeedback = (text: string, error = false) => {
    setFeedback({ text, error });
    setTimeout(() => setFeedback({ text: '', error: false }), 4000);
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      setStats(data);

      // Fetch lists
      const stRes = await fetch('/api/admin/users?role=student');
      setStudents(await stRes.json());

      const fcRes = await fetch('/api/admin/users?role=faculty');
      setFaculty(await fcRes.json());

      const dpRes = await fetch('/api/admin/crud?table=departments');
      setDepartments(await dpRes.json());

      const crRes = await fetch('/api/admin/crud?table=courses');
      setCourses(await crRes.json());

      const sbRes = await fetch('/api/admin/crud?table=subjects');
      setSubjects(await sbRes.json());

      const jbRes = await fetch('/api/admin/crud?table=jobs');
      setJobs(await jbRes.json());

      const apRes = await fetch('/api/admin/crud?table=applications');
      setApplications(await apRes.json());

    } catch (err) {
      showFeedback('Error reloading console data.', true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handleLogout = async () => {
    try {
      localStorage.removeItem('campuscore_session');
      document.cookie = 'campuscore_role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      await supabase.auth.signOut().catch(() => {});
    } catch (e) {}
    router.replace('/login');
  };


  // User CRUD handlers
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showFeedback(`Successfully registered new ${userForm.role}!`);
      setUserForm({
        email: '',
        password: '',
        full_name: '',
        role: 'student',
        usn_emp_id: '',
        department_id: '',
        semester: '1',
        section: 'A',
        phone_number: '',
        profile_photo_url: ''
      });
      fetchDashboardData();
    } catch (err: any) {
      showFeedback(err.message || 'Error creating user', true);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user account? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/admin/users?userId=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showFeedback('Account deleted successfully.');
      fetchDashboardData();
    } catch (err: any) {
      showFeedback(err.message || 'Error deleting account', true);
    }
  };

  // Generic DB CRUD posting
  const handlePostTable = async (table: string, body: any, clearForm: () => void) => {
    try {
      const res = await fetch(`/api/admin/crud?table=${table}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showFeedback(`Added new record to ${table}!`);
      clearForm();
      fetchDashboardData();
    } catch (err: any) {
      showFeedback(err.message || 'Failed to submit record', true);
    }
  };

  const handleDeleteRecord = async (table: string, id: string) => {
    if (!confirm('Are you sure you want to remove this record?')) return;
    try {
      const res = await fetch(`/api/admin/crud?table=${table}&id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showFeedback('Record removed.');
      fetchDashboardData();
    } catch (err: any) {
      showFeedback(err.message || 'Failed to delete record', true);
    }
  };

  // CSV Import/Export handlers
  const handleExportCSV = (role: string) => {
    const targetList = role === 'student' ? students : faculty;
    if (targetList.length === 0) {
      showFeedback('No records available to export.', true);
      return;
    }

    const headers = ['FullName', 'Email', 'ID_USN', 'Phone', 'Created_At'];
    const rows = targetList.map(u => [
      u.full_name,
      u.email,
      u.usn_emp_id || '',
      u.phone_number || '',
      new Date(u.created_at).toLocaleDateString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `campuscore_${role}_directory.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>, role: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
      
      // Skip header row
      let importedCount = 0;
      let failedCount = 0;

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(p => p.replace(/^"|"$/g, '').trim());
        if (parts.length >= 3) {
          const [full_name, email, usn_emp_id, phone_number] = parts;
          try {
            const res = await fetch('/api/admin/users', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email,
                password: 'TempPassword123!', // default temp password
                role,
                full_name,
                usn_emp_id,
                phone_number
              })
            });
            if (res.ok) importedCount++;
            else failedCount++;
          } catch {
            failedCount++;
          }
        }
      }

      showFeedback(`CSV Import: ${importedCount} succeeded, ${failedCount} failed.`);
      fetchDashboardData();
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen mesh-bg text-slate-900 flex relative overflow-hidden">
      {/* Decorative glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-50/30 rounded-full blur-[80px] pointer-events-none"></div>

      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-200 bg-white/80 backdrop-blur-md flex flex-col justify-between p-6 shrink-0 relative z-20">
        <div className="space-y-8">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-extrabold text-white text-base">
              CC
            </div>
            <div>
              <h1 className="text-sm font-black tracking-wide leading-none">CampusCore</h1>
              <span className="text-[9px] text-slate-600 font-bold uppercase tracking-wider">Console Panel</span>
            </div>
          </div>

          {/* Nav links */}
          <nav className="space-y-1">
            {[
              { id: 'overview', label: 'Console Home', icon: BarChart2 },
              { id: 'students', label: 'Student Accounts', icon: Users },
              { id: 'faculty', label: 'Faculty Accounts', icon: GraduationCap },
              { id: 'academics', label: 'Academics Manager', icon: BookOpen },
              { id: 'placements', label: 'Placement Drives', icon: Briefcase },
              { id: 'logs', label: 'System Logs', icon: ClipboardList }
            ].map(item => {
              const Icon = item.icon;
              const isAct = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-4.5 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    isAct 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/15' 
                      : 'text-slate-600 hover:bg-slate-100/40 hover:text-white'
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer actions */}
        <div className="pt-4 border-t border-slate-200 space-y-3">
          <div className="flex items-center space-x-2.5">
            <div className="h-7 w-7 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs">A</div>
            <div>
              <p className="text-[10px] font-bold text-slate-600">Super Admin</p>
              <p className="text-[8px] text-slate-600 uppercase font-black tracking-widest">Active session</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full py-2.5 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-500 hover:text-rose-400 font-bold rounded-xl text-[10px] uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out Console</span>
          </button>
        </div>
      </aside>

      {/* Main Console Content */}
      <main className="flex-1 min-w-0 p-8 space-y-6 relative z-10 overflow-y-auto max-h-screen">
        
        {/* Top bar with alert notification */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-wide">CampusCore Console</h2>
            <p className="text-[10px] text-slate-600">College Enterprise Resource Planner (ERP)</p>
          </div>
          {feedback.text && (
            <div className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all ${
              feedback.error ? 'bg-rose-500/10 border-rose-500/25 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
            }`}>
              {feedback.text}
            </div>
          )}
        </div>

        {loading ? (
          <div className="py-24 text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mx-auto" />
          </div>
        ) : (
          <>
            {/* 1. OVERVIEW VIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Students', value: stats?.students, icon: Users, color: 'text-blue-400' },
                    { label: 'Total Faculty', value: stats?.faculty, icon: GraduationCap, color: 'text-indigo-400' },
                    { label: 'Departments', value: stats?.departments, icon: Building2, color: 'text-emerald-400' },
                    { label: 'Placements Active', value: stats?.jobs, icon: Briefcase, color: 'text-amber-400' }
                  ].map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                      <div key={idx} className="premium-card rounded-3xl p-5 bg-white shadow-sm border border-slate-200 hover-glow transition-all">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">{stat.label}</span>
                          <Icon className={`h-4.5 w-4.5 ${stat.color}`} />
                        </div>
                        <div className="text-2xl font-black text-slate-900 mt-2">{stat.value}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Dashboard layout splits */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Performance stats track */}
                  <div className="premium-card rounded-3xl p-6 lg:col-span-2 space-y-4 bg-slate-50/40 border border-slate-150 border border-slate-200 hover-glow transition-all">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-3 flex items-center space-x-2">
                      <BarChart2 className="h-4.5 w-4.5 text-blue-400" />
                      <span>Student AI Mentor Track Distribution</span>
                    </h3>
                    
                    <div className="space-y-4">
                      {stats?.trackData?.map((track: any, idx: number) => (
                        <div key={idx} className="space-y-1.5 p-3.5 bg-white/80 border border-slate-200 shadow-sm rounded-xl rounded-2xl">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-600">{track.name} Track</span>
                            <span className="font-mono text-blue-600">{track.count} Students</span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-600 rounded-full"
                              style={{ width: `${stats?.students > 0 ? (track.count / stats.students) * 100 : 0}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Logs list */}
                  <div className="premium-card rounded-3xl p-6 space-y-4 bg-slate-50/40 border border-slate-150 border border-slate-200 hover-glow transition-all">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-3 flex items-center space-x-2">
                      <ShieldAlert className="h-4.5 w-4.5 text-rose-400" />
                      <span>Audit Activities</span>
                    </h3>

                    <div className="space-y-3">
                      {stats?.recentLogs?.map((log: any) => (
                        <div key={log.id} className="p-3 bg-white border border-slate-200 shadow-sm rounded-xl rounded-xl space-y-1">
                          <div className="flex justify-between items-center text-[8px] text-slate-600 font-bold uppercase font-mono">
                            <span className="text-indigo-400">{log.action_type}</span>
                            <span>{new Date(log.created_at).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-relaxed font-sans">{log.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. STUDENTS VIEW */}
            {activeTab === 'students' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-850">Student Profiles & Enrollment</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleExportCSV('student')}
                      className="px-3.5 py-2 bg-white border border-slate-200 shadow-sm rounded-2xl hover:border-slate-800 text-slate-700 font-bold rounded-xl text-[10px] uppercase flex items-center space-x-1.5 transition-all cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Export Directory</span>
                    </button>
                    <label className="px-3.5 py-2 bg-white border border-slate-200 shadow-sm rounded-2xl hover:border-slate-800 text-slate-700 font-bold rounded-xl text-[10px] uppercase flex items-center space-x-1.5 transition-all cursor-pointer">
                      <Upload className="h-3.5 w-3.5" />
                      <span>Import CSV</span>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={(e) => handleCSVImport(e, 'student')}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Create form */}
                  <div className="premium-card rounded-2xl p-6 bg-white shadow-sm border border-slate-200 space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center space-x-1.5">
                      <Plus className="h-4.5 w-4.5 text-blue-400" />
                      <span>Enroll Student Profile</span>
                    </h4>
                    <form onSubmit={handleCreateUser} className="space-y-3.5 text-left">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-600 uppercase">Full Name</label>
                        <input
                          type="text" required
                          value={userForm.full_name}
                          onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value, role: 'student' })}
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 shadow-sm rounded-2xl rounded-xl text-slate-900 placeholder-slate-650 text-xs focus:outline-none focus:border-blue-500"
                          placeholder="e.g. Rahul Sharma"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-600 uppercase">Email Address</label>
                        <input
                          type="email" required
                          value={userForm.email}
                          onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 shadow-sm rounded-2xl rounded-xl text-slate-900 placeholder-slate-650 text-xs focus:outline-none focus:border-blue-500"
                          placeholder="e.g. sharma@campuscore.edu"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-600 uppercase">Password</label>
                        <input
                          type="password" required
                          value={userForm.password}
                          onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 shadow-sm rounded-2xl rounded-xl text-slate-900 placeholder-slate-650 text-xs focus:outline-none focus:border-blue-500"
                          placeholder="Password"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-600 uppercase">USN ID</label>
                          <input
                            type="text" required
                            value={userForm.usn_emp_id}
                            onChange={(e) => setUserForm({ ...userForm, usn_emp_id: e.target.value })}
                            className="w-full px-3 py-2.5 bg-white border border-slate-200 shadow-sm rounded-2xl rounded-xl text-slate-900 placeholder-slate-650 text-xs focus:outline-none focus:border-blue-500"
                            placeholder="1CC23CS045"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-600 uppercase">Department</label>
                          <select
                            value={userForm.department_id}
                            onChange={(e) => setUserForm({ ...userForm, department_id: e.target.value })}
                            className="w-full px-3 py-2.5 bg-white border border-slate-200 shadow-sm rounded-2xl rounded-xl text-slate-700 text-xs focus:outline-none"
                          >
                            <option value="">Select Department</option>
                            {departments.map(d => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-600 uppercase">Semester</label>
                          <select
                            value={userForm.semester}
                            onChange={(e) => setUserForm({ ...userForm, semester: e.target.value })}
                            className="w-full px-3 py-2.5 bg-white border border-slate-200 shadow-sm rounded-2xl rounded-xl text-slate-700 text-xs focus:outline-none"
                          >
                            {['1','2','3','4','5','6','7','8'].map(s => (
                              <option key={s} value={s}>Semester {s}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-600 uppercase">Section</label>
                          <select
                            value={userForm.section}
                            onChange={(e) => setUserForm({ ...userForm, section: e.target.value })}
                            className="w-full px-3 py-2.5 bg-white border border-slate-200 shadow-sm rounded-2xl rounded-xl text-slate-700 text-xs focus:outline-none"
                          >
                            {['A','B','C','D'].map(s => (
                              <option key={s} value={s}>Section {s}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-600 uppercase">Phone Number</label>
                        <input
                          type="text"
                          value={userForm.phone_number}
                          onChange={(e) => setUserForm({ ...userForm, phone_number: e.target.value })}
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 shadow-sm rounded-2xl rounded-xl text-slate-900 placeholder-slate-650 text-xs focus:outline-none focus:border-blue-500"
                          placeholder="Phone Number"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                      >
                        Add Student
                      </button>
                    </form>
                  </div>

                  {/* List View */}
                  <div className="premium-card rounded-2xl p-6 bg-white shadow-sm border border-slate-200 lg:col-span-2 space-y-4">
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-600">
                        <Search className="h-4 w-4" />
                      </span>
                      <input
                        type="text"
                        placeholder="Search student directories by name/email/USN..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 shadow-sm rounded-2xl rounded-xl text-slate-800 placeholder-slate-500 focus:outline-none text-xs"
                      />
                    </div>

                    <div className="overflow-x-auto max-h-[500px]">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase">
                            <th className="pb-3">Name</th>
                            <th className="pb-3">USN ID</th>
                            <th className="pb-3">Dept</th>
                            <th className="pb-3">Sem/Sec</th>
                            <th className="pb-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {students.filter(s => 
                            (s.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (s.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (s.usn_emp_id || '').toLowerCase().includes(searchQuery.toLowerCase())
                          ).map((student) => (
                            <tr key={student.id} className="border-b border-slate-200/40 hover:bg-slate-100/5 text-slate-600">
                              <td className="py-3 font-semibold text-slate-800">
                                <div>{student.full_name}</div>
                                <div className="text-[10px] text-slate-600">{student.email}</div>
                              </td>
                              <td className="py-3 font-mono text-[11px]">{student.usn_emp_id}</td>
                              <td className="py-3">{student.departments?.name || 'N/A'}</td>
                              <td className="py-3">Sem {student.semester} - {student.section}</td>
                              <td className="py-3 text-right">
                                <button
                                  onClick={() => handleDeleteUser(student.id)}
                                  className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 rounded-lg transition-all cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. FACULTY VIEW */}
            {activeTab === 'faculty' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-850">Faculty Registry</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleExportCSV('faculty')}
                      className="px-3.5 py-2 bg-white border border-slate-200 shadow-sm rounded-2xl hover:border-slate-800 text-slate-700 font-bold rounded-xl text-[10px] uppercase flex items-center space-x-1.5 transition-all cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Export Directory</span>
                    </button>
                    <label className="px-3.5 py-2 bg-white border border-slate-200 shadow-sm rounded-2xl hover:border-slate-800 text-slate-700 font-bold rounded-xl text-[10px] uppercase flex items-center space-x-1.5 transition-all cursor-pointer">
                      <Upload className="h-3.5 w-3.5" />
                      <span>Import CSV</span>
                      <input
                        type="file"
                        accept=".csv"
                        onChange={(e) => handleCSVImport(e, 'faculty')}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Create form */}
                  <div className="premium-card rounded-2xl p-6 bg-white shadow-sm border border-slate-200 space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center space-x-1.5">
                      <Plus className="h-4.5 w-4.5 text-blue-400" />
                      <span>Register Faculty Profile</span>
                    </h4>
                    <form onSubmit={handleCreateUser} className="space-y-3.5 text-left">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-600 uppercase">Full Name</label>
                        <input
                          type="text" required
                          value={userForm.full_name}
                          onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value, role: 'faculty' })}
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 shadow-sm rounded-2xl rounded-xl text-slate-900 placeholder-slate-650 text-xs focus:outline-none focus:border-blue-500"
                          placeholder="e.g. Prof. Alice Smith"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-600 uppercase">Email Address</label>
                        <input
                          type="email" required
                          value={userForm.email}
                          onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 shadow-sm rounded-2xl rounded-xl text-slate-900 placeholder-slate-650 text-xs focus:outline-none focus:border-blue-500"
                          placeholder="e.g. alice@campuscore.edu"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-600 uppercase">Password</label>
                        <input
                          type="password" required
                          value={userForm.password}
                          onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 shadow-sm rounded-2xl rounded-xl text-slate-900 placeholder-slate-650 text-xs focus:outline-none focus:border-blue-500"
                          placeholder="Password"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-600 uppercase">Employee ID</label>
                          <input
                            type="text" required
                            value={userForm.usn_emp_id}
                            onChange={(e) => setUserForm({ ...userForm, usn_emp_id: e.target.value })}
                            className="w-full px-3 py-2.5 bg-white border border-slate-200 shadow-sm rounded-2xl rounded-xl text-slate-900 placeholder-slate-650 text-xs focus:outline-none focus:border-blue-500"
                            placeholder="EMP7752"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-600 uppercase">Department</label>
                          <select
                            value={userForm.department_id}
                            onChange={(e) => setUserForm({ ...userForm, department_id: e.target.value })}
                            className="w-full px-3 py-2.5 bg-white border border-slate-200 shadow-sm rounded-2xl rounded-xl text-slate-700 text-xs focus:outline-none"
                          >
                            <option value="">Select Department</option>
                            {departments.map(d => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-600 uppercase">Phone Number</label>
                        <input
                          type="text"
                          value={userForm.phone_number}
                          onChange={(e) => setUserForm({ ...userForm, phone_number: e.target.value })}
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 shadow-sm rounded-2xl rounded-xl text-slate-900 placeholder-slate-650 text-xs focus:outline-none focus:border-blue-500"
                          placeholder="Phone Number"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                      >
                        Register Faculty
                      </button>
                    </form>
                  </div>

                  {/* List View */}
                  <div className="premium-card rounded-2xl p-6 bg-white shadow-sm border border-slate-200 lg:col-span-2 space-y-4">
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-600">
                        <Search className="h-4 w-4" />
                      </span>
                      <input
                        type="text"
                        placeholder="Search faculty registries by name/email/Employee ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 shadow-sm rounded-2xl rounded-xl text-slate-800 placeholder-slate-500 focus:outline-none text-xs"
                      />
                    </div>

                    <div className="overflow-x-auto max-h-[500px]">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase">
                            <th className="pb-3">Name</th>
                            <th className="pb-3">Employee ID</th>
                            <th className="pb-3">Department</th>
                            <th className="pb-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {faculty.filter(f => 
                            (f.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (f.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (f.usn_emp_id || '').toLowerCase().includes(searchQuery.toLowerCase())
                          ).map((prof) => (
                            <tr key={prof.id} className="border-b border-slate-200/40 hover:bg-slate-100/5 text-slate-600">
                              <td className="py-3 font-semibold text-slate-800">
                                <div>{prof.full_name}</div>
                                <div className="text-[10px] text-slate-600">{prof.email}</div>
                              </td>
                              <td className="py-3 font-mono text-[11px]">{prof.usn_emp_id}</td>
                              <td className="py-3">{prof.departments?.name || 'N/A'}</td>
                              <td className="py-3 text-right">
                                <button
                                  onClick={() => handleDeleteUser(prof.id)}
                                  className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 rounded-lg transition-all cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. ACADEMICS MANAGER VIEW */}
            {activeTab === 'academics' && (
              <div className="space-y-8">
                <div className="border-b border-slate-200 pb-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-850">Academic Modules (CRUD)</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Departments Card */}
                  <div className="premium-card rounded-2xl p-5 bg-white shadow-sm border border-slate-200 space-y-4">
                    <h4 className="text-xs font-bold text-slate-800 uppercase flex items-center space-x-1.5">
                      <Building2 className="h-4.5 w-4.5 text-emerald-400" />
                      <span>Departments</span>
                    </h4>
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        handlePostTable('departments', deptForm, () => setDeptForm({ name: '', code: '', head_of_dept: '', description: '' }));
                      }}
                      className="space-y-3"
                    >
                      <input
                        type="text" required placeholder="Dept Name (e.g. Computer Science)"
                        value={deptForm.name} onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 shadow-sm rounded-2xl rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                      />
                      <input
                        type="text" required placeholder="Code (e.g. CSE)"
                        value={deptForm.code} onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 shadow-sm rounded-2xl rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                      />
                      <button type="submit" className="w-full py-2 bg-blue-600 hover:bg-blue-600 text-white font-bold rounded-xl text-xs uppercase cursor-pointer">
                        Add Department
                      </button>
                    </form>
                    <div className="border-t border-slate-200 pt-3 max-h-48 overflow-y-auto space-y-2">
                      {departments.map(d => (
                        <div key={d.id} className="flex justify-between items-center text-xs p-2 bg-white border border-slate-200 shadow-sm rounded-2xl rounded-lg">
                          <div>
                            <span className="font-bold text-slate-850">{d.code}</span>
                            <span className="text-[10px] text-slate-600 ml-1">({d.name})</span>
                          </div>
                          <button onClick={() => handleDeleteRecord('departments', d.id)} className="text-rose-400 p-1 hover:bg-slate-100 rounded">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Courses Card */}
                  <div className="premium-card rounded-2xl p-5 bg-white shadow-sm border border-slate-200 space-y-4">
                    <h4 className="text-xs font-bold text-slate-800 uppercase flex items-center space-x-1.5">
                      <GraduationCap className="h-4.5 w-4.5 text-indigo-400" />
                      <span>Courses</span>
                    </h4>
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        handlePostTable('courses', courseForm, () => setCourseForm({ name: '', code: '', degree: 'BE', credits: '4', duration_years: '4', department_id: '' }));
                      }}
                      className="space-y-3"
                    >
                      <input
                        type="text" required placeholder="Course Name (e.g. B.E. CSE)"
                        value={courseForm.name} onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 shadow-sm rounded-2xl rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                      />
                      <input
                        type="text" required placeholder="Course Code (e.g. CSE-BE)"
                        value={courseForm.code} onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 shadow-sm rounded-2xl rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                      />
                      <select
                        value={courseForm.department_id} onChange={(e) => setCourseForm({ ...courseForm, department_id: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 shadow-sm rounded-2xl rounded-xl text-slate-700 text-xs focus:outline-none"
                      >
                        <option value="">Link Dept</option>
                        {departments.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                      <button type="submit" className="w-full py-2 bg-blue-600 hover:bg-blue-600 text-white font-bold rounded-xl text-xs uppercase cursor-pointer">
                        Add Course
                      </button>
                    </form>
                    <div className="border-t border-slate-200 pt-3 max-h-48 overflow-y-auto space-y-2">
                      {courses.map(c => (
                        <div key={c.id} className="flex justify-between items-center text-xs p-2 bg-white border border-slate-200 shadow-sm rounded-2xl rounded-lg">
                          <div>
                            <span className="font-bold text-slate-850">{c.code}</span>
                            <span className="text-[10px] text-slate-600 ml-1">({c.name})</span>
                          </div>
                          <button onClick={() => handleDeleteRecord('courses', c.id)} className="text-rose-400 p-1 hover:bg-slate-100 rounded">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Subjects Card */}
                  <div className="premium-card rounded-2xl p-5 bg-white shadow-sm border border-slate-200 space-y-4">
                    <h4 className="text-xs font-bold text-slate-800 uppercase flex items-center space-x-1.5">
                      <BookOpen className="h-4.5 w-4.5 text-blue-400" />
                      <span>Subjects</span>
                    </h4>
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        handlePostTable('subjects', subjectForm, () => setSubjectForm({ name: '', code: '', credits: '4', course_id: '' }));
                      }}
                      className="space-y-3"
                    >
                      <input
                        type="text" required placeholder="Subject Name (e.g. Data Structures)"
                        value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 shadow-sm rounded-2xl rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                      />
                      <input
                        type="text" required placeholder="Code (e.g. 21CS32)"
                        value={subjectForm.code} onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 shadow-sm rounded-2xl rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                      />
                      <select
                        value={subjectForm.course_id} onChange={(e) => setSubjectForm({ ...subjectForm, course_id: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 shadow-sm rounded-2xl rounded-xl text-slate-700 text-xs focus:outline-none"
                      >
                        <option value="">Link Course</option>
                        {courses.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      <button type="submit" className="w-full py-2 bg-blue-600 hover:bg-blue-600 text-white font-bold rounded-xl text-xs uppercase cursor-pointer">
                        Add Subject
                      </button>
                    </form>
                    <div className="border-t border-slate-200 pt-3 max-h-48 overflow-y-auto space-y-2">
                      {subjects.map(s => (
                        <div key={s.id} className="flex justify-between items-center text-xs p-2 bg-white border border-slate-200 shadow-sm rounded-2xl rounded-lg">
                          <div>
                            <span className="font-bold text-slate-850">{s.code}</span>
                            <span className="text-[10px] text-slate-600 ml-1">({s.name})</span>
                          </div>
                          <button onClick={() => handleDeleteRecord('subjects', s.id)} className="text-rose-400 p-1 hover:bg-slate-100 rounded">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. PLACEMENTS VIEW */}
            {activeTab === 'placements' && (
              <div className="space-y-6">
                <div className="border-b border-slate-200 pb-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-850">Placement Jobs Manager & Applications</h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Post Job Form */}
                  <div className="premium-card rounded-2xl p-6 bg-white shadow-sm border border-slate-200 space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-850 flex items-center space-x-1.5">
                      <Plus className="h-4.5 w-4.5 text-blue-400" />
                      <span>Post Job Opportunity</span>
                    </h4>
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        const skillsArray = jobForm.skills_required.split(',').map(s => s.trim()).filter(Boolean);
                        handlePostTable('jobs', {
                          ...jobForm,
                          skills_required: skillsArray
                        }, () => setJobForm({ company_name: '', role: '', description: '', package_lpa: '', skills_required: '', location: '' }));
                      }}
                      className="space-y-3 text-left"
                    >
                      <input
                        type="text" required placeholder="Company Name"
                        value={jobForm.company_name} onChange={(e) => setJobForm({ ...jobForm, company_name: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 shadow-sm rounded-2xl rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                      />
                      <input
                        type="text" required placeholder="Job Role"
                        value={jobForm.role} onChange={(e) => setJobForm({ ...jobForm, role: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 shadow-sm rounded-2xl rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                      />
                      <input
                        type="number" step="0.1" required placeholder="Package (LPA)"
                        value={jobForm.package_lpa} onChange={(e) => setJobForm({ ...jobForm, package_lpa: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 shadow-sm rounded-2xl rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                      />
                      <input
                        type="text" required placeholder="Required Skills (e.g. React, Node)"
                        value={jobForm.skills_required} onChange={(e) => setJobForm({ ...jobForm, skills_required: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 shadow-sm rounded-2xl rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                      />
                      <textarea
                        required placeholder="Job Description" rows={3}
                        value={jobForm.description} onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 shadow-sm rounded-2xl rounded-xl text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                      />
                      <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-600 text-white font-bold rounded-xl text-xs uppercase cursor-pointer">
                        Post Drive Opportunity
                      </button>
                    </form>
                  </div>

                  {/* Placement Application Log & Jobs directory */}
                  <div className="premium-card rounded-2xl p-6 bg-white shadow-sm border border-slate-200 lg:col-span-2 space-y-6">
                    {/* Active list */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider block">Active Placement Drives</h4>
                      <div className="overflow-x-auto max-h-[250px]">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase">
                              <th className="pb-2">Company</th>
                              <th className="pb-2">Role</th>
                              <th className="pb-2 text-right">LPA</th>
                              <th className="pb-2 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {jobs.map(job => (
                              <tr key={job.id} className="border-b border-slate-200/40 hover:bg-slate-100/5 text-slate-600">
                                <td className="py-2.5 font-bold text-slate-800">{job.company_name}</td>
                                <td className="py-2.5">{job.role}</td>
                                <td className="py-2.5 text-right font-mono font-bold text-emerald-600">₹ {job.package_lpa} LPA</td>
                                <td className="py-2.5 text-right">
                                  <button onClick={() => handleDeleteRecord('jobs', job.id)} className="text-rose-405 p-1 hover:bg-slate-100 rounded">
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Applications tracking list */}
                    <div className="space-y-3 pt-4 border-t border-slate-200">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider block">Student Registrations Log</h4>
                      <div className="overflow-x-auto max-h-[250px]">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase">
                              <th className="pb-2">Student ID</th>
                              <th className="pb-2">Job ID</th>
                              <th className="pb-2">Status</th>
                              <th className="pb-2 text-right">Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {applications.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="py-4 text-center text-slate-600">No applications registered.</td>
                              </tr>
                            ) : (
                              applications.map(app => (
                                <tr key={app.id} className="border-b border-slate-200/40 hover:bg-slate-100/5 text-slate-600">
                                  <td className="py-2 font-mono text-[10px]">{app.student_id}</td>
                                  <td className="py-2 font-mono text-[10px]">{app.job_id}</td>
                                  <td className="py-2">
                                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-200 text-[9px] font-bold uppercase">
                                      {app.status}
                                    </span>
                                  </td>
                                  <td className="py-2 text-right font-mono text-slate-600 text-[10px]">{new Date(app.created_at).toLocaleDateString()}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 6. LOGS VIEW */}
            {activeTab === 'logs' && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-850">System Logs & Traces</h3>
                  <button onClick={fetchDashboardData} className="p-2 hover:bg-slate-100 rounded-xl transition-all cursor-pointer">
                    <RefreshCw className="h-4 w-4 text-slate-500" />
                  </button>
                </div>
                
                <div className="premium-card rounded-2xl p-6 bg-white shadow-sm border border-slate-200 space-y-4">
                  <div className="space-y-3.5 max-h-[600px] overflow-y-auto pr-2">
                    {stats?.recentLogs?.map((log: any) => (
                      <div key={log.id} className="p-4 bg-white/80 border border-slate-200 shadow-sm rounded-xl rounded-2xl hover:border-slate-800 transition-all flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-wider">
                            <span className="text-blue-600">{log.action_type}</span>
                            <span className="text-slate-600">•</span>
                            <span className="text-slate-600">{new Date(log.created_at).toLocaleString()}</span>
                          </div>
                          <p className="text-slate-700 text-xs leading-relaxed">{log.message}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[8px] font-mono select-none">
                          {log.id.slice(0, 8)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
