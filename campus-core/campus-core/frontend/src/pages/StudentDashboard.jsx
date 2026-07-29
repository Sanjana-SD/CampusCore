import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { UserCheck, BookOpen, GraduationCap, Rss, CalendarDays, RefreshCw } from 'lucide-react';
import CampusCoreAIMentor from './CampusCoreAIMentor';

export default function StudentDashboard({ studentId, activeTab }) {
  const [attendance, setAttendance] = useState(null);
  const [timetable, setTimetable] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loans, setLoans] = useState([]);
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentInfo, setStudentInfo] = useState(null);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      // 1. Fetch info
      const sInfo = await api.get(`/students/${studentId}`);
      setStudentInfo(sInfo);

      // 2. Fetch attendance
      const attData = await api.get(`/students/${studentId}/attendance`);
      setAttendance(attData);

      // 3. Fetch timetable
      const ttData = await api.get(`/students/${studentId}/timetable`);
      setTimetable(ttData);

      // 4. Fetch grades
      const gradeData = await api.get(`/assessments/student/${studentId}`);
      setGrades(gradeData);

      // 5. Fetch library loans
      const loanData = await api.get(`/library/loans/student/${studentId}`);
      setLoans(loanData);

      // 6. Fetch feed (global + class specific)
      const feedData = await api.get(`/feed?classId=${sInfo.class_id}`);
      setFeed(feedData);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentData();
  }, [studentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  // Helper to format durations
  const formatDuration = (seconds) => {
    if (!seconds) return '0s';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs}h ${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Student Profile summary banner */}
      <div className="glass-card rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{studentInfo?.first_name} {studentInfo?.last_name}</h2>
          <p className="text-sm text-slate-400">Class: {studentInfo?.class_name || 'Unassigned'} • Card UID: {studentInfo?.rfid_uid}</p>
        </div>
        <div className="flex space-x-6 text-xs text-slate-400">
          <div>
            <p className="font-semibold text-slate-300">Enrollment Status</p>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold uppercase text-[10px]">
              {studentInfo?.enrollment_status}
            </span>
          </div>
          <div>
            <p className="font-semibold text-slate-300">Parent / Guardian</p>
            <p className="mt-1 text-slate-200 font-medium">{studentInfo?.parent_name || 'Not Linked'}</p>
          </div>
        </div>
      </div>

      {/* Render based on selected Tab in Sidebar */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Gate attendance history */}
          <div className="glass-card rounded-2xl p-6 lg:col-span-2 space-y-6">
            <h3 className="text-base font-bold text-slate-200 border-b border-slate-800 pb-3 flex items-center space-x-2">
              <UserCheck className="h-4.5 w-4.5 text-blue-400" />
              <span>Campus Access Log (IN/OUT history)</span>
            </h3>

            <div className="overflow-x-auto max-h-64">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-2 font-semibold">Date</th>
                    <th className="pb-2 font-semibold">Terminal Gate</th>
                    <th className="pb-2 font-semibold">Scan Type</th>
                    <th className="pb-2 font-semibold text-right">Time Recorded</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance?.raw_events?.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-4 text-center text-slate-500">No logs found.</td>
                    </tr>
                  ) : (
                    attendance?.raw_events?.map((evt, idx) => (
                      <tr key={idx} className="border-b border-slate-850">
                        <td className="py-2.5 font-medium">{new Date(evt.timestamp).toLocaleDateString()}</td>
                        <td className="py-2.5 text-slate-400">{evt.device_id}</td>
                        <td className="py-2.5">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            evt.type === 'IN' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400'
                          }`}>
                            {evt.type}
                          </span>
                        </td>
                        <td className="py-2.5 text-right text-slate-400">{new Date(evt.timestamp).toLocaleTimeString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Daily Summaries */}
            <h3 className="text-base font-bold text-slate-200 border-b border-slate-800 pb-3 pt-4">
              Daily Attendance Roll Summaries
            </h3>
            <div className="overflow-x-auto max-h-64">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-2 font-semibold">Date</th>
                    <th className="pb-2 font-semibold">Roll Status</th>
                    <th className="pb-2 font-semibold">Late Flag</th>
                    <th className="pb-2 font-semibold text-right">Time on Campus</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance?.summaries?.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-4 text-center text-slate-500">No daily summaries compiled.</td>
                    </tr>
                  ) : (
                    attendance?.summaries?.map((sum, idx) => (
                      <tr key={idx} className="border-b border-slate-850">
                        <td className="py-2.5 font-medium">{new Date(sum.date).toLocaleDateString()}</td>
                        <td className="py-2.5">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            sum.present ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                          }`}>
                            {sum.present ? 'PRESENT' : 'ABSENT'}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <span className={`text-[10px] font-semibold ${sum.late_flag ? 'text-amber-400' : 'text-slate-400'}`}>
                            {sum.late_flag ? 'LATE CUTOFF' : 'ON TIME'}
                          </span>
                        </td>
                        <td className="py-2.5 text-right font-medium text-slate-300">{formatDuration(sum.total_duration_on_campus)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Timetable schedule sidebar */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-base font-bold text-slate-200 mb-4 flex items-center space-x-2">
              <CalendarDays className="h-4.5 w-4.5 text-blue-400" />
              <span>Timetable Schedule</span>
            </h3>
            <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-2">
              {timetable.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No schedule loaded.</p>
              ) : (
                timetable.map((slot) => {
                  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                  return (
                    <div key={slot.id} className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
                      <p className="text-sm font-semibold">{slot.subject}</p>
                      <p className="text-xs text-blue-400 mt-1 font-medium">Instructor: {slot.instructor}</p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {days[slot.day_of_week]} • {slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)} (Room {slot.room})
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'grades' && (
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-base font-bold text-slate-200 border-b border-slate-800 pb-3 flex items-center space-x-2 mb-4">
            <GraduationCap className="h-4.5 w-4.5 text-blue-400" />
            <span>Academic Performance Report</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-semibold">Assessment Title</th>
                  <th className="pb-3 font-semibold">Max Obtainable</th>
                  <th className="pb-3 font-semibold">Marks Secured</th>
                  <th className="pb-3 font-semibold">Academic Percentage</th>
                  <th className="pb-3 font-semibold text-right">Graded By</th>
                </tr>
              </thead>
              <tbody>
                {grades.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-4 text-center text-slate-500">No grades loaded in portal yet.</td>
                  </tr>
                ) : (
                  grades.map((grade, idx) => {
                    const pct = ((parseFloat(grade.marks_obtained) / grade.max_marks) * 100).toFixed(1);
                    return (
                      <tr key={idx} className="border-b border-slate-850 hover:bg-slate-900/10">
                        <td className="py-3 font-medium">{grade.title}</td>
                        <td className="py-3 text-slate-400">{grade.max_marks}</td>
                        <td className="py-3 font-semibold text-blue-400">{parseFloat(grade.marks_obtained).toFixed(2)}</td>
                        <td className="py-3 font-bold text-slate-300">{pct}%</td>
                        <td className="py-3 text-right text-slate-400">{grade.grader}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'library' && (
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-base font-bold text-slate-200 border-b border-slate-800 pb-3 flex items-center space-x-2 mb-4">
            <BookOpen className="h-4.5 w-4.5 text-blue-400" />
            <span>Digital Library Loan Ledger</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-semibold">Book Title</th>
                  <th className="pb-3 font-semibold">Author</th>
                  <th className="pb-3 font-semibold">Issue Date</th>
                  <th className="pb-3 font-semibold">Due Date</th>
                  <th className="pb-3 font-semibold">Return Status</th>
                  <th className="pb-3 font-semibold text-right">Fine Incurred</th>
                </tr>
              </thead>
              <tbody>
                {loans.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-4 text-center text-slate-500">No library checkouts logged.</td>
                  </tr>
                ) : (
                  loans.map((loan, idx) => (
                    <tr key={idx} className="border-b border-slate-850 hover:bg-slate-900/10">
                      <td className="py-3 font-medium">{loan.title}</td>
                      <td className="py-3 text-slate-400">{loan.author}</td>
                      <td className="py-3 text-slate-400">{new Date(loan.issue_date).toLocaleDateString()}</td>
                      <td className="py-3 text-slate-400">{new Date(loan.due_date).toLocaleDateString()}</td>
                      <td className="py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          loan.return_date ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {loan.return_date ? 'RETURNED' : 'ISSUED'}
                        </span>
                      </td>
                      <td className="py-3 text-right font-bold text-rose-400">
                        {loan.fine_amount > 0 ? `Rs. ${parseFloat(loan.fine_amount).toFixed(2)}` : 'Rs. 0.00'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'feed' && (
        <div className="glass-card rounded-2xl p-6 space-y-6">
          <h3 className="text-base font-bold text-slate-200 border-b border-slate-800 pb-3 flex items-center space-x-2">
            <Rss className="h-4.5 w-4.5 text-blue-400" />
            <span>Class feed announcements</span>
          </h3>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
            {feed.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">No notices posted for your feed.</p>
            ) : (
              feed.map((post) => (
                <div key={post.id} className="p-5 bg-slate-900/40 border border-slate-850 rounded-xl space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <h4 className="font-bold text-sm text-slate-200">{post.title}</h4>
                    <span className="text-[10px] text-slate-400">
                      {new Date(post.created_at).toLocaleDateString()} • {new Date(post.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed white-space-pre-wrap">{post.content}</p>
                  <p className="text-[10px] text-blue-400 font-semibold pt-1">
                    Posted By: {post.poster_name} ({post.poster_role})
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'campuscore_ai' && (
        <CampusCoreAIMentor />
      )}
    </div>
  );
}
