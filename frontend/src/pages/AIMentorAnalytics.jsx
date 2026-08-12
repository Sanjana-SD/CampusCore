import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { 
  Users, Award, ClipboardList, Database, ShieldAlert, Search, RefreshCw, BarChart2, CheckCircle2, TrendingUp, HelpCircle, Sparkles, Target, Star, Briefcase, Plus, Trash2, ListChecks
} from 'lucide-react';

export default function AIMentorAnalytics() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [performanceRecords, setPerformanceRecords] = useState([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('All');

  const [activePanelTab, setActivePanelTab] = useState('roster');
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [newJob, setNewJob] = useState({
    company_name: '',
    role: '',
    description: '',
    package_lpa: '',
    skills_required: '',
    location: ''
  });

  const fetchJobs = async () => {
    try {
      const res = await api.get('/campus360/jobs');
      setJobs(res || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchApplications = async () => {
    try {
      const res = await api.get('/campus360/jobs/applications');
      setApplications(res || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (activePanelTab === 'jobs') {
      fetchJobs();
    } else if (activePanelTab === 'applications') {
      fetchApplications();
    }
  }, [activePanelTab]);

  const handlePostJob = async (e) => {
    e.preventDefault();
    try {
      const skillsArray = newJob.skills_required.split(',').map(s => s.trim()).filter(Boolean);
      const res = await api.post('/campus360/jobs', {
        ...newJob,
        skills_required: skillsArray
      });
      if (res.success) {
        setNewJob({ company_name: '', role: '', description: '', package_lpa: '', skills_required: '', location: '' });
        fetchJobs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteJob = async (jobId) => {
    try {
      const res = await api.delete(`/campus360/jobs/${jobId}`);
      if (res.success) {
        fetchJobs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/analytics');
      
      if (res.ai_stats) {
        setStats(res.ai_stats.stats);
        setRecentLogs(res.ai_stats.recent_logs || []);
        setPerformanceRecords(res.ai_stats.student_performance || []);
      }
    } catch (err) {
      console.error('Error fetching AI analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  const filteredStudents = performanceRecords.filter(rec => {
    const nameMatch = `${rec.first_name} ${rec.last_name}`.toLowerCase().includes(searchQuery.toLowerCase());
    const classMatch = filterClass === 'All' || rec.classification === filterClass;
    return nameMatch && classMatch;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Overview header */}
      <div className="glass-card rounded-2xl p-6 bg-slate-900/10 border border-slate-900/80 flex flex-col md:flex-row md:items-center justify-between gap-4 hover-glow transition-all duration-300">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-blue-600/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold tracking-wide uppercase">
            <Sparkles className="h-3 w-3" />
            <span>Placement Officer Analytics</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white leading-snug">
            Technical Skill Gap & Placement Readiness Dashboard
          </h2>
          <p className="text-xs text-slate-405">
            Aggregated metric overview of student levels, technical quiz averages, and NLP keyword metrics.
          </p>
        </div>
        <button
          onClick={fetchAnalyticsData}
          className="px-5 py-2.5 bg-slate-950 border border-slate-850 hover:border-slate-800 text-slate-300 hover:text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 transition-all cursor-pointer shrink-0 hover-scale"
        >
          <RefreshCw className="h-4 w-4 shrink-0" />
          <span>Refresh Reports</span>
        </button>
      </div>

      {/* Aggregate metrics grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {[
          { count: stats?.total_participants || 0, label: 'Active Students', desc: 'Participating in AI mentor' },
          { count: `${Math.round(stats?.avg_total || 0)} / 100`, label: 'Average Score', desc: 'Mean total performance score' },
          { count: `${Math.round(stats?.avg_quiz || 0)} / 50`, label: 'Average Quiz', desc: 'Baseline domain competence' },
          { count: `${Math.round(stats?.avg_resume || 0)} / 30`, label: 'Average Resume', desc: 'NLP skill keyword index' }
        ].map((stat, idx) => (
          <div key={idx} className="glass-card rounded-2xl p-6 border border-slate-900 bg-slate-900/10 text-center space-y-1.5 hover-glow transition-all">
            <div className="text-2xl font-black bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">{stat.count}</div>
            <div className="text-xs font-bold text-slate-200">{stat.label}</div>
            <div className="text-[10px] text-slate-500">{stat.desc}</div>
          </div>
        ))}
      </div>

      {/* Sub tabs selector */}
      <div className="flex border-b border-slate-900 pb-2 gap-1.5 scrollbar-none">
        {[
          { id: 'roster', label: 'Student Directory', icon: Users },
          { id: 'jobs', label: 'Job Listings Manager', icon: Briefcase },
          { id: 'applications', label: 'Student Applications', icon: ListChecks }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activePanelTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActivePanelTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide shrink-0 transition-all cursor-pointer ${
                isActive 
                  ? 'bg-blue-600/90 text-white shadow-lg border border-blue-500/25' 
                  : 'text-slate-350 hover:bg-slate-900/60 hover:text-white border border-transparent'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area based on Tab */}
        <div className="lg:col-span-2 space-y-6">
          {activePanelTab === 'roster' && (
            <div className="glass-card rounded-2xl p-6 space-y-6 hover-glow transition-all">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-4">
                <h3 className="text-sm font-extrabold text-slate-200 flex items-center space-x-2.5">
                  <Users className="h-4.5 w-4.5 text-blue-400" />
                  <span>Student Performance Directory</span>
                </h3>

                <div className="flex flex-wrap gap-2">
                  {/* Classification Selector */}
                  <select
                    value={filterClass}
                    onChange={(e) => setFilterClass(e.target.value)}
                    className="px-3 py-2 bg-slate-950 border border-slate-900 rounded-xl text-slate-300 focus:outline-none text-xs font-semibold cursor-pointer"
                  >
                    <option value="All">All Tracks</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>

                  {/* Roster Search Input */}
                  <div className="relative w-44">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                      <Search className="h-3.5 w-3.5" />
                    </span>
                    <input
                      type="text"
                      placeholder="Search student..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-900 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-900 text-slate-400">
                      <th className="pb-3 font-bold uppercase tracking-wider">Student Name</th>
                      <th className="pb-3 font-bold uppercase tracking-wider">Classification Level</th>
                      <th className="pb-3 font-bold uppercase tracking-wider text-right">Quiz Marks</th>
                      <th className="pb-3 font-bold uppercase tracking-wider text-right">Resume Marks</th>
                      <th className="pb-3 font-bold uppercase tracking-wider text-right text-blue-400">Total Index</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-4 text-center text-slate-500">No student profiles match filter criteria.</td>
                      </tr>
                    ) : (
                      filteredStudents.map((rec, idx) => (
                        <tr key={idx} className="border-b border-slate-900/60 hover:bg-slate-900/5">
                          <td className="py-3.5 font-semibold text-slate-200">{rec.first_name} {rec.last_name}</td>
                          <td className="py-3.5">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border uppercase tracking-wide ${
                              rec.classification === 'Advanced' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-450' :
                              rec.classification === 'Intermediate' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                              'bg-amber-500/10 border-amber-500/20 text-amber-400'
                            }`}>
                              {rec.classification}
                            </span>
                          </td>
                          <td className="py-3.5 text-right font-mono font-semibold">{rec.quiz_score} / 50</td>
                          <td className="py-3.5 text-right font-mono font-semibold">{rec.resume_score} / 30</td>
                          <td className="py-3.5 text-right text-blue-400">
                            <span className="inline-block px-2.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 font-black font-mono">
                              {rec.total_score} / 100
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activePanelTab === 'jobs' && (
            <div className="glass-card rounded-2xl p-6 space-y-6 hover-glow transition-all">
              {/* Post job form */}
              <div className="p-5 bg-slate-950/40 border border-slate-900 rounded-2xl space-y-4">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                  <Plus className="h-4 w-4 text-blue-400" />
                  <span>Create Placement Job Posting</span>
                </h4>
                
                <form onSubmit={handlePostJob} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Company Name</label>
                    <input
                      type="text"
                      required
                      value={newJob.company_name}
                      onChange={(e) => setNewJob({ ...newJob, company_name: e.target.value })}
                      placeholder="e.g. Google"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-900 rounded-xl text-slate-100 placeholder-slate-650 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Job Role</label>
                    <input
                      type="text"
                      required
                      value={newJob.role}
                      onChange={(e) => setNewJob({ ...newJob, role: e.target.value })}
                      placeholder="e.g. Software Engineer Intern"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-900 rounded-xl text-slate-100 placeholder-slate-650 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Package (LPA)</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      value={newJob.package_lpa}
                      onChange={(e) => setNewJob({ ...newJob, package_lpa: e.target.value })}
                      placeholder="e.g. 24.5"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-900 rounded-xl text-slate-100 placeholder-slate-650 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Location</label>
                    <input
                      type="text"
                      value={newJob.location}
                      onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                      placeholder="e.g. Bangalore (Hybrid)"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-900 rounded-xl text-slate-100 placeholder-slate-650 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Skills Required (Comma separated)</label>
                    <input
                      type="text"
                      required
                      value={newJob.skills_required}
                      onChange={(e) => setNewJob({ ...newJob, skills_required: e.target.value })}
                      placeholder="React, Node, SQL, Docker"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-900 rounded-xl text-slate-100 placeholder-slate-650 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Description</label>
                    <textarea
                      required
                      rows="3"
                      value={newJob.description}
                      onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                      placeholder="Write brief requirements..."
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-900 rounded-xl text-slate-100 placeholder-slate-650 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2 pt-2">
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-[10px] uppercase tracking-wider transition-all hover-scale cursor-pointer"
                    >
                      Post Placement Opportunity
                    </button>
                  </div>
                </form>
              </div>

              {/* Jobs directory */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider block text-left">Active Job Postings</h4>
                <div className="overflow-x-auto max-h-[300px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-900 text-slate-400">
                        <th className="pb-2 font-bold uppercase tracking-wider">Company</th>
                        <th className="pb-2 font-bold uppercase tracking-wider">Role</th>
                        <th className="pb-2 font-bold uppercase tracking-wider text-right">Package</th>
                        <th className="pb-2 font-bold uppercase tracking-wider text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="py-4 text-center text-slate-500">No active job listings.</td>
                        </tr>
                      ) : (
                        jobs.map((job) => (
                          <tr key={job.id} className="border-b border-slate-900/60 hover:bg-slate-900/5">
                            <td className="py-2.5 font-bold text-slate-200">{job.company_name}</td>
                            <td className="py-2.5 text-slate-450">{job.role}</td>
                            <td className="py-2.5 text-right font-mono font-bold text-emerald-400">₹ {parseFloat(job.package_lpa).toFixed(2)} LPA</td>
                            <td className="py-2.5 text-right">
                              <button
                                onClick={() => handleDeleteJob(job.id)}
                                className="p-1 bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 text-rose-455 rounded transition-all cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activePanelTab === 'applications' && (
            <div className="glass-card rounded-2xl p-6 space-y-4 hover-glow transition-all">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider block text-left">Student Job Applications Log</h4>
              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-900 text-slate-400">
                      <th className="pb-2.5 font-bold uppercase">Student Name</th>
                      <th className="pb-2.5 font-bold uppercase">Company</th>
                      <th className="pb-2.5 font-bold uppercase">Applied Role</th>
                      <th className="pb-2.5 font-bold uppercase text-right">Status</th>
                      <th className="pb-2.5 font-bold uppercase text-right">Date Applied</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-4 text-center text-slate-500">No student applications received yet.</td>
                      </tr>
                    ) : (
                      applications.map((app) => (
                        <tr key={app.id} className="border-b border-slate-900/60 hover:bg-slate-900/5">
                          <td className="py-3 font-semibold text-slate-200">{app.first_name} {app.last_name}</td>
                          <td className="py-3 text-slate-400 font-bold">{app.company_name}</td>
                          <td className="py-3 text-slate-450">{app.role}</td>
                          <td className="py-3 text-right">
                            <span className="inline-block px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-450 border border-blue-500/20 text-[9px] font-extrabold uppercase">
                              {app.status}
                            </span>
                          </td>
                          <td className="py-3 text-right font-mono font-semibold text-slate-500">
                            {new Date(app.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* AI logs list */}
        <div className="glass-card rounded-2xl p-6 space-y-4 hover-glow transition-all">
          <h3 className="text-sm font-extrabold text-slate-200 border-b border-slate-900 pb-3 flex items-center space-x-2.5">
            <ClipboardList className="h-4.5 w-4.5 text-blue-400" />
            <span>AI Mentor Action Logs</span>
          </h3>

          <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-2">
            {recentLogs.length === 0 ? (
              <p className="text-slate-500 text-center py-6 text-xs">No logs recorded.</p>
            ) : (
              recentLogs.map((log) => (
                <div key={log.id} className="p-3.5 bg-slate-950/40 border border-slate-900 rounded-2xl space-y-1.5 hover:border-slate-800 transition-all">
                  <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                    <span className="text-blue-450">{log.action_type}</span>
                    <span className="font-mono text-slate-500">{new Date(log.created_at).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-350 leading-relaxed text-[11px]">{log.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
