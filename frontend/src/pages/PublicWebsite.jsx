import React, { useState, useEffect } from 'react';
import { 
  Building, BookOpen, Users, Calendar, Phone, Award, LogIn, Info, ShieldCheck, Mail, MapPin, Search, ArrowRight, Star, Sparkles, Check, Compass, Briefcase, Library, Globe, Layers, Target
} from 'lucide-react';
import heroImg from '../assets/hero.png';
import { api } from '../utils/api';
import Login from './Login';
import LibraryPage from './LibraryPage';
import EmptyState from '../components/EmptyState';
import {
  FadeInOnScroll,
  StaggerContainer,
  StaggerItem,
  CountUp,
  AnimatedGradientText,
  CircuitBackground,
  PageTransition,
} from '../components/AnimationWrappers';

export default function PublicWebsite({ onLoginSuccess }) {
  const [activeTab, setActiveTab] = useState('home');
  
  // Data states
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [events, setEvents] = useState([]);
  const [placements, setPlacements] = useState([]);
  const [faculty, setFaculty] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Contact form state
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactSubmitted, setContactSubmitted] = useState(false);

  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        setLoading(true);
        const [deptsData, coursesData, eventsData, placementsData, facultyData] = await Promise.all([
          api.get('/campus360/public/departments').catch(() => []),
          api.get('/campus360/public/courses').catch(() => []),
          api.get('/campus360/public/events').catch(() => []),
          api.get('/campus360/public/placements').catch(() => []),
          api.get('/campus360/public/faculty').catch(() => [])
        ]);
        
        setDepartments(deptsData);
        setCourses(coursesData);
        setEvents(eventsData);
        setPlacements(placementsData);
        setFaculty(facultyData);
      } catch (err) {
        console.error('Error fetching public portal data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPublicData();
  }, []);

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactSubmitted(true);
    setTimeout(() => {
      setContactForm({ name: '', email: '', message: '' });
      setContactSubmitted(false);
    }, 4000);
  };

  const navItems = [
    { id: 'home', label: 'Home', icon: Building },
    { id: 'about', label: 'About', icon: Info },
    { id: 'departments', label: 'Departments', icon: Building },
    { id: 'courses', label: 'Courses', icon: BookOpen },
    { id: 'library', label: 'Library', icon: Library },
    { id: 'faculty', label: 'Faculty', icon: Users },
    { id: 'placements', label: 'Placements', icon: Award },
    { id: 'contact', label: 'Contact', icon: Phone },
  ];

  const renderNavItem = (tabId, label, icon, isMobile = false) => {
    const Icon = icon;
    const isActive = activeTab === tabId;
    return (
      <button
        key={tabId}
        onClick={() => { setActiveTab(tabId); setSearchQuery(''); }}
        className={`nav-item-animated flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide uppercase transition-all cursor-pointer ${
          isActive 
            ? 'nav-active bg-blue-600/90 text-white shadow-lg shadow-blue-500/20 border border-blue-500/30' 
                    : 'text-muted hover:bg-slate-200/40 hover:text-on-card border border-transparent'
        }`}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span>{isMobile && label === 'Departments' ? 'Depts' : label}</span>
      </button>
    );
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* CampusCore Signature Circuit Background */}
      <CircuitBackground />

      {/* Decorative background grid overlays */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35"></div>
      
      {/* Glowing blur points */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] rounded-full bg-orange-500/12 blur-[130px] pointer-events-none"></div>
      <div className="absolute bottom-10 left-1/4 w-[450px] h-[450px] rounded-full bg-fuchsia-500/10 blur-[130px] pointer-events-none"></div>

      {activeTab !== 'home' && (
        <>
          {/* College Website Header/Navbar */}
          <header className="glass-nav sticky top-0 z-40 w-full px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-3.5">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 via-fuchsia-500 to-cyan-500 flex items-center justify-center font-extrabold text-xl text-white shadow-lg shadow-fuchsia-500/20 border border-fuchsia-500/20 gradient-border">
                CC
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight gradient-text-animated">
                  CampusCore
                </h1>
                <p className="text-[9px] text-muted font-bold uppercase tracking-widest leading-none mt-0.5">Institute of Technology</p>
              </div>
            </div>

            {/* Desktop Navbar */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navItems.map(item => renderNavItem(item.id, item.label, item.icon))}
            </nav>

            {/* Portal CTA */}
            <div>
              <button
                onClick={() => setActiveTab('login')}
                className={`btn-press btn-glow flex items-center space-x-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all cursor-pointer ${
                  activeTab === 'login'
                    ? 'bg-gradient-to-r from-orange-500 via-fuchsia-500 to-cyan-500 text-white shadow-lg shadow-fuchsia-500/20'
                    : 'bg-white/90 border border-gray-100 hover:border-gray-200 text-on-card'
                }`}
              >
                <LogIn className="h-4 w-4 shrink-0" />
                <span>Portal Login</span>
              </button>
            </div>
          </header>

          {/* Mobile Nav Bar */}
          <div className="lg:hidden flex overflow-x-auto space-x-1 bg-transparent backdrop-blur-md border-b border-slate-200 p-2.5 scrollbar-none">
            {navItems.map(item => renderNavItem(item.id, item.label, item.icon, true))}
          </div>
        </>
      )}

      {/* Content wrapper */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 relative z-10 overflow-y-auto">
        {activeTab === 'home' && (
          <PageTransition className="space-y-16">
            <section className="relative overflow-hidden rounded-[32px] border border-slate-200/50 bg-[radial-gradient(circle_at_top_left,rgba(248,250,252,0.98)_0%,rgba(252,230,227,0.88)_25%,rgba(219,234,254,0.78)_55%,rgba(239,228,255,0.78)_100%)] p-6 shadow-[0_30px_80px_rgba(15,23,42,0.12)] sm:p-8 lg:p-10">
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.86)_0%,rgba(255,255,255,0)_22%,rgba(255,255,255,0.5)_100%)]"></div>
              <div className="relative z-10 space-y-10">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-white shadow-lg shadow-slate-400/20 border border-slate-200/70 flex items-center justify-center text-lg font-black text-on-card">
                      CC
                    </div>
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.28em] text-on-card">CampusCore</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-center gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-muted xl:order-2 xl:flex-1 xl:justify-center">
                    {navItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => { setActiveTab(item.id); setSearchQuery(''); }}
                        className="transition-colors duration-200 hover:text-on-card"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  <button onClick={() => setActiveTab('login')} className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-500 xl:ml-0">
                    Portal Login
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
                  <div className="relative flex justify-center">
                    <div className="pointer-events-none absolute -left-6 top-10 h-28 w-28 rounded-3xl bg-white/70 blur-2xl opacity-80"></div>
                    <div className="pointer-events-none absolute right-10 top-6 h-20 w-20 rounded-3xl bg-[#fbc4d4]/40 blur-2xl"></div>
                    <div className="pointer-events-none absolute -bottom-10 left-20 h-24 w-24 rounded-3xl bg-[#dbeafe]/60 blur-2xl"></div>

                    <div className="relative aspect-square w-full max-w-[420px] md:max-w-[520px]">
                      <div className="absolute inset-0 rotate-45 overflow-hidden rounded-[42px] border border-white/80 bg-white/70 shadow-[0_40px_80px_rgba(15,23,42,0.12)]">
                        <img
                          src={heroImg}
                          alt="CampusCore student experience"
                          className="absolute inset-0 h-full w-full object-cover -rotate-45"
                        />
                      </div>
                    </div>

                    <div className="hidden md:block absolute right-0 top-1/2 w-[320px] -translate-y-1/2 rounded-[28px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_25px_60px_rgba(15,23,42,0.12)]">
                      <span className="text-[11px] uppercase tracking-[0.32em] text-muted">CampusCore</span>
                      <h2 className="mt-3 text-3xl font-extrabold tracking-tight card-title sm:text-4xl">Smart Campus<br />Learning Hub</h2>
                      <div className="my-4 h-px bg-slate-200/90"></div>
                      <p className="text-sm leading-6 text-muted">Since 2002 — building the next generation of student-ready technology leaders.</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="rounded-[28px] border border-slate-200/80 bg-white/95 p-8 shadow-[0_25px_60px_rgba(15,23,42,0.1)]">
                      <p className="text-base italic leading-7 text-muted">"CampusCore helped me discover my strengths in AI mentorship and placement readiness." </p>
                      <p className="mt-4 text-sm font-bold uppercase tracking-[0.28em] text-on-card">PRIYA MEHTA</p>
                    </div>

                    <div className="rounded-[28px] border border-slate-200/80 bg-white/95 p-8 shadow-[0_25px_60px_rgba(15,23,42,0.1)]">
                      <p className="text-sm uppercase tracking-[0.32em] text-on-card">AI MENTORSHIP</p>
                      <p className="mt-4 text-sm leading-7 text-muted">CampusCore delivers guided curriculum planning, skill gap insights, and internship preparation through our AI-powered mentor system.</p>
                      <p className="mt-3 text-sm leading-7 text-muted">From attendance automation to placement coaching, students access a full campus experience with personalized guidance.</p>

                      <div className="mt-6 rounded-3xl bg-slate-50 p-4">
                        <p className="text-xs uppercase tracking-[0.32em] text-muted">Expert Faculty</p>
                        <p className="mt-1 text-2xl font-bold text-on-card">150+ Faculty Members</p>
                      </div>
                    </div>

                    <div className="rounded-[28px] border border-slate-200/80 bg-white/95 p-8 shadow-[0_25px_60px_rgba(15,23,42,0.1)]">
                      <p className="text-sm uppercase tracking-[0.32em] font-semibold text-on-card">ENTER STUDENT PORTAL</p>
                      <p className="mt-3 text-sm leading-6 text-muted">Access course dashboards, attendance reports, AI mentor plans, and placement prep in one centralized portal.</p>
                    </div>
                  </div>
                </div>
              </div>

                <div className="pointer-events-none absolute right-0 top-1/2 hidden h-full w-14 flex-col items-center justify-center gap-4 lg:flex">
                <span className="rotate-90 origin-center text-[11px] uppercase tracking-[0.32em] text-muted">hello@campuscore.edu</span>
                <span className="rotate-90 origin-center text-[11px] uppercase tracking-[0.32em] text-muted">campuscore.edu</span>
                <span className="rotate-90 origin-center text-[11px] uppercase tracking-[0.32em] text-muted">@CampusCore</span>
              </div>
            </section>

            {/* Core Features Pillars Grid */}
            <div className="space-y-6 pt-6">
              <FadeInOnScroll>
                <h3 className="text-base font-extrabold card-title border-b border-slate-900 pb-3 flex items-center space-x-2">
                  <Building className="h-4.5 w-4.5 text-blue-400" />
                  <span className="uppercase tracking-wider text-xs">Integrated Campus Pillars</span>
                </h3>
              </FadeInOnScroll>

              <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6" staggerDelay={0.12}>
                {[
                  { title: 'IoT RFID Sensors', desc: 'Real-time check-in and check-out tracking directly recorded into daily access summaries.', icon: ShieldCheck, color: 'text-blue-400 bg-blue-500/10' },
                  { title: 'AI Mentor Engine', desc: 'Interactive MCQ career quizzes, spaCy-modeled NLP skill extractors, and score-based learning roadmaps.', icon: Compass, color: 'text-indigo-400 bg-indigo-500/10' },
                  { title: 'Placement Analytics', desc: 'Track packages, top student scores, recruiters directory, and placement readiness metrics.', icon: Award, color: 'text-emerald-400 bg-emerald-500/10' }
                ].map((pillar, idx) => {
                  const Icon = pillar.icon;
                  return (
                    <StaggerItem key={idx}>
                      <div className="glass-card rounded-2xl p-6 border hover-scale hover-glow flex flex-col items-start space-y-4 h-full">
                        <div className={`p-3 rounded-xl ${pillar.color} border border-white/5`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <h4 className="text-sm font-bold card-title">{pillar.title}</h4>
                        <p className="text-xs text-muted leading-relaxed">{pillar.desc}</p>
                      </div>
                    </StaggerItem>
                  );
                })}
              </StaggerContainer>
            </div>

            {/* Stats Roster — Animated Count Up */}
            <div className="relative rounded-3xl overflow-hidden pt-10">
              <div className="absolute -top-10 left-10 h-52 w-52 rounded-full bg-fuchsia-500/12 blur-[110px]" />
              <div className="absolute top-0 right-10 h-36 w-36 rounded-full bg-cyan-400/10 blur-[100px]" />
              <StaggerContainer className="relative grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 pt-4" staggerDelay={0.1}>
                {[
                  { count: '100%', label: 'Supabase Database', desc: 'Secure cloud integration' },
                  { count: '94.2%', label: 'Placement Records', desc: 'Highest in the region' },
                  { count: '150+', label: 'Expert Faculty', desc: 'Industry-active lectures' },
                  { count: '100%', label: 'MERN Architecture', desc: 'Blazing fast loading speeds' }
                ].map((stat, idx) => (
                  <StaggerItem key={idx}>
                    <div className="glass-card rounded-2xl p-6 border text-center space-y-4 hover-glow transition-all">
                      <div className="text-2xl font-black gradient-text-animated">
                        <CountUp
                          end={stat.count}
                          duration={2.5}
                          decimals={stat.count.includes('.') ? 1 : 0}
                        />
                      </div>
                      <div className="text-xs font-bold card-title">{stat.label}</div>
                      <div className="text-[10px] text-muted">{stat.desc}</div>
                    </div>
                  </StaggerItem>
                ))}
              </StaggerContainer>

            </div>
            {/* Events & Notices List */}
            <div className="space-y-6 pt-6">
              <FadeInOnScroll>
                <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                  <h3 className="text-base font-extrabold card-title flex items-center space-x-2.5">
                    <Calendar className="h-4.5 w-4.5 text-blue-400" />
                    <span>College Events & Announcements</span>
                  </h3>
                </div>
              </FadeInOnScroll>
              
              {events.length === 0 ? (
                <FadeInOnScroll delay={0.1}>
                  <EmptyState
                    icon={Calendar}
                    title="No Upcoming Events"
                    description="No upcoming events cataloged yet. Check back soon for announcements and campus activities."
                  />
                </FadeInOnScroll>
              ) : (
                <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-6" staggerDelay={0.1}>
                  {events.map((evt) => (
                    <StaggerItem key={evt.id}>
                      <div className="glass-card rounded-2xl p-6 bg-slate-900/15 border border-slate-900 hover-scale hover-glow flex flex-col justify-between space-y-4">
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/25 text-[9px] font-bold uppercase tracking-wide">
                              Upcoming notice
                            </span>
                            <span className="text-[10px] text-muted font-semibold font-mono">
                              {new Date(evt.event_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold card-title leading-snug">{evt.title}</h4>
                          <p className="text-xs text-muted leading-relaxed">{evt.description}</p>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-[10px] text-muted border-t border-slate-900 pt-3">
                          <MapPin className="h-3 w-3 text-muted shrink-0" />
                          <span>Venue: {evt.location}</span>
                        </div>
                      </div>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              )}
            </div>
          </PageTransition>
        )}

        {activeTab === 'about' && (
          <PageTransition className="space-y-8 max-w-4xl mx-auto py-6">
            <FadeInOnScroll className="text-center space-y-2">
              <h2 className="text-2xl font-black card-title uppercase tracking-wide">About CampusCore College</h2>
              <p className="text-xs text-muted">Pioneering standard-driven engineering research since 2002</p>
            </FadeInOnScroll>
            
            <FadeInOnScroll delay={0.1}>
              <div className="glass-card rounded-2xl p-6 md:p-8 border space-y-6 leading-relaxed">
                <div className="space-y-3.5">
                  <h3 className="text-base font-bold text-blue-400 flex items-center space-x-2 border-b border-slate-900 pb-2">
                    <ShieldCheck className="h-4.5 w-4.5" />
                    <span>Our Vision & Values</span>
                  </h3>
                  <p className="text-xs text-muted leading-relaxed">
                    To cultivate an innovative, technology-driven academic environment that integrates core engineering studies with next-generation smart automations. We focus on preparing students to solve global problems through critical analytics, solid foundations, and personalized mentorship.
                  </p>
                </div>

                <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-900/60" staggerDelay={0.1}>
                  <StaggerItem>
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold card-title uppercase tracking-wide">Integrated Campus</h4>
                      <p className="text-[11px] text-muted leading-relaxed">
                        Embedded sensors, attendance tracking logs, library transactions, and real-time Parent alerts via email.
                      </p>
                    </div>
                  </StaggerItem>
                  <StaggerItem>
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold card-title uppercase tracking-wide">AI Mentorship</h4>
                      <p className="text-[11px] text-muted leading-relaxed">
                        Providing automated resume parsers, skill gap evaluations, and personalized roadmaps custom-tailored to student scores.
                      </p>
                    </div>
                  </StaggerItem>
                  <StaggerItem>
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold card-title uppercase tracking-wide">Industry Placement</h4>
                      <p className="text-[11px] text-muted leading-relaxed">
                        Maintained links with premium recruiters and a solid internship prep curriculum matching standard specifications.
                      </p>
                    </div>
                  </StaggerItem>
                </StaggerContainer>
              </div>
            </FadeInOnScroll>

            {/* Additional About sections to fill empty area */}
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-6" staggerDelay={0.1}>
              <StaggerItem>
                <div className="glass-card rounded-2xl p-6 border hover-glow transition-all space-y-3 h-full">
                  <div className="p-3 rounded-xl text-blue-400 bg-blue-500/10 border border-white/5 w-fit">
                    <Target className="h-5 w-5" />
                  </div>
                  <h4 className="text-sm font-bold card-title">Our Mission</h4>
                  <p className="text-xs text-muted leading-relaxed">
                    To bridge the gap between traditional academia and industry demands through technology-driven learning, 
                    real-time campus management, and AI-powered career guidance that prepares students for the global workforce.
                  </p>
                </div>
              </StaggerItem>
              <StaggerItem>
                <div className="glass-card rounded-2xl p-6 border hover-glow transition-all space-y-3 h-full">
                  <div className="p-3 rounded-xl text-indigo-400 bg-indigo-500/10 border border-white/5 w-fit">
                    <Layers className="h-5 w-5" />
                  </div>
                  <h4 className="text-sm font-bold card-title">Technology Stack</h4>
                  <p className="text-xs text-muted leading-relaxed">
                    Built on a modern MERN architecture with PostgreSQL, Redis caching, Supabase integration, 
                    Socket.IO real-time communications, and ESP32-powered IoT gate terminals for seamless campus automation.
                  </p>
                </div>
              </StaggerItem>
            </StaggerContainer>

            <FadeInOnScroll delay={0.2}>
              <div className="glass-card rounded-2xl p-6 border hover-glow transition-all">
                <h4 className="text-sm font-bold card-title mb-4 flex items-center space-x-2 border-b border-slate-900 pb-2">
                  <Globe className="h-4 w-4 text-blue-400" />
                  <span>Campus Highlights</span>
                </h4>
                <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4" staggerDelay={0.08}>
                  {[
                    { value: '20+', label: 'Years of Excellence' },
                    { value: '5000+', label: 'Alumni Network' },
                    { value: '50+', label: 'Research Papers' },
                    { value: '15+', label: 'Industry Partners' },
                  ].map((item, idx) => (
                    <StaggerItem key={idx}>
                        <div className="text-center py-3">
                        <div className="text-lg font-black gradient-text-animated">
                          <CountUp end={item.value} duration={2} />
                        </div>
                        <div className="text-[10px] text-muted font-semibold mt-1">{item.label}</div>
                      </div>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              </div>
            </FadeInOnScroll>
          </PageTransition>
        )}

        {activeTab === 'departments' && (
          <PageTransition className="space-y-6">
            <FadeInOnScroll>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-4">
                <div>
                  <h2 className="text-xl font-bold card-title">Academic Departments</h2>
                  <p className="text-xs text-muted mt-0.5">Explore our departments leading innovation and research</p>
                </div>
                <div className="relative w-full md:w-80">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted">
                    <Search className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search departments..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl text-on-card placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all text-xs"
                  />
                </div>
              </div>
            </FadeInOnScroll>

            {departments.filter(dept => dept.name.toLowerCase().includes(searchQuery.toLowerCase()) || dept.code.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
              <FadeInOnScroll>
                <EmptyState
                  icon={Building}
                  title="No Departments Found"
                  description={searchQuery ? `No departments matching "${searchQuery}". Try a different search term.` : 'Department data will appear here once loaded from the system.'}
                />
              </FadeInOnScroll>
            ) : (
              <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-6" staggerDelay={0.08}>
                {departments
                  .filter(dept => dept.name.toLowerCase().includes(searchQuery.toLowerCase()) || dept.code.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((dept) => (
                    <StaggerItem key={dept.id}>
                      <div className="glass-card rounded-2xl p-6 border space-y-4 hover-scale hover-glow transition-all">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <span className="px-2.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono text-[9px] font-bold uppercase tracking-wider">
                              {dept.code}
                            </span>
                            <h4 className="text-sm font-bold card-title pt-1.5">{dept.name}</h4>
                          </div>
                        </div>
                        <p className="text-xs text-muted leading-relaxed">{dept.description}</p>
                        <div className="border-t border-slate-900/60 pt-3 flex justify-between text-[10px] text-muted">
                          <span>Head of Department: <span className="font-semibold text-muted">{dept.head_of_dept || 'Dr. Yathish Aradhya'}</span></span>
                        </div>
                      </div>
                    </StaggerItem>
                  ))}
              </StaggerContainer>
            )}
          </PageTransition>
        )}

        {activeTab === 'courses' && (
          <PageTransition className="space-y-6">
            <FadeInOnScroll>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-4">
                <div>
                  <h2 className="text-xl font-bold card-title">Courses & Curriculum</h2>
                  <p className="text-xs text-muted mt-0.5">Undergraduate and postgraduate degrees available</p>
                </div>
                <div className="relative w-full md:w-80">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted">
                    <Search className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search courses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl text-on-card placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all text-xs"
                  />
                </div>
              </div>
            </FadeInOnScroll>

            {courses.filter(course => course.name.toLowerCase().includes(searchQuery.toLowerCase()) || course.code.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
              <FadeInOnScroll>
                <EmptyState
                  icon={BookOpen}
                  title="No Courses Found"
                  description={searchQuery ? `No courses matching "${searchQuery}". Try a different search term.` : 'Course catalog will appear here once loaded from the system.'}
                />
              </FadeInOnScroll>
            ) : (
              <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" staggerDelay={0.08}>
                {courses
                  .filter(course => course.name.toLowerCase().includes(searchQuery.toLowerCase()) || course.code.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((course) => (
                    <StaggerItem key={course.id}>
                      <div className="glass-card rounded-2xl p-5 bg-slate-900/20 border border-slate-900 hover-scale hover-glow transition-all flex flex-col justify-between space-y-4 h-full">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between border-b border-slate-950 pb-2">
                            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono text-[9px] font-bold">
                              {course.code}
                            </span>
                            <span className="text-[10px] text-muted font-semibold font-mono">
                              {course.degree}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold card-title line-clamp-1">{course.name}</h4>
                          <p className="text-xs text-muted leading-relaxed line-clamp-3">{course.description}</p>
                        </div>
                        
                        <div className="border-t border-slate-900 pt-3 flex justify-between text-[10px] text-muted">
                          <span>Credits: <strong className="text-on-card">{course.credits}</strong></span>
                          <span>Duration: <strong className="text-on-card">{course.duration_years} Years</strong></span>
                        </div>
                      </div>
                    </StaggerItem>
                  ))}
              </StaggerContainer>
            )}
          </PageTransition>
        )}

        {activeTab === 'library' && (
          <PageTransition>
            <LibraryPage />
          </PageTransition>
        )}

        {activeTab === 'faculty' && (
          <PageTransition className="space-y-6">
            <FadeInOnScroll>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-4">
                <div>
                  <h2 className="text-xl font-bold card-title">Faculty Roster</h2>
                  <p className="text-xs text-muted mt-0.5">Our academic lecturers and industry-active scholars</p>
                </div>
                <div className="relative w-full md:w-80">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-muted">
                    <Search className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search faculty by name/department..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl text-on-card placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all text-xs"
                  />
                </div>
              </div>
            </FadeInOnScroll>

            {faculty.filter(f => f.first_name.toLowerCase().includes(searchQuery.toLowerCase()) || f.last_name.toLowerCase().includes(searchQuery.toLowerCase()) || (f.department && f.department.toLowerCase().includes(searchQuery.toLowerCase()))).length === 0 ? (
              <FadeInOnScroll>
                <EmptyState
                  icon={Users}
                  title="No Faculty Found"
                  description={searchQuery ? `No faculty matching "${searchQuery}". Try a different search term.` : 'Faculty roster will appear here once loaded from the system.'}
                />
              </FadeInOnScroll>
            ) : (
              <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" staggerDelay={0.06}>
                {faculty
                  .filter(f => f.first_name.toLowerCase().includes(searchQuery.toLowerCase()) || f.last_name.toLowerCase().includes(searchQuery.toLowerCase()) || (f.department && f.department.toLowerCase().includes(searchQuery.toLowerCase())))
                  .map((f, idx) => (
                    <StaggerItem key={idx}>
                      <div className="glass-card rounded-2xl p-5 border hover-scale hover-glow transition-all space-y-4">
                        <div className="flex items-center space-x-3.5">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-bold text-sm text-white shadow-md border border-white/10">
                            {f.first_name[0]}{f.last_name[0]}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold card-title">{f.first_name} {f.last_name}</h4>
                            <p className="text-[10px] text-blue-400 font-semibold">{f.department || 'Assistant Professor'}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-1.5 text-[10px] text-muted border-t border-slate-900 pt-3">
                          <div className="flex items-center space-x-2">
                            <Mail className="h-3 w-3 text-muted shrink-0" />
                            <span className="truncate">{f.email}</span>
                          </div>
                          {f.phone && (
                            <div className="flex items-center space-x-2">
                              <Phone className="h-3 w-3 text-muted shrink-0" />
                              <span>{f.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </StaggerItem>
                  ))}
              </StaggerContainer>
            )}
          </PageTransition>
        )}

        {activeTab === 'placements' && (
          <PageTransition className="space-y-6">
            <FadeInOnScroll>
              <div className="border-b border-slate-900 pb-4">
                <h2 className="text-xl font-bold card-title">Placement Reports</h2>
                <p className="text-xs text-muted mt-0.5">Consistently driving job excellence across industry standard salaries</p>
              </div>
            </FadeInOnScroll>

            {/* Recruiter list */}
            <FadeInOnScroll delay={0.1}>
              <div className="glass-card rounded-2xl p-6 bg-gradient-to-r from-blue-950/10 to-slate-950/10 border border-blue-900/10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-1.5 max-w-lg text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start space-x-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                    ))}
                    <span className="text-[9px] text-muted font-bold ml-1 uppercase tracking-wide">Top Recruiters Choice</span>
                  </div>
                  <h3 className="text-base font-bold card-title">Our Students Work at Leading Organizations</h3>
                  <p className="text-xs text-muted leading-relaxed">
                    CampusCore graduates are placed in premier companies worldwide, offering software development, cloud operations, cyber threat analysis, and data consulting.
                  </p>
                </div>
                <StaggerContainer className="flex flex-wrap justify-center gap-2 shrink-0 max-w-xs md:max-w-md" staggerDelay={0.06}>
                  {['Google', 'Microsoft', 'Amazon', 'Adobe', 'Qualcomm', 'Infosys'].map((company, idx) => (
                    <StaggerItem key={idx}>
                      <span className="px-3.5 py-1.5 rounded-xl bg-white/90 border border-gray-100 font-bold text-xs text-muted tracking-wide select-none hover-glow transition-all">
                        {company}
                      </span>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              </div>
            </FadeInOnScroll>

            {/* Placement List table */}
            <FadeInOnScroll delay={0.2}>
              <div className="glass-card rounded-2xl p-6 border">
                <h3 className="text-sm font-bold card-title mb-4 flex items-center space-x-2 border-b border-slate-900 pb-2">
                  <Briefcase className="h-4.5 w-4.5 text-blue-400" />
                  <span>Recent Placements Record</span>
                </h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-850 text-muted">
                        <th className="pb-2.5 font-bold uppercase tracking-wider">Student Name</th>
                        <th className="pb-2.5 font-bold uppercase tracking-wider">Company Recruiter</th>
                        <th className="pb-2.5 font-bold uppercase tracking-wider">Job Role</th>
                        <th className="pb-2.5 font-bold uppercase tracking-wider text-right">Package (LPA)</th>
                        <th className="pb-2.5 font-bold uppercase tracking-wider text-right">Placed Year</th>
                      </tr>
                    </thead>
                    <tbody>
                      {placements.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="py-4 text-center text-muted">No placements listed in the log.</td>
                        </tr>
                      ) : (
                        placements.map((p, idx) => (
                          <tr key={idx} className="border-b border-slate-900/60 hover:bg-slate-900/5">
                            <td className="py-3 font-semibold card-title">{p.student_name}</td>
                            <td className="py-3 text-muted font-bold">{p.company_name}</td>
                            <td className="py-3 text-muted">{p.job_role || 'Software Engineer Intern'}</td>
                            <td className="py-3 text-right">
                              <span className="inline-block px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-black font-mono">
                                ₹ {parseFloat(p.package_lpa).toFixed(2)} LPA
                              </span>
                            </td>
                            <td className="py-3 text-right text-muted font-mono font-semibold">{p.placed_year}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </FadeInOnScroll>

            {/* Placement Statistics Summary — fills empty area */}
            <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4" staggerDelay={0.1}>
              {[
                { value: '94.2%', label: 'Placement Rate' },
                { value: '12', label: 'Avg Package (LPA)' },
                { value: '50+', label: 'Recruiting Companies' },
                { value: '100%', label: 'Internship Coverage' },
              ].map((stat, idx) => (
                <StaggerItem key={idx}>
                  <div className="glass-card rounded-2xl p-5 border text-center space-y-1 hover-glow transition-all">
                    <div className="text-xl font-black gradient-text-animated">
                      <CountUp end={stat.value} duration={2} decimals={stat.value.includes('.') ? 1 : 0} />
                    </div>
                    <div className="text-[10px] text-muted font-semibold">{stat.label}</div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </PageTransition>
        )}

        {activeTab === 'contact' && (
          <PageTransition className="max-w-2xl mx-auto space-y-6 py-6">
            <FadeInOnScroll className="text-center space-y-1.5">
              <h2 className="text-2xl font-black card-title uppercase tracking-wide">Contact Us</h2>
              <p className="text-xs text-muted">We'd love to hear from you. Have inquiries, suggestions, or need portal access?</p>
            </FadeInOnScroll>

            <FadeInOnScroll delay={0.1}>
              <div className="glass-card rounded-2xl p-6 border hover-glow">
                {contactSubmitted ? (
                  <div className="py-8 text-center space-y-3">
                    <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-450 flex items-center justify-center mx-auto">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <h3 className="text-base font-bold card-title">Message Logged!</h3>
                    <p className="text-xs text-muted max-w-sm mx-auto leading-relaxed">
                      Thank you. Your message has been safely logged in our system. A representative will get back to you shortly.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted uppercase tracking-wider block">Full Name</label>
                        <input
                          type="text"
                          required
                          value={contactForm.name}
                          onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                          className="w-full px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-on-card placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all text-xs"
                          placeholder="John Doe"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-muted uppercase tracking-wider block">Email Address</label>
                        <input
                          type="email"
                          required
                          value={contactForm.email}
                          onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                          className="w-full px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-on-card placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all text-xs"
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-muted uppercase tracking-wider block">Your Message</label>
                      <textarea
                        required
                        rows="4"
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-on-card placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all text-xs leading-relaxed"
                        placeholder="Write your query or feedback here..."
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      className="btn-press w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs uppercase tracking-wide transition-all shadow-lg shadow-blue-500/15 cursor-pointer"
                    >
                      Send message
                    </button>
                  </form>
                )}
              </div>
            </FadeInOnScroll>
          </PageTransition>
        )}

        {activeTab === 'login' && (
          <PageTransition className="py-6">
            <Login onLoginSuccess={onLoginSuccess} />
          </PageTransition>
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200 bg-transparent text-center text-[10px] text-muted relative z-10">
        <p>© 2026 CampusCore Systems Inc. All rights reserved. Registered under Supabase Hosting Specs.</p>
      </footer>
    </div>
  );
}
