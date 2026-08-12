const db = require('../db');
const crypto = require('crypto');
require('dotenv').config();

// Helper to check if two timestamps are within a certain seconds difference
const isDebounced = (time1, time2, limitSeconds = 5) => {
  const diff = Math.abs(new Date(time1) - new Date(time2)) / 1000;
  return diff < limitSeconds;
};

// Scan handling endpoint (entry/exit device payload ingestion)
const handleScan = async (req, res) => {
  const { rfid_uid, timestamp, device_id } = req.body;

  if (!rfid_uid || !timestamp || !device_id) {
    return res.status(400).json({ 
      result: 'UNRECOGNIZED', 
      student_name: null, 
      message: 'Malformed payload. Missing fields.' 
    });
  }

  const scanTime = new Date(timestamp);
  if (isNaN(scanTime.getTime())) {
    return res.status(400).json({ 
      result: 'UNRECOGNIZED', 
      student_name: null, 
      message: 'Invalid timestamp format.' 
    });
  }

  try {
    // 1. Student Check
    const studentRes = await db.query(
      'SELECT id, first_name, last_name, class_id, enrollment_status FROM students WHERE rfid_uid = $1',
      [rfid_uid]
    );

    if (studentRes.rows.length === 0) {
      return res.status(200).json({
        result: 'UNRECOGNIZED',
        student_name: null,
        message: 'Unrecognized RFID Card.'
      });
    }

    const student = studentRes.rows[0];
    if (student.enrollment_status !== 'active') {
      return res.status(200).json({
        result: 'UNRECOGNIZED',
        student_name: `${student.first_name} ${student.last_name}`,
        message: 'Student account is suspended or inactive.'
      });
    }

    const studentName = `${student.first_name} ${student.last_name}`;

    // 2. Debounce Check (within 5 seconds of the overall last scan)
    const lastEventRes = await db.query(
      'SELECT timestamp FROM attendance_events WHERE student_id = $1 ORDER BY timestamp DESC LIMIT 1',
      [student.id]
    );

    if (lastEventRes.rows.length > 0) {
      const lastScanTime = new Date(lastEventRes.rows[0].timestamp);
      if (isDebounced(scanTime, lastScanTime, 5)) {
        return res.status(200).json({
          result: 'DUPLICATE',
          student_name: studentName,
          message: 'Duplicate scan ignored (debounce).'
        });
      }
    }

    // 3. Today's Boundary & Toggle Logic
    const scanDateStr = scanTime.toISOString().split('T')[0]; // YYYY-MM-DD
    const startOfDay = new Date(`${scanDateStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${scanDateStr}T23:59:59.999Z`);

    // Fetch the last scan for today
    const lastScanTodayRes = await db.query(
      `SELECT type, timestamp FROM attendance_events 
       WHERE student_id = $1 AND timestamp >= $2 AND timestamp <= $3 
       ORDER BY timestamp DESC LIMIT 1`,
      [student.id, startOfDay.toISOString(), endOfDay.toISOString()]
    );

    let resultType = 'IN';
    let sessionDuration = 0;
    const client = await db.pool.connect();

    try {
      await client.query('BEGIN');

      const lastScanToday = lastScanTodayRes.rows[0];

      // Toggle logic
      if (!lastScanToday || lastScanToday.type === 'OUT') {
        resultType = 'IN';

        // Log Raw Event
        await client.query(
          `INSERT INTO attendance_events (student_id, type, timestamp, device_id) 
           VALUES ($1, $2, $3, $4)`,
          [student.id, 'IN', scanTime.toISOString(), device_id]
        );

        // Calculate Late cutoff
        const configRes = await client.query('SELECT late_cutoff_time FROM config ORDER BY id DESC LIMIT 1');
        const lateCutoffStr = configRes.rows.length > 0 ? configRes.rows[0].late_cutoff_time : '09:15:00';
        
        // Check if the current scan's time exceeds late cutoff
        const scanTimePart = scanTime.toISOString().split('T')[1].substring(0, 8); // HH:MM:SS
        const isLate = scanTimePart > lateCutoffStr;

        // First IN of the day creates/updates daily summaries
        const isFirstIn = !lastScanToday;
        if (isFirstIn) {
          await client.query(
            `INSERT INTO daily_summaries (student_id, date, present, late_flag) 
             VALUES ($1, $2, TRUE, $3) 
             ON CONFLICT (student_id, date) 
             DO UPDATE SET present = TRUE, late_flag = EXCLUDED.late_flag`,
            [student.id, scanDateStr, isLate]
          );
        }

        // Recalculate period attendance dynamically
        await recalculatePeriodAttendance(student.id, student.class_id, scanDateStr, client);
      } else {
        resultType = 'OUT';

        // Log Raw Event
        await client.query(
          `INSERT INTO attendance_events (student_id, type, timestamp, device_id) 
           VALUES ($1, $2, $3, $4)`,
          [student.id, 'OUT', scanTime.toISOString(), device_id]
        );

        // Calculate session duration
        const lastInTime = new Date(lastScanToday.timestamp);
        sessionDuration = Math.round(Math.abs(scanTime - lastInTime) / 1000); // duration in seconds

        // Update total campus duration in daily summaries
        await client.query(
          `INSERT INTO daily_summaries (student_id, date, present, total_duration_on_campus) 
           VALUES ($1, $2, TRUE, $3) 
           ON CONFLICT (student_id, date) 
           DO UPDATE SET total_duration_on_campus = daily_summaries.total_duration_on_campus + EXCLUDED.total_duration_on_campus`,
          [student.id, scanDateStr, sessionDuration]
        );

        // --- Recalculate Period Attendance dynamically ---
        await recalculatePeriodAttendance(student.id, student.class_id, scanDateStr, client);
      }

      // 4. Audit Log (Hash-chained, append-only)
      const lastAuditRes = await client.query('SELECT row_hash FROM audit_log ORDER BY id DESC LIMIT 1');
      const previousHash = lastAuditRes.rows.length > 0 ? lastAuditRes.rows[0].row_hash : "GENESIS_HASH_CAMPUS_CORE";
      
      const auditPayload = {
        student_id: student.id,
        rfid_uid,
        event_type: resultType,
        timestamp: timestamp,
        device_id,
        session_duration
      };

      const payloadStr = JSON.stringify(auditPayload);
      const rowHash = crypto.createHash('sha256').update(payloadStr + previousHash).digest('hex');

      await client.query(
        `INSERT INTO audit_log (action_type, payload, previous_hash, row_hash) 
         VALUES ($1, $2, $3, $4)`,
        ['ATTENDANCE_EVENT', payloadStr, previousHash, rowHash]
      );

      await client.query('COMMIT');
      client.release();

      // 5. Broadcast live update to WebSocket clients
      const io = req.app.get('socketio');
      if (io) {
        io.emit('attendance_scan', {
          student_id: student.id,
          student_name: studentName,
          result: resultType,
          timestamp: scanTime,
          device_id,
          session_duration
        });
      }

      return res.status(200).json({
        result: resultType,
        student_name: studentName,
        message: `Checked ${resultType} successfully.`
      });

    } catch (txErr) {
      await client.query('ROLLBACK');
      client.release();
      throw txErr;
    }

  } catch (err) {
    console.error('Scan handling error:', err);
    return res.status(500).json({
      result: 'UNRECOGNIZED',
      student_name: null,
      message: 'Internal server error processing scan.'
    });
  }
};

// Retrieve a student's personal attendance history
const getStudentAttendance = async (req, res) => {
  const { id } = req.params;

  // Enforce access control boundaries: students can only view their own logs
  if (req.user.role === 'student' && req.user.id !== id) {
    return res.status(403).json({ error: 'Access denied. You can only view your own logs.' });
  }

  // Parents can only view their linked children's logs
  if (req.user.role === 'parent') {
    const parentCheck = await db.query('SELECT parent_user_id FROM students WHERE id = $1', [id]);
    if (parentCheck.rows.length === 0 || parentCheck.rows[0].parent_user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied. You can only view your children\'s logs.' });
    }
  }

  try {
    const rawEvents = await db.query(
      `SELECT type, timestamp, device_id FROM attendance_events 
       WHERE student_id = $1 ORDER BY timestamp DESC`,
      [id]
    );

    const summaries = await db.query(
      `SELECT date, present, total_duration_on_campus, late_flag 
       FROM daily_summaries WHERE student_id = $1 ORDER BY date DESC`,
      [id]
    );

    const periodLogs = await db.query(
      `SELECT pa.date, pa.status, t.subject, t.start_time, t.end_time 
       FROM period_attendance pa 
       JOIN timetables t ON pa.timetable_id = t.id 
       WHERE pa.student_id = $1 ORDER BY pa.date DESC, t.start_time DESC`,
      [id]
    );

    res.json({
      raw_events: rawEvents.rows,
      summaries: summaries.rows,
      period_attendance: periodLogs.rows
    });
  } catch (err) {
    console.error('getStudentAttendance error:', err);
    res.status(500).json({ error: 'Internal server error fetching student attendance.' });
  }
};

const recalculatePeriodAttendance = async (studentId, classId, dateStr, client) => {
  const dbClient = client || db;

  // 1. Fetch student's timetables for this day of the week
  const dateObj = new Date(`${dateStr}T00:00:00.000Z`);
  const dayOfWeek = dateObj.getUTCDay();

  const timetablesRes = await dbClient.query(
    `SELECT id, start_time, end_time, subject FROM timetables 
     WHERE class_id = $1 AND day_of_week = $2`,
    [classId, dayOfWeek]
  );
  
  // Sort timetables by start_time ascending in memory
  const timetables = timetablesRes.rows.sort((a, b) => a.start_time.localeCompare(b.start_time));

  // 2. Fetch all raw attendance events for this student on this day
  const startOfDay = `${dateStr}T00:00:00.000Z`;
  const endOfDay = `${dateStr}T23:59:59.999Z`;
  const eventsRes = await dbClient.query(
    `SELECT type, timestamp FROM attendance_events 
     WHERE student_id = $1 AND timestamp >= $2 AND timestamp <= $3`,
    [studentId, startOfDay, endOfDay]
  );
  
  // Sort events by timestamp ascending in memory
  const events = eventsRes.rows.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  for (const slot of timetables) {
    // Parse slot start and end times
    const [startH, startM, startS] = slot.start_time.split(':').map(Number);
    const [endH, endM, endS] = slot.end_time.split(':').map(Number);

    const slotStart = new Date(`${dateStr}T00:00:00.000Z`);
    slotStart.setUTCHours(startH, startM, startS || 0, 0);

    const slotEnd = new Date(`${dateStr}T00:00:00.000Z`);
    slotEnd.setUTCHours(endH, endM, endS || 0, 0);

    const graceLimit = new Date(slotStart);
    graceLimit.setUTCMinutes(graceLimit.getUTCMinutes() + 10);

    // Find the state of the student right before this period starts
    const eventsBefore = events.filter(e => new Date(e.timestamp) < slotStart);
    const lastEventBefore = eventsBefore.length > 0 ? eventsBefore[eventsBefore.length - 1] : null;

    // Find events during the class period
    const eventsDuring = events.filter(e => {
      const t = new Date(e.timestamp);
      return t >= slotStart && t <= slotEnd;
    });

    let status = 'absent';

    if (lastEventBefore && lastEventBefore.type === 'IN') {
      // Student entered before class
      const outEventDuring = eventsDuring.find(e => e.type === 'OUT');
      if (outEventDuring) {
        // Student left during class
        const outTime = new Date(outEventDuring.timestamp);
        if (outTime <= graceLimit) {
          // Left during grace period
          status = 'absent';
        } else {
          status = 'present';
        }
      } else {
        status = 'present';
      }
    } else {
      // Student was OUT or had no scans before class
      const inEventDuring = eventsDuring.find(e => e.type === 'IN');
      if (inEventDuring) {
        // Student entered during class
        const inTime = new Date(inEventDuring.timestamp);
        const outEventAfter = eventsDuring.find(e => e.type === 'OUT' && new Date(e.timestamp) > inTime);
        
        if (outEventAfter && (new Date(outEventAfter.timestamp) - inTime) < 5 * 60 * 1000) {
          // Left less than 5 minutes after entering
          status = 'absent';
        } else if (inTime <= graceLimit) {
          status = 'present';
        } else {
          status = 'late';
        }
      } else {
        status = 'absent';
      }
    }

    // Save period attendance
    await dbClient.query(
      `INSERT INTO period_attendance (student_id, timetable_id, date, status, marked_by) 
       VALUES ($1, $2, $3, $4, 'system') 
       ON CONFLICT (student_id, timetable_id, date) 
       DO UPDATE SET status = EXCLUDED.status`,
      [studentId, slot.id, dateStr, status]
    );
  }
};

module.exports = {
  handleScan,
  getStudentAttendance,
  recalculatePeriodAttendance
};
