const express = require('express');
const router = express.Router();
const { 
  getStudents, 
  getStudentById, 
  getStudentTimetable,
  getFacultyClasses,
  getFacultyTimetable,
  toggleClassRepresentative
} = require('../controllers/studentController');
const authenticateJWT = require('../middleware/auth');
const authorizeRoles = require('../middleware/rbac');

router.get('/', authenticateJWT, authorizeRoles('admin', 'faculty'), getStudents);
router.get('/faculty/classes', authenticateJWT, authorizeRoles('faculty'), getFacultyClasses);
router.get('/faculty/timetable', authenticateJWT, authorizeRoles('faculty'), getFacultyTimetable);
router.get('/:id', authenticateJWT, authorizeRoles('admin', 'faculty', 'student', 'parent'), getStudentById);
router.get('/:id/timetable', authenticateJWT, authorizeRoles('admin', 'faculty', 'student', 'parent'), getStudentTimetable);
router.post('/:id/toggle-cr', authenticateJWT, authorizeRoles('faculty'), toggleClassRepresentative);

module.exports = router;
