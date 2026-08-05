import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Award, BookOpen, Building2, GraduationCap, Library, MapPin, Mail, Phone, Users, Sparkles, Search, CalendarRange, BrainCircuit, ShieldCheck } from 'lucide-react';
import { api } from '../utils/api';
import { CountUp, FadeInOnScroll, StaggerContainer, StaggerItem } from '../components/AnimationWrappers';

const marqueeItems = ['Supabase', 'MERN Stack', 'IoT RFID', 'AI Mentor', 'Placement Analytics', 'Library Ops'];

function SectionLabel({ children }) {
  return <span className="inline-flex rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.26em] text-violet-200">{children}</span>;
}

function StatCard({ value, label, accent = 'text-sky-300' }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur">
      <div className={`text-4xl font-black tracking-tight ${accent}`}>
        <CountUp end={value} duration={1.6} />
      </div>
      <div className="mt-2 text-xs uppercase tracking-[0.24em] text-slate-400">{label}</div>
    </div>
  );
}

function MarqueeRow() {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] py-4">
      <div className="marquee-track flex min-w-max gap-4 px-4 text-sm font-semibold text-slate-300">
        {[...marqueeItems, ...marqueeItems].map((item, index) => (
          <span key={`${item}-${index}`} className="rounded-full border border-white/10 bg-slate-900/60 px-4 py-2">{item}</span>
        ))}
      </div>
    </div>
  );
}

function ContentCard({ title, description, icon: Icon, badge }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition hover:-translate-y-1 hover:border-sky-400/40 hover:shadow-[0_20px_45px_rgba(56,189,248,0.14)]">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="rounded-2xl bg-sky-400/10 p-2.5 text-sky-300"><Icon className="h-5 w-5" /></div>
        {badge ? <span className="rounded-full bg-violet-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-violet-200">{badge}</span> : null}
      </div>
      <h3 className="text-xl font-bold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
    </div>
  );
}

export function PortalHome() {
  const features = [
    { number: '01', title: 'IoT RFID Sensors', copy: 'Real-time attendance and scanner-driven gate workflows keep campus operations transparent.' },
    { number: '02', title: 'AI Mentor Engine', copy: 'Guided academic planning, skills mapping, and mentoring pathways for every learner.' },
    { number: '03', title: 'Placement Analytics', copy: 'Career readiness patterns help students visualize role fit, interview readiness, and outcomes.' },
    { number: '04', title: 'Integrated Library System', copy: 'Book catalogs, issue and return visibility, and study-resource support all in one place.' },
  ];

  return (
    <div className="space-y-14 pb-10">
      <FadeInOnScroll className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_20%),radial-gradient(circle_at_top_right,rgba(168,85,247,0.18),transparent_20%),linear-gradient(135deg,#0a0a0f_0%,#11111a_45%,#0b0f1a_100%)] p-6 sm:p-8 lg:p-10">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <SectionLabel>CampusCore</SectionLabel>
            <h1 className="mt-5 max-w-3xl text-5xl font-black leading-[0.95] tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl">
              Empowering Academics Through <span className="text-transparent bg-gradient-to-r from-sky-300 via-violet-300 to-fuchsia-300 bg-clip-text italic">AI Mentorship</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              A dark-mode AI academic operations platform that connects departments, faculty, library workflows, and placement insights under one secure campus portal.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="/departments" className="inline-flex items-center gap-2 rounded-full bg-sky-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-sky-300">Explore Departments <ArrowRight className="h-4 w-4" /></a>
              <a href="/placements" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10">View Placements</a>
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
              <div className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Live Systems</div>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-200"><span>Supabase Database</span><span className="text-emerald-300">Online</span></div>
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-200"><span>RFID Gate Logs</span><span className="text-sky-300">Active</span></div>
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-200"><span>Placement Sync</span><span className="text-violet-300">Queued</span></div>
              </div>
            </div>
            <div className="rounded-[28px] border border-sky-400/30 bg-sky-400/10 p-5 text-slate-50">
              <div className="text-[11px] uppercase tracking-[0.3em] text-sky-200">Institution Pulse</div>
              <div className="mt-4 text-4xl font-black text-white">92%</div>
              <p className="mt-2 text-sm text-sky-100">Campus-wide readiness score across student skill tracking and mentoring workflows.</p>
            </div>
          </motion.div>
        </div>
      </FadeInOnScroll>

      <FadeInOnScroll className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <SectionLabel>Why CampusCore</SectionLabel>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">Built for the full academic lifecycle.</h2>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {features.map((feature) => (
            <div key={feature.number} className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
              <div className="flex gap-4">
                <div className="text-5xl font-black leading-none text-violet-300">{feature.number}</div>
                <div>
                  <h3 className="text-lg font-bold text-white">{feature.title}</h3>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">{feature.copy}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </FadeInOnScroll>

      <FadeInOnScroll>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard value="265" label="Supabase Database" accent="text-sky-300" />
          <StatCard value="1200" label="Placement Records" accent="text-violet-300" />
          <StatCard value="150" label="Expert Faculty" accent="text-fuchsia-300" />
          <StatCard value="68" label="MERN Architecture" accent="text-emerald-300" />
        </div>
      </FadeInOnScroll>

      <FadeInOnScroll>
        <MarqueeRow />
      </FadeInOnScroll>
    </div>
  );
}

export function PortalDepartments() {
  const [departments, setDepartments] = useState([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    api.get('/campus360/public/departments').then(setDepartments).catch(() => setDepartments([]));
  }, []);

  const filtered = departments.filter((dept) => `${dept.name || ''} ${dept.code || ''}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="space-y-8 pb-10">
      <FadeInOnScroll>
        <div className="flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/[0.03] p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <SectionLabel>Departments</SectionLabel>
            <h2 className="mt-3 text-3xl font-black text-white">Academic departments</h2>
            <p className="mt-2 text-sm text-slate-400">Explore departments driving research, digital learning, and student outcomes.</p>
          </div>
          <div className="relative min-w-[260px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search departments" className="w-full rounded-full border border-white/10 bg-slate-950/70 py-2.5 pl-9 pr-4 text-sm text-white outline-none placeholder:text-slate-500" />
          </div>
        </div>
      </FadeInOnScroll>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.length ? filtered.map((dept, i) => (
          <FadeInOnScroll key={dept.code || i} delay={i * 0.04}>
            <ContentCard title={dept.name || 'Department'} description={dept.description || 'Department details supported by the CampusCore data layer.'} icon={Building2} badge={dept.code || 'DEPT'} />
          </FadeInOnScroll>
        )) : (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-sm text-slate-400">No departments available yet.</div>
        )}
      </div>
    </div>
  );
}

export function PortalFaculty() {
  const [faculty, setFaculty] = useState([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    api.get('/campus360/public/faculty').then(setFaculty).catch(() => setFaculty([]));
  }, []);

  const filtered = faculty.filter((person) => `${person.first_name || ''} ${person.last_name || ''} ${person.department || ''}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="space-y-8 pb-10">
      <FadeInOnScroll>
        <div className="flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/[0.03] p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <SectionLabel>Faculty</SectionLabel>
            <h2 className="mt-3 text-3xl font-black text-white">Faculty roster</h2>
            <p className="mt-2 text-sm text-slate-400">Highly experienced academic leaders, researchers, and faculty mentors.</p>
          </div>
          <div className="relative min-w-[260px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search faculty" className="w-full rounded-full border border-white/10 bg-slate-950/70 py-2.5 pl-9 pr-4 text-sm text-white outline-none placeholder:text-slate-500" />
          </div>
        </div>
      </FadeInOnScroll>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.length ? filtered.map((person, i) => (
          <FadeInOnScroll key={`${person.id || i}`} delay={i * 0.04}>
            <ContentCard title={`${person.first_name || ''} ${person.last_name || ''}`.trim()} description={person.department || 'Faculty member'} icon={Users} badge={person.email || 'Faculty'} />
          </FadeInOnScroll>
        )) : (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-sm text-slate-400">No faculty records available.</div>
        )}
      </div>
    </div>
  );
}

export function PortalLibrary() {
  const features = [
    { icon: BookOpen, title: 'Digital Catalog', description: 'Browse physical and digital resources from one unified system.' },
    { icon: Search, title: 'Smart Search', description: 'Discover books, journals, reading lists, and authors instantly.' },
    { icon: CalendarRange, title: 'Availability Tracking', description: 'Monitor checkouts and returns in real time for study planning.' },
    { icon: Library, title: 'Study Support', description: 'Access academic archives and reserve collaborative spaces.' },
  ];

  return (
    <div className="space-y-8 pb-10">
      <FadeInOnScroll>
        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
          <SectionLabel>Library</SectionLabel>
          <h2 className="mt-3 text-3xl font-black text-white">Your gateway to knowledge</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">CampusCore’s library system keeps books, digital resources, and availability information organized for all students and staff.</p>
        </div>
      </FadeInOnScroll>

      <StaggerContainer className="grid gap-4 md:grid-cols-2" staggerDelay={0.07}>
        {features.map((feature, i) => {
          const Icon = feature.icon;
          return (
            <StaggerItem key={feature.title}>
              <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
                <div className="mb-4 rounded-2xl bg-sky-400/10 p-2.5 text-sky-300"><Icon className="h-5 w-5" /></div>
                <h3 className="text-lg font-bold text-white">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{feature.description}</p>
              </div>
            </StaggerItem>
          );
        })}
      </StaggerContainer>
    </div>
  );
}

export function PortalPlacements() {
  const [placements, setPlacements] = useState([]);

  useEffect(() => {
    api.get('/campus360/public/placements').then(setPlacements).catch(() => setPlacements([]));
  }, []);

  return (
    <div className="space-y-8 pb-10">
      <FadeInOnScroll>
        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
          <SectionLabel>Placements</SectionLabel>
          <h2 className="mt-3 text-3xl font-black text-white">Recruitment outcomes & opportunities</h2>
          <p className="mt-2 text-sm text-slate-400">Placement intelligence, talent readiness, and recent outcomes presented on a refreshed dark campus design.</p>
        </div>
      </FadeInOnScroll>

      <FadeInOnScroll>
        <MarqueeRow />
      </FadeInOnScroll>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard value="1200" label="Placement Records" />
        <StatCard value="86" label="Offer Conversion" accent="text-emerald-300" />
        <StatCard value="35" label="Top Recruiters" accent="text-fuchsia-300" />
      </div>

      <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4 md:p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-300">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-[0.24em] text-slate-500">
                <th className="pb-3 pr-4">Student</th>
                <th className="pb-3 pr-4">Company</th>
                <th className="pb-3 pr-4">Role</th>
                <th className="pb-3 pr-4">Package</th>
              </tr>
            </thead>
            <tbody>
              {placements.length ? placements.map((placement, i) => (
                <tr key={`${placement.company || i}-${placement.student_name || i}`} className="border-b border-white/5">
                  <td className="py-3 pr-4 text-white">{placement.student_name || 'Student'}</td>
                  <td className="py-3 pr-4">{placement.company || 'Company'}</td>
                  <td className="py-3 pr-4">{placement.role || 'Role'}</td>
                  <td className="py-3 pr-4">{placement.package || '—'}</td>
                </tr>
              )) : (
                <tr><td className="py-4 text-slate-400" colSpan="4">No placement records available.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function PortalCourses() {
  const [courses, setCourses] = useState([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    api.get('/campus360/public/courses').then(setCourses).catch(() => setCourses([]));
  }, []);

  const filtered = courses.filter((course) => `${course.name || ''} ${course.code || ''}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="space-y-8 pb-10">
      <FadeInOnScroll>
        <div className="flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/[0.03] p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <SectionLabel>Courses</SectionLabel>
            <h2 className="mt-3 text-3xl font-black text-white">Curriculum and learning tracks</h2>
            <p className="mt-2 text-sm text-slate-400">Discover core curriculum, specializations, and guided academic pathways.</p>
          </div>
          <div className="relative min-w-[260px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search courses" className="w-full rounded-full border border-white/10 bg-slate-950/70 py-2.5 pl-9 pr-4 text-sm text-white outline-none placeholder:text-slate-500" />
          </div>
        </div>
      </FadeInOnScroll>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.length ? filtered.map((course, i) => (
          <FadeInOnScroll key={course.code || i} delay={i * 0.04}>
            <ContentCard title={course.name || 'Course'} description={course.description || 'Course details will appear here.'} icon={GraduationCap} badge={course.code || 'COURSE'} />
          </FadeInOnScroll>
        )) : (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.02] p-8 text-sm text-slate-400">No course records available.</div>
        )}
      </div>
    </div>
  );
}

export function PortalAbout() {
  return (
    <div className="space-y-8 pb-10">
      <FadeInOnScroll>
        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
          <SectionLabel>About</SectionLabel>
          <h2 className="mt-3 text-3xl font-black text-white">CampusCore at a glance</h2>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-400">CampusCore brings together student records, faculty operations, RFID-driven scans, digital library workflows, and career readiness in one secure, intelligent campus layer.</p>
        </div>
      </FadeInOnScroll>

      <div className="grid gap-4 md:grid-cols-2">
        <ContentCard title="Smart Campus Infrastructure" description="From attendance and mentor analytics to placement and library integrations, the platform keeps every campus touchpoint connected." icon={Sparkles} badge="AI" />
        <ContentCard title="Secure Access & Roles" description="Admins, faculty, students, librarians, and parents each have clear secure access paths while preserving the existing auth flow." icon={ShieldCheck} badge="Secure" />
      </div>
    </div>
  );
}

export function PortalContact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setForm({ name: '', email: '', message: '' });
    }, 3000);
  };

  return (
    <div className="space-y-8 pb-10">
      <FadeInOnScroll>
        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
          <SectionLabel>Contact</SectionLabel>
          <h2 className="mt-3 text-3xl font-black text-white">Reach the CampusCore team</h2>
          <p className="mt-2 text-sm text-slate-400">For admissions, portal access, support, or institutional queries, connect with the team below.</p>
        </div>
      </FadeInOnScroll>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
            <div className="flex items-center gap-3 text-white"><MapPin className="h-4 w-4 text-sky-300" /><span>CampusCore Institute, Innovation District, Bengaluru, India</span></div>
            <div className="mt-3 flex items-center gap-3 text-white"><Mail className="h-4 w-4 text-sky-300" /><a href="mailto:hello@campuscore.edu" className="text-slate-300 hover:text-white">hello@campuscore.edu</a></div>
            <div className="mt-3 flex items-center gap-3 text-white"><Phone className="h-4 w-4 text-sky-300" /><a href="tel:+919876543210" className="text-slate-300 hover:text-white">+91 98765 43210</a></div>
          </div>
        </div>

        <FadeInOnScroll>
          <form onSubmit={handleSubmit} className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
            {sent ? (
              <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-6 text-center text-emerald-100">
                <p className="text-lg font-bold">Message logged successfully.</p>
                <p className="mt-2 text-sm text-emerald-50/80">We will follow up shortly.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Full Name</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500" placeholder="John Doe" />
                </div>
                <div>
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Email Address</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500" placeholder="john@example.com" />
                </div>
                <div>
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Your Message</label>
                  <textarea rows="5" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500" placeholder="Write to the portal team..." />
                </div>
                <button type="submit" className="w-full rounded-full bg-sky-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-sky-300">Send Message</button>
              </div>
            )}
          </form>
        </FadeInOnScroll>
      </div>
    </div>
  );
}
