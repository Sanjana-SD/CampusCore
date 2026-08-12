const db = require('../db');
const { getCache, setCache, delCache } = require('../redis');
const crypto = require('crypto');

// Invalidation Helper
const CONFIG_CACHE_KEY = 'campuscore:config';

const getConfig = async (req, res) => {
  try {
    // Check Redis cache
    const cachedConfig = await getCache(CONFIG_CACHE_KEY);
    if (cachedConfig) {
      return res.json(JSON.parse(cachedConfig));
    }

    const configRes = await db.query('SELECT * FROM config ORDER BY id DESC LIMIT 1');
    const config = configRes.rows.length > 0 ? configRes.rows[0] : {
      late_cutoff_time: '09:15:00',
      absenteeism_threshold: 75.00,
      parent_notification_time: '09:30:00'
    };

    // Save in Cache
    await setCache(CONFIG_CACHE_KEY, JSON.stringify(config), 3600); // 1 hour

    res.json(config);
  } catch (err) {
    console.error('getConfig error:', err);
    res.status(500).json({ error: 'Failed to retrieve configuration.' });
  }
};

const updateConfig = async (req, res) => {
  const { late_cutoff_time, absenteeism_threshold, parent_notification_time, resend_api_key, email_from_address, google_sheet_url } = req.body;

  try {
    const checkConfig = await db.query('SELECT id FROM config LIMIT 1');

    let updatedConfig;

    if (checkConfig.rows.length === 0) {
      const insertQuery = `
        INSERT INTO config (
          late_cutoff_time, absenteeism_threshold, parent_notification_time,
          resend_api_key, email_from_address, google_sheet_url
        ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
      const values = [
        late_cutoff_time || '09:15:00',
        absenteeism_threshold || 75.00,
        parent_notification_time || '09:30:00',
        resend_api_key || null,
        email_from_address || 'onboarding@resend.dev',
        google_sheet_url || null
      ];
      const result = await db.query(insertQuery, values);
      updatedConfig = result.rows[0];
    } else {
      const updateQuery = `
        UPDATE config SET 
          late_cutoff_time = $1, absenteeism_threshold = $2, parent_notification_time = $3,
          resend_api_key = $4, email_from_address = $5, google_sheet_url = $6
        WHERE id = ${checkConfig.rows[0].id} RETURNING *`;
      const values = [
        late_cutoff_time, absenteeism_threshold, parent_notification_time,
        resend_api_key, email_from_address, google_sheet_url
      ];
      const result = await db.query(updateQuery, values);
      updatedConfig = result.rows[0];
    }

    // Invalidate Redis config cache
    await delCache(CONFIG_CACHE_KEY);

    // Hash-chained audit logging for config changes
    const lastAuditRes = await db.query('SELECT row_hash FROM audit_log ORDER BY id DESC LIMIT 1');
    const previousHash = lastAuditRes.rows.length > 0 ? lastAuditRes.rows[0].row_hash : "GENESIS_HASH_CAMPUS_CORE";
    
    const payloadStr = JSON.stringify({ updated_by: req.user.username, timestamp: new Date() });
    const rowHash = crypto.createHash('sha256').update(payloadStr + previousHash).digest('hex');

    await db.query(
      `INSERT INTO audit_log (action_type, payload, previous_hash, row_hash) VALUES ($1, $2, $3, $4)`,
      ['CONFIG_UPDATE', payloadStr, previousHash, rowHash]
    );

    res.json({ message: 'Configuration updated successfully.', config: updatedConfig });
  } catch (err) {
    console.error('updateConfig error:', err);
    res.status(500).json({ error: 'Failed to update configuration.' });
  }
};

const getAnalytics = async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Total active students count
    const totalStudentsRes = await db.query("SELECT COUNT(*) FROM students WHERE enrollment_status = 'active'");
    const totalStudents = parseInt(totalStudentsRes.rows[0].count, 10);

    // 2. Count of students checked IN today
    const checkedInTodayRes = await db.query(
      "SELECT COUNT(DISTINCT student_id) FROM daily_summaries WHERE date = $1 AND present = TRUE",
      [todayStr]
    );
    const presentToday = parseInt(checkedInTodayRes.rows[0].count, 10);
    const absentToday = Math.max(0, totalStudents - presentToday);

    // 3. Overall attendance rates (by student)
    const configRes = await db.query('SELECT absenteeism_threshold FROM config ORDER BY id DESC LIMIT 1');
    const threshold = configRes.rows.length > 0 ? parseFloat(configRes.rows[0].absenteeism_threshold) : 75.00;

    const alertStudentsRes = await db.query(
      `SELECT s.id, s.first_name, s.last_name, c.name as class_name,
       COUNT(ds.id) as total_days,
       COUNT(CASE WHEN ds.present = TRUE THEN 1 END) as days_present,
       ROUND((COUNT(CASE WHEN ds.present = TRUE THEN 1 END)::decimal / NULLIF(COUNT(ds.id), 0)) * 100, 2) as attendance_pct
       FROM students s
       LEFT JOIN classes c ON s.class_id = c.id
       LEFT JOIN daily_summaries ds ON s.id = ds.student_id
       GROUP BY s.id, s.first_name, s.last_name, c.name
       HAVING (COUNT(CASE WHEN ds.present = TRUE THEN 1 END)::decimal / NULLIF(COUNT(ds.id), 0)) * 100 < $1`,
      [threshold]
    );

    // 4. Recently scanned events
    const recentScansRes = await db.query(
      `SELECT ae.timestamp, ae.type, s.first_name, s.last_name, c.name as class_name 
       FROM attendance_events ae
       JOIN students s ON ae.student_id = s.id
       LEFT JOIN classes c ON s.class_id = c.id
       ORDER BY ae.timestamp DESC LIMIT 10`
    );

    // 5. Query AI Mentor stats (Placement Officer data)
    const mentorStatsRes = await db.query(`
      SELECT 
        COUNT(student_id) as total_participants,
        COUNT(CASE WHEN classification = 'Beginner' THEN 1 END) as beginner_count,
        COUNT(CASE WHEN classification = 'Intermediate' THEN 1 END) as intermediate_count,
        COUNT(CASE WHEN classification = 'Advanced' THEN 1 END) as advanced_count,
        AVG(quiz_score) as avg_quiz,
        AVG(resume_score) as avg_resume,
        AVG(skill_gap_score) as avg_gap,
        AVG(total_score) as avg_total
      FROM c360_performance_scores
    `);

    // 6. Query recent AI logs
    const aiLogsRes = await db.query(`
      SELECT * FROM c360_admin_logs 
      ORDER BY created_at DESC LIMIT 10
    `);

    // 7. Query student placement readiness list
    const studentReadyRes = await db.query(`
      SELECT p.quiz_score, p.resume_score, p.skill_gap_score, p.total_score, p.classification, s.first_name, s.last_name
      FROM c360_performance_scores p
      JOIN students s ON p.student_id = s.id
      ORDER BY p.total_score DESC
    `);

    res.json({
      total_students: totalStudents,
      present_today: presentToday,
      absent_today: absentToday,
      absenteeism_threshold: threshold,
      alert_students: alertStudentsRes.rows,
      recent_scans: recentScansRes.rows,
      ai_stats: {
        stats: mentorStatsRes.rows[0] || {
          total_participants: 0,
          beginner_count: 0,
          intermediate_count: 0,
          advanced_count: 0,
          avg_quiz: 0,
          avg_resume: 0,
          avg_gap: 0,
          avg_total: 0
        },
        recent_logs: aiLogsRes.rows,
        student_performance: studentReadyRes.rows
      }
    });
  } catch (err) {
    console.error('getAnalytics error:', err);
    res.status(500).json({ error: 'Failed to retrieve analytics.' });
  }
};

const getAuditLog = async (req, res) => {
  try {
    const auditRes = await db.query('SELECT * FROM audit_log ORDER BY id DESC');
    
    // Verify hash integrity of the chain
    let isChainValid = true;
    for (let i = 0; i < auditRes.rows.length - 1; i++) {
      const currentRow = auditRes.rows[i];
      const nextRow = auditRes.rows[i + 1]; // next in terms of ID is previous row in descending order

      // Re-verify the hash of this row
      const payloadStr = typeof currentRow.payload === 'string' ? currentRow.payload : JSON.stringify(currentRow.payload);
      const computedHash = crypto.createHash('sha256').update(payloadStr + currentRow.previous_hash).digest('hex');

      if (computedHash !== currentRow.row_hash || currentRow.previous_hash !== nextRow.row_hash) {
        isChainValid = false;
        break;
      }
    }

    res.json({
      audit_logs: auditRes.rows,
      integrity_valid: isChainValid
    });
  } catch (err) {
    console.error('getAuditLog error:', err);
    res.status(500).json({ error: 'Failed to retrieve audit log.' });
  }
};

const createUser = async (req, res) => {
  const { username, password, role, details } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ error: 'Username, password, and role are required.' });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Check if user already exists
    const userCheck = await client.query('SELECT id FROM users WHERE username = $1', [username]);
    if (userCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(400).json({ error: 'Username already exists.' });
    }

    // 2. Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 3. Insert User
    const userRes = await client.query(
      `INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id`,
      [username, passwordHash, role]
    );
    const userId = userRes.rows[0].id;

    // 4. Role-Specific Profiles
    if (role === 'student' || role === 'class_rep') {
      const { rfid_uid, first_name, last_name, email, phone, parent_name, parent_email, parent_phone, parent_user_id, class_id } = details;
      if (!first_name || !last_name || !email) {
        throw new Error('First Name, Last Name, and Email are required for students.');
      }
      
      let assignedRfid = rfid_uid;
      if (!assignedRfid) {
        // Auto-generate a dummy unique RFID code (e.g. TEMP_C2F4)
        assignedRfid = 'TEMP_' + crypto.randomBytes(3).toString('hex').toUpperCase();
      }
      
      // Check if RFID already exists
      const rfidCheck = await client.query('SELECT id FROM students WHERE rfid_uid = $1', [assignedRfid]);
      if (rfidCheck.rows.length > 0) {
        throw new Error('RFID UID is already assigned to another student.');
      }

      await client.query(
        `INSERT INTO students (id, rfid_uid, first_name, last_name, email, phone, parent_name, parent_email, parent_phone, parent_user_id, class_id, enrollment_status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'active')`,
        [userId, assignedRfid, first_name, last_name, email, phone || null, parent_name || null, parent_email || null, parent_phone || null, parent_user_id || null, class_id || null]
      );
    } 
    else if (role === 'faculty' || role === 'librarian' || role === 'placement_officer') {
      const { first_name, last_name, email, phone, department } = details;
      if (!first_name || !last_name || !email) {
        throw new Error('First Name, Last Name, and Email are required for staff.');
      }

      await client.query(
        `INSERT INTO staff (id, first_name, last_name, email, phone, department) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, first_name, last_name, email, phone || null, department || null]
      );
    } 
    else if (role === 'parent') {
      const { linked_student_id } = details;
      if (linked_student_id) {
        await client.query(
          `UPDATE students SET parent_user_id = $1 WHERE id = $2`,
          [userId, linked_student_id]
        );
      }
    }

    // 5. Audit Logging
    const lastAuditRes = await client.query('SELECT row_hash FROM audit_log ORDER BY id DESC LIMIT 1');
    const previousHash = lastAuditRes.rows.length > 0 ? lastAuditRes.rows[0].row_hash : "GENESIS_HASH_CAMPUS_CORE";
    const auditPayload = { action: 'USER_CREATED', created_user: username, role, timestamp: new Date() };
    const payloadStr = JSON.stringify(auditPayload);
    const rowHash = crypto.createHash('sha256').update(payloadStr + previousHash).digest('hex');
    await client.query(
      `INSERT INTO audit_log (action_type, payload, previous_hash, row_hash) VALUES ($1, $2, $3, $4)`,
      ['USER_CREATION', payloadStr, previousHash, rowHash]
    );

    await client.query('COMMIT');
    client.release();
    res.status(201).json({ message: 'User account created successfully.', userId });
  } catch (err) {
    await client.query('ROLLBACK');
    client.release();
    console.error('createUser error:', err);
    res.status(500).json({ error: err.message || 'Failed to create user account.' });
  }
};

const getClasses = async (req, res) => {
  try {
    const classesRes = await db.query('SELECT * FROM classes ORDER BY name ASC');
    res.json(classesRes.rows);
  } catch (err) {
    console.error('getClasses error:', err);
    res.status(500).json({ error: 'Failed to retrieve classes.' });
  }
};

const https = require('https');
const { recalculatePeriodAttendance } = require('./attendanceController');

const fetchCsvWithRedirects = (url, depth = 0) => {
  return new Promise((resolve, reject) => {
    if (depth > 5) return reject(new Error('Too many redirects'));

    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchCsvWithRedirects(res.headers.location, depth + 1));
      }

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(data);
        } else {
          reject(new Error(`Failed to fetch CSV: Status ${res.statusCode}`));
        }
      });
    }).on('error', err => reject(err));
  });
};

const syncGoogleSheet = async (req, res) => {
  try {
    const configRes = await db.query('SELECT google_sheet_url, late_cutoff_time FROM config ORDER BY id DESC LIMIT 1');
    const googleSheetUrl = configRes.rows[0]?.google_sheet_url;
    const lateCutoffStr = configRes.rows[0]?.late_cutoff_time || '09:15:00';

    if (!googleSheetUrl) {
      return res.status(400).json({ error: 'Google Sheet Sync URL is not configured in System Settings.' });
    }

    let fetchUrl = googleSheetUrl;
    const sheetIdMatch = googleSheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (sheetIdMatch) {
      const sheetId = sheetIdMatch[1];
      fetchUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
    }

    console.log(`[Sync] Fetching CSV from: ${fetchUrl}`);
    const csvContent = await fetchCsvWithRedirects(fetchUrl);
    
    const lines = csvContent.split(/\r?\n/);
    if (lines.length <= 1) {
      return res.json({ message: 'Sync complete. No rows to process.', imported_count: 0 });
    }

    let importedCount = 0;
    const studentDatesToRecalculate = new Set(); 

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cols = line.split(',').map(c => c.replace(/^["']|["']$/g, '').trim());
        
        if (i === 0 && (cols[0].toLowerCase().includes('timestamp') || cols[1].toLowerCase().includes('uid'))) {
          continue;
        }

        const timestampVal = cols[0];
        let uidVal = cols[1];
        let directionVal = cols[2] ? cols[2].toUpperCase() : null;

        if (!timestampVal || !uidVal) continue;

        uidVal = uidVal.toUpperCase();
        const scanTime = new Date(timestampVal);
        if (isNaN(scanTime.getTime())) continue;

        const scanDateStr = scanTime.toISOString().split('T')[0];

        const studentRes = await client.query('SELECT id, class_id FROM students WHERE rfid_uid = $1', [uidVal]);
        if (studentRes.rows.length === 0) continue; 

        const student = studentRes.rows[0];

        const checkEventRes = await client.query(
          'SELECT id FROM attendance_events WHERE student_id = $1 AND timestamp = $2',
          [student.id, scanTime.toISOString()]
        );

        if (checkEventRes.rows.length === 0) {
          if (!directionVal) {
            const lastScanRes = await client.query(
              `SELECT type FROM attendance_events 
               WHERE student_id = $1 AND timestamp < $2 AND timestamp >= $3
               ORDER BY timestamp DESC LIMIT 1`,
              [student.id, scanTime.toISOString(), `${scanDateStr}T00:00:00.000Z`]
            );
            if (lastScanRes.rows.length === 0 || lastScanRes.rows[0].type === 'OUT') {
              directionVal = 'IN';
            } else {
              directionVal = 'OUT';
            }
          } else {
            if (directionVal.startsWith('IN') || directionVal.startsWith('ENT')) {
              directionVal = 'IN';
            } else {
              directionVal = 'OUT';
            }
          }

          await client.query(
            `INSERT INTO attendance_events (student_id, type, timestamp, device_id) 
             VALUES ($1, $2, $3, 'GOOGLE_SHEET')`,
            [student.id, directionVal, scanTime.toISOString()]
          );

          importedCount++;
          studentDatesToRecalculate.add(`${student.id}:${student.class_id}:${scanDateStr}`);
        }
      }

      for (const item of studentDatesToRecalculate) {
        const [studentId, classId, dateStr] = item.split(':');

        await recalculatePeriodAttendance(studentId, classId, dateStr, client);

        const dayEventsRes = await client.query(
          `SELECT type, timestamp FROM attendance_events 
           WHERE student_id = $1 AND timestamp >= $2 AND timestamp <= $3 
           ORDER BY timestamp ASC`,
          [studentId, `${dateStr}T00:00:00.000Z`, `${dateStr}T23:59:59.999Z`]
        );
        const dayEvents = dayEventsRes.rows;

        if (dayEvents.length > 0) {
          const firstIn = dayEvents[0];
          const scanTimePart = new Date(firstIn.timestamp).toISOString().split('T')[1].substring(0, 8);
          const isLate = firstIn.type === 'IN' && scanTimePart > lateCutoffStr;

          let totalDuration = 0;
          for (let j = 0; j < dayEvents.length; j++) {
            if (dayEvents[j].type === 'IN' && dayEvents[j+1] && dayEvents[j+1].type === 'OUT') {
              const inT = new Date(dayEvents[j].timestamp);
              const outT = new Date(dayEvents[j+1].timestamp);
              totalDuration += Math.round((outT - inT) / 1000);
              j++;
            }
          }

          await client.query(
            `INSERT INTO daily_summaries (student_id, date, present, late_flag, total_duration_on_campus) 
             VALUES ($1, $2, TRUE, $3, $4) 
             ON CONFLICT (student_id, date) 
             DO UPDATE SET present = TRUE, late_flag = EXCLUDED.late_flag, total_duration_on_campus = EXCLUDED.total_duration_on_campus`,
            [studentId, dateStr, isLate, totalDuration]
          );
        }
      }

      await client.query('COMMIT');
      client.release();
      
      res.json({ 
        message: `Successfully synchronized Google Sheet. Imported ${importedCount} new scans and updated period attendance.`, 
        imported_count: importedCount 
      });

    } catch (txErr) {
      await client.query('ROLLBACK');
      client.release();
      throw txErr;
    }

  } catch (err) {
    console.error('syncGoogleSheet error:', err);
    res.status(500).json({ error: err.message || 'Failed to sync with Google Sheet.' });
  }
};

module.exports = {
  getConfig,
  updateConfig,
  getAnalytics,
  getAuditLog,
  createUser,
  getClasses,
  syncGoogleSheet
};
