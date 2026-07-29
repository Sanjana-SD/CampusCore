import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { 
  Award, BookOpen, BrainCircuit, FileText, CheckCircle2, ChevronRight, AlertCircle, RefreshCw, BarChart2, Check, X, ClipboardList, HelpCircle, Sparkles, Star, Target, Compass, Briefcase
} from 'lucide-react';

export default function CampusCoreAIMentor() {
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Performance Score Data
  const [scores, setScores] = useState({
    quiz_score: 0,
    resume_score: 0,
    skill_gap_score: 0,
    total_score: 0,
    classification: 'Beginner'
  });
  
  // Target Career Profile
  const [targetCareer, setTargetCareer] = useState('Full-Stack Developer');
  
  // Career Quiz states
  const [quizAnswers, setQuizAnswers] = useState(Array(10).fill(-1));
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResultScore, setQuizResultScore] = useState(null);

  // Resume Upload states
  const [resumeText, setResumeText] = useState('');
  const [fileName, setFileName] = useState('');
  const [extractedSkills, setExtractedSkills] = useState([]);
  const [resumeSubmitted, setResumeSubmitted] = useState(false);
  
  // Skill Gap states
  const [gapData, setGapData] = useState(null);
  
  // Roadmap states
  const [roadmap, setRoadmap] = useState(null);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [progressPercentage, setProgressPercentage] = useState(0);
  
  // Future Career Predictor states
  const [careerPrediction, setCareerPrediction] = useState(null);

  // Job Board states
  const [jobsList, setJobsList] = useState([]);
  const [appliedJobIds, setAppliedJobIds] = useState([]);
  const [jobFeedbackMessage, setJobFeedbackMessage] = useState('');

  // Fetch jobs and applications
  const fetchJobsAndApplications = async () => {
    try {
      const jobsRes = await api.get('/campus360/jobs').catch(() => []);
      const appsRes = await api.get('/campus360/jobs/applications').catch(() => []);
      setJobsList(jobsRes || []);
      setAppliedJobIds((appsRes || []).map(a => a.job_id));
    } catch (err) {
      console.warn('Failed to fetch job postings:', err.message);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'jobs') {
      fetchJobsAndApplications();
    }
  }, [activeSubTab]);

  const handleApplyJob = async (jobId) => {
    try {
      setErrorMessage('');
      const res = await api.post('/campus360/jobs/apply', { jobId });
      if (res.success) {
        setJobFeedbackMessage('Application submitted successfully!');
        setAppliedJobIds(prev => [...prev, jobId]);
        setTimeout(() => setJobFeedbackMessage(''), 3000);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to submit application.');
    }
  };

  // Fetch initial performance score data and settings
  const fetchMentorOverview = async () => {
    try {
      setLoading(true);
      setErrorMessage('');
      
      // Try to fetch skill gap (will tell us if quiz completed)
      const gapRes = await api.get('/campus360/skill-gap').catch(() => null);
      if (gapRes) {
        setGapData(gapRes);
        setScores(gapRes.performanceStats);
        setTargetCareer(gapRes.targetCareer);
        setExtractedSkills(gapRes.studentSkills);
      }
      
      // Fetch roadmap & progress
      const roadRes = await api.get('/campus360/generate-roadmap').catch(() => null);
      if (roadRes) {
        setRoadmap(roadRes);
      }
      
      const progRes = await api.get('/campus360/future-career').catch(() => null);
      if (progRes) {
        setCareerPrediction(progRes);
      }
    } catch (err) {
      console.warn('Initial mentor overview fetch warning:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMentorOverview();
  }, []);

  // Fetch progress updates
  useEffect(() => {
    const fetchProgress = async () => {
      if (roadmap) {
        try {
          // Find active step completions if any
          const progressObj = await api.post('/campus360/update-progress', { completedSteps }).catch(() => null);
          if (progressObj) {
            setProgressPercentage(progressObj.percentage);
          }
        } catch (e) {
          console.warn(e);
        }
      }
    };
    fetchProgress();
  }, [roadmap, completedSteps]);

  // Quiz Questions list
  const QUIZ_QUESTIONS = [
    {
      q: 'Which database isolation level prevents dirty reads but allows non-repeatable reads?',
      options: ['Read Uncommitted', 'Read Committed', 'Repeatable Read', 'Serializable'],
      correct: 1,
      career: 'Full-Stack Developer'
    },
    {
      q: 'In React, what hook should you use to cache a computed calculation between renders?',
      options: ['useEffect', 'useCallback', 'useMemo', 'useRef'],
      correct: 2,
      career: 'Full-Stack Developer'
    },
    {
      q: 'Which metrics would you use to evaluate an imbalanced classification machine learning model?',
      options: ['Accuracy', 'Mean Squared Error', 'F1-Score and ROC-AUC', 'R-Squared'],
      correct: 2,
      career: 'Data Scientist'
    },
    {
      q: 'Which data preprocessing technique scales numerical features to a range of [0, 1]?',
      options: ['Standardization', 'Min-Max Normalization', 'One-Hot Encoding', 'Principal Component Analysis'],
      correct: 1,
      career: 'Data Scientist'
    },
    {
      q: 'Which container registry command uploads local images onto docker hub?',
      options: ['docker push', 'docker pull', 'docker run', 'docker build'],
      correct: 0,
      career: 'Cloud Engineer & DevOps'
    },
    {
      q: 'What is the primary purpose of writing a Jenkinsfile or YAML pipeline?',
      options: ['Frontend layout design', 'Automate CI/CD execution steps', 'Cache static assets', 'Configure SQL triggers'],
      correct: 1,
      career: 'Cloud Engineer & DevOps'
    },
    {
      q: 'What type of security attack intercepts communication between two network nodes without detection?',
      options: ['SQL Injection', 'Man-in-the-Middle (MitM)', 'DDoS Attack', 'Cross-Site Scripting (XSS)'],
      correct: 1,
      career: 'Cybersecurity Analyst'
    },
    {
      q: 'Which encryption technique uses the same key for encrypting and decrypting data files?',
      options: ['Asymmetric Encryption', 'Symmetric Encryption', 'Hashing algorithms', 'Salt keys'],
      correct: 1,
      career: 'Cybersecurity Analyst'
    },
    {
      q: 'What HTTP status code is returned when a client makes a request without valid authentication tokens?',
      options: ['400 Bad Request', '401 Unauthorized', '403 Forbidden', '404 Not Found'],
      correct: 1,
      career: 'Full-Stack Developer'
    },
    {
      q: 'What version control action integrates changes from one branch into another branch?',
      options: ['git push', 'git merge', 'git stash', 'git fetch'],
      correct: 1,
      career: 'Full-Stack Developer'
    }
  ];

  // Submit Career Quiz
  const handleQuizSubmit = async () => {
    // Check if all questions are answered
    if (quizAnswers.includes(-1)) {
      setErrorMessage('Please answer all 10 questions before submitting.');
      return;
    }
    
    setErrorMessage('');
    setLoading(true);
    
    try {
      const answers = quizAnswers.map((sel, idx) => ({
        questionIndex: idx,
        answerIndex: sel,
        correctIndex: QUIZ_QUESTIONS[idx].correct,
        isCorrect: sel === QUIZ_QUESTIONS[idx].correct
      }));
      
      const careerCounts = {};
      quizAnswers.forEach((sel, idx) => {
        const q = QUIZ_QUESTIONS[idx];
        if (sel === q.correct) {
          careerCounts[q.career] = (careerCounts[q.career] || 0) + 1;
        }
      });
      
      let dominantCareer = 'Full-Stack Developer';
      let maxCount = 0;
      Object.keys(careerCounts).forEach((c) => {
        if (careerCounts[c] > maxCount) {
          maxCount = careerCounts[c];
          dominantCareer = c;
        }
      });
      
      const res = await api.post('/campus360/quiz-score', {
        targetCareer: dominantCareer,
        answers
      });
      
      setQuizResultScore(res.score);
      setQuizSubmitted(true);
      setTargetCareer(res.targetCareer);
      setScores(res.performanceStats);
      
      // Refresh roadmap
      const roadRes = await api.post('/campus360/generate-roadmap', {});
      setRoadmap(roadRes);
      
      // Refresh future career
      const careerRes = await api.get('/campus360/future-career').catch(() => null);
      if (careerRes) {
        setCareerPrediction(careerRes);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to submit career quiz.');
    } finally {
      setLoading(false);
    }
  };

  // Submit Resume Text
  const handleResumeSubmit = async (e) => {
    e.preventDefault();
    if (!resumeText.trim()) {
      setErrorMessage('Please enter or paste your resume text content.');
      return;
    }

    setErrorMessage('');
    setLoading(true);
    
    try {
      const res = await api.post('/campus360/upload-resume', {
        resumeText,
        fileName: fileName || 'my_resume.txt'
      });
      
      setExtractedSkills(res.extractedSkills);
      setResumeSubmitted(true);
      setScores(res.performanceStats);
      
      // Refresh skill gap
      const gapRes = await api.get('/campus360/skill-gap').catch(() => null);
      if (gapRes) setGapData(gapRes);
      
      // Refresh roadmap
      const roadRes = await api.post('/campus360/generate-roadmap', {});
      setRoadmap(roadRes);
      
      // Refresh future career
      const careerRes = await api.get('/campus360/future-career').catch(() => null);
      if (careerRes) {
        setCareerPrediction(careerRes);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to extract skills from resume.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle step checklist
  const handleToggleStep = async (stepId) => {
    const updated = completedSteps.includes(stepId)
      ? completedSteps.filter(id => id !== stepId)
      : [...completedSteps, stepId];
      
    setCompletedSteps(updated);
    
    try {
      const res = await api.post('/campus360/update-progress', { completedSteps: updated });
      setProgressPercentage(res.percentage);
    } catch (e) {
      console.warn('Failed to save progress update:', e.message);
    }
  };

  // Force re-generating roadmap
  const handleGenerateRoadmap = async () => {
    setLoading(true);
    try {
      const res = await api.post('/campus360/generate-roadmap', {});
      setRoadmap(res);
      setCompletedSteps([]);
      setProgressPercentage(0);
    } catch (err) {
      setErrorMessage('Failed to compile your custom roadmap.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Overview header block with glowing score */}
      <div className="glass-card rounded-2xl p-6 bg-slate-900/10 border border-slate-900/80 flex flex-col md:flex-row md:items-center justify-between gap-6 hover-glow transition-all duration-300">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-blue-600/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold tracking-wide uppercase">
            <Sparkles className="h-3 w-3" />
            <span>CampusCore AI Mentor</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white leading-snug">
            Technical Skill Gap & Dynamic Learning Roadmap
          </h2>
          <p className="text-xs text-slate-400 max-w-xl">
            Evaluate your engineering portfolio. Complete your domains quiz, paste your CV structure to extract credentials, and tick learning checkpoints.
          </p>
        </div>
        
        {/* Glow indicator card */}
        <div className="flex items-center space-x-4 shrink-0 bg-slate-950/50 px-5 py-4 rounded-2xl border border-slate-900 shadow-xl animate-glow">
          <div className="relative h-16 w-16 flex items-center justify-center bg-blue-600/15 rounded-full border border-blue-500/30">
            <span className="text-xl font-black text-blue-400">{scores.total_score}</span>
            <span className="text-[8px] text-slate-500 absolute -bottom-1">/ 100</span>
          </div>
          <div>
            <div className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest leading-none">Classified Track</div>
            <span className={`inline-block mt-1.5 px-3 py-0.5 rounded-full font-extrabold text-[10px] uppercase border tracking-wide ${
              scores.classification === 'Advanced' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-450' :
              scores.classification === 'Intermediate' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
              'bg-amber-500/10 border-amber-500/20 text-amber-400'
            }`}>
              {scores.classification}
            </span>
          </div>
        </div>
      </div>

      {/* Sub navigation bar */}
      <div className="flex overflow-x-auto border-b border-slate-900 pb-2 gap-1.5 scrollbar-none">
        {[
          { id: 'overview', label: 'Mentor Overview', icon: BrainCircuit },
          { id: 'quiz', label: 'Career Quiz', icon: HelpCircle },
          { id: 'resume', label: 'Resume Upload', icon: FileText },
          { id: 'skill_gap', label: 'Skill Gap', icon: ClipboardList },
          { id: 'roadmap', label: 'Personalized Roadmap', icon: BookOpen },
          { id: 'future_career', label: 'Future Career', icon: Award },
          { id: 'jobs', label: 'Jobs & Openings', icon: Briefcase }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveSubTab(tab.id); setErrorMessage(''); }}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide shrink-0 transition-all cursor-pointer ${
                isActive 
                  ? 'bg-blue-600/90 text-white shadow-lg border border-blue-500/25' 
                  : 'text-slate-350 hover:bg-slate-900/60 hover:text-white border border-transparent'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Warning message */}
      {errorMessage && (
        <div className="flex items-start space-x-2.5 bg-rose-950/30 border border-rose-900/40 p-4 rounded-xl text-rose-400 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
        </div>
      )}

      {/* Overview Dashboard Tab */}
      {!loading && activeSubTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel breakdown */}
          <div className="glass-card rounded-2xl p-6 lg:col-span-2 space-y-6 hover-glow transition-all">
            <h3 className="text-sm font-extrabold text-slate-200 border-b border-slate-900 pb-3 flex items-center space-x-2.5">
              <BarChart2 className="h-4.5 w-4.5 text-blue-400" />
              <span>AI Evaluation Progress Scores</span>
            </h3>

            <div className="space-y-5">
              {[
                { label: 'Domain Career Quiz', score: scores.quiz_score, max: 50, color: 'from-amber-500 to-orange-400', desc: 'Baseline technical assessment of engineering concepts.' },
                { label: 'Extracted Resume Credentials', score: scores.resume_score, max: 30, color: 'from-blue-500 to-indigo-400', desc: 'NLP-extracted programming skill levels.' },
                { label: 'Role Alignment Index', score: scores.skill_gap_score, max: 20, color: 'from-emerald-500 to-teal-400', desc: 'Evaluates matching versus missing target keywords.' }
              ].map((pScore, idx) => {
                const percentage = Math.round((pScore.score / pScore.max) * 100);
                return (
                  <div key={idx} className="space-y-2.5 p-4 bg-slate-950/40 border border-slate-900 rounded-2xl hover-glow transition-all">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <div>
                        <span className="text-slate-200 font-bold">{pScore.label}</span>
                        <p className="text-[10px] text-slate-450 font-normal mt-0.5">{pScore.desc}</p>
                      </div>
                      <span className="text-slate-300 font-mono font-bold bg-slate-900 px-2.5 py-0.5 rounded border border-slate-850">{pScore.score} / {pScore.max}</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${pScore.color} rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Platform rules guide card */}
            <div className="p-4 bg-slate-950/70 rounded-2xl border border-slate-900 flex items-start space-x-3 shadow-inner">
              <HelpCircle className="h-4.5 w-4.5 text-blue-400 shrink-0 mt-0.5" />
              <div className="text-[11px] text-slate-400 leading-relaxed">
                <span className="font-bold text-slate-350">Platform Rules:</span> Complete the MCQ questions and paste your technical CV text. The system automatically computes your alignment index to generate your roadmap level: <strong className="text-amber-400">Beginner (0-40)</strong>, <strong className="text-blue-400">Intermediate (41-75)</strong>, or <strong className="text-emerald-400">Advanced (76-100)</strong>.
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            {/* Target Career Panel */}
            <div className="glass-card rounded-2xl p-6 space-y-4 hover-glow transition-all">
              <h3 className="text-sm font-extrabold text-slate-200 border-b border-slate-900 pb-3 flex items-center space-x-2">
                <Target className="h-4.5 w-4.5 text-blue-400" />
                <span>Primary Job Target</span>
              </h3>
              
              <div className="p-4 bg-slate-950/65 border border-slate-900 rounded-xl space-y-1 hover:border-slate-800 transition-all">
                <div className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest leading-none">Target Career Focus</div>
                <div className="text-sm font-extrabold text-slate-100 pt-1">{targetCareer}</div>
              </div>

              {roadmap ? (
                <div className="p-4 bg-slate-950/65 border border-slate-900 rounded-xl space-y-3.5 hover:border-slate-800 transition-all">
                  <div className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest leading-none">Roadmap completion</div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] text-slate-450 font-bold">
                      <span>Tasks Checked:</span>
                      <span className="font-mono text-slate-200">{completedSteps.length} / {roadmap.steps?.length}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                    <div className="text-right text-[10px] font-black text-blue-400">{progressPercentage}% Complete</div>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-slate-500 border border-dashed border-slate-850 rounded-xl text-xs">
                  Roadmap not compiled yet. Take evaluation quiz.
                </div>
              )}
            </div>

            {/* Platform Recruiter matching */}
            <div className="glass-card rounded-2xl p-5 bg-gradient-to-br from-indigo-950/10 to-slate-950/20 border border-indigo-900/10 space-y-2.5">
              <div className="flex items-center space-x-1.5">
                <Star className="h-4 w-4 text-indigo-400 fill-indigo-400" />
                <h4 className="text-xs font-bold text-slate-200">Recruiter Visibility</h4>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Ticking roadmap projects matches your candidate profile in our Placement Officer Admin reports.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Section */}
      {!loading && activeSubTab === 'quiz' && (
        <div className="glass-card rounded-2xl p-6 bg-slate-900/10 border border-slate-900 max-w-3xl mx-auto space-y-6 hover-glow transition-all">
          <div className="border-b border-slate-900 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-250">
              Technical Career Evaluation Quiz
            </h3>
            {quizResultScore !== null && (
              <span className="px-3 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold font-mono">
                Recent Score: {quizResultScore} / 50
              </span>
            )}
          </div>

          {quizSubmitted ? (
            <div className="py-10 text-center space-y-4">
              <div className="h-14 w-14 rounded-full bg-emerald-500/15 border border-emerald-500/20 text-emerald-450 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/5">
                <Check className="h-7 w-7" />
              </div>
              <h4 className="text-sm font-bold text-slate-100">Career Quiz Completed!</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Thank you for completing the technical queries. You scored <strong className="text-blue-400">{quizResultScore}/50</strong>. Your matching career profile is identified as <strong className="text-slate-200">{targetCareer}</strong>.
              </p>
              <button
                onClick={() => { setQuizSubmitted(false); setQuizAnswers(Array(10).fill(-1)); }}
                className="px-5 py-2.5 bg-slate-950 border border-slate-850 hover:border-slate-800 text-slate-200 font-semibold rounded-xl text-xs transition-all cursor-pointer hover-scale"
              >
                Re-take evaluation
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {QUIZ_QUESTIONS.map((q, qIdx) => (
                <div key={qIdx} className="p-4.5 bg-slate-950/40 border border-slate-900 rounded-2xl space-y-3.5 hover-glow transition-all">
                  <div className="text-xs font-bold text-slate-200 leading-relaxed flex items-start space-x-2">
                    <span className="text-blue-400 font-mono">{qIdx + 1}.</span>
                    <span>{q.q}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = quizAnswers[qIdx] === optIdx;
                      return (
                        <button
                          key={optIdx}
                          onClick={() => {
                            const updated = [...quizAnswers];
                            updated[qIdx] = optIdx;
                            setQuizAnswers(updated);
                          }}
                          className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600/15 border-blue-500 text-blue-400 shadow-lg shadow-blue-500/5'
                              : 'bg-slate-950/60 border-slate-900/60 text-slate-400 hover:border-slate-800 hover:text-slate-200'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <button
                onClick={handleQuizSubmit}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-blue-500/10 hover-scale cursor-pointer"
              >
                Submit Quiz Solutions
              </button>
            </div>
          )}
        </div>
      )}

      {/* Resume Upload Section */}
      {!loading && activeSubTab === 'resume' && (
        <div className="glass-card rounded-2xl p-6 bg-slate-900/10 border border-slate-900 max-w-2xl mx-auto space-y-6 hover-glow transition-all">
          <div className="border-b border-slate-900 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-250">
              Resume Upload & NLP Skill Parsing
            </h3>
            {resumeSubmitted && (
              <span className="px-3 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold font-mono">
                Resume Score: {scores.resume_score} / 30
              </span>
            )}
          </div>

          <form onSubmit={handleResumeSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Resume File Name (Optional)</label>
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="e.g. John_Doe_Resume.pdf"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-900 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all text-xs"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Paste Resume Text</label>
              <textarea
                rows="8"
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste the text contents of your resume CV here. Include technical skill keywords such as React, Node, SQL, Docker, Python, Java, etc."
                className="w-full px-4 py-3 bg-slate-950 border border-slate-900 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all text-xs leading-relaxed"
                required
              ></textarea>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-blue-500/10 hover-scale cursor-pointer"
            >
              Parse Credentials
            </button>
          </form>

          {resumeSubmitted && (
            <div className="space-y-4 border-t border-slate-900 pt-5">
              <h4 className="text-xs font-bold text-slate-200">Extracted Skill Keywords:</h4>
              <div className="flex flex-wrap gap-2">
                {extractedSkills.length === 0 ? (
                  <span className="text-slate-500 text-xs">No technical keywords extracted yet.</span>
                ) : (
                  extractedSkills.map((skill, idx) => (
                    <span key={idx} className="px-3 py-1 rounded bg-blue-600/10 text-blue-400 font-mono text-[10px] font-bold border border-blue-500/15 uppercase tracking-wide">
                      {skill}
                    </span>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Skill Gap Analysis Section */}
      {!loading && activeSubTab === 'skill_gap' && (
        <div className="glass-card rounded-2xl p-6 bg-slate-900/10 border border-slate-900 max-w-3xl mx-auto space-y-6 hover-glow transition-all">
          <div className="border-b border-slate-900 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-250 flex items-center space-x-2">
              <ClipboardList className="h-4.5 w-4.5 text-blue-400" />
              <span>Skill Gap Evaluation</span>
            </h3>
            {gapData && (
              <span className="px-3 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold font-mono">
                Score: {scores.skill_gap_score} / 20
              </span>
            )}
          </div>

          {!gapData ? (
            <div className="py-12 text-center text-slate-500 text-xs border border-dashed border-slate-850 rounded-2xl space-y-2">
              <AlertCircle className="h-8 w-8 text-slate-600 mx-auto" />
              <p>No skill gap data compiled. Please complete your quiz and upload your resume first.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Box comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl space-y-2.5">
                  <div className="text-[10px] text-emerald-450 font-bold uppercase tracking-wider flex items-center space-x-1.5 border-b border-emerald-500/10 pb-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Matching skills ({gapData.matchedSkills?.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {gapData.matchedSkills?.length === 0 ? (
                      <span className="text-slate-500 text-[10px]">None. Improve your technical resume content.</span>
                    ) : (
                      gapData.matchedSkills?.map((skill, idx) => (
                        <span key={idx} className="px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/15 uppercase font-mono">
                          {skill}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <div className="p-5 bg-rose-500/5 border border-rose-500/10 rounded-2xl space-y-2.5">
                  <div className="text-[10px] text-rose-450 font-bold uppercase tracking-wider flex items-center space-x-1.5 border-b border-rose-500/10 pb-1.5">
                    <X className="h-4 w-4 text-rose-500" />
                    <span>Missing skills ({gapData.missingSkills?.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {gapData.missingSkills?.length === 0 ? (
                      <span className="text-slate-500 text-[10px]">None! You align perfectly.</span>
                    ) : (
                      gapData.missingSkills?.map((skill, idx) => (
                        <span key={idx} className="px-2.5 py-0.5 rounded bg-rose-500/10 text-rose-450 text-[10px] font-bold border border-rose-500/15 uppercase font-mono">
                          {skill}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Dynamic comparative dashboard */}
              <div className="p-5 bg-slate-950/50 border border-slate-900 rounded-2xl space-y-4">
                <h4 className="text-xs font-bold text-slate-200">Required Skills Matching for: {gapData.targetCareer}</h4>
                
                <div className="space-y-3.5 pt-2">
                  {gapData.idealSkills?.map((skill, idx) => {
                    const matched = gapData.matchedSkills?.includes(skill);
                    return (
                      <div key={idx} className="flex items-center space-x-4">
                        <span className="text-xs font-bold text-slate-300 w-32 truncate uppercase font-mono">{skill}</span>
                        <div className="flex-1 h-3 bg-slate-900 rounded-full overflow-hidden relative">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${matched ? 'bg-emerald-500' : 'bg-slate-900'}`}
                            style={{ width: matched ? '100%' : '0%' }}
                          ></div>
                        </div>
                        <span className="text-[10px] font-bold w-14 text-right">
                          {matched ? (
                            <span className="text-emerald-450 font-extrabold uppercase">Possessed</span>
                          ) : (
                            <span className="text-rose-450 font-extrabold uppercase">Missing</span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Personalized Roadmap Section */}
      {!loading && activeSubTab === 'roadmap' && (
        <div className="glass-card rounded-2xl p-6 bg-slate-900/10 border border-slate-900 max-w-3xl mx-auto space-y-6 hover-glow transition-all">
          <div className="border-b border-slate-900 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-250">
                Personalized Learning Timeline
              </h3>
              <p className="text-[10px] text-slate-450 mt-0.5">
                Current Level: <strong className="text-blue-400 uppercase font-mono">{scores.classification}</strong> (Total Score: {scores.total_score}/100)
              </p>
            </div>
            
            <button
              onClick={handleGenerateRoadmap}
              className="px-4 py-2 bg-slate-950 border border-slate-850 text-slate-300 hover:text-white font-bold rounded-xl text-[10px] uppercase tracking-wider flex items-center space-x-1.5 transition-all cursor-pointer hover-scale"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Regenerate Roadmap</span>
            </button>
          </div>

          {!roadmap ? (
            <div className="py-12 text-center text-slate-500 text-xs border border-dashed border-slate-850 rounded-2xl space-y-2">
              <AlertCircle className="h-8 w-8 text-slate-600 mx-auto" />
              <p>Roadmap timeline not generated. Please complete your quiz first.</p>
            </div>
          ) : (
            <div className="space-y-8 pt-4">
              {/* Timeline checkpoints */}
              <div className="relative border-l border-slate-800 ml-3.5 space-y-8">
                {roadmap.steps?.map((step, idx) => {
                  const isCompleted = completedSteps.includes(step.id);
                  return (
                    <div key={step.id} className="relative pl-6">
                      {/* Node Bullet */}
                      <span className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 ${
                        isCompleted
                          ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/15'
                          : 'bg-slate-950 border-slate-850 text-slate-500'
                      } flex items-center justify-center transition-all duration-300`}>
                        {isCompleted && <Check className="h-2.5 w-2.5" />}
                      </span>

                      {/* Card Content */}
                      <div className="p-5 bg-slate-950/40 border border-slate-900 rounded-2xl space-y-3.5 hover-glow hover-scale transition-all">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-xs font-bold text-slate-200">{step.title}</h4>
                            <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{step.desc}</p>
                          </div>
                          <span className="px-2.5 py-0.5 bg-slate-900 border border-slate-850 text-slate-450 text-[9px] font-bold font-mono rounded">
                            {step.duration}
                          </span>
                        </div>

                        {/* Topics */}
                        {step.subjects && (
                          <div className="flex flex-wrap gap-1.5">
                            {step.subjects.map((sub, sIdx) => (
                              <span key={sIdx} className="px-2.5 py-0.5 bg-blue-500/10 text-blue-400 text-[9px] font-bold rounded uppercase tracking-wide">
                                {sub}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Projects */}
                        {step.projects && (
                          <div className="space-y-1.5">
                            <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest block leading-none">Milestone Projects:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {step.projects.map((proj, pIdx) => (
                                <span key={pIdx} className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-450 text-[9px] font-bold rounded uppercase tracking-wide border border-emerald-500/5">
                                  {proj}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Complete action */}
                        <div className="border-t border-slate-900/60 pt-3 flex items-center justify-between">
                          <button
                            onClick={() => handleToggleStep(step.id)}
                            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wide transition-all cursor-pointer ${
                              isCompleted
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/15'
                                : 'bg-slate-900 border border-slate-850 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <span>{isCompleted ? 'Step Completed' : 'Mark Complete'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Future Career Prediction Section */}
      {!loading && activeSubTab === 'future_career' && (
        <div className="glass-card rounded-2xl p-6 bg-slate-900/10 border border-slate-900 max-w-2xl mx-auto space-y-6 hover-glow transition-all">
          <h3 className="text-sm font-extrabold text-slate-250 border-b border-slate-900 pb-3 flex items-center space-x-2">
            <Award className="h-4.5 w-4.5 text-blue-400" />
            <span>AI Future Career Prediction</span>
          </h3>

          {!careerPrediction ? (
            <div className="py-12 text-center text-slate-500 text-xs border border-dashed border-slate-850 rounded-2xl space-y-2">
              <AlertCircle className="h-8 w-8 text-slate-600 mx-auto" />
              <p>No predictions compiled yet. Complete Quiz and evaluations first.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Match Callout */}
              <div className="p-5 bg-gradient-to-r from-blue-950/20 to-slate-950/20 border border-blue-900/15 rounded-2xl space-y-2.5 hover-glow transition-all">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] font-bold uppercase tracking-wider">
                    Primary Predictor Match
                  </span>
                  <span className="text-xs font-black text-blue-400 font-mono">{careerPrediction.matchPercentage}% MATCH</span>
                </div>
                <h4 className="text-base font-bold text-slate-100 leading-snug">{careerPrediction.predictedCareer}</h4>
                <p className="text-xs text-slate-350 leading-relaxed">{careerPrediction.recommendationSummary}</p>
              </div>

              {/* Suggestions */}
              <div className="space-y-4">
                <h5 className="text-xs font-bold text-slate-200">Suggested Roles Breakdowns</h5>
                
                <div className="space-y-3.5">
                  {careerPrediction.allSuggestions?.map((sug, idx) => (
                    <div key={idx} className="space-y-2 p-3.5 bg-slate-950/40 border border-slate-900 rounded-xl hover-glow transition-all">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-200">{sug.role}</span>
                        <span className="font-bold text-slate-400 font-mono">{sug.match}%</span>
                      </div>
                      
                      <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 rounded-full transition-all duration-350"
                          style={{ width: `${sug.match}%` }}
                        ></div>
                      </div>
                      <p className="text-[10px] text-slate-450 leading-relaxed mt-1">{sug.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Jobs & Openings Section */}
      {!loading && activeSubTab === 'jobs' && (
        <div className="glass-card rounded-2xl p-6 bg-slate-900/10 border border-slate-900 max-w-4xl mx-auto space-y-6 hover-glow transition-all">
          <div className="border-b border-slate-900 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-250">
                Jobs & Placements Openings
              </h3>
              <p className="text-[10px] text-slate-450 mt-0.5">
                Apply for placement opportunities matching your AI Mentor skill profiles.
              </p>
            </div>
            {jobFeedbackMessage && (
              <span className="px-3 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-405 text-xs font-bold transition-all">
                {jobFeedbackMessage}
              </span>
            )}
          </div>

          <div className="space-y-6">
            {jobsList.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs border border-dashed border-slate-850 rounded-2xl space-y-2">
                <AlertCircle className="h-8 w-8 text-slate-600 mx-auto" />
                <p>No job opportunities currently open.</p>
              </div>
            ) : (
              jobsList.map((job) => {
                const reqSkills = Array.isArray(job.skills_required) 
                  ? job.skills_required 
                  : (typeof job.skills_required === 'string' ? JSON.parse(job.skills_required) : []);
                
                const studentSkillsLower = extractedSkills.map(s => s.toLowerCase());
                const matched = reqSkills.filter(s => studentSkillsLower.includes(s.toLowerCase()));
                const missing = reqSkills.filter(s => !studentSkillsLower.includes(s.toLowerCase()));
                const matchPercent = reqSkills.length > 0 ? Math.round((matched.length / reqSkills.length) * 100) : 0;
                const isApplied = appliedJobIds.includes(job.id);

                return (
                  <div key={job.id} className="p-5 bg-slate-950/40 border border-slate-900 rounded-2xl hover-glow hover-scale transition-all space-y-4">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-900/60 pb-3.5">
                      <div className="space-y-1">
                        <span className="px-2.5 py-0.5 rounded bg-blue-500/10 text-blue-450 border border-blue-500/15 text-[9px] font-bold uppercase tracking-wider">
                          {job.company_name}
                        </span>
                        <h4 className="text-sm font-bold text-slate-200 pt-1">{job.role}</h4>
                        <div className="text-[10px] text-slate-500 flex flex-wrap gap-x-3">
                          <span>Location: <strong>{job.location || 'Remote'}</strong></span>
                          <span>Posted: <strong>{new Date(job.created_at).toLocaleDateString()}</strong></span>
                        </div>
                      </div>
                      <span className="px-3.5 py-1 rounded bg-emerald-500/10 text-emerald-405 font-black text-xs font-mono border border-emerald-500/15 shrink-0 align-self-start md:align-self-auto">
                        ₹ {parseFloat(job.package_lpa).toFixed(2)} LPA
                      </span>
                    </div>

                    <p className="text-xs text-slate-405 leading-relaxed">{job.description}</p>

                    {/* AI Skill Match block */}
                    <div className="p-4 bg-slate-950/60 border border-slate-900 rounded-xl space-y-3">
                      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                        <span className="text-slate-450 flex items-center space-x-1">
                          <Target className="h-3.5 w-3.5 text-indigo-400" />
                          <span>AI Skills Match Analysis</span>
                        </span>
                        <span className={`font-mono ${matchPercent >= 70 ? 'text-emerald-450' : matchPercent >= 40 ? 'text-blue-405' : 'text-amber-405'}`}>
                          {matchPercent}% Match
                        </span>
                      </div>
                      
                      <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            matchPercent >= 70 ? 'bg-emerald-550' : matchPercent >= 40 ? 'bg-blue-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${matchPercent}%` }}
                        ></div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-1.5">
                        {matched.map((sk, idx) => (
                          <span key={idx} className="px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-bold border border-emerald-500/10 uppercase font-mono">
                            ✓ {sk}
                          </span>
                        ))}
                        {missing.map((sk, idx) => (
                          <span key={idx} className="px-2.5 py-0.5 rounded bg-rose-500/5 text-rose-450 text-[9px] font-bold border border-rose-500/10 uppercase font-mono">
                            ✗ {sk}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => handleApplyJob(job.id)}
                        disabled={isApplied}
                        className={`px-5 py-2.5 rounded-xl text-[10px] font-extrabold uppercase tracking-wide transition-all cursor-pointer hover-scale flex items-center space-x-1.5 ${
                          isApplied
                            ? 'bg-slate-900 border border-slate-850 text-slate-500 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/10'
                        }`}
                      >
                        {isApplied ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            <span>Applied</span>
                          </>
                        ) : (
                          <span>Apply For Opportunity</span>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
