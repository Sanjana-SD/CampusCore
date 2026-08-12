const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../db');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'campuscore-dev-secret';

const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    const userResult = await db.query('SELECT * FROM users WHERE username = $1', [username]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const user = userResult.rows[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Fetch role-specific details
    let profile = null;
    if (user.role === 'student' || user.role === 'class_rep') {
      const studentRes = await db.query(
        `SELECT s.*, c.name as class_name 
         FROM students s 
         LEFT JOIN classes c ON s.class_id = c.id 
         WHERE s.id = $1`,
        [user.id]
      );
      if (studentRes.rows.length > 0) {
        profile = studentRes.rows[0];
      }
    } else if (user.role === 'faculty' || user.role === 'librarian') {
      const staffRes = await db.query('SELECT * FROM staff WHERE id = $1', [user.id]);
      if (staffRes.rows.length > 0) {
        profile = staffRes.rows[0];
      }
    } else if (user.role === 'parent') {
      // Find students linked to this parent
      const childRes = await db.query(
        `SELECT s.*, c.name as class_name 
         FROM students s 
         LEFT JOIN classes c ON s.class_id = c.id 
         WHERE s.parent_user_id = $1`,
        [user.id]
      );
      profile = {
        parent_user_id: user.id,
        children: childRes.rows
      };
    }

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      },
      profile
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
};

const getMe = async (req, res) => {
  try {
    const userRes = await db.query('SELECT id, username, role FROM users WHERE id = $1', [req.user.id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    const user = userRes.rows[0];

    let profile = null;
    if (user.role === 'student' || user.role === 'class_rep') {
      const studentRes = await db.query(
        `SELECT s.*, c.name as class_name 
         FROM students s 
         LEFT JOIN classes c ON s.class_id = c.id 
         WHERE s.id = $1`,
        [user.id]
      );
      if (studentRes.rows.length > 0) {
        profile = studentRes.rows[0];
      }
    } else if (user.role === 'faculty' || user.role === 'librarian') {
      const staffRes = await db.query('SELECT * FROM staff WHERE id = $1', [user.id]);
      if (staffRes.rows.length > 0) {
        profile = staffRes.rows[0];
      }
    } else if (user.role === 'parent') {
      const childRes = await db.query(
        `SELECT s.*, c.name as class_name 
         FROM students s 
         LEFT JOIN classes c ON s.class_id = c.id 
         WHERE s.parent_user_id = $1`,
        [user.id]
      );
      profile = {
        parent_user_id: user.id,
        children: childRes.rows
      };
    }

    res.json({
      user,
      profile
    });
  } catch (err) {
    console.error('getMe error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = {
  login,
  getMe
};
