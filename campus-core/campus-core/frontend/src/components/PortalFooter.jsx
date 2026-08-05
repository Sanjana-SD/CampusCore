import React from 'react';
import { Globe, Mail, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

const quickLinks = [
  { label: 'Home', to: '/' },
  { label: 'Departments', to: '/departments' },
  { label: 'Faculty', to: '/faculty' },
  { label: 'Library', to: '/library' },
  { label: 'Placements', to: '/placements' },
  { label: 'Courses', to: '/courses' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
];

export default function PortalFooter() {
  return (
    <footer className="mt-16 border-t border-white/10 bg-[#0a0a0f] text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.4fr_0.9fr_1.2fr] lg:px-8">
        <div>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 via-violet-500 to-sky-500 font-black text-white">
              CC
            </div>
            <div>
              <p className="text-lg font-black text-white">CampusCore</p>
              <p className="text-[10px] uppercase tracking-[0.28em] text-slate-500">AI Mentorship & Campus Intelligence</p>
            </div>
          </div>
          <p className="max-w-md text-sm leading-6 text-slate-400">
            Connecting academic operations, student experience, and career readiness with one unified campus intelligence layer.
          </p>
          <div className="mt-5 flex gap-3 text-slate-400">
            <a href="https://www.linkedin.com" className="rounded-full border border-white/10 p-2 transition hover:border-sky-400/50 hover:text-white"><Globe className="h-4 w-4" /></a>
            <a href="https://www.instagram.com" className="rounded-full border border-white/10 p-2 transition hover:border-fuchsia-400/50 hover:text-white"><Globe className="h-4 w-4" /></a>
            <a href="https://www.facebook.com" className="rounded-full border border-white/10 p-2 transition hover:border-sky-400/50 hover:text-white"><Globe className="h-4 w-4" /></a>
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-white">Quick Links</h3>
          <div className="grid gap-2">
            {quickLinks.map((item) => (
              <Link key={item.to} to={item.to} className="text-sm text-slate-400 transition hover:text-white">
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.24em] text-white">Contact</h3>
          <div className="space-y-3 text-sm text-slate-400">
            <div className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 text-sky-300" /><span>CampusCore Institute, Innovation District, Bengaluru, India</span></div>
            <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-sky-300" /><a href="mailto:hello@campuscore.edu" className="transition hover:text-white">hello@campuscore.edu</a></div>
            <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-sky-300" /><a href="tel:+919876543210" className="transition hover:text-white">+91 98765 43210</a></div>
          </div>
        </div>
      </div>
      <div className="border-t border-white/5 px-4 py-4 text-center text-xs text-slate-500 sm:px-6 lg:px-8">
        © 2026 CampusCore. All rights reserved.
      </div>
    </footer>
  );
}
