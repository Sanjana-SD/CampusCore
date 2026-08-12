import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { api } from './utils/api';
import PortalNavbar from './components/PortalNavbar';
import PortalFooter from './components/PortalFooter';
import Login from './pages/Login';
import {
  PortalHome,
  PortalDepartments,
  PortalFaculty,
  PortalLibrary,
  PortalPlacements,
  PortalCourses,
  PortalAbout,
  PortalContact,
} from './pages/PortalPages';
import { RefreshCw } from 'lucide-react';

function PortalLayout({ user, onLogout }) {
  return (
    <div className="min-h-screen bg-page text-white">
      <PortalNavbar user={user} onLogout={onLogout} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<PortalHome />} />
          <Route path="/departments" element={<PortalDepartments />} />
          <Route path="/faculty" element={<PortalFaculty />} />
          <Route path="/library" element={<PortalLibrary />} />
          <Route path="/placements" element={<PortalPlacements />} />
          <Route path="/courses" element={<PortalCourses />} />
          <Route path="/about" element={<PortalAbout />} />
          <Route path="/contact" element={<PortalContact />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <PortalFooter />
    </div>
  );
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('campuscore_token') || '');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initSession = async () => {
      if (token) {
        localStorage.setItem('campuscore_token', token);
        try {
          const session = await api.get('/auth/me');
          setUser(session.user);
          setProfile(session.profile);
        } catch (err) {
          console.error('Session restore failed:', err);
          handleLogout();
        }
      }
      setLoading(false);
    };

    initSession();
  }, [token]);

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
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#05060a] text-slate-400 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-25"></div>
        <div className="relative z-10 flex flex-col items-center space-y-4">
          <div className="relative flex items-center justify-center h-16 w-16">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-500/20 opacity-75"></span>
            <RefreshCw className="h-8 w-8 animate-spin text-sky-400 relative" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-black tracking-[0.28em] bg-gradient-to-r from-sky-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent uppercase">CampusCore</h2>
            <p className="mt-1 text-[11px] uppercase tracking-[0.28em] text-slate-500">Restoring Secure Session</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return <PortalLayout user={user} onLogout={handleLogout} />;
}

