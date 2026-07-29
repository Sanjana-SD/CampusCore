import React, { useState, useEffect } from 'react';
import { 
  Building, BookOpen, Users, Calendar, Phone, Award, LogIn, Info, ShieldCheck, Mail, MapPin, Search, ArrowRight, Star, Sparkles, Check, ChevronRight, GraduationCap, Compass, Briefcase
} from 'lucide-react';
import { api } from '../utils/api';
import Login from './Login';

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

  const renderNavItem = (tabId, label, icon) => {
    const Icon = icon;
    const isActive = activeTab === tabId;
    return (
      <button
        onClick={() => { setActiveTab(tabId); setSearchQuery(''); }}
        className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide uppercase transition-all cursor-pointer ${
          isActive 
            ? 'bg-blue-600/90 text-white shadow-lg shadow-blue-500/10 border border-blue-500/20' 
            : 'text-slate-350 hover:bg-slate-900/60 hover:text-white border border-transparent'
        }`}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span>{label}</span>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden premium-gradient">
      {/* Decorative background grid overlays */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35"></div>
      
      {/* Glowing blur points */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] rounded-full bg-blue-500/10 blur-[130px] pointer-events-none"></div>
      <div className="absolute bottom-10 left-1/4 w-[450px] h-[450px] rounded-full bg-indigo-500/8 blur-[130px] pointer-events-none"></div>

      {/* College Website Header/Navbar */}
      <header className="glass-nav sticky top-0 z-40 w-full px-6 py-4 flex items-center justify-between bg-slate-950/40 backdrop-blur-xl">
        <div className="flex items-center space-x-3.5">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-extrabold text-xl text-white shadow-lg shadow-blue-500/25 border border-blue-400/20">
            CC
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-white bg-clip-text text-transparent">
              CampusCore
            </h1>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-0.5">Institute of Technology</p>
          </div>
        </div>

        {/* Desktop Navbar */}
        <nav className="hidden lg:flex items-center space-x-1">
          {renderNavItem('home', 'Home', Building)}
          {renderNavItem('about', 'About', Info)}
          {renderNavItem('departments', 'Departments', Building)}
          {renderNavItem('courses', 'Courses', BookOpen)}
          {renderNavItem('faculty', 'Faculty', Users)}
          {renderNavItem('placements', 'Placements', Award)}
          {renderNavItem('contact', 'Contact', Phone)}
        </nav>

        {/* Portal CTA */}
        <div>
          <button
            onClick={() => setActiveTab('login')}
            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all cursor-pointer ${
              activeTab === 'login'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/10'
                : 'bg-slate-950/70 border border-slate-850 hover:border-slate-700 hover:bg-slate-900/60 text-slate-200 hover:text-white'
            }`}
          >
            <LogIn className="h-4 w-4 shrink-0" />
            <span>Portal Login</span>
          </button>
        </div>
      </header>

      {/* Mobile Nav Bar */}
      <div className="lg:hidden flex overflow-x-auto space-x-1 bg-slate-950/60 backdrop-blur-md border-b border-slate-900 p-2.5 scrollbar-none">
        {renderNavItem('home', 'Home', Building)}
        {renderNavItem('about', 'About', Info)}
        {renderNavItem('departments', 'Depts', Building)}
        {renderNavItem('courses', 'Courses', BookOpen)}
        {renderNavItem('faculty', 'Faculty', Users)}
        {renderNavItem('placements', 'Placements', Award)}
        {renderNavItem('contact', 'Contact', Phone)}
      </div>

      {/* Content wrapper */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 relative z-10 overflow-y-auto">
        {activeTab === 'home' && (
          <div className="space-y-16 animate-fade-in">
            {/* Split Hero Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center py-6">
              {/* Left Column: Premium Value Pitch */}
              <div className="lg:col-span-7 space-y-6 text-left">
                <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-blue-600/10 text-blue-400 border border-blue-500/20 text-xs font-semibold">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Integrated Smart Campus System</span>
                </div>
                
                <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
                  Empowering Academics <br />
                  Through <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">AI Mentorship</span>
                </h2>
                
                <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-xl">
                  Welcome to CampusCore, a unified educational ecosystem. Connect with advanced gate sensors, view real-time warnings, study curriculum modules, and map your industry readiness using our AI-driven mentor.
                </p>

                <div className="space-y-3 pt-2">
                  {[
                    'Automatic RFID gate check-ins & duration tracking',
                    'Parent notification alerts via Express cron checkouts',
                    'NLP skill gap parser & performance roadmaps',
                    'Integrated library ledgers and online assessments'
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center space-x-2.5 text-xs text-slate-350">
                      <span className="h-4.5 w-4.5 rounded-full bg-emerald-500/15 border border-emerald-500/20 text-emerald-450 flex items-center justify-center shrink-0">
                        <Check className="h-3 w-3" />
                      </span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 flex flex-wrap gap-4">
                  <button 
                    onClick={() => setActiveTab('login')}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs uppercase tracking-wide transition-all shadow-lg shadow-blue-500/15 flex items-center space-x-2 hover-scale cursor-pointer"
                  >
                    <span>Enter Student Portal</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => setActiveTab('about')}
                    className="px-6 py-3 bg-slate-950/60 border border-slate-850 hover:border-slate-850 hover:bg-slate-900/40 text-slate-300 font-bold rounded-xl text-xs uppercase tracking-wide transition-all hover-glow cursor-pointer"
                  >
                    About The College
                  </button>
                </div>
              </div>

              {/* Right Column: Premium AI Mentor Mock Preview */}
              <div className="lg:col-span-5 relative w-full max-w-md mx-auto">
                {/* Glowing border ring */}
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 opacity-20 blur-xl"></div>
                
                {/* Floating Mock UI */}
                <div className="relative glass-card rounded-2xl p-6 bg-slate-950/70 border border-slate-900 shadow-2xl space-y-5 animate-glow">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                    <div className="flex items-center space-x-2">
                      <Compass className="h-4.5 w-4.5 text-indigo-400" />
                      <span className="text-xs font-bold text-slate-200">CampusCore AI Mentor Mock</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[9px] font-mono font-bold uppercase">
                      Classified
                    </span>
                  </div>

                  {/* Mock Score Indicator */}
                  <div className="flex items-center justify-between p-4 bg-slate-900/40 border border-slate-900/60 rounded-xl">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Performance Index</span>
                      <div className="text-xl font-black text-slate-100 flex items-baseline">
                        <span>82</span>
                        <span className="text-[10px] text-slate-500 font-normal ml-0.5">/100</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[9px] uppercase tracking-wide">
                      Advanced Track
                    </span>
                  </div>

                  {/* Skills preview bar */}
                  <div className="space-y-3">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Skill Gap Analysis</div>
                    {[
                      { label: 'React JS', match: 90, color: 'bg-blue-500' },
                      { label: 'Node / Express', match: 80, color: 'bg-indigo-500' },
                      { label: 'Cloud Deployment', match: 40, color: 'bg-rose-500' }
                    ].map((skill, idx) => (
                      <div key={idx} className="space-y-1 text-[11px]">
                        <div className="flex justify-between font-semibold">
                          <span className="text-slate-350">{skill.label}</span>
                          <span className="text-slate-450">{skill.match}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${skill.color}`} style={{ width: `${skill.match}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Roadmap Timeline preview */}
                  <div className="space-y-2.5 border-t border-slate-900 pt-3.5">
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Timeline Checkpoint</div>
                    <div className="relative border-l border-slate-800 ml-2 pl-4 space-y-2">
                      <div className="relative text-[11px] text-slate-300">
                        <span className="absolute -left-[20px] top-1.5 h-2 w-2 rounded-full bg-blue-500"></span>
                        <span>Basic Programming Foundations</span>
                      </div>
                      <div className="relative text-[11px] text-slate-450">
                        <span className="absolute -left-[20px] top-1.5 h-2 w-2 rounded-full bg-slate-800"></span>
                        <span>Advanced System Architecture</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Core Features Pillars Grid */}
            <div className="space-y-6 pt-6">
              <h3 className="text-base font-extrabold text-slate-200 border-b border-slate-900 pb-3 flex items-center space-x-2">
                <Building className="h-4.5 w-4.5 text-blue-400" />
                <span>Integrated Campus Pillars</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { title: 'IoT RFID Sensors', desc: 'Real-time check-in and check-out tracking directly recorded into daily access summaries.', icon: ShieldCheck, color: 'text-blue-400 bg-blue-500/10' },
                  { title: 'AI Mentor Engine', desc: 'Interactive MCQ career quizzes, spaCy-modeled NLP skill extractors, and score-based learning roadmaps.', icon: Compass, color: 'text-indigo-400 bg-indigo-500/10' },
                  { title: 'Placement Analytics', desc: 'Track packages, top student scores, recruiters directory, and placement readiness metrics.', icon: Award, color: 'text-emerald-400 bg-emerald-500/10' }
                ].map((pillar, idx) => {
                  const Icon = pillar.icon;
                  return (
                    <div key={idx} className="glass-card rounded-2xl p-6 bg-slate-900/10 border border-slate-900 hover-scale hover-glow flex flex-col items-start space-y-4">
                      <div className={`p-3 rounded-xl ${pillar.color} border border-white/5`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-200">{pillar.title}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">{pillar.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stats Roster */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 pt-4">
              {[
                { count: '100%', label: 'Supabase Database', desc: 'Secure cloud integration' },
                { count: '94.2%', label: 'Placement Records', desc: 'Highest in the region' },
                { count: '150+', label: 'Expert Faculty', desc: 'Industry-active lectures' },
                { count: '100%', label: 'MERN Architecture', desc: 'Blazing fast loading speeds' }
              ].map((stat, idx) => (
                <div key={idx} className="glass-card rounded-2xl p-6 border border-slate-900 bg-slate-900/10 text-center space-y-1.5 hover-glow transition-all">
                  <div className="text-2xl font-black bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">{stat.count}</div>
                  <div className="text-xs font-bold text-slate-200">{stat.label}</div>
                  <div className="text-[10px] text-slate-500">{stat.desc}</div>
                </div>
              ))}
            </div>

            {/* Events & Notices List */}
            <div className="space-y-6 pt-6">
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <h3 className="text-base font-extrabold text-slate-200 flex items-center space-x-2.5">
                  <Calendar className="h-4.5 w-4.5 text-blue-400" />
                  <span>College Events & Announcements</span>
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {events.length === 0 ? (
                  <p className="text-slate-500 text-xs">No upcoming events cataloged yet.</p>
                ) : (
                  events.map((evt) => (
                    <div key={evt.id} className="glass-card rounded-2xl p-6 bg-slate-900/15 border border-slate-900 hover-scale hover-glow flex flex-col justify-between space-y-4">
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
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="space-y-8 animate-fade-in max-w-4xl mx-auto py-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-slate-100 uppercase tracking-wide">About CampusCore College</h2>
              <p className="text-xs text-slate-400">Pioneering standard-driven engineering research since 2002</p>
            </div>
            
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-900/60">
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">Integrated Campus</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Embedded sensors, attendance tracking logs, library transactions, and real-time Parent alerts via email.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">AI Mentorship</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Providing automated resume parsers, skill gap evaluations, and personalized roadmaps custom-tailored to student scores.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide">Industry Placement</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Maintained links with premium recruiters and a solid internship prep curriculum matching standard specifications.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'departments' && (
          <div className="space-y-6 animate-fade-in">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {departments
                .filter(dept => dept.name.toLowerCase().includes(searchQuery.toLowerCase()) || dept.code.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((dept) => (
                  <div key={dept.id} className="glass-card rounded-2xl p-6 bg-slate-900/10 border border-slate-900 space-y-4 hover-scale hover-glow transition-all">
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
                ))}
            </div>
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="space-y-6 animate-fade-in">
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses
                .filter(course => course.name.toLowerCase().includes(searchQuery.toLowerCase()) || course.code.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((course) => (
                  <div key={course.id} className="glass-card rounded-2xl p-5 bg-slate-900/20 border border-slate-900 hover-scale hover-glow transition-all flex flex-col justify-between space-y-4">
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
                ))}
            </div>
          </div>
        )}

        {activeTab === 'faculty' && (
          <div className="space-y-6 animate-fade-in">
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {faculty
                .filter(f => f.first_name.toLowerCase().includes(searchQuery.toLowerCase()) || f.last_name.toLowerCase().includes(searchQuery.toLowerCase()) || (f.department && f.department.toLowerCase().includes(searchQuery.toLowerCase())))
                .map((f, idx) => (
                  <div key={idx} className="glass-card rounded-2xl p-5 bg-slate-900/10 border border-slate-900 hover-scale hover-glow transition-all space-y-4">
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
                ))}
            </div>
          </div>
        )}

        {activeTab === 'placements' && (
          <div className="space-y-6 animate-fade-in">
            <div className="border-b border-slate-900 pb-4">
              <h2 className="text-xl font-bold text-slate-100">Placement Reports</h2>
              <p className="text-xs text-slate-450 mt-0.5">Consistently driving job excellence across industry standard salaries</p>
            </div>

            {/* Recruiter list */}
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
              <div className="flex flex-wrap justify-center gap-2 shrink-0 max-w-xs md:max-w-md">
                {['Google', 'Microsoft', 'Amazon', 'Adobe', 'Qualcomm', 'Infosys'].map((company, idx) => (
                  <span key={idx} className="px-3.5 py-1.5 rounded-xl bg-slate-950/90 border border-slate-850 font-bold text-xs text-slate-400 tracking-wide select-none hover-glow transition-all">
                    {company}
                  </span>
                ))}
              </div>
            </div>

            {/* Placement List table */}
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
          </div>
        )}

        {activeTab === 'contact' && (
          <div className="max-w-2xl mx-auto space-y-6 animate-fade-in py-6">
            <div className="text-center space-y-1.5">
              <h2 className="text-2xl font-black text-slate-100 uppercase tracking-wide">Contact Us</h2>
              <p className="text-xs text-slate-400">We'd love to hear from you. Have inquiries, suggestions, or need portal access?</p>
            </div>

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
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs uppercase tracking-wide transition-all shadow-lg shadow-blue-500/10 hover-scale cursor-pointer"
                  >
                    Send message
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {activeTab === 'login' && (
          <div className="animate-fade-in py-6">
            <Login onLoginSuccess={onLoginSuccess} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-900 bg-slate-950/30 text-center text-[10px] text-slate-500">
        <p>© 2026 CampusCore Systems Inc. All rights reserved. Registered under Supabase Hosting Specs.</p>
      </footer>
    </div>
  );
}
