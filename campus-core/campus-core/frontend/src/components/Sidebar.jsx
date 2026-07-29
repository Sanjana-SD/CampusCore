import React from 'react';
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
    <aside className="w-64 glass-card shrink-0 m-4 rounded-2xl p-4 flex flex-col justify-between">
      <div className="space-y-6">
        <div className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Menu Navigation
        </div>
        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-blue-600/90 text-white shadow-lg shadow-blue-500/10 border border-blue-500/20' 
                    : 'text-slate-300 hover:bg-slate-800/40 hover:text-white border border-transparent'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/80">
        <div className="flex items-start space-x-2">
          <AlertCircle className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
          <div className="text-[11px] text-slate-400 leading-relaxed">
            <span className="font-semibold text-slate-300">Edge Hub Rule:</span> Scans will process instantly via gate sensors.
          </div>
        </div>
      </div>
    </aside>
  );
}
