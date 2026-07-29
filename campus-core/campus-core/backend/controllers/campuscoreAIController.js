const db = require('../db');

// Predefined target careers and their ideal industry skill lists (for gap analysis)
const CAREER_SKILL_PROFILES = {
  'Full-Stack Developer': ['html', 'css', 'javascript', 'react', 'node.js', 'express', 'mongodb', 'git', 'sql', 'rest apis'],
  'Data Scientist': ['python', 'sql', 'numpy', 'pandas', 'scikit-learn', 'tensorflow', 'r', 'statistics', 'tableau', 'git'],
  'Cloud Engineer & DevOps': ['docker', 'kubernetes', 'aws', 'linux', 'ci/cd', 'git', 'bash', 'terraform', 'nginx', 'python'],
  'Cybersecurity Analyst': ['linux', 'networking', 'wireshark', 'cryptography', 'firewalls', 'python', 'sql', 'bash', 'security audits', 'owasp']
};

// Extracted skill keywords categorized for NLP matching
const INDUSTRY_SKILL_KEYWORDS = [
  'html', 'css', 'javascript', 'js', 'react', 'reactjs', 'node.js', 'nodejs', 'express', 'expressjs', 
  'mongodb', 'mongo', 'git', 'github', 'sql', 'postgresql', 'mysql', 'sqlite', 'rest apis', 'api', 
  'python', 'numpy', 'pandas', 'scikit-learn', 'sklearn', 'tensorflow', 'keras', 'pytorch', 'r', 
  'statistics', 'tableau', 'powerbi', 'docker', 'kubernetes', 'k8s', 'aws', 'azure', 'gcp', 'linux', 
  'ci/cd', 'jenkins', 'bash', 'shell', 'terraform', 'nginx', 'apache', 'networking', 'wireshark', 
  'cryptography', 'firewalls', 'owasp', 'java', 'c++', 'c#', 'php', 'typescript', 'ts', 'graphql',
  'redis', 'docker', 'graphql', 'next.js', 'nextjs', 'tailwind', 'bootstrap', 'scrum', 'agile'
];

// Helper to log admin events
const logAdminAction = async (actionType, studentId, message) => {
  try {
    await db.query(
      'INSERT INTO c360_admin_logs (action_type, student_id, message) VALUES ($1, $2, $3)',
      [actionType, studentId, message]
    );
  } catch (err) {
    console.error('Error logging admin action:', err.message);
  }
};

// Recalculates and updates the student's entry in c360_performance_scores
const recalculateTotalScore = async (studentId) => {
  try {
    // 1. Get latest quiz score (max 50)
    const quizRes = await db.query(
      'SELECT score FROM c360_quiz_scores WHERE student_id = $1 ORDER BY created_at DESC LIMIT 1',
      [studentId]
    );
    const quizScore = quizRes.rows.length > 0 ? quizRes.rows[0].score : 0;

    // 2. Get latest resume skills score (max 30)
    const resumeRes = await db.query(
      'SELECT score FROM c360_resume_skills WHERE student_id = $1 ORDER BY uploaded_at DESC LIMIT 1',
      [studentId]
    );
    const resumeScore = resumeRes.rows.length > 0 ? resumeRes.rows[0].score : 0;

    // 3. Get latest skill gap score (max 20)
    const gapRes = await db.query(
      'SELECT gap_score FROM c360_skill_gap WHERE student_id = $1 ORDER BY created_at DESC LIMIT 1',
      [studentId]
    );
    const skillGapScore = gapRes.rows.length > 0 ? gapRes.rows[0].gap_score : 0;

    const totalScore = quizScore + resumeScore + skillGapScore;

    // 4. Classify level
    let classification = 'Beginner';
    if (totalScore >= 76) {
      classification = 'Advanced';
    } else if (totalScore >= 41) {
      classification = 'Intermediate';
    }

    // 5. Update or insert into c360_performance_scores
    await db.query(
      `INSERT INTO c360_performance_scores (student_id, quiz_score, resume_score, skill_gap_score, classification)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (student_id)
       DO UPDATE SET quiz_score = $2, resume_score = $3, skill_gap_score = $4, classification = $5`,
      [studentId, quizScore, resumeScore, skillGapScore, classification]
    );

    return { quizScore, resumeScore, skillGapScore, totalScore, classification };
  } catch (err) {
    console.error('Error recalculating performance score:', err.message);
    throw err;
  }
};

// ==========================================
// CONTROLLER HANDLERS
// ==========================================

// 1. POST /api/campus360/quiz-score
// Receives answers, target career, and calculates a quiz score (0-50 pts)
exports.submitQuizScore = async (req, res) => {
  const studentId = req.user.id;
  const { targetCareer, answers } = req.body;

  if (!targetCareer || !answers || !Array.isArray(answers)) {
    return res.status(400).json({ error: 'targetCareer and answers array are required.' });
  }

  try {
    // Basic scoring algorithm: 5 points per question answered, up to 10 questions (50 pts total)
    // In a real ML environment, the answers would form a vector passed to a model,
    // here we score correct engineering principles and technical queries
    let correctCount = 0;
    answers.forEach((q) => {
      // Treat specific selections as correct/advanced choices
      if (q.isCorrect === true || q.answerIndex === q.correctIndex || q.points > 0) {
        correctCount++;
      }
    });

    // Ensure we give points for completing: each question is worth 5 points
    const score = Math.min(50, Math.max(10, correctCount * 5));

    // Save quiz score
    await db.query(
      'INSERT INTO c360_quiz_scores (student_id, score, target_career, answers_json) VALUES ($1, $2, $3, $4)',
      [studentId, score, targetCareer, JSON.stringify(answers)]
    );

    // Sync c360_users
    await db.query(
      `INSERT INTO c360_users (student_id, target_career, preferred_level)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE SET target_career = $2`,
      [studentId, targetCareer, score >= 40 ? 'Intermediate' : 'Beginner']
    );

    // Log admin action
    await logAdminAction('QUIZ_SUBMIT', studentId, `Completed career quiz for target role: ${targetCareer}. Score: ${score}/50.`);

    // Recalculate performance
    const stats = await recalculateTotalScore(studentId);

    return res.status(200).json({
      message: 'Quiz score submitted successfully.',
      score,
      targetCareer,
      performanceStats: stats
    });
  } catch (err) {
    console.error('submitQuizScore error:', err);
    return res.status(500).json({ error: 'Internal server error submitting quiz.' });
  }
};

// 2. POST /api/campus360/upload-resume
// Parse skills from text/paste and calculate resume score (0-30 pts)
exports.uploadResume = async (req, res) => {
  const studentId = req.user.id;
  const { resumeText, fileName } = req.body;

  if (!resumeText) {
    return res.status(400).json({ error: 'Resume text content is required.' });
  }

  const nameOfFile = fileName || 'pasted_text.txt';

  try {
    // NLP emulation: simple regex extraction of skills from the text
    const cleanText = resumeText.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, " ");
    const words = cleanText.split(/\s+/);
    
    // Find matching skills
    const detectedSkills = [];
    INDUSTRY_SKILL_KEYWORDS.forEach((skill) => {
      // Check if skill is in words list
      if (cleanText.includes(' ' + skill + ' ') || cleanText.startsWith(skill + ' ') || cleanText.endsWith(' ' + skill)) {
        if (!detectedSkills.includes(skill)) {
          detectedSkills.push(skill);
        }
      }
    });

    // Score calculation: 3 points per detected skill, max 30 points (10 skills)
    const score = Math.min(30, Math.max(5, detectedSkills.length * 3));

    // Save resume skills
    await db.query(
      'INSERT INTO c360_resume_skills (student_id, skills_json, score, file_name) VALUES ($1, $2, $3, $4)',
      [studentId, JSON.stringify(detectedSkills), score, nameOfFile]
    );

    // Log admin action
    await logAdminAction('RESUME_UPLOAD', studentId, `Uploaded resume (${nameOfFile}) and extracted ${detectedSkills.length} skills. Score: ${score}/30.`);

    // Recalculate performance
    const stats = await recalculateTotalScore(studentId);

    return res.status(200).json({
      message: 'Resume parsed and skills extracted successfully.',
      extractedSkills: detectedSkills,
      score,
      performanceStats: stats
    });
  } catch (err) {
    console.error('uploadResume error:', err);
    return res.status(500).json({ error: 'Internal server error uploading resume.' });
  }
};

// 3. GET /api/campus360/skill-gap
// Compare student skills with ideal target career skills (0-20 pts)
exports.getSkillGap = async (req, res) => {
  const studentId = req.user.id;

  try {
    // Get target career from quiz or user settings
    const userSettingsRes = await db.query(
      'SELECT target_career FROM c360_users WHERE student_id = $1 ORDER BY updated_at DESC LIMIT 1',
      [studentId]
    );
    
    if (userSettingsRes.rows.length === 0) {
      return res.status(404).json({ error: 'Quiz and target career profile not found. Please complete the Career quiz first.' });
    }

    const targetCareer = userSettingsRes.rows[0].target_career;
    const idealSkills = CAREER_SKILL_PROFILES[targetCareer] || CAREER_SKILL_PROFILES['Full-Stack Developer'];

    // Get student's extracted resume skills
    const resumeRes = await db.query(
      'SELECT skills_json FROM c360_resume_skills WHERE student_id = $1 ORDER BY uploaded_at DESC LIMIT 1',
      [studentId]
    );
    
    const studentSkills = resumeRes.rows.length > 0 ? resumeRes.rows[0].skills_json : [];

    // Gap analysis: find missing and matching skills
    const matchedSkills = [];
    const missingSkills = [];

    idealSkills.forEach(skill => {
      // Perform fuzzy/includes match
      const hasSkill = studentSkills.some(s => s.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(s.toLowerCase()));
      if (hasSkill) {
        matchedSkills.push(skill);
      } else {
        missingSkills.push(skill);
      }
    });

    // Score: percentage of matched ideal skills * 20
    const gapScore = Math.round((matchedSkills.length / idealSkills.length) * 20);

    // Save skill gap
    await db.query(
      'INSERT INTO c360_skill_gap (student_id, target_career, missing_skills_json, gap_score) VALUES ($1, $2, $3, $4)',
      [studentId, targetCareer, JSON.stringify(missingSkills), gapScore]
    );

    // Recalculate performance
    const stats = await recalculateTotalScore(studentId);

    return res.status(200).json({
      targetCareer,
      idealSkills,
      studentSkills,
      matchedSkills,
      missingSkills,
      gapScore,
      performanceStats: stats
    });
  } catch (err) {
    console.error('getSkillGap error:', err);
    return res.status(500).json({ error: 'Internal server error calculating skill gap.' });
  }
};

// 4. POST /api/campus360/generate-roadmap
// Generates Beginner / Intermediate / Advanced roadmaps based on performance level
exports.generateRoadmap = async (req, res) => {
  const studentId = req.user.id;

  try {
    // 1. Get latest performance score/classification
    const perfRes = await db.query(
      'SELECT total_score, classification FROM c360_performance_scores WHERE student_id = $1',
      [studentId]
    );

    let classification = 'Beginner';
    let totalScore = 0;

    if (perfRes.rows.length > 0) {
      classification = perfRes.rows[0].classification;
      totalScore = perfRes.rows[0].total_score;
    } else {
      // Initialize with default beginner classification if scores don't exist yet
      classification = 'Beginner';
      totalScore = 0;
      await db.query(
        'INSERT INTO c360_performance_scores (student_id, quiz_score, resume_score, skill_gap_score, classification) VALUES ($1, 0, 0, 0, $2)',
        [studentId, classification]
      );
    }

    // Get student's target career
    const userRes = await db.query(
      'SELECT target_career FROM c360_users WHERE student_id = $1 LIMIT 1',
      [studentId]
    );
    const targetCareer = userRes.rows.length > 0 ? userRes.rows[0].target_career : 'Full-Stack Developer';

    // 2. Define custom learning tracks based on scores
    let roadmapSteps = [];

    if (classification === 'Beginner') {
      roadmapSteps = [
        { id: 'b1', title: 'Programming Foundations', desc: 'Learn variables, conditionals, loops, and basic structures.', subjects: ['Introduction to Coding', 'Logic & Flow'], duration: '2 weeks' },
        { id: 'b2', title: 'Data Structures 101', desc: 'Understanding Arrays, Objects, Lists, and simple searching/sorting.', subjects: ['Data Structures Basic'], duration: '3 weeks' },
        { id: 'b3', title: 'Simple Project Milestone', desc: 'Build a command-line calculator, local inventory manager, or basic profile portal.', projects: ['CLI Calculator', 'Static Landing Page'], duration: '2 weeks' },
        { id: 'b4', title: 'Git & Version Control', desc: 'Learn git repository initialization, staging, commits, and pushing to Github.', subjects: ['Git Basics'], duration: '1 week' }
      ];
    } else if (classification === 'Intermediate') {
      roadmapSteps = [
        { id: 'i1', title: 'Advanced Frameworks', desc: 'Dive into libraries like React (frontend) and Express.js (backend) or Python Flask.', subjects: ['React Components', 'API Routing'], duration: '4 weeks' },
        { id: 'i2', title: 'Database Integrations', desc: 'Configure relational databases (PostgreSQL/SQL) or non-relational document stores (MongoDB).', subjects: ['Relational Schemas', 'CRUD Operations'], duration: '3 weeks' },
        { id: 'i3', title: 'Intermediate Project Milestone', desc: 'Create a fully-connected dynamic web application (e.g. blog site or weather dashboard).', projects: ['Dynamic Blog Engine', 'Task Board'], duration: '3 weeks' },
        { id: 'i4', title: 'Testing & Debugging', desc: 'Write basic unit tests, test APIs using Postman, and inspect server logs.', subjects: ['Unit Testing', 'API Debugging'], duration: '2 weeks' }
      ];
    } else {
      roadmapSteps = [
        { id: 'a1', title: 'System Design & Scalability', desc: 'Learn architecture patterns, caching mechanisms (Redis), load balancing, and messaging systems.', subjects: ['Microservices', 'Distributed Systems'], duration: '4 weeks' },
        { id: 'a2', title: 'Cloud Deployments & DevOps', desc: 'Dockerize applications, script CI/CD pipelines, and deploy onto AWS or Supabase Hosting.', subjects: ['Docker Containerization', 'CI/CD Pipelines', 'Cloud Security'], duration: '4 weeks' },
        { id: 'a3', title: 'Advanced Project Milestone', desc: 'Build a production-grade application featuring real-time socket connections and analytics.', projects: ['Real-Time Smart Campus Gate System', 'E-commerce Engine'], duration: '4 weeks' },
        { id: 'a4', title: 'Internship Prep & Interviews', desc: 'LeetCode algorithms, behavioral preparation, resume design review, and mock panel interviews.', subjects: ['DSA Algorithms', 'System Architecture Design'], duration: '2 weeks' }
      ];
    }

    // Save roadmap in db
    await db.query(
      `INSERT INTO c360_roadmap (student_id, target_career, level, steps_json)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (student_id, target_career)
       DO UPDATE SET level = $3, steps_json = $4`,
      [studentId, targetCareer, classification, JSON.stringify(roadmapSteps)]
    );

    // Initialize progress tracker if missing
    const progressRes = await db.query('SELECT * FROM c360_progress WHERE student_id = $1', [studentId]);
    if (progressRes.rows.length === 0) {
      await db.query(
        'INSERT INTO c360_progress (student_id, completed_steps_json, percentage) VALUES ($1, $2, $3)',
        [studentId, JSON.stringify([]), 0]
      );
    }

    // Log admin action
    await logAdminAction('ROADMAP_GENERATE', studentId, `Generated personalized ${classification} roadmap for target career: ${targetCareer}. Score: ${totalScore}.`);

    return res.status(200).json({
      targetCareer,
      level: classification,
      score: totalScore,
      steps: roadmapSteps
    });
  } catch (err) {
    console.error('generateRoadmap error:', err);
    return res.status(500).json({ error: 'Internal server error compiling roadmap.' });
  }
};

// 5. POST /api/campus360/update-progress
// Check step boxes and calculate completion percentage
exports.updateProgress = async (req, res) => {
  const studentId = req.user.id;
  const { completedSteps } = req.body; // array of step IDs: e.g. ['b1', 'b2']

  if (!completedSteps || !Array.isArray(completedSteps)) {
    return res.status(400).json({ error: 'completedSteps array is required.' });
  }

  try {
    // Get total roadmap steps count
    const roadmapRes = await db.query(
      'SELECT steps_json FROM c360_roadmap WHERE student_id = $1 ORDER BY created_at DESC LIMIT 1',
      [studentId]
    );

    if (roadmapRes.rows.length === 0) {
      return res.status(404).json({ error: 'Roadmap not generated. Please generate your roadmap first.' });
    }

    const steps = roadmapRes.rows[0].steps_json || [];
    const totalStepsCount = steps.length;

    // Calculate percentage
    const percentage = totalStepsCount > 0 ? Math.round((completedSteps.length / totalStepsCount) * 100) : 0;

    // Update progress
    await db.query(
      `INSERT INTO c360_progress (student_id, completed_steps_json, percentage)
       VALUES ($1, $2, $3)
       ON CONFLICT (student_id)
       DO UPDATE SET completed_steps_json = $2, percentage = $3`,
      [studentId, JSON.stringify(completedSteps), percentage]
    );

    // Log admin action
    await logAdminAction('PROGRESS_UPDATE', studentId, `Updated learning progress: ${percentage}% completed (${completedSteps.length}/${totalStepsCount} tasks).`);

    return res.status(200).json({
      message: 'Progress updated successfully.',
      completedSteps,
      percentage
    });
  } catch (err) {
    console.error('updateProgress error:', err);
    return res.status(500).json({ error: 'Internal server error updating progress.' });
  }
};

// 6. GET /api/campus360/future-career
// Predict top paths based on technical grades and quiz scoring
exports.getFutureCareer = async (req, res) => {
  const studentId = req.user.id;

  try {
    // 1. Get latest performance scores
    const perfRes = await db.query('SELECT total_score, classification FROM c360_performance_scores WHERE student_id = $1', [studentId]);
    const score = perfRes.rows.length > 0 ? perfRes.rows[0].total_score : 50;

    // 2. Get latest quiz target career
    const userRes = await db.query('SELECT target_career FROM c360_users WHERE student_id = $1 LIMIT 1', [studentId]);
    const chosenCareer = userRes.rows.length > 0 ? userRes.rows[0].target_career : 'Full-Stack Developer';

    // 3. Get student's grades
    const gradesRes = await db.query('SELECT marks_obtained, max_marks FROM assessment_grades WHERE student_id = $1', [studentId]);
    let academicAvg = 70; // fallback default
    if (gradesRes.rows.length > 0) {
      const sum = gradesRes.rows.reduce((acc, row) => acc + (parseFloat(row.marks_obtained) / row.max_marks), 0);
      academicAvg = Math.round((sum / gradesRes.rows.length) * 100);
    }

    // Heuristic ML Career Predictor logic (representing Decision tree/KNN classifier outputs)
    // Computes top recommended jobs, description, and match percentage based on academics and profile
    const careers = [
      { role: 'Full-Stack Developer', match: Math.min(95, Math.max(50, score + 10)), reason: 'High quiz technical score and strong web framework understanding.' },
      { role: 'Data Scientist', match: Math.min(95, Math.max(40, academicAvg - 5 + (score > 60 ? 10 : 0))), reason: 'Excellent math background and analytical grade levels.' },
      { role: 'Cloud Engineer & DevOps', match: Math.min(92, Math.max(35, score - 5)), reason: 'Aptitude for Linux terminal networks and automation logs.' },
      { role: 'Cybersecurity Analyst', match: Math.min(90, Math.max(30, academicAvg - 10 + (score > 50 ? 15 : 0))), reason: 'Deep interest in networking configurations and security rules.' }
    ];

    // Boost the match percentage of the user's chosen target career
    const chosenIdx = careers.findIndex(c => c.role.toLowerCase().includes(chosenCareer.toLowerCase()) || chosenCareer.toLowerCase().includes(c.role.toLowerCase()));
    if (chosenIdx !== -1) {
      careers[chosenIdx].match = Math.min(98, careers[chosenIdx].match + 15);
      careers[chosenIdx].reason = 'Matched Target Focus! ' + careers[chosenIdx].reason;
    }

    // Sort by match percentage DESC
    careers.sort((a, b) => b.match - a.match);

    return res.status(200).json({
      predictedCareer: careers[0].role,
      matchPercentage: careers[0].match,
      recommendationSummary: careers[0].reason,
      allSuggestions: careers
    });
  } catch (err) {
    console.error('getFutureCareer error:', err);
    return res.status(500).json({ error: 'Internal server error predicting future career.' });
  }
};

// ==========================================
// PUBLIC COLLEGE WEBSITE GETTERS
// ==========================================

exports.getPublicDepartments = async (req, res) => {
  try {
    const data = await db.query('SELECT * FROM departments ORDER BY code ASC');
    return res.json(data.rows);
  } catch (err) {
    console.error('getPublicDepartments error:', err);
    return res.status(500).json({ error: 'Failed to retrieve departments.' });
  }
};

exports.getPublicCourses = async (req, res) => {
  try {
    const data = await db.query('SELECT * FROM courses');
    return res.json(data.rows);
  } catch (err) {
    console.error('getPublicCourses error:', err);
    return res.status(500).json({ error: 'Failed to retrieve courses.' });
  }
};

exports.getPublicEvents = async (req, res) => {
  try {
    const data = await db.query('SELECT * FROM events ORDER BY event_date ASC');
    return res.json(data.rows);
  } catch (err) {
    console.error('getPublicEvents error:', err);
    return res.status(500).json({ error: 'Failed to retrieve events.' });
  }
};

exports.getPublicPlacements = async (req, res) => {
  try {
    const data = await db.query('SELECT * FROM placements ORDER BY placed_year DESC, package_lpa DESC');
    return res.json(data.rows);
  } catch (err) {
    console.error('getPublicPlacements error:', err);
    return res.status(500).json({ error: 'Failed to retrieve placements.' });
  }
};

exports.getPublicFaculty = async (req, res) => {
  try {
    // Read from both the faculty table and staff profile table to populate a rich roster
    const staffRes = await db.query('SELECT first_name, last_name, email, phone, department FROM staff');
    return res.json(staffRes.rows);
  } catch (err) {
    console.error('getPublicFaculty error:', err);
    return res.status(500).json({ error: 'Failed to retrieve faculty.' });
  }
};

// ==========================================
// JOB SECTIONS AND APPLICATIONS CONTROLLERS
// ==========================================

exports.getJobs = async (req, res) => {
  try {
    const data = await db.query('SELECT * FROM c360_jobs');
    return res.json(data.rows);
  } catch (err) {
    console.error('getJobs error:', err);
    return res.status(500).json({ error: 'Failed to retrieve jobs.' });
  }
};

exports.applyJob = async (req, res) => {
  const { jobId } = req.body;
  const studentId = req.user.id;

  if (!jobId) {
    return res.status(400).json({ error: 'Job ID is required.' });
  }

  try {
    const uuidVal = crypto.randomUUID();
    
    // Check if student already applied
    const checkRes = await db.query('SELECT * FROM c360_job_applications WHERE student_id = $1', [studentId]);
    const alreadyApplied = checkRes.rows.some(a => a.job_id === jobId);
    
    if (alreadyApplied) {
      return res.status(400).json({ error: 'You have already applied for this job.' });
    }

    // Apply for job
    await db.query('INSERT INTO c360_job_applications (id, job_id, student_id, status) VALUES ($1, $2, $3, $4)', [
      uuidVal,
      jobId,
      studentId,
      'applied'
    ]);

    // Insert log
    const logId = crypto.randomUUID();
    await db.query('INSERT INTO c360_admin_logs (id, action_type, student_id, message) VALUES ($1, $2, $3, $4)', [
      logId,
      'job_applied',
      studentId,
      `Student applied for Job ID ${jobId}`
    ]);

    return res.json({ success: true, message: 'Application submitted successfully.' });
  } catch (err) {
    console.error('applyJob error:', err);
    return res.status(500).json({ error: 'Failed to submit job application.' });
  }
};

exports.getApplications = async (req, res) => {
  const { role, id: userId } = req.user;
  try {
    if (role === 'admin') {
      const data = await db.query('SELECT a.*, j.company_name, j.role, j.package_lpa, j.skills_required, j.location, s.first_name, s.last_name FROM c360_job_applications a JOIN c360_jobs j ON a.job_id = j.id JOIN students s ON a.student_id = s.id');
      return res.json(data.rows);
    } else {
      const data = await db.query('SELECT * FROM c360_job_applications WHERE student_id = $1', [userId]);
      return res.json(data.rows);
    }
  } catch (err) {
    console.error('getApplications error:', err);
    return res.status(500).json({ error: 'Failed to retrieve applications.' });
  }
};

exports.createJob = async (req, res) => {
  const { company_name, role, description, package_lpa, skills_required, location } = req.body;
  
  if (!company_name || !role || !description || !package_lpa || !skills_required) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const uuidVal = crypto.randomUUID();
    await db.query('INSERT INTO c360_jobs (id, company_name, role, description, package_lpa, skills_required, location) VALUES ($1, $2, $3, $4, $5, $6, $7)', [
      uuidVal,
      company_name,
      role,
      description,
      parseFloat(package_lpa),
      typeof skills_required === 'string' ? skills_required : JSON.stringify(skills_required),
      location || 'Remote'
    ]);

    // Log action
    const logId = crypto.randomUUID();
    await db.query('INSERT INTO c360_admin_logs (id, action_type, student_id, message) VALUES ($1, $2, $3, $4)', [
      logId,
      'job_created',
      null,
      `New job posting created: ${role} at ${company_name}`
    ]);

    return res.json({ success: true, message: 'Job posting created successfully.' });
  } catch (err) {
    console.error('createJob error:', err);
    return res.status(500).json({ error: 'Failed to create job posting.' });
  }
};

exports.deleteJob = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM c360_jobs WHERE id = $1', [id]);
    
    // Log action
    const logId = crypto.randomUUID();
    await db.query('INSERT INTO c360_admin_logs (id, action_type, student_id, message) VALUES ($1, $2, $3, $4)', [
      logId,
      'job_deleted',
      null,
      `Job posting ID ${id} deleted`
    ]);

    return res.json({ success: true, message: 'Job posting deleted.' });
  } catch (err) {
    console.error('deleteJob error:', err);
    return res.status(500).json({ error: 'Failed to delete job posting.' });
  }
};
