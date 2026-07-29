const express = require('express');
const router = express.Router();
const { 
  getBooks, 
  addBook, 
  issueBook, 
  returnBook, 
  getLoans, 
  getStudentLoans 
} = require('../controllers/libraryController');
const authenticateJWT = require('../middleware/auth');
const authorizeRoles = require('../middleware/rbac');

router.get('/books', authenticateJWT, authorizeRoles('admin', 'faculty', 'student', 'class_rep', 'librarian'), getBooks);
router.post('/books', authenticateJWT, authorizeRoles('admin', 'librarian'), addBook);
router.post('/loans/issue', authenticateJWT, authorizeRoles('admin', 'librarian'), issueBook);
router.post('/loans/return', authenticateJWT, authorizeRoles('admin', 'librarian'), returnBook);
router.get('/loans', authenticateJWT, authorizeRoles('admin', 'librarian'), getLoans);
router.get('/loans/student/:studentId', authenticateJWT, authorizeRoles('admin', 'faculty', 'student', 'parent'), getStudentLoans);

module.exports = router;
