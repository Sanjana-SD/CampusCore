const express = require('express');
const router = express.Router();
const { dispatchNotifications } = require('../controllers/notificationController');
const authenticateJWT = require('../middleware/auth');
const authorizeRoles = require('../middleware/rbac');

router.post('/dispatch', authenticateJWT, authorizeRoles('admin', 'faculty'), dispatchNotifications);

module.exports = router;
