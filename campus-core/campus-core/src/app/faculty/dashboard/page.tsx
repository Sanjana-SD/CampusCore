'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { 
  Users, Award, ClipboardList, Database, ShieldAlert, Search, RefreshCw, BarChart2, 
  CheckCircle2, TrendingUp, HelpCircle, Sparkles, Target, Star, Briefcase, Plus, Trash2, 
  ListChecks, LogOut, Building2, BookOpen, GraduationCap, Download, Upload, Calendar, Clock
} from 'lucide-react';

export default function FacultyDashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Database datasets
  const [students, setStudents] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [timetables, setTimetables] = useState<any[]>([]);
  
  // Selection states for Attendance & Marks
  const [selectedClass, setSelectedClass] = useState({
    department_id: '',
    semester: '1',
    section: 'A',
    subject_id: ''
  });
  
  // Roster loaded for editing
  const [activeRoster, setActiveRoster] = useState<any[]>([]);
  const [examType, setExamType] = useState('internal_1');

  // Assignment Form
  const [assignForm, setAssignForm] = useState({
    title: '',
    description: '',
    due_date: '',
    subject_id: '',
    semester: '1',
    section: 'A',
    attachment_url: ''
  });

  // Grading states
  const [gradingSubId, setGradingSubId] = useState('');
  const [gradingForm, setGradingForm] = useState({ marks_obtained: '', feedback: '' });

  // Notifications
  const [feedback, setFeedback] = useState({ text: '', error: false });

  const showFeedback = (text: string, error = false) => {
    setFeedback({ text, error });
    setTimeout(() => setFeedback({ text: '', error: false }), 4000);
  };

  const fetchFacultyData = async () => {
    try {
      setLoading(true);
      // Get current authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }
      
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setCurrentUser(profile);

      // Load static data
      const dpRes = await fetch('/api/admin/crud?table=departments');
      setDepartments(await dpRes.json());

      const sbRes = await fetch('/api/admin/crud?table=subjects');
      setSubjects(await sbRes.json());

      const asRes = await fetch('/api/admin/crud?table=assignments');
      setAssignments(await asRes.json());

      const sbmsRes = await fetch('/api/admin/crud?table=submissions');
      setSubmissions(await sbmsRes.json());

      const ttRes = await fetch('/api/admin/crud?table=timetables');
      setTimetables(await ttRes.json());

      // Fetch all students for quick reference
      const stRes = await fetch('/api/admin/users?role=student');
      setStudents(await stRes.json());

    } catch (err) {
      showFeedback('Error loading faculty workspace.', true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacultyData();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  // Filter students based on selection (Dept, Sem, Sec)
  const handleLoadClassRoster = () => {
    if (!selectedClass.department_id || !selectedClass.subject_id) {
      showFeedback('Please select department and subject.', true);
      return;
    }

    const roster = students.filter(s => 
      s.department_id === selectedClass.department_id &&
      s.semester === parseInt(selectedClass.semester) &&
      s.section === selectedClass.section
    );

    // Map default present status or current grades if loaded
    const mapped = roster.map(s => ({
      student_id: s.id,
      full_name: s.full_name,
      usn_emp_id: s.usn_emp_id,
      status: 'present', // default attendance
      marks_obtained: '', // default grade
      max_marks: '50'
    }));

    setActiveRoster(mapped);
    showFeedback(`Loaded roster: ${mapped.length} students found.`);
  };

  const handleAttendanceChange = (studentId: string, status: string) => {
    setActiveRoster(prev => prev.map(s => s.student_id === studentId ? { ...s, status } : s));
  };

  const handleMarksChange = (studentId: string, value: string) => {
    setActiveRoster(prev => prev.map(s => s.student_id === studentId ? { ...s, marks_obtained: value } : s));
  };

  // Submit Attendance Batch
  const handleSubmitAttendance = async () => {
    if (activeRoster.length === 0) {
      showFeedback('No students loaded in active sheet.', true);
      return;
    }

    try {
      const res = await fetch('/api/faculty/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentStatusList: activeRoster.map(s => ({ student_id: s.student_id, status: s.status })),
          subject_id: selectedClass.subject_id,
          date: new Date().toISOString().split('T')[0],
          marked_by: currentUser?.id
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      showFeedback('Attendance sheet submitted successfully!');
      setActiveRoster([]);
    } catch (err: any) {
      showFeedback(err.message || 'Failed to submit attendance.', true);
    }
  };

  // Submit Marks Batch
  const handleSubmitMarks = async () => {
    if (activeRoster.length === 0) {
      showFeedback('No student roster loaded to grade.', true);
      return;
    }

    try {
      const res = await fetch('/api/faculty/marks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marksList: activeRoster.map(s => ({ student_id: s.student_id, marks_obtained: s.marks_obtained || '0', max_marks: s.max_marks })),
          subject_id: selectedClass.subject_id,
          exam_type: examType,
          graded_by: currentUser?.id
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      showFeedback('Internal grades posted successfully!');
      setActiveRoster([]);
    } catch (err: any) {
      showFeedback(err.message || 'Failed to post grades.', true);
    }
  };

  // Create Assignment
  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/crud?table=assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...assignForm,
          semester: parseInt(assignForm.semester),
          created_by: currentUser?.id
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      showFeedback('Assignment published for classroom students.');
      setAssignForm({
        title: '',
        description: '',
        due_date: '',
        subject_id: '',
        semester: '1',
        section: 'A',
        attachment_url: ''
      });
      fetchFacultyData();
    } catch (err: any) {
      showFeedback(err.message || 'Failed to publish assignment', true);
    }
  };

  // Grade homework submission
  const handleGradeSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/admin/crud?table=submissions&id=${gradingSubId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marks_obtained: parseFloat(gradingForm.marks_obtained),
          feedback: gradingForm.feedback,
          status: 'graded'
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      showFeedback('Homework submission graded.');
      setGradingSubId('');
      setGradingForm({ marks_obtained: '', feedback: '' });
      fetchFacultyData();
    } catch (err: any) {
      showFeedback(err.message || 'Failed to grade submission', true);
    }
  };

  return (
    <div className="min-h-screen mesh-bg text-slate-900 flex relative overflow-hidden font-sans">
      {/* Glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-100/30 rounded-full blur-[80px] pointer-events-none"></div>

      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 bg-white/80 backdrop-blur-md flex flex-col justify-between p-6 shrink-0 relative z-20">
        <div className="space-y-8">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center font-extrabold text-white text-base">
              CC
            </div>
            <div>
              <h1 className="text-sm font-black tracking-wide leading-none">CampusCore</h1>
              <span className="text-[9px] text-slate-600 font-bold uppercase tracking-wider">Faculty Portal</span>
            </div>
          </div>

          <nav className="space-y-1">
            {[
              { id: 'overview', label: 'Console Home', icon: BarChart2 },
              { id: 'attendance', label: 'Take Attendance', icon: ClipboardList },
              { id: 'grades', label: 'Enter Grades', icon: Award },
              { id: 'assignments', label: 'Assignments', icon: ListChecks },
              { id: 'timetable', label: 'Class Timetable', icon: Calendar }
            ].map(item => {
              const Icon = item.icon;
              const isAct = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setActiveRoster([]); }}
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

        <div className="pt-4 border-t border-slate-200 space-y-3">
          <div className="flex items-center space-x-2.5">
            <div className="h-7 w-7 rounded-full bg-indigo-900 flex items-center justify-center font-bold text-xs">F</div>
            <div>
              <p className="text-[10px] font-bold text-slate-600">{currentUser?.full_name || 'Faculty Member'}</p>
              <p className="text-[8px] text-indigo-400 uppercase font-bold tracking-widest">{currentUser?.usn_emp_id}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full py-2.5 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-500 hover:text-rose-400 font-bold rounded-xl text-[10px] uppercase tracking-wider flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="flex-1 min-w-0 p-8 space-y-6 relative z-10 overflow-y-auto max-h-screen">
        
        {/* Header bar */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-wide">Faculty Workspace</h2>
            <p className="text-[10px] text-slate-600">Academic & attendance control terminal</p>
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
            <RefreshCw className="h-8 w-8 animate-spin text-indigo-500 mx-auto" />
          </div>
        ) : (
          <>
            {/* 1. MODULE OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Visual mock card list */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="premium-card rounded-3xl p-6 bg-slate-50/40 border border-slate-150 border border-slate-200 hover-glow transition-all space-y-2">
                    <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest block">Class Registry</span>
                    <h4 className="text-sm font-bold text-slate-800">Take Attendance</h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed">Launch roster logs to track absent, present, late, or leave student schedules.</p>
                    <button onClick={() => setActiveTab('attendance')} className="text-xs font-bold text-blue-600 hover:underline flex items-center space-x-1 pt-1.5 cursor-pointer">
                      <span>Go to Attendance</span>
                      <span>&rarr;</span>
                    </button>
                  </div>
                  <div className="premium-card rounded-3xl p-6 bg-slate-50/40 border border-slate-150 border border-slate-200 hover-glow transition-all space-y-2">
                    <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest block">Performance</span>
                    <h4 className="text-sm font-bold text-slate-800">Enter Grades Roll</h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed">Key in classroom marks for Internal assessments 1, 2, 3, and Semester papers.</p>
                    <button onClick={() => setActiveTab('grades')} className="text-xs font-bold text-blue-600 hover:underline flex items-center space-x-1 pt-1.5 cursor-pointer">
                      <span>Go to Grading</span>
                      <span>&rarr;</span>
                    </button>
                  </div>
                  <div className="premium-card rounded-3xl p-6 bg-slate-50/40 border border-slate-150 border border-slate-200 hover-glow transition-all space-y-2">
                    <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest block">Study Workspace</span>
                    <h4 className="text-sm font-bold text-slate-800">Assignments & Materials</h4>
                    <p className="text-[11px] text-slate-600 leading-relaxed">Publish new tasks, configure attachments, and grade student submissions.</p>
                    <button onClick={() => setActiveTab('assignments')} className="text-xs font-bold text-blue-600 hover:underline flex items-center space-x-1 pt-1.5 cursor-pointer">
                      <span>Go to Homeworks</span>
                      <span>&rarr;</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. ATTENDANCE SHEET ENTRY */}
            {activeTab === 'attendance' && (
              <div className="space-y-6">
                {/* Roster selection deck */}
                <div className="p-5 bg-white border border-slate-200 shadow-sm rounded-2xl rounded-3xl flex flex-wrap gap-4 items-end">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-600 uppercase">Department</label>
                    <select
                      value={selectedClass.department_id}
                      onChange={(e) => setSelectedClass({ ...selectedClass, department_id: e.target.value })}
                      className="px-3.5 py-2.5 bg-white border border-slate-200 shadow-sm rounded-2xl rounded-xl text-slate-700 text-xs focus:outline-none w-44"
                    >
                      <option value="">Select Dept</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-600 uppercase">Subject</label>
                    <select
                      value={selectedClass.subject_id}
                      onChange={(e) => setSelectedClass({ ...selectedClass, subject_id: e.target.value })}
                      className="px-3.5 py-2.5 bg-white border border-slate-200 shadow-sm rounded-2xl rounded-xl text-slate-700 text-xs focus:outline-none w-44"
                    >
                      <option value="">Select Subject</option>
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-600 uppercase">Semester</label>
                    <select
                      value={selectedClass.semester}
                      onChange={(e) => setSelectedClass({ ...selectedClass, semester: e.target.value })}
                      className="px-3.5 py-2.5 bg-white border border-slate-200 shadow-sm rounded-2xl rounded-xl text-slate-700 text-xs focus:outline-none w-28"
                    >
                      {['1','2','3','4','5','6','7','8'].map(s => (
                        <option key={s} value={s}>Semester {s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-600 uppercase">Section</label>
                    <select
                      value={selectedClass.section}
                      onChange={(e) => setSelectedClass({ ...selectedClass, section: e.target.value })}
                      className="px-3.5 py-2.5 bg-white border border-slate-200 shadow-sm rounded-2xl rounded-xl text-slate-700 text-xs focus:outline-none w-24"
                    >
                      {['A','B','C','D'].map(s => (
                        <option key={s} value={s}>Section {s}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={handleLoadClassRoster}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-600 text-white font-bold rounded-xl text-xs uppercase tracking-wide transition-all cursor-pointer flex items-center space-x-1.5"
                  >
                    <Users className="h-4 w-4" />
                    <span>Load Roster</span>
                  </button>
                </div>

                {activeRoster.length > 0 && (
                  <div className="premium-card rounded-3xl p-6 bg-white shadow-sm border border-slate-200 space-y-6">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                      <span className="text-xs font-bold text-slate-700">Marking Attendance - {new Date().toLocaleDateString()}</span>
                      <button
                        onClick={handleSubmitAttendance}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs uppercase tracking-wide transition-all cursor-pointer"
                      >
                        Submit Attendance Sheet
                      </button>
                    </div>

                    <div className="overflow-x-auto max-h-[500px]">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase">
                            <th className="pb-3">USN ID</th>
                            <th className="pb-3">Student Name</th>
                            <th className="pb-3 text-right">Status Option</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeRoster.map((s) => (
                            <tr key={s.student_id} className="border-b border-slate-200/40 hover:bg-slate-100/5 text-slate-600">
                              <td className="py-3 font-mono font-bold text-indigo-400">{s.usn_emp_id}</td>
                              <td className="py-3 font-semibold text-slate-850">{s.full_name}</td>
                              <td className="py-3 text-right">
                                <div className="inline-flex rounded-xl bg-white border border-slate-200 shadow-sm rounded-2xl p-1 gap-1">
                                  {['present', 'absent', 'late', 'leave'].map(opt => (
                                    <button
                                      key={opt}
                                      onClick={() => handleAttendanceChange(s.student_id, opt)}
                                      className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                                        s.status === opt 
                                          ? opt === 'present' ? 'bg-emerald-500 text-white' : opt === 'absent' ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'
                                          : 'text-slate-600 hover:text-white'
                                      }`}
                                    >
                                      {opt}
                                    </button>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. GRADES ENTRY VIEW */}
            {activeTab === 'grades' && (
              <div className="space-y-6">
                {/* Roster parameters */}
                <div className="p-5 bg-white border border-slate-200 shadow-sm rounded-2xl rounded-3xl flex flex-wrap gap-4 items-end">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-600 uppercase">Department</label>
                    <select
                      value={selectedClass.department_id}
                      onChange={(e) => setSelectedClass({ ...selectedClass, department_id: e.target.value })}
                      className="px-3.5 py-2.5 bg-white border border-slate-200 shadow-sm rounded-2xl rounded-xl text-slate-700 text-xs focus:outline-none w-44"
                    >
                      <option value="">Select Dept</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-600 uppercase">Subject</label>
                    <select
                      value={selectedClass.subject_id}
                      onChange={(e) => setSelectedClass({ ...selectedClass, subject_id: e.target.value })}
                      className="px-3.5 py-2.5 bg-white border border-slate-200 shadow-sm rounded-2xl rounded-xl text-slate-700 text-xs focus:outline-none w-44"
                    >
                      <option value="">Select Subject</option>
                      {subjects.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-600 uppercase">Exam Type</label>
                    <select
                      value={examType}
                      onChange={(e) => setExamType(e.target.value)}
                      className="px-3.5 py-2.5 bg-white border border-slate-200 shadow-sm rounded-2xl rounded-xl text-slate-700 text-xs focus:outline-none w-44"
                    >
                      <option value="internal_1">Internal Assessment 1</option>
                      <option value="internal_2">Internal Assessment 2</option>
                      <option value="internal_3">Internal Assessment 3</option>
                      <option value="semester">Semester Exam</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-600 uppercase">Semester</label>
                      <select
                        value={selectedClass.semester}
                        onChange={(e) => setSelectedClass({ ...selectedClass, semester: e.target.value })}
                        className="px-3.5 py-2.5 bg-white border border-slate-200 shadow-sm rounded-2xl rounded-xl text-slate-700 text-xs focus:outline-none w-24"
                      >
                        {['1','2','3','4','5','6','7','8'].map(s => (
                          <option key={s} value={s}>Semester {s}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-600 uppercase">Section</label>
                      <select
                        value={selectedClass.section}
                        onChange={(e) => setSelectedClass({ ...selectedClass, section: e.target.value })}
                        className="px-3.5 py-2.5 bg-white border border-slate-200 shadow-sm rounded-2xl rounded-xl text-slate-700 text-xs focus:outline-none w-24"
                      >
                        {['A','B','C','D'].map(s => (
                          <option key={s} value={s}>Section {s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={handleLoadClassRoster}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-600 text-white font-bold rounded-xl text-xs uppercase tracking-wide transition-all cursor-pointer flex items-center space-x-1.5"
                  >
                    <Users className="h-4 w-4" />
                    <span>Load Gradesheet</span>
                  </button>
                </div>

                {activeRoster.length > 0 && (
                  <div className="premium-card rounded-3xl p-6 bg-white shadow-sm border border-slate-200 space-y-6">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                      <span className="text-xs font-bold text-slate-700">Grading System: {examType.toUpperCase().replace('_',' ')}</span>
                      <button
                        onClick={handleSubmitMarks}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs uppercase tracking-wide transition-all cursor-pointer"
                      >
                        Publish Gradesheet
                      </button>
                    </div>

                    <div className="overflow-x-auto max-h-[500px]">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase">
                            <th className="pb-3">USN ID</th>
                            <th className="pb-3">Student Name</th>
                            <th className="pb-3 text-right">Marks (Max 50)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeRoster.map((s) => (
                            <tr key={s.student_id} className="border-b border-slate-200/40 hover:bg-slate-100/5 text-slate-600">
                              <td className="py-3 font-mono font-bold text-indigo-400">{s.usn_emp_id}</td>
                              <td className="py-3 font-semibold text-slate-850">{s.full_name}</td>
                              <td className="py-3 text-right">
                                <input
                                  type="number"
                                  placeholder="0.0"
                                  min="0"
                                  max="50"
                                  step="0.5"
                                  value={s.marks_obtained}
                                  onChange={(e) => handleMarksChange(s.student_id, e.target.value)}
                                  className="w-24 px-3 py-2 bg-white border border-slate-200 shadow-sm rounded-2xl rounded-xl text-right text-slate-900 text-xs focus:outline-none focus:border-blue-500 font-mono font-bold"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. ASSIGNMENTS VIEW */}
            {activeTab === 'assignments' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Create assignment Form */}
                  <div className="premium-card rounded-2xl p-6 bg-white shadow-sm border border-slate-200 space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center space-x-1.5">
                      <Plus className="h-4.5 w-4.5 text-blue-400" />
                      <span>Post Homework Assignment</span>
                    </h4>
                    <form onSubmit={handleCreateAssignment} className="space-y-3.5 text-left">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-600 uppercase">Assignment Title</label>
                        <input
                          type="text" required
                          value={assignForm.title}
                          onChange={(e) => setAssignForm({ ...assignForm, title: e.target.value })}
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 shadow-sm rounded-2xl rounded-xl text-slate-900 placeholder-slate-650 text-xs focus:outline-none focus:border-blue-500"
                          placeholder="e.g. Graph Algorithms Lab Sheet"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-600 uppercase">Description / Details</label>
                        <textarea
                          required
                          value={assignForm.description}
                          onChange={(e) => setAssignForm({ ...assignForm, description: e.target.value })}
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 shadow-sm rounded-2xl rounded-xl text-slate-900 placeholder-slate-650 text-xs focus:outline-none focus:border-blue-500"
                          placeholder="Instructions..."
                          rows={3}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-600 uppercase">Subject</label>
                        <select
                          value={assignForm.subject_id}
                          onChange={(e) => setAssignForm({ ...assignForm, subject_id: e.target.value })}
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 shadow-sm rounded-2xl rounded-xl text-slate-700 text-xs focus:outline-none"
                        >
                          <option value="">Select Subject</option>
                          {subjects.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-600 uppercase">Semester</label>
                          <select
                            value={assignForm.semester}
                            onChange={(e) => setAssignForm({ ...assignForm, semester: e.target.value })}
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
                            value={assignForm.section}
                            onChange={(e) => setAssignForm({ ...assignForm, section: e.target.value })}
                            className="w-full px-3 py-2.5 bg-white border border-slate-200 shadow-sm rounded-2xl rounded-xl text-slate-700 text-xs focus:outline-none"
                          >
                            {['A','B','C','D'].map(s => (
                              <option key={s} value={s}>Section {s}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-600 uppercase">Due Date</label>
                        <input
                          type="datetime-local" required
                          value={assignForm.due_date}
                          onChange={(e) => setAssignForm({ ...assignForm, due_date: e.target.value })}
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 shadow-sm rounded-2xl rounded-xl text-slate-700 text-xs focus:outline-none"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                      >
                        Publish Task
                      </button>
                    </form>
                  </div>

                  {/* Submission Log */}
                  <div className="premium-card rounded-2xl p-6 bg-white shadow-sm border border-slate-200 lg:col-span-2 space-y-4">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-200 pb-3">
                      <ListChecks className="h-4.5 w-4.5 text-blue-600" />
                      <span>Student Homework Submissions</span>
                    </h4>

                    <div className="overflow-x-auto max-h-[500px]">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase">
                            <th className="pb-2">Student</th>
                            <th className="pb-2">Assignment</th>
                            <th className="pb-2">Sub. Date</th>
                            <th className="pb-2 text-right">Marks / Status</th>
                            <th className="pb-2 text-right">Grade Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {submissions.map((sub) => (
                            <tr key={sub.id} className="border-b border-slate-200/40 hover:bg-slate-100/5 text-slate-600">
                              <td className="py-2 font-mono text-[10px]">{sub.student_id.slice(0,8)}</td>
                              <td className="py-2 font-bold text-slate-850">
                                {assignments.find(a => a.id === sub.assignment_id)?.title || 'Task'}
                              </td>
                              <td className="py-2 font-mono">{new Date(sub.created_at).toLocaleDateString()}</td>
                              <td className="py-2 text-right font-mono font-bold text-indigo-400">
                                {sub.status === 'graded' ? `${sub.marks_obtained} / 50` : 'Ungraded'}
                              </td>
                              <td className="py-2 text-right">
                                <button
                                  onClick={() => { setGradingSubId(sub.id); setGradingForm({ marks_obtained: sub.marks_obtained || '', feedback: sub.feedback || '' }); }}
                                  className="px-2.5 py-1 bg-blue-500/15 hover:bg-blue-500/25 border border-blue-200 text-blue-600 rounded text-[9px] font-bold uppercase cursor-pointer"
                                >
                                  Grade
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Grading overlay form */}
                    {gradingSubId && (
                      <div className="p-4 bg-slate-100/50 border border-slate-200 rounded-2xl space-y-3 mt-4 text-left">
                        <h5 className="text-[10px] font-bold text-slate-800 uppercase tracking-wider block">Submit Marks & Review</h5>
                        <form onSubmit={handleGradeSubmission} className="flex gap-4 items-end">
                          <div className="space-y-1">
                            <label className="text-[8px] font-bold text-slate-600 uppercase">Marks</label>
                            <input
                              type="number" required max="50" step="0.5"
                              value={gradingForm.marks_obtained}
                              onChange={(e) => setGradingForm({ ...gradingForm, marks_obtained: e.target.value })}
                              className="px-3 py-2 bg-white border border-slate-200 shadow-sm rounded-2xl rounded-xl text-slate-900 text-xs w-24"
                            />
                          </div>
                          <div className="flex-1 space-y-1">
                            <label className="text-[8px] font-bold text-slate-600 uppercase">Feedback Comments</label>
                            <input
                              type="text" required
                              value={gradingForm.feedback}
                              onChange={(e) => setGradingForm({ ...gradingForm, feedback: e.target.value })}
                              className="w-full px-3 py-2 bg-white border border-slate-200 shadow-sm rounded-2xl rounded-xl text-slate-900 text-xs"
                              placeholder="Great logic, structure is clean."
                            />
                          </div>
                          <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl cursor-pointer">
                            Post
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 5. TIMETABLE VIEW */}
            {activeTab === 'timetable' && (
              <div className="space-y-4">
                <div className="border-b border-slate-200 pb-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-850">Academic Class Timetable</h3>
                </div>

                <div className="premium-card rounded-2xl p-6 bg-white shadow-sm border border-slate-200">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase">
                          <th className="pb-3">Day of Week</th>
                          <th className="pb-3">Period 1</th>
                          <th className="pb-3">Period 2</th>
                          <th className="pb-3">Period 3</th>
                          <th className="pb-3">Period 4</th>
                          <th className="pb-3">Period 5</th>
                        </tr>
                      </thead>
                      <tbody>
                        {timetables.map((item, idx) => (
                          <tr key={idx} className="border-b border-slate-200/40 hover:bg-slate-100/5 text-slate-600">
                            <td className="py-3.5 font-bold text-slate-800">{item.day_of_week}</td>
                            <td className="py-3.5 font-mono text-indigo-400">{item.period_1_subject_id || 'Free'}</td>
                            <td className="py-3.5 font-mono text-indigo-400">{item.period_2_subject_id || 'Free'}</td>
                            <td className="py-3.5 font-mono text-indigo-400">{item.period_3_subject_id || 'Free'}</td>
                            <td className="py-3.5 font-mono text-indigo-400">{item.period_4_subject_id || 'Free'}</td>
                            <td className="py-3.5 font-mono text-indigo-400">{item.period_5_subject_id || 'Free'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
