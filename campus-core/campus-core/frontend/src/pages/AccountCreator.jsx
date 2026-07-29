import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { UserPlus, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

export default function AccountCreator() {
  const [role, setRole] = useState('student');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Profile-specific fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [rfidUid, setRfidUid] = useState('');
  const [classId, setClassId] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [linkedStudentId, setLinkedStudentId] = useState('');

  // Dropdowns lists loaded from backend
  const [classesList, setClassesList] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Fetch dropdown data on mount
  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        const classes = await api.get('/admin/classes');
        setClassesList(classes);
        if (classes.length > 0) setClassId(classes[0].id);

        const students = await api.get('/students');
        setStudentsList(students);
        if (students.length > 0) setLinkedStudentId(students[0].id);
      } catch (err) {
        console.error('Failed to load classes or students:', err);
      }
    };
    loadDropdownData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    // Build role details payload
    const details = {};
    if (role === 'student' || role === 'class_rep') {
      details.rfid_uid = rfidUid;
      details.first_name = firstName;
      details.last_name = lastName;
      details.email = email;
      details.phone = phone;
      details.parent_name = parentName;
      details.parent_email = parentEmail;
      details.parent_phone = parentPhone;
      details.class_id = classId;
    } else if (role === 'faculty' || role === 'librarian' || role === 'placement_officer') {
      details.first_name = firstName;
      details.last_name = lastName;
      details.email = email;
      details.phone = phone;
      details.department = department;
    } else if (role === 'parent') {
      details.linked_student_id = linkedStudentId;
    }

    try {
      await api.post('/admin/users/create', {
        username,
        password,
        role,
        details
      });

      setMessage({ type: 'success', text: `Account for "${username}" (${role}) created successfully!` });
      
      // Clear forms
      setUsername('');
      setPassword('');
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setRfidUid('');
      setParentName('');
      setParentEmail('');
      setParentPhone('');
      setDepartment('');
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to create user account.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold">Account Creator</h2>
        <p className="text-sm text-slate-400">Register new students, lecturers, class representatives, librarians, and parents</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl flex items-start space-x-2 border text-sm ${
          message.type === 'success' 
            ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-400' 
            : 'bg-rose-950/20 border-rose-900/40 text-rose-400'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Credentials Card */}
        <div className="glass-card rounded-2xl p-6 space-y-5">
          <h3 className="text-base font-bold text-slate-200 border-b border-slate-800 pb-3 flex items-center space-x-2">
            <UserPlus className="h-4.5 w-4.5 text-blue-400" />
            <span>Login Credentials</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                User Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
              >
                <option value="student">Student</option>
                <option value="faculty">Faculty / Lecturer</option>
                <option value="placement_officer">Placement Officer</option>
                <option value="parent">Parent / Guardian</option>
                <option value="librarian">Librarian</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                placeholder="Enter unique username"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Profile Details Form Fields */}
        {role !== 'parent' && (
          <div className="glass-card rounded-2xl p-6 space-y-6">
            <h3 className="text-base font-bold text-slate-200 border-b border-slate-800 pb-3">
              Personal Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">First Name</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Last Name</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
            </div>
          </div>
        )}

        {/* Student Specific Fields */}
        {(role === 'student' || role === 'class_rep') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Enrollment */}
            <div className="glass-card rounded-2xl p-6 space-y-6">
              <h3 className="text-base font-bold text-slate-200 border-b border-slate-800 pb-3">
                Enrollment Details
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Class Section</label>
                  <select
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                  >
                    {classesList.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Parent contact information */}
            <div className="glass-card rounded-2xl p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-200 border-b border-slate-800 pb-3">
                Parent / Guardian Contact
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1.5 uppercase font-semibold">Guardian Full Name</label>
                  <input
                    type="text"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1.5 uppercase font-semibold">Guardian Email</label>
                    <input
                      type="email"
                      value={parentEmail}
                      onChange={(e) => setParentEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1.5 uppercase font-semibold">Guardian Phone</label>
                    <input
                      type="text"
                      value={parentPhone}
                      onChange={(e) => setParentPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Staff Specific Fields */}
        {(role === 'faculty' || role === 'librarian' || role === 'placement_officer') && (
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-200 border-b border-slate-800 pb-3">
              Professional Details
            </h3>
            <div className="max-w-md">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Department</label>
              <input
                type="text"
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="e.g. Computer Science & Engineering"
              />
            </div>
          </div>
        )}

        {/* Parent Specific Fields */}
        {role === 'parent' && (
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-200 border-b border-slate-800 pb-3">
              Guardian Linkage Mapping
            </h3>
            <div className="max-w-md">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Select Child Student</label>
              <select
                value={linkedStudentId}
                onChange={(e) => setLinkedStudentId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              >
                {studentsList.map(s => (
                  <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.class_name || 'Class Unassigned'})</option>
                ))}
              </select>
              <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
                Linking the parent account maps dashboard views and triggers live gate updates for this student.
              </p>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-blue-500/10 cursor-pointer disabled:opacity-50 flex items-center space-x-2"
        >
          {loading ? (
            <RefreshCw className="h-4.5 w-4.5 animate-spin" />
          ) : (
            <UserPlus className="h-4.5 w-4.5" />
          )}
          <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
        </button>
      </form>
    </div>
  );
}
