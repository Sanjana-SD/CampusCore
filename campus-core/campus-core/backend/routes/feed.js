const express = require('express');
const router = express.Router();
const { getFeed, createPost, deletePost } = require('../controllers/feedController');
const authenticateJWT = require('../middleware/auth');
const authorizeRoles = require('../middleware/rbac');

router.get('/', authenticateJWT, authorizeRoles('admin', 'faculty', 'student', 'class_rep'), getFeed);
router.post('/', authenticateJWT, authorizeRoles('admin', 'faculty', 'class_rep'), createPost);
router.delete('/:id', authenticateJWT, authorizeRoles('admin', 'faculty', 'class_rep'), deletePost);

module.exports = router;
