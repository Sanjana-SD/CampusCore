import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { api } from './utils/api';

// Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Pages
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import ConfigPanel from './pages/ConfigPanel';
import AuditLog from './pages/AuditLog';
import FacultyDashboard from './pages/FacultyDashboard';
import StudentDashboard from './pages/StudentDashboard';
import LibrarianDashboard from './pages/LibrarianDashboard';
import ParentDashboard from './pages/ParentDashboard';
import AccountCreator from './pages/AccountCreator';
import PublicWebsite from './pages/PublicWebsite';
import AIMentorAnalytics from './pages/AIMentorAnalytics';

import { Bell, RefreshCw } from 'lucide-react';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('campuscore_token') || '');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Tab navigation state
  const [currentTab, setCurrentTab] = useState('dashboard');

  // Socket state
  const [socket, setSocket] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [liveScans, setLiveScans] = useState([]);
  const [toast, setToast] = useState({ show: false, title: '', message: '' });

  // Load session from token on mount
  useEffect(() => {
    const initSession = async () => {
      if (token) {
        localStorage.setItem('campuscore_token', token);
        try {
          const session = await api.get('/auth/me');
          setUser(session.user);
          setProfile(session.profile);

          // Select default tabs based on role
          if (session.user.role === 'librarian') {
            setCurrentTab('catalog');
          } else {
            setCurrentTab('dashboard');
          }
        } catch (err) {
          console.error('Session restore failed:', err);
          handleLogout();
        }
      }
      setLoading(false);
    };

    initSession();
  }, [token]);

  // Connect WebSockets when user is authenticated
  useEffect(() => {
    if (user) {
      const socketConnection = io('http://localhost:5000');
      setSocket(socketConnection);

      socketConnection.on('connect', () => {
        setSocketConnected(true);
      });

      socketConnection.on('disconnect', () => {
        setSocketConnected(false);
      });

      // Listen for live scan triggers
      socketConnection.on('attendance_scan', (scan) => {
        // 1. Admin/Faculty dashboard logs
        if (user.role === 'admin' || user.role === 'faculty') {
          setLiveScans((prev) => [scan, ...prev]);
        }

        // 2. Parent real-time browser warnings
        if (user.role === 'parent') {
          const childrenIds = profile?.children?.map((c) => c.id) || [];
          if (childrenIds.includes(scan.student_id)) {
            triggerToast(
              'Real-Time Student Alert',
              `${scan.student_name} has checked ${scan.result} at ${new Date(scan.timestamp).toLocaleTimeString()}.`
            );
          }
        }

        // 3. Student check-in logs
        if (user.role === 'student' || user.role === 'class_rep') {
          if (scan.student_id === user.id) {
            triggerToast(
              'Gate Scan Logged',
              `Check-${scan.result} successfully logged. Current time is ${new Date(scan.timestamp).toLocaleTimeString()}.`
            );
          }
        }
      });

      socketConnection.on('new_announcement', (ann) => {
        // If student belongs to class or global announcement
        if (user.role === 'student' || user.role === 'class_rep' || user.role === 'parent') {
          triggerToast('New Announcement', `${ann.posted_by}: "${ann.title}"`);
        }
      });

      return () => {
        socketConnection.disconnect();
      };
    }
  }, [user, profile]);

  const triggerToast = (title, message) => {
    setToast({ show: true, title, message });
    setTimeout(() => {
      setToast({ show: false, title: '', message: '' });
    }, 6000);
  };

  const handleLoginSuccess = (newToken, loggedUser, userProfile) => {
    setToken(newToken);
    setUser(loggedUser);
    setProfile(userProfile);
    localStorage.setItem('campuscore_token', newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('campuscore_token');
    setToken('');
    setUser(null);
    setProfile(null);
    setLiveScans([]);
    setSocketConnected(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  // Not logged in? Show Public landing website portal
  if (!user) {
    return <PublicWebsite onLoginSuccess={handleLoginSuccess} />;
  }

  // Render correct panel view inside layout
  const renderContent = () => {
    switch (user.role) {
      case 'admin':
        if (currentTab === 'dashboard') return <AdminDashboard liveScans={liveScans} />;
        if (currentTab === 'config') return <ConfigPanel />;
        if (currentTab === 'accounts') return <AccountCreator />;
        if (currentTab === 'audit') return <AuditLog />;
        break;

      case 'faculty':
        if (currentTab === 'dashboard' || currentTab === 'assessments' || currentTab === 'feed') {
          return <FacultyDashboard profile={profile} />;
        }
        break;

      case 'placement_officer':
        if (currentTab === 'dashboard') return <AIMentorAnalytics />;
        break;

      case 'student':
      case 'class_rep':
        return <StudentDashboard studentId={user.id} activeTab={currentTab} />;

      case 'librarian':
        return <LibrarianDashboard activeTab={currentTab} />;

      case 'parent':
        return <ParentDashboard profile={profile} activeTab={currentTab} />;

      default:
        return <div className="text-slate-500">Feature tab not implemented.</div>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Toast Alert overlay */}
      {toast.show && (
        <div className="fixed top-6 right-6 z-50 glass-card bg-slate-900 border-blue-500/30 p-4 rounded-xl shadow-2xl flex items-start space-x-3 w-80 animate-slide-in">
          <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg shrink-0">
            <Bell className="h-4.5 w-4.5" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-100 uppercase tracking-wide">{toast.title}</h4>
            <p className="text-xs text-slate-350 mt-1 leading-relaxed">{toast.message}</p>
          </div>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar user={user} socketConnected={socketConnected} onLogout={handleLogout} />

      {/* Sidebar & Dashboard layouts */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto p-4 overflow-hidden gap-4">
        <Sidebar role={user.role} currentTab={currentTab} setCurrentTab={setCurrentTab} />
        
        <main className="flex-1 overflow-y-auto p-4 bg-slate-900/10 rounded-2xl border border-slate-900/30">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
