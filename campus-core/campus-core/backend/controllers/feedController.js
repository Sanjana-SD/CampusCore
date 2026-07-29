const db = require('../db');

const getFeed = async (req, res) => {
  const { classId } = req.query;

  try {
    let queryText = '';
    let params = [];

    if (classId) {
      // Fetch global announcements + class-specific announcements
      queryText = `
        SELECT cf.*, u.username as poster_name, u.role as poster_role
        FROM class_feeds cf
        JOIN users u ON cf.posted_by = u.id
        WHERE cf.class_id IS NULL OR cf.class_id = $1
        ORDER BY cf.created_at DESC`;
      params = [classId];
    } else {
      // Just fetch global announcements
      queryText = `
        SELECT cf.*, u.username as poster_name, u.role as poster_role
        FROM class_feeds cf
        JOIN users u ON cf.posted_by = u.id
        WHERE cf.class_id IS NULL
        ORDER BY cf.created_at DESC`;
    }

    const feedRes = await db.query(queryText, params);
    res.json(feedRes.rows);
  } catch (err) {
    console.error('getFeed error:', err);
    res.status(500).json({ error: 'Failed to retrieve announcements feed.' });
  }
};

const createPost = async (req, res) => {
  const { class_id, title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required.' });
  }

  // A class representative (class_rep) can only post to their *own* class
  if (req.user.role === 'class_rep') {
    if (!class_id) {
      return res.status(403).json({ error: 'Class Reps can only post to their assigned class feed.' });
    }
    
    // Check if class rep is indeed assigned to this class
    const crCheck = await db.query('SELECT class_id FROM students WHERE id = $1', [req.user.id]);
    if (crCheck.rows.length === 0 || crCheck.rows[0].class_id !== class_id) {
      return res.status(403).json({ error: 'Forbidden. You are not authorized to post to this class feed.' });
    }
  }

  try {
    const result = await db.query(
      `INSERT INTO class_feeds (class_id, title, content, posted_by) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [class_id || null, title, content, req.user.id]
    );

    // Broadcast announcement in real-time
    const io = req.app.get('socketio');
    if (io) {
      io.emit('new_announcement', {
        id: result.rows[0].id,
        title,
        content,
        class_id: class_id || null,
        posted_by: req.user.username,
        created_at: result.rows[0].created_at
      });
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('createPost error:', err);
    res.status(500).json({ error: 'Failed to create feed post.' });
  }
};

const deletePost = async (req, res) => {
  const { id } = req.params;

  try {
    // Admin can delete any post. Lecturer/CR can only delete their own.
    const postRes = await db.query('SELECT posted_by FROM class_feeds WHERE id = $1', [id]);
    if (postRes.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const post = postRes.rows[0];
    if (req.user.role !== 'admin' && post.posted_by !== req.user.id) {
      return res.status(403).json({ error: 'Access denied. You can only delete your own posts.' });
    }

    await db.query('DELETE FROM class_feeds WHERE id = $1', [id]);
    res.json({ message: 'Feed post deleted successfully.' });
  } catch (err) {
    console.error('deletePost error:', err);
    res.status(500).json({ error: 'Failed to delete feed post.' });
  }
};

module.exports = {
  getFeed,
  createPost,
  deletePost
};
