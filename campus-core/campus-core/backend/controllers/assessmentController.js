const db = require('../db');

const getAssessmentsByClass = async (req, res) => {
  const { classId } = req.query;
  
  if (!classId) {
    return res.status(400).json({ error: 'classId is required.' });
  }

  try {
    const assessmentsRes = await db.query(
      'SELECT * FROM assessments WHERE class_id = $1 ORDER BY created_at DESC',
      [classId]
    );
    res.json(assessmentsRes.rows);
  } catch (err) {
    console.error('getAssessmentsByClass error:', err);
    res.status(500).json({ error: 'Failed to retrieve assessments.' });
  }
};

const createAssessment = async (req, res) => {
  const { class_id, title, max_marks } = req.body;

  if (!class_id || !title || !max_marks) {
    return res.status(400).json({ error: 'class_id, title, and max_marks are required.' });
  }

  try {
    const result = await db.query(
      `INSERT INTO assessments (class_id, title, max_marks, created_by) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [class_id, title, max_marks, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('createAssessment error:', err);
    res.status(500).json({ error: 'Failed to create assessment.' });
  }
};

const inputGrades = async (req, res) => {
  const { id } = req.params; // assessment_id
  const { grades } = req.body; // array of { student_id, marks_obtained }

  if (!grades || !Array.isArray(grades)) {
    return res.status(400).json({ error: 'grades must be an array of objects.' });
  }

  try {
    // Check lock status
    const assessRes = await db.query('SELECT locked_at FROM assessments WHERE id = $1', [id]);
    if (assessRes.rows.length === 0) {
      return res.status(404).json({ error: 'Assessment not found.' });
    }

    if (assessRes.rows[0].locked_at && new Date() > new Date(assessRes.rows[0].locked_at)) {
      return res.status(403).json({ error: 'Grades for this assessment are locked and cannot be modified.' });
    }

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      for (const grade of grades) {
        await client.query(
          `INSERT INTO assessment_grades (assessment_id, student_id, marks_obtained, graded_by) 
           VALUES ($1, $2, $3, $4) 
           ON CONFLICT (assessment_id, student_id) 
           DO UPDATE SET marks_obtained = EXCLUDED.marks_obtained, updated_at = CURRENT_TIMESTAMP`,
          [id, grade.student_id, grade.marks_obtained, req.user.id]
        );
      }
      await client.query('COMMIT');
      client.release();
      res.json({ message: 'Grades saved successfully.' });
    } catch (txErr) {
      await client.query('ROLLBACK');
      client.release();
      throw txErr;
    }
  } catch (err) {
    console.error('inputGrades error:', err);
    res.status(500).json({ error: 'Failed to record grades.' });
  }
};

const getGrades = async (req, res) => {
  const { id } = req.params;

  try {
    const gradesRes = await db.query(
      `SELECT ag.*, s.first_name, s.last_name, s.email 
       FROM assessment_grades ag
       JOIN students s ON ag.student_id = s.id 
       WHERE ag.assessment_id = $1`,
      [id]
    );

    // Calculate averages and top score
    const marksList = gradesRes.rows.map(g => parseFloat(g.marks_obtained));
    const average = marksList.length > 0 ? (marksList.reduce((a, b) => a + b, 0) / marksList.length).toFixed(2) : 0;
    const max = marksList.length > 0 ? Math.max(...marksList) : 0;

    res.json({
      average,
      max,
      grades: gradesRes.rows
    });
  } catch (err) {
    console.error('getGrades error:', err);
    res.status(500).json({ error: 'Failed to retrieve grades.' });
  }
};

const lockAssessment = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      'UPDATE assessments SET locked_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );
    res.json({ message: 'Assessment records locked successfully.', assessment: result.rows[0] });
  } catch (err) {
    console.error('lockAssessment error:', err);
    res.status(500).json({ error: 'Failed to lock assessment.' });
  }
};

const getStudentGrades = async (req, res) => {
  const { studentId } = req.params;

  if (req.user.role === 'student' && req.user.id !== studentId) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  try {
    const gradesRes = await db.query(
      `SELECT ag.marks_obtained, a.title, a.max_marks, a.created_at, st.first_name || ' ' || st.last_name as grader
       FROM assessment_grades ag
       JOIN assessments a ON ag.assessment_id = a.id
       JOIN staff st ON ag.graded_by = st.id
       WHERE ag.student_id = $1 ORDER BY a.created_at DESC`,
      [studentId]
    );
    res.json(gradesRes.rows);
  } catch (err) {
    console.error('getStudentGrades error:', err);
    res.status(500).json({ error: 'Failed to retrieve student grades.' });
  }
};

module.exports = {
  getAssessmentsByClass,
  createAssessment,
  inputGrades,
  getGrades,
  lockAssessment,
  getStudentGrades
};
