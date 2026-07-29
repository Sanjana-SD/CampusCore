const express = require('express');
const router = express.Router();
const { login, getMe } = require('../controllers/authController');
const authenticateJWT = require('../middleware/auth');

router.post('/login', login);
router.get('/me', authenticateJWT, getMe);

module.exports = router;
