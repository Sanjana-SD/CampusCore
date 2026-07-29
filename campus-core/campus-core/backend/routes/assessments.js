const express = require('express');
const router = express.Router();
const { 
  getAssessmentsByClass, 
  createAssessment, 
  inputGrades, 
  getGrades, 
  lockAssessment, 
  getStudentGrades 
} = require('../controllers/assessmentController');
const authenticateJWT = require('../middleware/auth');
const authorizeRoles = require('../middleware/rbac');

router.get('/', authenticateJWT, authorizeRoles('admin', 'faculty', 'class_rep'), getAssessmentsByClass);
router.post('/', authenticateJWT, authorizeRoles('admin', 'faculty'), createAssessment);
router.post('/:id/grades', authenticateJWT, authorizeRoles('admin', 'faculty'), inputGrades);
router.get('/:id/grades', authenticateJWT, authorizeRoles('admin', 'faculty', 'class_rep'), getGrades);
router.post('/:id/lock', authenticateJWT, authorizeRoles('admin', 'faculty'), lockAssessment);
router.get('/student/:studentId', authenticateJWT, authorizeRoles('admin', 'faculty', 'student', 'parent'), getStudentGrades);

module.exports = router;
