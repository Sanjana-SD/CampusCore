import React, { useState, useEffect } from 'react';
import { 
  Building, BookOpen, Users, Calendar, Phone, Award, LogIn, Info, ShieldCheck, Mail, MapPin, Search, ArrowRight, Star, Sparkles, Check, Compass, Briefcase, Library, Globe, Layers, Target
} from 'lucide-react';
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
            : 'text-slate-400 hover:bg-slate-800/40 hover:text-white border border-transparent'
        }`}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span>{isMobile && label === 'Departments' ? 'Depts' : label}</span>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden premium-gradient">
      {/* CampusCore Signature Circuit Background */}
      <CircuitBackground />

      {/* Decorative background grid overlays */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35"></div>
      
      {/* Glowing blur points */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] rounded-full bg-orange-500/12 blur-[130px] pointer-events-none"></div>
      <div className="absolute bottom-10 left-1/4 w-[450px] h-[450px] rounded-full bg-fuchsia-500/10 blur-[130px] pointer-events-none"></div>

      {/* College Website Header/Navbar */}
      <header className="glass-nav sticky top-0 z-40 w-full px-6 py-4 flex items-center justify-between bg-slate-950/35 backdrop-blur-2xl shadow-[0_18px_80px_-50px_rgba(0,0,0,0.7)]">
        <div className="flex items-center space-x-3.5">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 via-fuchsia-500 to-cyan-500 flex items-center justify-center font-extrabold text-xl text-white shadow-lg shadow-fuchsia-500/20 border border-fuchsia-500/20 gradient-border">
            CC
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight gradient-text-animated">
              CampusCore
            </h1>
            <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest leading-none mt-0.5">Institute of Technology</p>
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
                : 'bg-slate-950/70 border border-slate-800 hover:border-slate-700 hover:bg-slate-900/60 text-slate-200 hover:text-white'
            }`}
          >
            <LogIn className="h-4 w-4 shrink-0" />
            <span>Portal Login</span>
          </button>
        </div>
      </header>

      {/* Mobile Nav Bar */}
      <div className="lg:hidden flex overflow-x-auto space-x-1 bg-slate-950/60 backdrop-blur-md border-b border-slate-900 p-2.5 scrollbar-none">
        {navItems.map(item => renderNavItem(item.id, item.label, item.icon, true))}
      </div>

      {/* Content wrapper */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 relative z-10 overflow-y-auto">
        {activeTab === 'home' && (
          <PageTransition className="space-y-16">
            {/* Split Hero Layout */}
            <div className="relative overflow-hidden py-12">
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute left-[-5%] top-10 h-[520px] w-[520px] rounded-full bg-orange-500/12 blur-[140px]" />
                <div className="absolute right-0 top-24 h-[420px] w-[420px] rounded-full bg-fuchsia-500/12 blur-[140px]" />
                <div className="absolute left-16 bottom-6 h-[140px] w-[140px] rotate-45 rounded-3xl bg-white/8 blur-2xl" />
                <div className="absolute right-16 bottom-24 h-[120px] w-[120px] rotate-45 rounded-3xl bg-slate-100/6 blur-2xl" />
              </div>

              <FadeInOnScroll className="relative z-10 max-w-3xl space-y-6 text-left" direction="left">
                <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-orange-500/10 text-orange-200 border border-orange-500/20 text-xs font-semibold">
                  <Sparkles className="h-3.5 w-3.5 text-orange-300" />
                  <span>Integrated Smart Campus System</span>
                </div>
                
                <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.05]">
                  Empowering Academics <br />
                  Through <AnimatedGradientText>AI Mentorship</AnimatedGradientText>
                </h2>
                
                <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-xl">
                  Welcome to CampusCore, a unified educational ecosystem. Connect with advanced gate sensors, view real-time warnings, study curriculum modules, and map your industry readiness using our AI-driven mentor.
                </p>

                <StaggerContainer className="space-y-3 pt-2" staggerDelay={0.08}>
                  {[
                    'Automatic RFID gate check-ins & duration tracking',
                    'Parent notification alerts via Express cron checkouts',
                    'NLP skill gap parser & performance roadmaps',
                    'Integrated library ledgers and online assessments'
                  ].map((item, idx) => (
                    <StaggerItem key={idx}>
                      <div className="flex items-center space-x-2.5 text-xs text-slate-350">
                        <span className="h-4.5 w-4.5 rounded-full bg-emerald-500/15 border border-emerald-500/20 text-emerald-450 flex items-center justify-center shrink-0">
                          <Check className="h-3 w-3" />
                        </span>
                        <span>{item}</span>
                      </div>
                    </StaggerItem>
                  ))}
                </StaggerContainer>

                <div className="pt-4 flex flex-wrap gap-4">
                  <button 
                    onClick={() => setActiveTab('login')}
                    className="btn-press px-7 py-3 bg-gradient-to-r from-orange-500 via-fuchsia-500 to-cyan-500 text-white font-bold rounded-full text-xs uppercase tracking-wide transition-all shadow-2xl shadow-fuchsia-500/20 flex items-center space-x-2 cursor-pointer"
                  >
                    <span>Enter Student Portal</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => setActiveTab('about')}
                    className="btn-press btn-glow px-7 py-3 bg-slate-950/70 border border-slate-800 hover:border-slate-700 hover:bg-slate-900/70 text-slate-200 font-bold rounded-full text-xs uppercase tracking-wide transition-all cursor-pointer"
                  >
                    About The College
                  </button>
                </div>
              </FadeInOnScroll>
            </div>

            {/* Core Features Pillars Grid */}
            <div className="space-y-6 pt-6">
              <FadeInOnScroll>
                <h3 className="text-base font-extrabold text-slate-200 border-b border-slate-900 pb-3 flex items-center space-x-2">
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
                      <div className="glass-card rounded-2xl p-6 bg-slate-900/10 border border-slate-900 hover-scale hover-glow flex flex-col items-start space-y-4 h-full">
                        <div className={`p-3 rounded-xl ${pillar.color} border border-white/5`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-200">{pillar.title}</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">{pillar.desc}</p>
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
                    <div className="glass-card rounded-2xl p-6 border border-slate-900 bg-slate-900/10 text-center space-y-1.5 hover-glow transition-all">
                    <div className="text-2xl font-black gradient-text-animated">
                      <CountUp 
                        end={stat.count} 
                        duration={2.5} 
                        decimals={stat.count.includes('.') ? 1 : 0}
                      />
                    </div>
                    <div className="text-xs font-bold text-slate-200">{stat.label}</div>
                    <div className="text-[10px] text-slate-500">{stat.desc}</div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>

            {/* Events & Notices List */}
            <div className="space-y-6 pt-6">
              <FadeInOnScroll>
                <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                  <h3 className="text-base font-extrabold text-slate-200 flex items-center space-x-2.5">
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
                            <span className="text-[10px] text-slate-400 font-semibold font-mono">
                              {new Date(evt.event_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-250 leading-snug">{evt.title}</h4>
                          <p className="text-xs text-slate-400 leading-relaxed">{evt.description}</p>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-[10px] text-slate-500 border-t border-slate-900 pt-3">
                          <MapPin className="h-3 w-3 text-slate-500 shrink-0" />
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
              <h2 className="text-2xl font-black text-slate-100 uppercase tracking-wide">About CampusCore College</h2>
              <p className="text-xs text-slate-400">Pioneering standard-driven engineering research since 2002</p>
            </FadeInOnScroll>
            
            <FadeInOnScroll delay={0.1}>
              <div className="glass-card rounded-2xl p-6 md:p-8 bg-slate-900/10 border border-slate-900 space-y-6 leading-relaxed">
                <div className="space-y-3.5">
                  <h3 className="text-base font-bold text-blue-400 flex items-center space-x-2 border-b border-slate-900 pb-2">
                    <ShieldCheck className="h-4.5 w-4.5" />
                    <span>Our Vision & Values</span>
                  </h3>
                  <p className="text-xs text-slate-350 leading-relaxed">
                    To cultivate an innovative, technology-driven academic environment that integrates core engineering studies with next-generation smart automations. We focus on preparing students to solve global problems through critical analytics, solid foundations, and personalized mentorship.
                  </p>
                </div>

                <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-900/60" staggerDelay={0.1}>
                  <StaggerItem>
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">Integrated Campus</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Embedded sensors, attendance tracking logs, library transactions, and real-time Parent alerts via email.
                      </p>
                    </div>
                  </StaggerItem>
                  <StaggerItem>
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">AI Mentorship</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Providing automated resume parsers, skill gap evaluations, and personalized roadmaps custom-tailored to student scores.
                      </p>
                    </div>
                  </StaggerItem>
                  <StaggerItem>
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">Industry Placement</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
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
                <div className="glass-card rounded-2xl p-6 bg-slate-900/10 border border-slate-900 hover-glow transition-all space-y-3 h-full">
                  <div className="p-3 rounded-xl text-blue-400 bg-blue-500/10 border border-white/5 w-fit">
                    <Target className="h-5 w-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-200">Our Mission</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    To bridge the gap between traditional academia and industry demands through technology-driven learning, 
                    real-time campus management, and AI-powered career guidance that prepares students for the global workforce.
                  </p>
                </div>
              </StaggerItem>
              <StaggerItem>
                <div className="glass-card rounded-2xl p-6 bg-slate-900/10 border border-slate-900 hover-glow transition-all space-y-3 h-full">
                  <div className="p-3 rounded-xl text-indigo-400 bg-indigo-500/10 border border-white/5 w-fit">
                    <Layers className="h-5 w-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-200">Technology Stack</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Built on a modern MERN architecture with PostgreSQL, Redis caching, Supabase integration, 
                    Socket.IO real-time communications, and ESP32-powered IoT gate terminals for seamless campus automation.
                  </p>
                </div>
              </StaggerItem>
            </StaggerContainer>

            <FadeInOnScroll delay={0.2}>
              <div className="glass-card rounded-2xl p-6 bg-slate-900/10 border border-slate-900 hover-glow transition-all">
                <h4 className="text-sm font-bold text-slate-200 mb-4 flex items-center space-x-2 border-b border-slate-900 pb-2">
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
                        <div className="text-[10px] text-slate-500 font-semibold mt-1">{item.label}</div>
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
                  <h2 className="text-xl font-bold text-slate-100">Academic Departments</h2>
                  <p className="text-xs text-slate-450 mt-0.5">Explore our departments leading innovation and research</p>
                </div>
                <div className="relative w-full md:w-80">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <Search className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search departments..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-900 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all text-xs"
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
                      <div className="glass-card rounded-2xl p-6 bg-slate-900/10 border border-slate-900 space-y-4 hover-scale hover-glow transition-all">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <span className="px-2.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono text-[9px] font-bold uppercase tracking-wider">
                              {dept.code}
                            </span>
                            <h4 className="text-sm font-bold text-slate-200 pt-1.5">{dept.name}</h4>
                          </div>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">{dept.description}</p>
                        <div className="border-t border-slate-900/60 pt-3 flex justify-between text-[10px] text-slate-500">
                          <span>Head of Department: <span className="font-semibold text-slate-300">{dept.head_of_dept || 'Dr. Yathish Aradhya'}</span></span>
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
                  <h2 className="text-xl font-bold text-slate-100">Courses & Curriculum</h2>
                  <p className="text-xs text-slate-450 mt-0.5">Undergraduate and postgraduate degrees available</p>
                </div>
                <div className="relative w-full md:w-80">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <Search className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search courses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-900 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all text-xs"
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
                            <span className="text-[10px] text-slate-400 font-semibold font-mono">
                              {course.degree}
                            </span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-200 line-clamp-1">{course.name}</h4>
                          <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{course.description}</p>
                        </div>
                        
                        <div className="border-t border-slate-900 pt-3 flex justify-between text-[10px] text-slate-500">
                          <span>Credits: <strong className="text-slate-350">{course.credits}</strong></span>
                          <span>Duration: <strong className="text-slate-350">{course.duration_years} Years</strong></span>
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
                  <h2 className="text-xl font-bold text-slate-100">Faculty Roster</h2>
                  <p className="text-xs text-slate-450 mt-0.5">Our academic lecturers and industry-active scholars</p>
                </div>
                <div className="relative w-full md:w-80">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                    <Search className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search faculty by name/department..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-900 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all text-xs"
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
                      <div className="glass-card rounded-2xl p-5 bg-slate-900/10 border border-slate-900 hover-scale hover-glow transition-all space-y-4">
                        <div className="flex items-center space-x-3.5">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-bold text-sm text-white shadow-md border border-white/10">
                            {f.first_name[0]}{f.last_name[0]}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-250">{f.first_name} {f.last_name}</h4>
                            <p className="text-[10px] text-blue-400 font-semibold">{f.department || 'Assistant Professor'}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-1.5 text-[10px] text-slate-400 border-t border-slate-900 pt-3">
                          <div className="flex items-center space-x-2">
                            <Mail className="h-3 w-3 text-slate-500 shrink-0" />
                            <span className="truncate">{f.email}</span>
                          </div>
                          {f.phone && (
                            <div className="flex items-center space-x-2">
                              <Phone className="h-3 w-3 text-slate-500 shrink-0" />
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
                <h2 className="text-xl font-bold text-slate-100">Placement Reports</h2>
                <p className="text-xs text-slate-450 mt-0.5">Consistently driving job excellence across industry standard salaries</p>
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
                    <span className="text-[9px] text-slate-400 font-bold ml-1 uppercase tracking-wide">Top Recruiters Choice</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-200">Our Students Work at Leading Organizations</h3>
                  <p className="text-xs text-slate-450 leading-relaxed">
                    CampusCore graduates are placed in premier companies worldwide, offering software development, cloud operations, cyber threat analysis, and data consulting.
                  </p>
                </div>
                <StaggerContainer className="flex flex-wrap justify-center gap-2 shrink-0 max-w-xs md:max-w-md" staggerDelay={0.06}>
                  {['Google', 'Microsoft', 'Amazon', 'Adobe', 'Qualcomm', 'Infosys'].map((company, idx) => (
                    <StaggerItem key={idx}>
                      <span className="px-3.5 py-1.5 rounded-xl bg-slate-950/90 border border-slate-800 font-bold text-xs text-slate-400 tracking-wide select-none hover-glow transition-all">
                        {company}
                      </span>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              </div>
            </FadeInOnScroll>

            {/* Placement List table */}
            <FadeInOnScroll delay={0.2}>
              <div className="glass-card rounded-2xl p-6 border border-slate-900 bg-slate-900/10">
                <h3 className="text-sm font-bold text-slate-250 mb-4 flex items-center space-x-2 border-b border-slate-900 pb-2">
                  <Briefcase className="h-4.5 w-4.5 text-blue-400" />
                  <span>Recent Placements Record</span>
                </h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-850 text-slate-400">
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
                          <td colSpan="5" className="py-4 text-center text-slate-500">No placements listed in the log.</td>
                        </tr>
                      ) : (
                        placements.map((p, idx) => (
                          <tr key={idx} className="border-b border-slate-900/60 hover:bg-slate-900/5">
                            <td className="py-3 font-semibold text-slate-200">{p.student_name}</td>
                            <td className="py-3 text-slate-400 font-bold">{p.company_name}</td>
                            <td className="py-3 text-slate-450">{p.job_role || 'Software Engineer Intern'}</td>
                            <td className="py-3 text-right">
                              <span className="inline-block px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-black font-mono">
                                ₹ {parseFloat(p.package_lpa).toFixed(2)} LPA
                              </span>
                            </td>
                            <td className="py-3 text-right text-slate-500 font-mono font-semibold">{p.placed_year}</td>
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
                  <div className="glass-card rounded-2xl p-5 border border-slate-900 bg-slate-900/10 text-center space-y-1 hover-glow transition-all">
                    <div className="text-xl font-black gradient-text-animated">
                      <CountUp end={stat.value} duration={2} decimals={stat.value.includes('.') ? 1 : 0} />
                    </div>
                    <div className="text-[10px] text-slate-500 font-semibold">{stat.label}</div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </PageTransition>
        )}

        {activeTab === 'contact' && (
          <PageTransition className="max-w-2xl mx-auto space-y-6 py-6">
            <FadeInOnScroll className="text-center space-y-1.5">
              <h2 className="text-2xl font-black text-slate-100 uppercase tracking-wide">Contact Us</h2>
              <p className="text-xs text-slate-400">We'd love to hear from you. Have inquiries, suggestions, or need portal access?</p>
            </FadeInOnScroll>

            <FadeInOnScroll delay={0.1}>
              <div className="glass-card rounded-2xl p-6 bg-slate-900/10 border border-slate-900 hover-glow">
                {contactSubmitted ? (
                  <div className="py-8 text-center space-y-3">
                    <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-450 flex items-center justify-center mx-auto">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <h3 className="text-base font-bold text-slate-100">Message Logged!</h3>
                    <p className="text-xs text-slate-405 max-w-sm mx-auto leading-relaxed">
                      Thank you. Your message has been safely logged in our system. A representative will get back to you shortly.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Full Name</label>
                        <input
                          type="text"
                          required
                          value={contactForm.name}
                          onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-850 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all text-xs"
                          placeholder="John Doe"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Email Address</label>
                        <input
                          type="email"
                          required
                          value={contactForm.email}
                          onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                          className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-850 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all text-xs"
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Your Message</label>
                      <textarea
                        required
                        rows="4"
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-850 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all text-xs leading-relaxed"
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
      <footer className="py-6 border-t border-slate-900 bg-slate-950/30 text-center text-[10px] text-slate-500 relative z-10">
        <p>© 2026 CampusCore Systems Inc. All rights reserved. Registered under Supabase Hosting Specs.</p>
      </footer>
    </div>
  );
}
