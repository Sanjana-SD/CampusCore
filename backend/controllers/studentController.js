const db = require('../db');
const { getCache, setCache } = require('../redis');

const getStudents = async (req, res) => {
  try {
    const studentsRes = await db.query(
      `SELECT s.*, c.name as class_name 
       FROM students s 
       LEFT JOIN classes c ON s.class_id = c.id
       ORDER BY s.first_name ASC`
    );
    res.json(studentsRes.rows);
  } catch (err) {
    console.error('getStudents error:', err);
    res.status(500).json({ error: 'Failed to retrieve students roster.' });
  }
};

const getStudentById = async (req, res) => {
  const { id } = req.params;

  try {
    const studentRes = await db.query(
      `SELECT s.*, c.name as class_name, u.username
       FROM students s 
       JOIN users u ON s.id = u.id
       LEFT JOIN classes c ON s.class_id = c.id 
       WHERE s.id = $1`,
      [id]
    );

    if (studentRes.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    res.json(studentRes.rows[0]);
  } catch (err) {
    console.error('getStudentById error:', err);
    res.status(500).json({ error: 'Failed to retrieve student details.' });
  }
};

const getStudentTimetable = async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Fetch student's class
    const studentRes = await db.query('SELECT class_id FROM students WHERE id = $1', [id]);
    if (studentRes.rows.length === 0 || !studentRes.rows[0].class_id) {
      return res.status(404).json({ error: 'Student or class mapping not found.' });
    }
    const classId = studentRes.rows[0].class_id;

    // 2. Redis Caching for class timetable
    const cacheKey = `campuscore:timetable:${classId}`;
    const cachedTimetable = await getCache(cacheKey);

    if (cachedTimetable) {
      return res.json(JSON.parse(cachedTimetable));
    }

    // 3. Query DB
    const timetableRes = await db.query(
      `SELECT t.*, st.first_name || ' ' || st.last_name as instructor 
       FROM timetables t
       JOIN staff st ON t.faculty_id = st.id
       WHERE t.class_id = $1 
       ORDER BY t.day_of_week ASC, t.start_time ASC`,
      [classId]
    );

    // Save in Redis for 10 minutes
    await setCache(cacheKey, JSON.stringify(timetableRes.rows), 600);

    res.json(timetableRes.rows);
  } catch (err) {
    console.error('getStudentTimetable error:', err);
    res.status(500).json({ error: 'Failed to retrieve student timetable.' });
  }
};

const getFacultyClasses = async (req, res) => {
  try {
    const classesRes = await db.query(
      'SELECT * FROM classes WHERE faculty_id = $1 ORDER BY name ASC',
      [req.user.id]
    );
    res.json(classesRes.rows);
  } catch (err) {
    console.error('getFacultyClasses error:', err);
    res.status(500).json({ error: 'Failed to retrieve faculty classes.' });
  }
};

const getFacultyTimetable = async (req, res) => {
  try {
    const timetableRes = await db.query(
      `SELECT t.*, c.name as class_name 
       FROM timetables t
       JOIN classes c ON t.class_id = c.id
       WHERE t.faculty_id = $1 
       ORDER BY t.day_of_week ASC, t.start_time ASC`,
      [req.user.id]
    );
    res.json(timetableRes.rows);
  } catch (err) {
    console.error('getFacultyTimetable error:', err);
    res.status(500).json({ error: 'Failed to retrieve faculty timetable.' });
  }
};

const crypto = require('crypto');

const toggleClassRepresentative = async (req, res) => {
  const { id } = req.params;

  if (req.user.role !== 'faculty') {
    return res.status(403).json({ error: 'Access denied. Only lecturers can assign Class Representatives.' });
  }

  try {
    const studentRes = await db.query(
      `SELECT s.id, s.first_name, s.last_name, s.class_id, u.role 
       FROM students s 
       JOIN users u ON s.id = u.id 
       WHERE s.id = $1`,
      [id]
    );

    if (studentRes.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    const student = studentRes.rows[0];

    const classCheck = await db.query(
      'SELECT id FROM classes WHERE id = $1 AND faculty_id = $2',
      [student.class_id, req.user.id]
    );

    if (classCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied. You can only assign CRs for your own classes.' });
    }

    const newRole = student.role === 'class_rep' ? 'student' : 'class_rep';
    
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      
      await client.query('UPDATE users SET role = $1 WHERE id = $2', [newRole, id]);

      const lastAuditRes = await client.query('SELECT row_hash FROM audit_log ORDER BY id DESC LIMIT 1');
      const previousHash = lastAuditRes.rows.length > 0 ? lastAuditRes.rows[0].row_hash : "GENESIS_HASH_CAMPUS_CORE";
      
      const auditPayload = {
        action: 'CR_TOGGLE',
        student_id: id,
        student_name: `${student.first_name} ${student.last_name}`,
        assigned_by: req.user.id,
        new_role: newRole,
        timestamp: new Date()
      };
      
      const payloadStr = JSON.stringify(auditPayload);
      const rowHash = crypto.createHash('sha256').update(payloadStr + previousHash).digest('hex');
      
      await client.query(
        `INSERT INTO audit_log (action_type, payload, previous_hash, row_hash) VALUES ($1, $2, $3, $4)`,
        ['CR_PROMOTION', payloadStr, previousHash, rowHash]
      );

      await client.query('COMMIT');
      client.release();

      res.json({ 
        message: `Successfully updated ${student.first_name}'s status to ${newRole.toUpperCase()}.`, 
        new_role: newRole 
      });
    } catch (txErr) {
      await client.query('ROLLBACK');
      client.release();
      throw txErr;
    }
  } catch (err) {
    console.error('toggleClassRepresentative error:', err);
    res.status(500).json({ error: 'Failed to toggle Class Representative status.' });
  }
};

module.exports = {
  getStudents,
  getStudentById,
  getStudentTimetable,
  getFacultyClasses,
  getFacultyTimetable,
  toggleClassRepresentative
};
