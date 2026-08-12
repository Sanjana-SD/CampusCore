import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { BookOpen, Calendar, GraduationCap, PlusCircle, Rss, Save, RefreshCw, Lock } from 'lucide-react';

export default function FacultyDashboard({ profile }) {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [assessments, setAssessments] = useState([]);
  
  // Grade Input Form state
  const [newAssessTitle, setNewAssessTitle] = useState('');
  const [newAssessMax, setNewAssessMax] = useState('100');
  const [selectedAssessment, setSelectedAssessment] = useState('');
  const [gradeInputs, setGradeInputs] = useState({}); // studentId -> marks

  // Class Feed announcement form state
  const [feedTitle, setFeedTitle] = useState('');
  const [feedContent, setFeedContent] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchFacultyData = async () => {
    try {
      setLoading(true);
      // Fetch classes taught by this lecturer
      const classData = await api.get('/students/faculty/classes');
      setClasses(classData);
      if (classData.length > 0) {
        setSelectedClass(classData[0].id);
      }

      // Fetch faculty personal timetable
      const timetableData = await api.get('/students/faculty/timetable');
      setTimetable(timetableData);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch faculty data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacultyData();
  }, []);

  const fetchClassDetails = async () => {
    if (!selectedClass) return;
    try {
      // 1. Fetch all students in class
      const allStudents = await api.get('/students');
      const classStudents = allStudents.filter(s => s.class_id === selectedClass);
      setStudents(classStudents);

      // Initialize grade inputs
      const initGrades = {};
      classStudents.forEach(s => {
        initGrades[s.id] = '';
      });
      setGradeInputs(initGrades);

      // 2. Fetch assessments
      const assessData = await api.get(`/assessments?classId=${selectedClass}`);
      setAssessments(assessData);
      if (assessData.length > 0) {
        setSelectedAssessment(assessData[0].id);
      } else {
        setSelectedAssessment('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchClassDetails();
  }, [selectedClass]);

  const handleCreateAssessment = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newAssessTitle || !newAssessMax) return;

    try {
      await api.post('/assessments', {
        class_id: selectedClass,
        title: newAssessTitle,
        max_marks: parseInt(newAssessMax, 10)
      });
      setSuccess('Assessment created successfully.');
      setNewAssessTitle('');
      fetchClassDetails();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleCR = async (studentId) => {
    setError('');
    setSuccess('');
    try {
      const res = await api.post(`/students/${studentId}/toggle-cr`, {});
      setSuccess(res.message);
      setStudents(prev =>
        prev.map(s => {
          if (s.id === studentId) {
            const isCurrentlyCR = s.role === 'class_rep';
            return { ...s, role: isCurrentlyCR ? 'student' : 'class_rep' };
          }
          return s;
        })
      );
    } catch (err) {
      setError(err.message || 'Failed to toggle Class Representative status.');
    }
  };

  const handleSaveGrades = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedAssessment) return;

    const gradesPayload = Object.keys(gradeInputs)
      .filter(sid => gradeInputs[sid] !== '')
      .map(sid => ({
        student_id: sid,
        marks_obtained: parseFloat(gradeInputs[sid])
      }));

    try {
      await api.post(`/assessments/${selectedAssessment}/grades`, { grades: gradesPayload });
      setSuccess('Grades saved successfully.');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLockGrades = async () => {
    if (!selectedAssessment) return;
    setError('');
    setSuccess('');
    try {
      await api.post(`/assessments/${selectedAssessment}/lock`, {});
      setSuccess('Academic records locked successfully.');
      fetchClassDetails();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!feedTitle || !feedContent) return;

    try {
      await api.post('/feed', {
        class_id: selectedClass,
        title: feedTitle,
        content: feedContent
      });
      setSuccess('Announcement published to class feed.');
      setFeedTitle('');
      setFeedContent('');
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Faculty Portal</h2>
        <p className="text-sm text-slate-400">Manage classroom rosters, schedule timetables, input grades, and post feeds</p>
      </div>

      {(error || success) && (
        <div className={`p-4 rounded-xl text-sm border ${
          success 
            ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-400' 
            : 'bg-rose-950/20 border-rose-900/40 text-rose-400'
        }`}>
          {success || error}
        </div>
      )}

      {/* Class Selector & Timetable Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timetable view */}
        <div className="glass-card rounded-2xl p-6 lg:col-span-1">
          <h3 className="text-base font-bold text-slate-200 mb-4 flex items-center space-x-2">
            <Calendar className="h-4.5 w-4.5 text-blue-400" />
            <span>My Lecture Schedule</span>
          </h3>
          <div className="space-y-3.5 max-h-96 overflow-y-auto pr-2">
            {timetable.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">No classes scheduled on the timetable.</p>
            ) : (
              timetable.map((slot) => {
                const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                return (
                  <div key={slot.id} className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
                    <p className="text-sm font-semibold">{slot.subject}</p>
                    <p className="text-xs text-blue-400 mt-1 font-medium">{slot.class_name} • Room {slot.room}</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {days[slot.day_of_week]} • {slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Core Roster & Grading */}
        <div className="glass-card rounded-2xl p-6 lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-3">
              <BookOpen className="h-5 w-5 text-blue-400" />
              <span className="font-bold text-slate-200">Class Roster & Assessments</span>
            </div>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Grading Input Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Create Assessment */}
            <form onSubmit={handleCreateAssessment} className="space-y-4 p-4.5 bg-slate-900/40 border border-slate-850 rounded-xl">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <PlusCircle className="h-4 w-4 text-blue-400" />
                <span>Create New Assessment Record</span>
              </h4>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1.5">Title / Subject Test</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Test 1: Network Topology"
                  value={newAssessTitle}
                  onChange={(e) => setNewAssessTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1.5">Maximum Obtainable Marks</label>
                <input
                  type="number"
                  required
                  value={newAssessMax}
                  onChange={(e) => setNewAssessMax(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs transition-all shadow-md shadow-blue-500/5 cursor-pointer"
              >
                Create Record
              </button>
            </form>

            {/* Input Grades */}
            <form onSubmit={handleSaveGrades} className="space-y-4 p-4.5 bg-slate-900/40 border border-slate-850 rounded-xl flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                  <GraduationCap className="h-4 w-4 text-blue-400" />
                  <span>Select Assessment to Grade</span>
                </h4>
                <select
                  value={selectedAssessment}
                  onChange={(e) => setSelectedAssessment(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">-- Choose Assessment --</option>
                  {assessments.map(a => (
                    <option key={a.id} value={a.id}>{a.title} (Max: {a.max_marks})</option>
                  ))}
                </select>

                {selectedAssessment && (
                  <div className="mt-4 border-t border-slate-800/80 pt-4 max-h-48 overflow-y-auto space-y-2 pr-2">
                    {students.map(student => (
                      <div key={student.id} className="flex items-center justify-between text-xs py-1">
                        <span>{student.first_name} {student.last_name}</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Marks"
                          value={gradeInputs[student.id] || ''}
                          onChange={(e) => setGradeInputs(prev => ({ ...prev, [student.id]: e.target.value }))}
                          className="w-20 px-2 py-1 bg-slate-950 border border-slate-850 rounded text-center text-slate-100 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedAssessment && (
                <div className="flex space-x-2 mt-4">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs transition-all flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>Save Grades</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLockGrades}
                    className="px-3 py-2 bg-rose-900/60 hover:bg-rose-800 text-rose-300 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 cursor-pointer border border-rose-800/40"
                    title="Lock Assessment Records (Permanent Read-Only)"
                  >
                    <Lock className="h-3.5 w-3.5" />
                    <span>Lock Record</span>
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Student Roster Table */}
          <div className="border-t border-slate-800 pt-6 space-y-4">
            <h4 className="text-xs font-bold text-slate-350 uppercase tracking-wider">Class Roster & CR Management</h4>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">Email</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {students.map((student) => {
                    const isCR = student.role === 'class_rep';
                    return (
                      <tr key={student.id} className="hover:bg-slate-900/20">
                        <td className="py-3 px-3 font-medium text-slate-100">
                          {student.first_name} {student.last_name}
                        </td>
                        <td className="py-3 px-3 text-slate-400">{student.email}</td>
                        <td className="py-3 px-3 text-center">
                          {isCR ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              Class Rep (CR)
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500">Student</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => handleToggleCR(student.id)}
                            className={`px-3 py-1 rounded-lg font-semibold text-[10px] transition-all cursor-pointer border ${
                              isCR
                                ? 'bg-rose-950/20 border-rose-900/40 text-rose-400 hover:bg-rose-900/30'
                                : 'bg-blue-950/20 border-blue-900/40 text-blue-400 hover:bg-blue-900/30'
                            }`}
                          >
                            {isCR ? 'Demote CR' : 'Promote to CR'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Class Feed Publisher */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-base font-bold text-slate-200 mb-4 flex items-center space-x-2">
          <Rss className="h-4.5 w-4.5 text-blue-400" />
          <span>Publish Class Announcement</span>
        </h3>
        <form onSubmit={handleCreatePost} className="space-y-4 max-w-2xl">
          <input
            type="text"
            required
            placeholder="Announcement Title"
            value={feedTitle}
            onChange={(e) => setFeedTitle(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <textarea
            required
            rows="4"
            placeholder="Type your notice description here. It will immediately show up on student and parent feeds."
            value={feedContent}
            onChange={(e) => setFeedContent(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
          ></textarea>
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs transition-all shadow-md shadow-blue-500/10 cursor-pointer"
          >
            Post Announcement
          </button>
        </form>
      </div>
    </div>
  );
}
