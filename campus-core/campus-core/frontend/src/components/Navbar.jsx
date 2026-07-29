import React from 'react';
import { Wifi, WifiOff, LogOut, ShieldAlert } from 'lucide-react';

export default function Navbar({ user, socketConnected, onLogout }) {
  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'faculty': return 'Faculty / Lecturer';
      case 'student': return 'Student';
      case 'class_rep': return 'Class Representative';
      case 'librarian': return 'Librarian';
      case 'parent': return 'Parent / Guardian';
      default: return role;
    }
  };

  return (
    <nav className="glass-nav sticky top-0 z-40 w-full px-6 py-4 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-blue-500/20">
          CC
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
            CampusCore
          </h1>
          <p className="text-xs text-slate-400">Integrated College Management</p>
        </div>
      </div>

      <div className="flex items-center space-x-6">
        {/* Real-time Connection Indicator */}
        <div className="flex items-center space-x-2 bg-slate-900/60 px-3 py-1.5 rounded-full border border-slate-800 text-xs">
          {socketConnected ? (
            <>
              <Wifi className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
              <span className="text-emerald-400 font-medium">LIVE CONNECTED</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3.5 w-3.5 text-rose-400" />
              <span className="text-rose-400 font-medium">OFFLINE</span>
            </>
          )}
        </div>

        {/* User Card */}
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <p className="text-sm font-semibold">{user?.username}</p>
            <p className="text-xs text-blue-400 font-medium">{getRoleLabel(user?.role)}</p>
          </div>
          <button
            onClick={onLogout}
            className="p-2 rounded-lg bg-slate-800 hover:bg-rose-950/40 hover:text-rose-400 border border-slate-700 hover:border-rose-900/60 transition-all text-slate-300 cursor-pointer"
            title="Log Out"
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>
    </nav>
  );
}
