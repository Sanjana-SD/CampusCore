const express = require('express');
const router = express.Router();
const { getConfig, updateConfig, getAnalytics, getAuditLog, createUser, getClasses, syncGoogleSheet } = require('../controllers/adminController');
const authenticateJWT = require('../middleware/auth');
const authorizeRoles = require('../middleware/rbac');

router.get('/config', authenticateJWT, authorizeRoles('admin', 'faculty', 'student', 'class_rep', 'parent', 'librarian'), getConfig);
router.put('/config', authenticateJWT, authorizeRoles('admin'), updateConfig);
router.get('/analytics', authenticateJWT, authorizeRoles('admin', 'faculty'), getAnalytics);
router.get('/audit-log', authenticateJWT, authorizeRoles('admin'), getAuditLog);
router.post('/users/create', authenticateJWT, authorizeRoles('admin'), createUser);
router.get('/classes', authenticateJWT, authorizeRoles('admin'), getClasses);
router.post('/sync-sheet', authenticateJWT, authorizeRoles('admin'), syncGoogleSheet);

module.exports = router;
