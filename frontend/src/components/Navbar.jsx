import React from 'react';
import { Wifi, WifiOff, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

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
        <motion.div 
          className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-blue-500/20 gradient-border"
          whileHover={{ scale: 1.05, rotate: [0, -5, 5, 0] }}
          transition={{ duration: 0.5 }}
        >
          CC
        </motion.div>
        <div>
          <h1 className="text-xl font-bold tracking-tight gradient-text-animated">
            CampusCore
          </h1>
          <p className="text-[10px] text-slate-450 uppercase tracking-widest font-semibold">Integrated College Management</p>
        </div>
      </div>

      <div className="flex items-center space-x-6">
        {/* Real-time Connection Indicator */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center space-x-2 bg-white/80 px-3 py-1.5 rounded-full border border-gray-100 text-xs"
        >
          {socketConnected ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-450 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Wifi className="h-3.5 w-3.5 text-emerald-450" />
              <span className="text-emerald-450 font-semibold tracking-wide uppercase text-[10px]">LIVE CONNECTED</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3.5 w-3.5 text-rose-400" />
              <span className="text-rose-400 font-semibold tracking-wide uppercase text-[10px]">OFFLINE</span>
            </>
          )}
        </motion.div>

        {/* User Card */}
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <p className="text-sm font-bold text-slate-800">{user?.username}</p>
            <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">{getRoleLabel(user?.role)}</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onLogout}
            className="p-2 rounded-lg bg-white border border-gray-100 hover:border-rose-200 transition-all text-slate-700 cursor-pointer btn-press"
            title="Log Out"
          >
            <LogOut className="h-4.5 w-4.5" />
          </motion.button>
        </div>
      </div>
    </nav>
  );
}

