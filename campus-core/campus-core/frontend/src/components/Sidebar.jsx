import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Settings, 
  Database, 
  GraduationCap, 
  BookOpen, 
  Rss, 
  UserCheck, 
  CalendarDays, 
  Users,
  AlertCircle,
  Bot,
  Sparkles
} from 'lucide-react';

export default function Sidebar({ role, currentTab, setCurrentTab }) {
  const getMenuItems = () => {
    switch (role) {
      case 'admin':
        return [
          { id: 'dashboard', label: 'Analytics Dashboard', icon: LayoutDashboard },
          { id: 'config', label: 'System Settings', icon: Settings },
          { id: 'accounts', label: 'Account Creator', icon: Users },
          { id: 'audit', label: 'Audit Log Chain', icon: Database }
        ];
      case 'faculty':
        return [
          { id: 'dashboard', label: 'Faculty Roster', icon: Users },
          { id: 'assessments', label: 'Academic Grades', icon: GraduationCap },
          { id: 'feed', label: 'Class Announcements', icon: Rss }
        ];
      case 'placement_officer':
        return [
          { id: 'dashboard', label: 'Placement Officer Panel', icon: Sparkles }
        ];
      case 'student':
      case 'class_rep':
        return [
          { id: 'dashboard', label: 'My Attendance', icon: UserCheck },
          { id: 'grades', label: 'My Grades', icon: GraduationCap },
          { id: 'library', label: 'Digital Library', icon: BookOpen },
          { id: 'feed', label: 'Class Feed', icon: Rss },
          { id: 'campuscore_ai', label: '⭐ CampusCore AI Mentor', icon: Bot }
        ];
      case 'librarian':
        return [
          { id: 'catalog', label: 'Book Catalog', icon: BookOpen },
          { id: 'transactions', label: 'Book Checkouts', icon: CalendarDays }
        ];
      case 'parent':
        return [
          { id: 'dashboard', label: 'Child Attendance', icon: UserCheck },
          { id: 'grades', label: 'Academic Progress', icon: GraduationCap },
          { id: 'library', label: 'Library Status', icon: BookOpen }
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  return (
    <aside className="w-64 glass-card shrink-0 m-4 rounded-2xl p-4 flex flex-col justify-between border border-slate-900 bg-slate-950/40 relative z-10">
      <div className="space-y-6">
        <div className="px-3 text-xs font-semibold text-slate-450 uppercase tracking-widest">
          Menu Navigation
        </div>
        <motion.nav 
          className="space-y-1.5"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.05 }
            }
          }}
        >
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <motion.button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                variants={{
                  hidden: { opacity: 0, x: -10 },
                  visible: { opacity: 1, x: 0 }
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors cursor-pointer relative btn-press overflow-hidden"
              >
                {/* Active tab sliding highlight background */}
                {isActive && (
                  <motion.div
                    layoutId="activeSidebarHighlight"
                    className="absolute inset-0 bg-blue-600/90 border border-blue-500/30 rounded-xl shadow-lg shadow-blue-500/10 z-0"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                
                <span className="relative z-10 flex items-center space-x-3 w-full">
                  <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className={isActive ? 'text-white font-bold' : 'text-slate-350'}>{item.label}</span>
                </span>
              </motion.button>
            );
          })}
        </motion.nav>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-slate-950/60 p-4 rounded-xl border border-slate-900"
      >
        <div className="flex items-start space-x-2">
          <AlertCircle className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
          <div className="text-[11px] text-slate-450 leading-relaxed">
            <span className="font-bold text-slate-300 uppercase tracking-wide text-[9px] block mb-0.5">Edge Hub Rule</span>
            Scans will process instantly via gate sensors.
          </div>
        </div>
      </motion.div>
    </aside>
  );
}

