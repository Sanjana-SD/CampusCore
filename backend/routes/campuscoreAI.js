const express = require('express');
const router = express.Router();
const {
  submitQuizScore,
  uploadResume,
  getSkillGap,
  generateRoadmap,
  updateProgress,
  getFutureCareer,
  getPublicDepartments,
  getPublicCourses,
  getPublicEvents,
  getPublicPlacements,
  getPublicFaculty,
  getJobs,
  applyJob,
  getApplications,
  createJob,
  deleteJob
} = require('../controllers/campuscoreAIController');

const authenticateJWT = require('../middleware/auth');
const authorizeRoles = require('../middleware/rbac');

// Secure all endpoints to authenticated students, class reps, and administrators
router.post('/quiz-score', authenticateJWT, authorizeRoles('student', 'class_rep', 'admin'), submitQuizScore);
router.post('/upload-resume', authenticateJWT, authorizeRoles('student', 'class_rep', 'admin'), uploadResume);
router.get('/skill-gap', authenticateJWT, authorizeRoles('student', 'class_rep', 'admin'), getSkillGap);
router.post('/generate-roadmap', authenticateJWT, authorizeRoles('student', 'class_rep', 'admin'), generateRoadmap);
router.post('/update-progress', authenticateJWT, authorizeRoles('student', 'class_rep', 'admin'), updateProgress);
router.get('/future-career', authenticateJWT, authorizeRoles('student', 'class_rep', 'admin'), getFutureCareer);

// Jobs & Applications API
router.get('/jobs', authenticateJWT, authorizeRoles('student', 'class_rep', 'admin', 'placement_officer'), getJobs);
router.post('/jobs/apply', authenticateJWT, authorizeRoles('student', 'class_rep'), applyJob);
router.get('/jobs/applications', authenticateJWT, authorizeRoles('student', 'class_rep', 'admin', 'placement_officer'), getApplications);
router.post('/jobs', authenticateJWT, authorizeRoles('admin', 'placement_officer'), createJob);
router.delete('/jobs/:id', authenticateJWT, authorizeRoles('admin', 'placement_officer'), deleteJob);

// Public College Portal Endpoints (no auth required)
router.get('/public/departments', getPublicDepartments);
router.get('/public/courses', getPublicCourses);
router.get('/public/events', getPublicEvents);
router.get('/public/placements', getPublicPlacements);
router.get('/public/faculty', getPublicFaculty);

module.exports = router;
