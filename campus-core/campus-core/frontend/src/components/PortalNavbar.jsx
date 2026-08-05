import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { NavLink, useLocation } from 'react-router-dom';
import { LogOut, Sparkles, UserCircle2 } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/departments', label: 'Departments' },
  { to: '/faculty', label: 'Faculty' },
  { to: '/library', label: 'Library' },
  { to: '/placements', label: 'Placements' },
  { to: '/courses', label: 'Courses' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export default function PortalNavbar({ user, onLogout }) {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-40 transition-all duration-300 ${scrolled ? 'nav-shell scrolled' : 'nav-shell'}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 via-violet-500 to-sky-500 text-lg font-black text-white shadow-lg shadow-violet-950/70">
            CC
          </div>
          <div>
            <p className="text-lg font-black tracking-tight text-white">CampusCore</p>
            <p className="text-[10px] uppercase tracking-[0.32em] text-slate-400">AI Academic Portal</p>
          </div>
        </div>

        <nav className="hidden items-center gap-2 lg:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-full px-3.5 py-2 text-sm font-semibold transition ${
                  isActive || (item.to === '/' && location.pathname === '/')
                    ? 'bg-white/10 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.08)]'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 sm:flex">
            <UserCircle2 className="h-4 w-4 text-sky-300" />
            <span>{user?.username || 'Portal User'}</span>
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-full border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-100 transition hover:border-rose-300/60 hover:bg-rose-500/20"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </motion.button>
        </div>
      </div>

      <div className="border-t border-white/5 px-4 py-3 lg:hidden">
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold transition ${
                  isActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </div>
    </header>
  );
}
