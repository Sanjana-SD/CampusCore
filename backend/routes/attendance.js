const express = require('express');
const router = express.Router();
const { handleScan, getStudentAttendance } = require('../controllers/attendanceController');
const authenticateJWT = require('../middleware/auth');
const authorizeRoles = require('../middleware/rbac');

// Scanner payload ingestion is public to accommodate ESP32 requests
router.post('/scan', handleScan);

// Students, Parents, Admin, Faculty, and Class Reps can query attendance records with constraints inside the controller
router.get('/:id/attendance', authenticateJWT, authorizeRoles('admin', 'faculty', 'student', 'class_rep', 'parent'), getStudentAttendance);

module.exports = router;
