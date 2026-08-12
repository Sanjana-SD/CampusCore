'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { 
  Users, Award, ClipboardList, Database, ShieldAlert, Search, RefreshCw, BarChart2, 
  CheckCircle2, TrendingUp, HelpCircle, Sparkles, Target, Star, Briefcase, Plus, Trash2, 
  ListChecks, LogOut, Building2, BookOpen, GraduationCap, Download, Upload, MessageSquare, Send, Calendar
} from 'lucide-react';

export default function StudentDashboard() {
  const router = useRouter();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Database datasets
  const [attendance, setAttendance] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [marks, setMarks] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);

  // AI Career Mentor states
  const [resumeText, setResumeText] = useState('');
  const [selectedGoal, setSelectedGoal] = useState('Software Engineer');
  const [roadmap, setRoadmap] = useState<any>(null);
  const [mentoring, setMentoring] = useState(false);

  // Submission Form
  const [submitForm, setSubmitForm] = useState({ assignment_id: '', file_url: '' });

  // Chat Form
  const [newMsg, setNewMsg] = useState('');
  const [chatRoster, setChatRoster] = useState<any[]>([]);
  const [activeChatUserId, setActiveChatUserId] = useState('');

  // Notifications
  const [feedback, setFeedback] = useState({ text: '', error: false });

  const showFeedback = (text: string, error = false) => {
    setFeedback({ text, error });
    setTimeout(() => setFeedback({ text: '', error: false }), 4000);
  };

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      
      let activeProfile: any = null;
      let activeUserId = 'demo-student-id';

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          activeUserId = user.id;
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
          activeProfile = profile;
        }
      } catch (e) {}

      if (!activeProfile) {
        const rawSession = typeof window !== 'undefined' ? localStorage.getItem('campuscore_session') : null;
        if (rawSession) {
          try {
            const sess = JSON.parse(rawSession);
            activeProfile = { full_name: sess.full_name || 'Sanjana S D', email: sess.email || 'sanjana@campuscore.edu', role: 'student', usn_emp_id: '1KT22CS042' };
          } catch (e) {}
        }
      }

      if (!activeProfile) {
        activeProfile = { full_name: 'Sanjana S D', email: 'sanjana@campuscore.edu', role: 'student', usn_emp_id: '1KT22CS042' };
      }

      setCurrentUser(activeProfile);

      // Load static data
      const attRes = await fetch(`/api/admin/crud?table=attendance&filterCol=student_id&filterVal=${activeUserId}`);
      setAttendance(await attRes.json());

      const asRes = await fetch('/api/admin/crud?table=assignments');
      setAssignments(await asRes.json());

      const sbmsRes = await fetch(`/api/admin/crud?table=submissions&filterCol=student_id&filterVal=${activeUserId}`);
      setSubmissions(await sbmsRes.json());

      const mkRes = await fetch(`/api/admin/crud?table=marks&filterCol=student_id&filterVal=${activeUserId}`);
      setMarks(await mkRes.json());

      const jbRes = await fetch('/api/admin/crud?table=jobs');
      setJobs(await jbRes.json());

      const apRes = await fetch(`/api/admin/crud?table=applications&filterCol=student_id&filterVal=${activeUserId}`);
      setApplications(await apRes.json());

      // Fetch active roadmap
      const rdRes = await fetch('/api/student/mentor');
      const rdData = await rdRes.json();
      if (rdData.roadmap) {
        setRoadmap(rdData.roadmap.roadmap_json);
      }

      // Load chat contacts (Faculty & Admins)
      const ctRes = await fetch('/api/admin/users');
      const ctData = await ctRes.json();
      if (Array.isArray(ctData)) {
        setChatRoster(ctData.filter((c: any) => c.id !== activeUserId));
      }

      // Load messages
      const msgRes = await fetch('/api/admin/crud?table=messages');
      setMessages(await msgRes.json());

    } catch (err) {
      showFeedback('Error loading student dashboard.', true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
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


  // Submit Homework Action
  const handleSubmitHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submitForm.assignment_id || !submitForm.file_url) {
      showFeedback('Please fill out the assignment submission fields.', true);
      return;
    }

    try {
      const res = await fetch('/api/admin/crud?table=submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignment_id: submitForm.assignment_id,
          student_id: currentUser?.id,
          file_url: submitForm.file_url,
          status: 'submitted'
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      showFeedback('Homework assignment uploaded successfully!');
      setSubmitForm({ assignment_id: '', file_url: '' });
      fetchStudentData();
    } catch (err: any) {
      showFeedback(err.message || 'Failed to submit assignment', true);
    }
  };

  // Compile AI Roadmap Action
  const handleCompileRoadmap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeText) {
      showFeedback('Please paste your resume credentials.', true);
      return;
    }

    setMentoring(true);
    try {
      const res = await fetch('/api/student/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText,
          selectedCareerGoal: selectedGoal,
          academicPerformance: '85%' // mocked grade average index
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setRoadmap(data.recommendations);
      showFeedback('AI Career Mentor plan generated!');
    } catch (err: any) {
      showFeedback(err.message || 'Failed to compile career roadmap.', true);
    } finally {
      setMentoring(false);
    }
  };

  // Apply Placements Drive
  const handleApplyPlacement = async (jobId: string) => {
    try {
      const res = await fetch('/api/admin/crud?table=applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: jobId,
          student_id: currentUser?.id,
          status: 'applied'
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      showFeedback('Registered application for placement drive!');
      fetchStudentData();
    } catch (err: any) {
      showFeedback(err.message || 'Failed to apply.', true);
    }
  };

  // Chat Messenger Sending Action
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg || !activeChatUserId) return;

    try {
      const res = await fetch('/api/admin/crud?table=messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: currentUser?.id,
          receiver_id: activeChatUserId,
          content: newMsg
        })
      });

      if (res.ok) {
        setNewMsg('');
        fetchStudentData();
      }
    } catch {
      showFeedback('Chat message failed to send.', true);
    }
  };

  // Calculate matching details
  const getMatchDetails = (jobSkills: any[]) => {
    if (!roadmap?.currentSkills || !jobSkills) return { score: 0, matched: [], missing: jobSkills };
    
    const clientSkillsLower = roadmap.currentSkills.map((s: string) => s.toLowerCase());
    const matched = jobSkills.filter(s => clientSkillsLower.includes(s.toLowerCase()));
    const missing = jobSkills.filter(s => !clientSkillsLower.includes(s.toLowerCase()));
    const score = jobSkills.length > 0 ? Math.round((matched.length / jobSkills.length) * 100) : 0;
    
    return { score, matched, missing };
  };

  const getAttendancePercentage = () => {
    if (attendance.length === 0) return 100;
    const presentCount = attendance.filter(a => a.status === 'present').length;
    return Math.round((presentCount / attendance.length) * 100);
  };

  return (
    <div className="min-h-screen mesh-bg text-slate-900 flex relative overflow-hidden font-sans">
      {/* Glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-50/30 rounded-full blur-[80px] pointer-events-none"></div>

      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 bg-white/80 backdrop-blur-md flex flex-col justify-between p-6 shrink-0 relative z-20">
        <div className="space-y-8">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-extrabold text-white text-base">
              CC
            </div>
            <div>
              <h1 className="text-sm font-black tracking-wide leading-none">CampusCore</h1>
              <span className="text-[9px] text-slate-600 font-bold uppercase tracking-wider">Student Hub</span>
            </div>
          </div>

          <nav className="space-y-1">
            {[
              { id: 'overview', label: 'Student Home', icon: BarChart2 },
              { id: 'attendance', label: 'My Attendance', icon: ClipboardList },
              { id: 'grades', label: 'Internal Marks', icon: Award },
              { id: 'homework', label: 'Assignments', icon: ListChecks },
              { id: 'mentor', label: 'AI Career Mentor', icon: Target },
              { id: 'placements', label: 'Job Placements', icon: Briefcase },
              { id: 'chat', label: 'Messenger', icon: MessageSquare }
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

        <div className="pt-4 border-t border-slate-200 space-y-3">
          <div className="flex items-center space-x-2.5">
            <div className="h-7 w-7 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-blue-400">S</div>
            <div>
              <p className="text-[10px] font-bold text-slate-600">{currentUser?.full_name || 'Student profile'}</p>
              <p className="text-[8px] text-slate-600 uppercase font-black tracking-widest">{currentUser?.usn_emp_id}</p>
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
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-wide">Student Dashboard</h2>
            <p className="text-[10px] text-slate-600">Workspace Portal, Sem {currentUser?.semester || '1'} — {currentUser?.section || 'A'}</p>
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
                {/* Stats ring cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Attendance ring */}
                  <div className="premium-card rounded-3xl p-6 bg-slate-50/40 border border-slate-150 border border-slate-200 hover-glow transition-all flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest block">Attendance Summary</span>
                      <h4 className="text-lg font-black text-slate-800">{getAttendancePercentage()}% Present</h4>
                      <p className="text-[10px] text-slate-600">Active sessions: {attendance.length}</p>
                    </div>
                    <div className="h-14 w-14 rounded-full border-[6px] border-blue-200 border-t-blue-500 flex items-center justify-center font-bold text-xs font-mono">
                      {getAttendancePercentage()}%
                    </div>
                  </div>

                  {/* Marks Card */}
                  <div className="premium-card rounded-3xl p-6 bg-slate-50/40 border border-slate-150 border border-slate-200 hover-glow transition-all flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest block">Academic Evaluation</span>
                      <h4 className="text-lg font-black text-slate-800">{marks.length > 0 ? `${(marks.reduce((a,b) => a+parseFloat(b.marks_obtained), 0)/marks.length).toFixed(1)} / 50` : 'N/A'}</h4>
                      <p className="text-[10px] text-slate-600">Graded assessment entries: {marks.length}</p>
                    </div>
                    <Award className="h-10 w-10 text-indigo-400 shrink-0" />
                  </div>

                  {/* Placements Matching */}
                  <div className="premium-card rounded-3xl p-6 bg-slate-50/40 border border-slate-150 border border-slate-200 hover-glow transition-all flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest block">Recruitment Matches</span>
                      <h4 className="text-lg font-black text-slate-800">{jobs.length} Open Drives</h4>
                      <p className="text-[10px] text-slate-600">Applications submitted: {applications.length}</p>
                    </div>
                    <Briefcase className="h-10 w-10 text-emerald-400 shrink-0" />
                  </div>
                </div>
              </div>
            )}

            {/* 2. ATTENDANCE VIEW */}
            {activeTab === 'attendance' && (
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">My Attendance Calendars</h3>
                <div className="premium-card rounded-2xl p-6 bg-white shadow-sm border border-slate-200 max-w-3xl">
                  {attendance.length === 0 ? (
                    <p className="text-slate-600 text-center py-6 text-xs">No attendance marked yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {attendance.map((att, idx) => (
                        <div key={idx} className="p-3 bg-white border border-slate-200 shadow-sm rounded-2xl rounded-xl flex justify-between items-center">
                          <div>
                            <span className="text-[11px] font-semibold text-slate-700">Date: {new Date(att.date).toLocaleDateString()}</span>
                            <div className="text-[9px] text-slate-600 font-mono mt-0.5">Subject: {att.subject_id}</div>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                            att.status === 'present' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {att.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. GRADES VIEW */}
            {activeTab === 'grades' && (
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">Assessment Scores Sheet</h3>
                <div className="premium-card rounded-2xl p-6 bg-white shadow-sm border border-slate-200 max-w-3xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase">
                          <th className="pb-3">Subject ID</th>
                          <th className="pb-3">Exam Type</th>
                          <th className="pb-3 text-right">Marks Obtained</th>
                          <th className="pb-3 text-right">Max Marks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {marks.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-4 text-center text-slate-600">No grades posted yet.</td>
                          </tr>
                        ) : (
                          marks.map((mk, idx) => (
                            <tr key={idx} className="border-b border-slate-200/40 hover:bg-slate-100/5 text-slate-600">
                              <td className="py-3 font-mono font-semibold text-indigo-400">{mk.subject_id}</td>
                              <td className="py-3 uppercase font-bold text-[10px]">{mk.exam_type.replace('_',' ')}</td>
                              <td className="py-3 text-right font-mono font-bold text-slate-900">{mk.marks_obtained}</td>
                              <td className="py-3 text-right font-mono text-slate-600">{mk.max_marks}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 4. ASSIGNMENTS VIEW */}
            {activeTab === 'homework' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Submit Form */}
                  <div className="premium-card rounded-2xl p-6 bg-white shadow-sm border border-slate-200 space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center space-x-1.5">
                      <Upload className="h-4.5 w-4.5 text-blue-400" />
                      <span>Upload Homework</span>
                    </h4>
                    <form onSubmit={handleSubmitHomework} className="space-y-3.5 text-left">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-600 uppercase">Select Assignment</label>
                        <select
                          value={submitForm.assignment_id}
                          onChange={(e) => setSubmitForm({ ...submitForm, assignment_id: e.target.value })}
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 shadow-sm rounded-2xl rounded-xl text-slate-700 text-xs focus:outline-none"
                        >
                          <option value="">Link Assignment</option>
                          {assignments.map(a => (
                            <option key={a.id} value={a.id}>{a.title}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-600 uppercase">Submission Link (PDF/Doc URL)</label>
                        <input
                          type="text" required
                          value={submitForm.file_url}
                          onChange={(e) => setSubmitForm({ ...submitForm, file_url: e.target.value })}
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 shadow-sm rounded-2xl rounded-xl text-slate-900 placeholder-slate-650 text-xs focus:outline-none focus:border-blue-500"
                          placeholder="e.g. https://supabase.co/storage/v1/object/public/assignments/sub_ rahul.pdf"
                        />
                      </div>
                      <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer">
                        Post Submission
                      </button>
                    </form>
                  </div>

                  {/* Assignments directory & submitted status */}
                  <div className="premium-card rounded-2xl p-6 bg-white shadow-sm border border-slate-200 lg:col-span-2 space-y-4">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-200 pb-3">
                      <ListChecks className="h-4.5 w-4.5 text-blue-600" />
                      <span>Assigned Homeworks</span>
                    </h4>

                    <div className="space-y-3.5 max-h-[400px] overflow-y-auto pr-2">
                      {assignments.map((item) => {
                        const sub = submissions.find(s => s.assignment_id === item.id);
                        return (
                          <div key={item.id} className="p-4 bg-white/80 border border-slate-200 shadow-sm rounded-xl rounded-2xl hover:border-slate-800 transition-all flex justify-between items-start gap-4">
                            <div className="space-y-1">
                              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 border border-blue-200/80 text-[8px] font-bold uppercase tracking-wider">
                                Due: {new Date(item.due_date).toLocaleDateString()}
                              </span>
                              <h5 className="text-xs font-bold text-slate-800 pt-1">{item.title}</h5>
                              <p className="text-[11px] text-slate-600 leading-relaxed">{item.description}</p>
                            </div>
                            
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase shrink-0 border ${
                              sub 
                                ? sub.status === 'graded' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-blue-500/10 border-blue-200 text-blue-400'
                                : 'bg-slate-100 border-slate-200 text-slate-600'
                            }`}>
                              {sub ? sub.status === 'graded' ? `Graded: ${sub.marks_obtained}` : 'Submitted' : 'Pending'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. AI CAREER MENTOR VIEW */}
            {activeTab === 'mentor' && (
              <div className="space-y-6">
                {/* Form to parse CV */}
                <div className="premium-card rounded-2xl p-6 bg-white shadow-sm border border-slate-200 space-y-4">
                  <div className="border-b border-slate-200 pb-3">
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">CampusCore AI Career Mentor</h3>
                    <p className="text-[10px] text-slate-600 mt-0.5">Resume uploader, skill-matching analyzer, and tailored roadmaps compiler.</p>
                  </div>

                  <form onSubmit={handleCompileRoadmap} className="space-y-4 text-left">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-600 uppercase">Target Career Role</label>
                        <select
                          value={selectedGoal}
                          onChange={(e) => setSelectedGoal(e.target.value)}
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 shadow-sm rounded-2xl rounded-xl text-slate-600 text-xs focus:outline-none"
                        >
                          <option value="Software Engineer">Software Engineer</option>
                          <option value="Data Scientist">Data Scientist</option>
                          <option value="DevOps Engineer">DevOps Engineer</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-600 uppercase">Paste CV Text Credentials</label>
                      <textarea
                        required
                        rows={5}
                        value={resumeText}
                        onChange={(e) => setResumeText(e.target.value)}
                        placeholder="Paste details of projects, certifications, past experiences, and skills from your resume..."
                        className="w-full px-3 py-2.5 bg-white border border-slate-200 shadow-sm rounded-2xl rounded-xl text-slate-900 placeholder-slate-650 text-xs focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={mentoring}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-600 text-white font-bold rounded-xl text-xs uppercase tracking-wide transition-all cursor-pointer flex items-center space-x-1.5"
                    >
                      {mentoring ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Target className="h-4 w-4" />
                          <span>Generate Career Blueprint</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {roadmap && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Metrics analysis */}
                    <div className="premium-card rounded-2xl p-6 bg-white shadow-sm border border-slate-200 space-y-6">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-3">AI Skill Gap matching</h4>
                      
                      <div className="space-y-4">
                        <div className="flex justify-between items-center text-xs font-bold font-mono">
                          <span className="text-slate-500">Match Rank:</span>
                          <span className="text-blue-600 uppercase">{roadmap.careerLevel}</span>
                        </div>

                        <div className="space-y-2 text-left">
                          <span className="text-[9px] text-slate-600 font-bold uppercase">Matched Credentials</span>
                          <div className="flex flex-wrap gap-1.5">
                            {roadmap.currentSkills?.map((s: string, idx: number) => (
                              <span key={idx} className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/15 text-emerald-400 text-[9px] font-bold uppercase font-mono">✓ {s}</span>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2 text-left">
                          <span className="text-[9px] text-slate-600 font-bold uppercase">Missing tags</span>
                          <div className="flex flex-wrap gap-1.5">
                            {roadmap.missingSkills?.map((s: string, idx: number) => (
                              <span key={idx} className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/15 text-rose-600 text-[9px] font-bold uppercase font-mono">✗ {s}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Timeline roadmap plans */}
                    <div className="premium-card rounded-2xl p-6 bg-white shadow-sm border border-slate-200 lg:col-span-2 space-y-4 text-left">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-3">30/60/90 Days Roadmap Guide</h4>
                      
                      <div className="space-y-4">
                        {[
                          { title: 'Plan 30 Days', desc: roadmap.learningRoadmap?.plan30 },
                          { title: 'Plan 60 Days', desc: roadmap.learningRoadmap?.plan60 },
                          { title: 'Plan 90 Days', desc: roadmap.learningRoadmap?.plan90 }
                        ].map((m, idx) => (
                          <div key={idx} className="p-4 bg-white/80 border border-slate-200 shadow-sm rounded-xl rounded-2xl space-y-1 hover:border-slate-800 transition-all">
                            <h5 className="text-xs font-black text-indigo-400 uppercase font-mono">{m.title}</h5>
                            <p className="text-[11px] text-slate-600 leading-relaxed">{m.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 6. PLACEMENTS VIEW */}
            {activeTab === 'placements' && (
              <div className="space-y-6">
                <div className="border-b border-slate-200 pb-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-850">Placement Jobs & Match Scores</h3>
                </div>

                <div className="space-y-4">
                  {jobs.map((job) => {
                    const reqSkills = Array.isArray(job.skills_required) 
                      ? job.skills_required 
                      : (typeof job.skills_required === 'string' ? JSON.parse(job.skills_required) : []);
                    
                    const { score, matched, missing } = getMatchDetails(reqSkills);
                    const isApplied = applications.some(a => a.job_id === job.id);

                    return (
                      <div key={job.id} className="p-5 bg-white shadow-sm border border-slate-200 rounded-3xl hover-glow transition-all space-y-4 text-left">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-200/80 pb-3">
                          <div className="space-y-0.5">
                            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 border border-blue-200 text-[9px] font-bold uppercase tracking-wider">{job.company_name}</span>
                            <h4 className="text-sm font-bold text-slate-800 pt-1">{job.role}</h4>
                          </div>
                          <span className="px-3 py-1 rounded bg-emerald-500/10 text-emerald-600 font-black text-xs font-mono border border-emerald-500/20 shrink-0">
                            ₹ {parseFloat(job.package_lpa).toFixed(2)} LPA
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 leading-relaxed">{job.description}</p>

                        <div className="p-4 bg-slate-100/50 border border-slate-200 rounded-2xl space-y-2.5">
                          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                            <span className="text-slate-600 flex items-center space-x-1">
                              <Target className="h-3.5 w-3.5 text-indigo-400" />
                              <span>AI Match Analytics</span>
                            </span>
                            <span className="font-mono text-indigo-400">{score}% Match Score</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${score}%` }}></div>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-2">
                          <div className="flex flex-wrap gap-1">
                            {matched.map((sk, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[8px] font-bold border border-emerald-500/15 uppercase font-mono">✓ {sk}</span>
                            ))}
                            {missing.map((sk, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 text-[8px] font-bold border border-rose-500/15 uppercase font-mono">✗ {sk}</span>
                            ))}
                          </div>
                          <button
                            onClick={() => handleApplyPlacement(job.id)}
                            disabled={isApplied}
                            className={`px-4.5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wide transition-all cursor-pointer ${
                              isApplied 
                                ? 'bg-slate-100 border border-slate-200 text-slate-600 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-600 text-white shadow-lg'
                            }`}
                          >
                            {isApplied ? 'Applied' : 'Apply Now'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 7. CHAT MESSENGER VIEW */}
            {activeTab === 'chat' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[500px]">
                {/* Contacts list */}
                <div className="glass-card rounded-2xl p-4 bg-white shadow-sm border border-slate-200 overflow-y-auto space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest block border-b border-slate-200 pb-2">Academic Directory</h4>
                  <div className="space-y-1.5">
                    {chatRoster.map(contact => (
                      <button
                        key={contact.id}
                        onClick={() => setActiveChatUserId(contact.id)}
                        className={`w-full text-left p-3 rounded-xl text-xs font-bold transition-all cursor-pointer block border ${
                          activeChatUserId === contact.id 
                            ? 'bg-blue-600 text-white border-blue-200' 
                            : 'bg-slate-50 text-slate-500 hover:text-white border-transparent'
                        }`}
                      >
                        <div>{contact.full_name}</div>
                        <span className="text-[9px] uppercase font-mono text-slate-600">{contact.role}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message display panel */}
                <div className="glass-card rounded-2xl p-4 bg-white shadow-sm border border-slate-200 md:col-span-2 flex flex-col justify-between overflow-hidden relative">
                  {activeChatUserId ? (
                    <>
                      {/* Messages body */}
                      <div className="flex-1 overflow-y-auto pr-1 space-y-3 p-2">
                        {messages.filter(m => 
                          (m.sender_id === currentUser?.id && m.receiver_id === activeChatUserId) ||
                          (m.sender_id === activeChatUserId && m.receiver_id === currentUser?.id)
                        ).map((msg, idx) => {
                          const isMe = msg.sender_id === currentUser?.id;
                          return (
                            <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                              <div className={`p-3 rounded-2xl max-w-xs text-xs leading-relaxed ${
                                isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 shadow-sm rounded-2xl text-slate-800 rounded-tl-none'
                              }`}>
                                {msg.content}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Text Input footer */}
                      <form onSubmit={handleSendChat} className="flex gap-2 border-t border-slate-200 pt-3 mt-2 shrink-0">
                        <input
                          type="text"
                          value={newMsg}
                          onChange={(e) => setNewMsg(e.target.value)}
                          className="flex-1 px-3.5 py-2.5 bg-white border border-slate-200 shadow-sm rounded-2xl rounded-xl text-slate-900 placeholder-slate-650 text-xs focus:outline-none focus:border-blue-500"
                          placeholder="Type your message..."
                        />
                        <button type="submit" className="p-2.5 bg-blue-600 hover:bg-blue-600 text-white rounded-xl cursor-pointer">
                          <Send className="h-4 w-4" />
                        </button>
                      </form>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-600 text-xs space-y-2">
                      <MessageSquare className="h-8 w-8 text-slate-600" />
                      <p>Select a contact from academic directory to begin chat.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
