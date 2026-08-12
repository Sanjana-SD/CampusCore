const db = require('../db');
const https = require('https');

// Helper function to send email via Resend API
const sendResendEmail = (apiKey, from, to, subject, bodyText) => {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      from: from || 'onboarding@resend.dev',
      to: [to],
      subject: subject,
      html: `<p>${bodyText.replace(/\n/g, '<br>')}</p>`
    });

    const options = {
      hostname: 'api.resend.com',
      path: '/emails',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve();
        } else {
          reject(new Error(`Resend API error: Status ${res.statusCode} - ${responseBody}`));
        }
      });
    });

    req.on('error', err => reject(err));
    req.write(payload);
    req.end();
  });
};

const dispatchAlert = async (resendKey, fromEmail, recipient, subject, message) => {
  console.log(`\n=================== DISPATCHING ALERT ===================`);
  console.log(`RECIPIENT: ${recipient}`);
  console.log(`SUBJECT:   ${subject}`);
  console.log(`MESSAGE:   ${message}`);
  console.log(`=========================================================\n`);

  if (resendKey && recipient) {
    try {
      await sendResendEmail(resendKey, fromEmail, recipient, subject, message);
      console.log(`[Resend] Email successfully dispatched to ${recipient}.`);
    } catch (err) {
      console.warn(`[Resend] Failed to send email to ${recipient}:`, err.message);
    }
  } else {
    console.log(`[Resend] Alert logged to console (No Resend API Key configured).`);
  }
};

const dispatchNotifications = async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    // Fetch config
    const configRes = await db.query('SELECT * FROM config ORDER BY id DESC LIMIT 1');
    const config = configRes.rows[0] || {
      late_cutoff_time: '09:15:00',
      absenteeism_threshold: 75.00,
      parent_notification_time: '09:30:00',
      resend_api_key: null,
      email_from_address: 'onboarding@resend.dev'
    };

    const threshold = parseFloat(config.absenteeism_threshold);

    // 1. Absentee Alert (First check-in check)
    // Find students who have NOT checked IN today
    const absenteesRes = await db.query(
      `SELECT s.id, s.first_name, s.last_name, s.parent_name, s.parent_email, s.parent_phone 
       FROM students s
       WHERE s.enrollment_status = 'active'
       AND s.id NOT IN (
         SELECT student_id FROM daily_summaries 
         WHERE date = $1 AND present = TRUE
       )`,
      [todayStr]
    );

    const absenteeAlerts = [];
    for (const student of absenteesRes.rows) {
      const subject = `Urgent: CampusCore Attendance Notice for ${student.first_name}`;
      const msg = `Dear ${student.parent_name || 'Parent'},\n\nThis is to notify you that ${student.first_name} ${student.last_name} has not checked in at the college gate as of ${config.parent_notification_time || '09:30 AM'} today (${todayStr}). Please contact the admin department for any queries.\n\nRegards,\nCampusCore Administration`;
      
      await dispatchAlert(config.resend_api_key, config.email_from_address, student.parent_email || 'parent@school.edu', subject, msg);
      
      absenteeAlerts.push({
        student_id: student.id,
        student_name: `${student.first_name} ${student.last_name}`,
        parent_email: student.parent_email
      });
    }

    // 2. Low Attendance Threshold Check
    const lowAttendanceRes = await db.query(
      `SELECT s.id, s.first_name, s.last_name, s.parent_name, s.parent_email,
       COUNT(ds.id) as total_days,
       COUNT(CASE WHEN ds.present = TRUE THEN 1 END) as days_present,
       ROUND((COUNT(CASE WHEN ds.present = TRUE THEN 1 END)::decimal / NULLIF(COUNT(ds.id), 0)) * 100, 2) as attendance_pct
       FROM students s
       LEFT JOIN daily_summaries ds ON s.id = ds.student_id
       WHERE s.enrollment_status = 'active'
       GROUP BY s.id, s.first_name, s.last_name, s.parent_name, s.parent_email
       HAVING (COUNT(CASE WHEN ds.present = TRUE THEN 1 END)::decimal / NULLIF(COUNT(ds.id), 0)) * 100 < $1`,
      [threshold]
    );

    const lowAttendanceAlerts = [];
    for (const student of lowAttendanceRes.rows) {
      // Avoid alerting if there is no attendance data yet
      if (parseInt(student.total_days, 10) === 0) continue;

      const subject = `Alert: Low Attendance Warning for ${student.first_name}`;
      const msg = `Dear ${student.parent_name || 'Parent'},\n\nWe would like to bring to your attention that the overall attendance of your child, ${student.first_name} ${student.last_name}, has dropped to ${student.attendance_pct}%, which is below the institution minimum required threshold of ${threshold}%.\n\nKindly ensure regular attendance to avoid academic penalties.\n\nRegards,\nCampusCore Administration`;

      await dispatchAlert(config.resend_api_key, config.email_from_address, student.parent_email || 'parent@school.edu', subject, msg);

      lowAttendanceAlerts.push({
        student_id: student.id,
        student_name: `${student.first_name} ${student.last_name}`,
        attendance_pct: student.attendance_pct
      });
    }

    res.json({
      message: 'Notification run completed successfully.',
      dispatched_absentees: absenteeAlerts,
      dispatched_low_attendance: lowAttendanceAlerts
    });
  } catch (err) {
    console.error('dispatchNotifications error:', err);
    res.status(500).json({ error: 'Failed to dispatch alerts.' });
  }
};

module.exports = {
  dispatchNotifications
};
