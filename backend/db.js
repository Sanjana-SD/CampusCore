const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const FILE_PATH = path.join(__dirname, 'campuscore_db.json');

// Initialize local JSON DB structure
const loadJsonDb = () => {
  let dbObj = {
    users: [],
    staff: [],
    classes: [],
    students: [],
    timetables: [],
    attendance_events: [],
    daily_summaries: [],
    period_attendance: [],
    assessments: [],
    assessment_grades: [],
    class_feeds: [],
    books: [],
    library_loans: [],
    fee_status: [],
    config: [],
    audit_log: [],
    // New College Tables
    departments: [],
    courses: [],
    events: [],
    placements: [],
    login: [],
    // New AI Mentor (CampusCore) Tables
    c360_users: [],
    c360_quiz_scores: [],
    c360_resume_skills: [],
    c360_skill_gap: [],
    c360_performance_scores: [],
    c360_roadmap: [],
    c360_progress: [],
    c360_admin_logs: [],
    c360_jobs: [],
    c360_job_applications: []
  };
  if (fs.existsSync(FILE_PATH)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(FILE_PATH, 'utf8'));
      dbObj = { ...dbObj, ...parsed };
    } catch (e) {
      console.error('Failed to parse JSON DB, starting fresh:', e.message);
    }
  }
  return dbObj;
};

const saveJsonDb = (data) => {
  fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
};

let useJsonFallback = false;
let pool = null;

try {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 2000 // fail fast if not running
  });
} catch (e) {
  console.warn('PostgreSQL configuration failed. Using JSON Database fallback.');
  useJsonFallback = true;
}

// Simplified SQL Query Interpreter for Fallback
const executeFallbackQuery = (text, params = []) => {
  const db = loadJsonDb();
  const sql = text
    .replace(/--.*$/gm, '') // strip single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, '') // strip multi-line comments
    .replace(/\s+/g, ' ')
    .trim();

  // Helper for generating UUID
  const uuid = () => crypto.randomUUID();

  // ================= GENERAL REGEX PARSER FOR NEW TABLES =================
  const newTables = [
    'departments', 'courses', 'events', 'placements', 'login',
    'c360_users', 'c360_quiz_scores', 'c360_resume_skills', 'c360_skill_gap', 
    'c360_performance_scores', 'c360_roadmap', 'c360_progress', 'c360_admin_logs'
  ];

  const targetsNewTable = newTables.some(t => sql.toLowerCase().includes(t));
  if (targetsNewTable) {
    // 1. SELECT * FROM table WHERE col = $1 [AND col2 = $2]
    const selectWhereMatch = sql.match(/^SELECT\s+\*\s+FROM\s+(\w+)\s+WHERE\s+(\w+)\s*=\s*\$1(?:\s+AND\s+(\w+)\s*=\s*\$2)?(?:\s+ORDER\s+BY\s+\w+\s+DESC)?(?:\s+LIMIT\s+\d+)?$/i);
    if (selectWhereMatch) {
      const table = selectWhereMatch[1].toLowerCase();
      const col1 = selectWhereMatch[2].toLowerCase();
      const col2 = selectWhereMatch[3] ? selectWhereMatch[3].toLowerCase() : null;
      if (db[table]) {
        let rows = db[table].filter(row => {
          const match1 = String(row[col1]) === String(params[0]);
          const match2 = col2 ? String(row[col2]) === String(params[1]) : true;
          return match1 && match2;
        });
        if (sql.includes('ORDER BY')) {
          rows.sort((a, b) => new Date(b.created_at || b.uploaded_at || b.event_date || 0) - new Date(a.created_at || a.uploaded_at || a.event_date || 0));
        }
        if (sql.includes('LIMIT 1')) {
          rows = rows.slice(0, 1);
        }
        return { rows };
      }
    }

    // 2. SELECT * FROM table
    const selectAllMatch = sql.match(/^SELECT\s+\*\s+FROM\s+(\w+)(?:\s+ORDER\s+BY\s+\w+\s+DESC)?(?:\s+LIMIT\s+(\d+))?$/i);
    if (selectAllMatch) {
      const table = selectAllMatch[1].toLowerCase();
      if (db[table]) {
        let rows = [...db[table]];
        if (sql.includes('ORDER BY')) {
          rows.sort((a, b) => new Date(b.created_at || b.uploaded_at || b.event_date || 0) - new Date(a.created_at || a.uploaded_at || a.event_date || 0));
        }
        if (selectAllMatch[2]) {
          const limit = parseInt(selectAllMatch[2], 10);
          rows = rows.slice(0, limit);
        }
        return { rows };
      }
    }

    // 3. INSERT INTO table (cols) VALUES ($1...) with optional ON CONFLICT
    if (sql.startsWith('INSERT INTO')) {
      const insertMatch = sql.match(/^INSERT\s+INTO\s+(\w+)\s*\((.*?)\)\s*VALUES\s*\((.*?)\)(?:\s+ON\s+CONFLICT\s*.*)?$/i);
      if (insertMatch) {
        const table = insertMatch[1].toLowerCase();
        const cols = insertMatch[2].split(',').map(c => c.trim().toLowerCase());
        if (db[table]) {
          const isUpsert = sql.includes('ON CONFLICT');
          let existingIndex = -1;
          if (isUpsert) {
            const studentIdIdx = cols.indexOf('student_id');
            const targetCareerIdx = cols.indexOf('target_career');
            if (studentIdIdx !== -1) {
              existingIndex = db[table].findIndex(row => {
                const matchStudent = String(row.student_id) === String(params[studentIdIdx]);
                const matchCareer = targetCareerIdx !== -1 ? String(row.target_career) === String(params[targetCareerIdx]) : true;
                return matchStudent && matchCareer;
              });
            }
          }
          const newRow = existingIndex !== -1 ? { ...db[table][existingIndex] } : { id: uuid(), created_at: new Date().toISOString() };
          cols.forEach((col, idx) => {
            let val = params[idx];
            if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
              try { val = JSON.parse(val); } catch(e) {}
            }
            newRow[col] = val;
          });
          if (existingIndex !== -1) {
            newRow.updated_at = new Date().toISOString();
            db[table][existingIndex] = newRow;
          } else {
            db[table].push(newRow);
          }
          saveJsonDb(db);
          return { rows: [newRow] };
        }
      }
    }
  }
  // 1. DROP / CREATE TABLES (Initializers)
  if (sql.startsWith('DROP TABLE') || sql.startsWith('CREATE TABLE') || sql.startsWith('CREATE EXTENSION')) {
    if (sql.includes('DROP TABLE')) {
      // Clear specific tables or create fresh DB structure
      saveJsonDb({
        users: [], staff: [], classes: [], students: [], timetables: [],
        attendance_events: [], daily_summaries: [], period_attendance: [],
        assessments: [], assessment_grades: [], class_feeds: [],
        books: [], library_loans: [], fee_status: [], config: [], audit_log: []
      });
    }
    return { rows: [] };
  }

  // 2. INSERT INTO config
  if (sql.startsWith('INSERT INTO config')) {
    const configRow = {
      id: db.config.length + 1,
      late_cutoff_time: params[0] || '09:15:00',
      absenteeism_threshold: params[1] || 75.00,
      parent_notification_time: params[2] || '09:30:00',
      resend_api_key: params[3] || null,
      email_from_address: params[4] || 'noreply@campuscore.edu',
      google_sheet_url: params[5] || null
    };
    db.config.push(configRow);
    saveJsonDb(db);
    return { rows: [configRow] };
  }

  // 3. UPDATE config
  if (sql.startsWith('UPDATE config')) {
    if (db.config.length === 0) {
      db.config.push({});
    }
    const idx = db.config.length - 1;
    db.config[idx] = {
      ...db.config[idx],
      late_cutoff_time: params[0] !== undefined ? params[0] : db.config[idx].late_cutoff_time,
      absenteeism_threshold: params[1] !== undefined ? params[1] : db.config[idx].absenteeism_threshold,
      parent_notification_time: params[2] !== undefined ? params[2] : db.config[idx].parent_notification_time,
      resend_api_key: params[3],
      email_from_address: params[4],
      google_sheet_url: params[5]
    };
    saveJsonDb(db);
    return { rows: [db.config[idx]] };
  }

  // 4. INSERT INTO audit_log
  if (sql.startsWith('INSERT INTO audit_log')) {
    const log = {
      id: db.audit_log.length + 1,
      action_type: params[0],
      payload: typeof params[1] === 'string' ? JSON.parse(params[1]) : params[1],
      previous_hash: params[2],
      row_hash: params[3],
      created_at: new Date().toISOString()
    };
    db.audit_log.push(log);
    saveJsonDb(db);
    return { rows: [log] };
  }

  // 5. INSERT INTO users
  if (sql.startsWith('INSERT INTO users')) {
    const matchValues = sql.match(/VALUES\s*\((.*?)\)/i);
    let username = '';
    let passwordHash = '';
    let role = 'student';

    if (matchValues) {
      const parts = matchValues[1].split(',').map(p => p.trim());
      
      // If it uses parameter placeholders: VALUES ($1, $2, $3)
      if (parts[0] === '$1') {
        username = params[0];
        passwordHash = params[1];
        role = params[2];
      } else {
        username = parts[0].replace(/'/g, "");
        if (parts[1] === '$1') {
          passwordHash = params[0];
        } else {
          passwordHash = parts[1].replace(/'/g, "");
        }
        if (parts[2]) {
          role = parts[2].replace(/'/g, "");
        }
      }
    }

    const user = {
      id: uuid(),
      username,
      password_hash: passwordHash,
      role,
      created_at: new Date().toISOString()
    };
    db.users.push(user);
    saveJsonDb(db);
    return { rows: [user] };
  }

  // 6. INSERT INTO staff
  if (sql.startsWith('INSERT INTO staff')) {
    if (params.length === 6) {
      // Dynamic single staff insert
      const staffRow = {
        id: params[0],
        first_name: params[1],
        last_name: params[2],
        email: params[3],
        phone: params[4],
        department: params[5],
        created_at: new Date().toISOString()
      };
      db.staff.push(staffRow);
      saveJsonDb(db);
      return { rows: [staffRow] };
    } else {
      // Seed script insert
      const items = [
        { id: params[0], first_name: 'Yathish Aradhya', last_name: 'B C', email: 'yathish.aradhya@kit.edu', phone: '9876543210', department: 'Computer Science & Engineering', created_at: new Date().toISOString() },
        { id: params[1], first_name: 'Suman', last_name: 'K R', email: 'suman.kr@kit.edu', phone: '9876543211', department: 'Computer Science & Engineering', created_at: new Date().toISOString() },
        { id: params[2], first_name: 'Anila', last_name: 'Kumara', email: 'anila.kumara@kit.edu', phone: '9876543212', department: 'Library Science', created_at: new Date().toISOString() }
      ];
      db.staff.push(...items);
      saveJsonDb(db);
      return { rows: items };
    }
  }

  // 7. INSERT INTO classes
  if (sql.startsWith('INSERT INTO classes')) {
    const classRow = {
      id: uuid(),
      name: params[0],
      department: params[1],
      faculty_id: params[2]
    };
    db.classes.push(classRow);
    saveJsonDb(db);
    return { rows: [classRow] };
  }

  // 8. INSERT INTO students
  if (sql.startsWith('INSERT INTO students')) {
    const student = {
      id: params[0],
      rfid_uid: params[1],
      first_name: params[2],
      last_name: params[3],
      email: params[4],
      phone: params[5],
      parent_name: params[6],
      parent_email: params[7],
      parent_phone: params[8],
      parent_user_id: params[9],
      class_id: params[10],
      enrollment_status: params[11] || 'active',
      created_at: new Date().toISOString()
    };
    db.students.push(student);
    saveJsonDb(db);
    return { rows: [student] };
  }

  // 9. INSERT INTO timetables
  if (sql.startsWith('INSERT INTO timetables')) {
    const slot = {
      id: uuid(),
      class_id: params[0],
      faculty_id: params[1],
      subject: params[2],
      day_of_week: params[3],
      start_time: params[4],
      end_time: params[5],
      room: params[6]
    };
    db.timetables.push(slot);
    saveJsonDb(db);
    return { rows: [slot] };
  }

  // 10. INSERT INTO books
  if (sql.startsWith('INSERT INTO books')) {
    const book = {
      id: uuid(),
      rfid_uid: params[0],
      title: params[1],
      author: params[2],
      isbn: params[3],
      status: 'available'
    };
    db.books.push(book);
    saveJsonDb(db);
    return { rows: [book] };
  }

  // 11. INSERT INTO class_feeds
  if (sql.startsWith('INSERT INTO class_feeds')) {
    const feed = {
      id: uuid(),
      class_id: params[0],
      title: params[1],
      content: params[2],
      posted_by: params[3],
      created_at: new Date().toISOString()
    };
    db.class_feeds.push(feed);
    saveJsonDb(db);
    return { rows: [feed] };
  }

  // 12. INSERT INTO fee_status
  if (sql.startsWith('INSERT INTO fee_status')) {
    const fee = {
      id: uuid(),
      student_id: params[0],
      term: params[1],
      amount_due: params[2],
      amount_paid: params[3],
      status: params[4] || 'unpaid',
      due_date: params[5]
    };
    db.fee_status.push(fee);
    saveJsonDb(db);
    return { rows: [fee] };
  }

  // 13. SELECT FROM users
  if (sql.includes('FROM users WHERE username =')) {
    const username = params[0];
    const match = db.users.find(u => u.username === username);
    return { rows: match ? [match] : [] };
  }
  if (sql.includes('FROM users WHERE id =')) {
    const match = db.users.find(u => u.id === params[0]);
    return { rows: match ? [match] : [] };
  }

  // 14. SELECT FROM config
  if (sql.includes('FROM config')) {
    const config = db.config[db.config.length - 1] || {
      late_cutoff_time: '09:15:00',
      absenteeism_threshold: 75.00,
      parent_notification_time: '09:30:00'
    };
    return { rows: [config] };
  }

  // 15. SELECT FROM audit_log
  if (sql.includes('FROM audit_log ORDER BY id DESC LIMIT 1')) {
    const sorted = [...db.audit_log].sort((a, b) => b.id - a.id);
    return { rows: sorted.length > 0 ? [sorted[0]] : [] };
  }
  if (sql.includes('FROM audit_log')) {
    const sorted = [...db.audit_log].sort((a, b) => b.id - a.id);
    return { rows: sorted };
  }

  // 16. SELECT FROM students
  if (sql.includes('FROM students WHERE rfid_uid =')) {
    const match = db.students.find(s => s.rfid_uid === params[0]);
    return { rows: match ? [match] : [] };
  }
  if (sql.includes('FROM students WHERE parent_user_id =')) {
    const matches = db.students.filter(s => s.parent_user_id === params[0]);
    return { rows: matches };
  }
  if (sql.includes('FROM students s JOIN users u')) {
    const s = db.students.find(std => std.id === params[0]);
    if (s) {
      const u = db.users.find(usr => usr.id === s.id) || {};
      return { rows: [{ ...s, role: u.role }] };
    }
    return { rows: [] };
  }
  if (sql.includes('FROM students WHERE id =')) {
    const match = db.students.find(s => s.id === params[0]);
    return { rows: match ? [match] : [] };
  }
  if (sql.includes('FROM students s LEFT JOIN classes c')) {
    const list = db.students.map(s => {
      const cls = db.classes.find(c => c.id === s.class_id);
      return { ...s, class_name: cls ? cls.name : null };
    });
    if (sql.includes('WHERE s.id =')) {
      const match = list.find(s => s.id === params[0]);
      return { rows: match ? [match] : [] };
    }
    if (sql.includes('WHERE s.parent_user_id =')) {
      const matches = list.filter(s => s.parent_user_id === params[0]);
      return { rows: matches };
    }
    return { rows: list };
  }

  // 17. SELECT FROM staff
  if (sql.includes('FROM staff WHERE id =')) {
    const match = db.staff.find(s => s.id === params[0]);
    return { rows: match ? [match] : [] };
  }

  // 18. SELECT FROM classes
  if (sql.includes('FROM classes WHERE faculty_id =')) {
    const matches = db.classes.filter(c => c.faculty_id === params[0]);
    return { rows: matches };
  }

  // 19. SELECT FROM timetables
  if (sql.includes('FROM timetables WHERE class_id =') && sql.includes('day_of_week =')) {
    const matches = db.timetables.filter(t => t.class_id === params[0] && t.day_of_week === params[1]);
    return { rows: matches };
  }
  if (sql.includes('FROM timetables t JOIN staff st')) {
    const matches = db.timetables
      .filter(t => t.class_id === params[0])
      .map(t => {
        const teacher = db.staff.find(s => s.id === t.faculty_id) || { first_name: 'Faculty', last_name: 'Member' };
        return { ...t, instructor: `${teacher.first_name} ${teacher.last_name}` };
      });
    return { rows: matches };
  }
  if (sql.includes('FROM timetables t JOIN classes c')) {
    const matches = db.timetables
      .filter(t => t.faculty_id === params[0])
      .map(t => {
        const cls = db.classes.find(c => c.id === t.class_id);
        return { ...t, class_name: cls ? cls.name : 'Unknown Class' };
      });
    return { rows: matches };
  }

  // 20. SELECT FROM books
  if (sql.includes('FROM books WHERE rfid_uid =')) {
    const match = db.books.find(b => b.rfid_uid === params[0]);
    return { rows: match ? [match] : [] };
  }
  if (sql.includes('FROM books')) {
    return { rows: db.books };
  }

  // 21. SELECT FROM class_feeds
  if (sql.includes('FROM class_feeds cf JOIN users u')) {
    let matches = db.class_feeds;
    if (params.length > 0) {
      matches = db.class_feeds.filter(cf => cf.class_id === null || cf.class_id === params[0]);
    } else {
      matches = db.class_feeds.filter(cf => cf.class_id === null);
    }
    const populated = matches.map(cf => {
      const poster = db.users.find(u => u.id === cf.posted_by) || { username: 'System', role: 'admin' };
      return {
        ...cf,
        poster_name: poster.username,
        poster_role: poster.role
      };
    });
    return { rows: populated };
  }

  // 22. SELECT FROM library_loans
  if (sql.includes('FROM library_loans WHERE book_id =') && sql.includes('return_date IS NULL')) {
    const active = db.library_loans.filter(l => l.book_id === params[0] && l.return_date === null);
    return { rows: active };
  }
  if (sql.includes('FROM library_loans ll JOIN books b')) {
    if (sql.includes('WHERE ll.student_id =')) {
      const studentId = params[0];
      const matches = db.library_loans
        .filter(l => l.student_id === studentId)
        .map(l => {
          const book = db.books.find(b => b.id === l.book_id) || {};
          return { ...l, title: book.title, author: book.author, isbn: book.isbn };
        });
      return { rows: matches };
    }
    // Full loans history
    const allLoans = db.library_loans.map(l => {
      const book = db.books.find(b => b.id === l.book_id) || {};
      const student = db.students.find(s => s.id === l.student_id) || {};
      return {
        ...l,
        title: book.title,
        author: book.author,
        first_name: student.first_name,
        last_name: student.last_name,
        email: student.email
      };
    });
    return { rows: allLoans };
  }

  // 23. SELECT FROM attendance_events
  if (sql.includes('FROM attendance_events WHERE student_id =') && sql.includes('ORDER BY timestamp DESC LIMIT 1')) {
    const matches = db.attendance_events.filter(e => e.student_id === params[0]);
    const sorted = [...matches].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return { rows: sorted.length > 0 ? [sorted[0]] : [] };
  }
  if (sql.includes('FROM attendance_events WHERE student_id =') && sql.includes('timestamp >=') && sql.includes('timestamp <=')) {
    const studentId = params[0];
    const tMin = new Date(params[1]);
    const tMax = new Date(params[2]);
    const matches = db.attendance_events.filter(e => {
      const et = new Date(e.timestamp);
      return e.student_id === studentId && et >= tMin && et <= tMax;
    });
    
    if (sql.includes('LIMIT 1')) {
      const descSorted = [...matches].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      return { rows: descSorted.length > 0 ? [descSorted[0]] : [] };
    }
    
    const ascSorted = [...matches].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    return { rows: ascSorted };
  }
  if (sql.includes('FROM attendance_events ae JOIN students s')) {
    const list = db.attendance_events.map(e => {
      const s = db.students.find(std => std.id === e.student_id) || {};
      const c = db.classes.find(cls => cls.id === s.class_id) || {};
      return {
        ...e,
        first_name: s.first_name,
        last_name: s.last_name,
        class_name: c.name
      };
    });
    const sorted = [...list].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return { rows: sorted.slice(0, 10) };
  }
  if (sql.includes('FROM attendance_events WHERE student_id =')) {
    const matches = db.attendance_events.filter(e => e.student_id === params[0]);
    const sorted = [...matches].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return { rows: sorted };
  }

  // 24. SELECT FROM daily_summaries
  if (sql.includes('FROM daily_summaries WHERE student_id =')) {
    const matches = db.daily_summaries.filter(d => d.student_id === params[0]);
    const sorted = [...matches].sort((a, b) => new Date(b.date) - new Date(a.date));
    return { rows: sorted };
  }
  if (sql.includes('FROM daily_summaries WHERE date =') && sql.includes('present = TRUE')) {
    const matches = db.daily_summaries.filter(d => d.date === params[0] && d.present === true);
    return { rows: matches };
  }

  // 25. SELECT FROM period_attendance
  if (sql.includes('FROM period_attendance pa JOIN timetables t')) {
    const matches = db.period_attendance
      .filter(pa => pa.student_id === params[0])
      .map(pa => {
        const timetable = db.timetables.find(t => t.id === pa.timetable_id) || {};
        return {
          ...pa,
          subject: timetable.subject,
          start_time: timetable.start_time,
          end_time: timetable.end_time
        };
      });
    return { rows: matches };
  }

  // 26. SELECT FROM assessments
  if (sql.includes('FROM assessments WHERE class_id =')) {
    const matches = db.assessments.filter(a => a.class_id === params[0]);
    return { rows: matches };
  }
  if (sql.includes('FROM assessments WHERE id =')) {
    const match = db.assessments.find(a => a.id === params[0]);
    return { rows: match ? [match] : [] };
  }

  // 27. SELECT FROM assessment_grades
  if (sql.includes('FROM assessment_grades ag JOIN students s')) {
    const matches = db.assessment_grades
      .filter(ag => ag.assessment_id === params[0])
      .map(ag => {
        const student = db.students.find(s => s.id === ag.student_id) || {};
        return {
          ...ag,
          first_name: student.first_name,
          last_name: student.last_name,
          email: student.email
        };
      });
    return { rows: matches };
  }
  if (sql.includes('FROM assessment_grades ag JOIN assessments a')) {
    const matches = db.assessment_grades
      .filter(ag => ag.student_id === params[0])
      .map(ag => {
        const assess = db.assessments.find(a => a.id === ag.assessment_id) || {};
        const grader = db.staff.find(st => st.id === ag.graded_by) || { first_name: 'Faculty', last_name: 'Grader' };
        return {
          ...ag,
          title: assess.title,
          max_marks: assess.max_marks,
          created_at: assess.created_at,
          grader: `${grader.first_name} ${grader.last_name}`
        };
      });
    return { rows: matches };
  }

  // 28. INSERT/UPDATE attendance_events
  if (sql.startsWith('INSERT INTO attendance_events')) {
    const event = {
      id: uuid(),
      student_id: params[0],
      type: params[1],
      timestamp: params[2],
      device_id: params[3],
      created_at: new Date().toISOString()
    };
    db.attendance_events.push(event);
    saveJsonDb(db);
    return { rows: [event] };
  }

  // 29. INSERT daily_summaries (UPSERT)
  if (sql.startsWith('INSERT INTO daily_summaries')) {
    // Determine if it is present/late_flag or present/total_duration
    const studentId = params[0];
    const date = params[1];
    let row = db.daily_summaries.find(ds => ds.student_id === studentId && ds.date === date);

    if (!row) {
      row = {
        id: uuid(),
        student_id: studentId,
        date: date,
        present: params[2] !== undefined ? params[2] : true,
        total_duration_on_campus: 0,
        late_flag: false,
        created_at: new Date().toISOString()
      };
      db.daily_summaries.push(row);
    }

    if (sql.includes('late_flag = EXCLUDED.late_flag') || sql.includes('late_flag = ?')) {
      row.late_flag = params[2];
    } else if (sql.includes('total_duration_on_campus = daily_summaries.total_duration_on_campus + EXCLUDED.total_duration_on_campus')) {
      row.total_duration_on_campus += params[2];
    }

    saveJsonDb(db);
    return { rows: [row] };
  }

  // 30. INSERT period_attendance
  if (sql.startsWith('INSERT INTO period_attendance')) {
    const studentId = params[0];
    const ttId = params[1];
    const date = params[2];
    const status = params[3];
    
    let row = db.period_attendance.find(pa => pa.student_id === studentId && pa.timetable_id === ttId && pa.date === date);
    if (!row) {
      row = {
        id: uuid(),
        student_id: studentId,
        timetable_id: ttId,
        date: date,
        status: status,
        marked_by: params[4] || 'system',
        created_at: new Date().toISOString()
      };
      db.period_attendance.push(row);
    } else {
      row.status = status;
    }
    saveJsonDb(db);
    return { rows: [row] };
  }

  // 31. UPDATE books status
  if (sql.startsWith('UPDATE books SET status =')) {
    const status = sql.includes("'issued'") ? 'issued' : 'available';
    const bookId = params[0];
    const book = db.books.find(b => b.id === bookId);
    if (book) {
      book.status = status;
    }
    saveJsonDb(db);
    return { rows: [] };
  }

  // 32. INSERT library_loans
  if (sql.startsWith('INSERT INTO library_loans')) {
    const loan = {
      id: uuid(),
      book_id: params[0],
      student_id: params[1],
      issue_date: params[2].toISOString(),
      due_date: params[3].toISOString(),
      return_date: null,
      fine_amount: 0.00
    };
    db.library_loans.push(loan);
    saveJsonDb(db);
    return { rows: [loan] };
  }

  // 33. UPDATE library_loans (return)
  if (sql.startsWith('UPDATE library_loans SET return_date =')) {
    const returnDate = params[0];
    const fine = parseFloat(params[1]);
    const loanId = params[2];
    const loan = db.library_loans.find(l => l.id === loanId);
    if (loan) {
      loan.return_date = returnDate.toISOString();
      loan.fine_amount = fine;
    }
    saveJsonDb(db);
    return { rows: [] };
  }

  // 34. INSERT assessment_grades
  if (sql.startsWith('INSERT INTO assessment_grades')) {
    const assessId = params[0];
    const studentId = params[1];
    const marks = parseFloat(params[2]);
    const graderId = params[3];

    let row = db.assessment_grades.find(g => g.assessment_id === assessId && g.student_id === studentId);
    if (!row) {
      row = {
        id: uuid(),
        assessment_id: assessId,
        student_id: studentId,
        marks_obtained: marks,
        graded_by: graderId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      db.assessment_grades.push(row);
    } else {
      row.marks_obtained = marks;
      row.updated_at = new Date().toISOString();
    }
    saveJsonDb(db);
    return { rows: [row] };
  }

  // 35. UPDATE assessments lock
  if (sql.startsWith('UPDATE assessments SET locked_at =')) {
    const assessId = params[0];
    const assess = db.assessments.find(a => a.id === assessId);
    if (assess) {
      assess.locked_at = new Date().toISOString();
    }
    saveJsonDb(db);
    return { rows: [assess] };
  }

  // 36. DELETE class_feeds
  if (sql.startsWith('DELETE FROM class_feeds')) {
    const postIdx = db.class_feeds.findIndex(cf => cf.id === params[0]);
    if (postIdx !== -1) {
      db.class_feeds.splice(postIdx, 1);
      saveJsonDb(db);
    }
    return { rows: [] };
  }

  // 37. UPDATE students SET parent_user_id
  if (sql.startsWith('UPDATE students SET parent_user_id =')) {
    const parentId = params[0];
    const studentId = params[1];
    const student = db.students.find(s => s.id === studentId);
    if (student) {
      student.parent_user_id = parentId;
    }
    saveJsonDb(db);
    return { rows: [] };
  }

  // 38. UPDATE users SET role
  if (sql.startsWith('UPDATE users SET role =')) {
    const roleVal = params[0];
    const userId = params[1];
    const user = db.users.find(u => u.id === userId);
    if (user) {
      user.role = roleVal;
    }
    saveJsonDb(db);
    return { rows: [] };
  }

  // 39. SELECT * FROM c360_jobs
  if (sql.startsWith('SELECT * FROM c360_jobs')) {
    return { rows: db.c360_jobs || [] };
  }

  // 40. INSERT INTO c360_jobs
  if (sql.startsWith('INSERT INTO c360_jobs')) {
    const newJob = {
      id: params[0] || uuid(),
      company_name: params[1],
      role: params[2],
      description: params[3],
      package_lpa: parseFloat(params[4]),
      skills_required: typeof params[5] === 'string' ? JSON.parse(params[5]) : params[5],
      location: params[6] || 'Remote',
      created_at: new Date().toISOString()
    };
    db.c360_jobs = db.c360_jobs || [];
    db.c360_jobs.push(newJob);
    saveJsonDb(db);
    return { rows: [newJob] };
  }

  // 41. DELETE FROM c360_jobs WHERE id = $1
  if (sql.startsWith('DELETE FROM c360_jobs WHERE id =')) {
    const jobId = params[0];
    db.c360_jobs = (db.c360_jobs || []).filter(j => j.id !== jobId);
    db.c360_job_applications = (db.c360_job_applications || []).filter(a => a.job_id !== jobId);
    saveJsonDb(db);
    return { rows: [] };
  }

  // 42. INSERT INTO c360_job_applications
  if (sql.startsWith('INSERT INTO c360_job_applications')) {
    const newApp = {
      id: params[0] || uuid(),
      job_id: params[1],
      student_id: params[2],
      status: params[3] || 'applied',
      created_at: new Date().toISOString()
    };
    db.c360_job_applications = db.c360_job_applications || [];
    db.c360_job_applications.push(newApp);
    saveJsonDb(db);
    return { rows: [newApp] };
  }

  // 43. SELECT * FROM c360_job_applications WHERE student_id = $1
  if (sql.startsWith('SELECT * FROM c360_job_applications WHERE student_id =')) {
    const studentId = params[0];
    const apps = (db.c360_job_applications || []).filter(a => a.student_id === studentId);
    const rows = apps.map(a => {
      const job = (db.c360_jobs || []).find(j => j.id === a.job_id);
      return {
        ...a,
        company_name: job ? job.company_name : '',
        role: job ? job.role : '',
        package_lpa: job ? job.package_lpa : 0,
        skills_required: job ? job.skills_required : [],
        location: job ? job.location : ''
      };
    });
    return { rows };
  }

  // 44. SELECT a.*, j.company_name, j.role... FROM c360_job_applications a JOIN c360_jobs j ON a.job_id = j.id
  if (sql.includes('FROM c360_job_applications a') && sql.includes('JOIN c360_jobs j')) {
    const rows = (db.c360_job_applications || []).map(a => {
      const job = (db.c360_jobs || []).find(j => j.id === a.job_id);
      const student = (db.students || []).find(s => s.id === a.student_id);
      return {
        ...a,
        company_name: job ? job.company_name : '',
        role: job ? job.role : '',
        package_lpa: job ? job.package_lpa : 0,
        skills_required: job ? job.skills_required : [],
        location: job ? job.location : '',
        first_name: student ? student.first_name : 'Student',
        last_name: student ? student.last_name : 'User'
      };
    });
    return { rows };
  }

  return { rows: [] };
};

// Fallback Mock Client interface simulating standard transaction pools
const mockClient = {
  query: async (text, params) => executeFallbackQuery(text, params),
  release: () => {}
};

const queryMockPool = async (text, params) => {
  return executeFallbackQuery(text, params);
};

// Initialize Supabase Client if configured
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
  try {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    console.log('Successfully connected to Supabase REST client.');
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err.message);
  }
}

// SQL-to-Supabase translation handler
const executeSupabaseQuery = async (text, params = []) => {
  const sql = text
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .trim();

  try {
    // 1. SELECT * FROM users WHERE username = $1
    if (sql.startsWith('SELECT * FROM users WHERE username =')) {
      const { data, error } = await supabase.from('users').select('*').eq('username', params[0]);
      if (error) throw error;
      return { rows: data || [] };
    }

    // 2. SELECT s.*, c.name as class_name FROM students s LEFT JOIN classes c ON s.class_id = c.id WHERE s.id = $1
    if (sql.includes('FROM students s') && sql.includes('s.id = $1')) {
      const { data, error } = await supabase.from('students').select('*').eq('id', params[0]);
      if (error) throw error;
      if (data && data.length > 0 && data[0].class_id) {
        const classRes = await supabase.from('classes').select('name').eq('id', data[0].class_id);
        data[0].class_name = classRes.data && classRes.data.length > 0 ? classRes.data[0].name : null;
      }
      return { rows: data || [] };
    }

    // 3. SELECT * FROM staff WHERE id = $1
    if (sql.startsWith('SELECT * FROM staff WHERE id =')) {
      const { data, error } = await supabase.from('staff').select('*').eq('id', params[0]);
      if (error) throw error;
      return { rows: data || [] };
    }

    // 4. SELECT s.*, c.name as class_name FROM students s ... WHERE s.parent_user_id = $1
    if (sql.includes('FROM students s') && sql.includes('parent_user_id = $1')) {
      const { data, error } = await supabase.from('students').select('*').eq('parent_user_id', params[0]);
      if (error) throw error;
      for (const row of (data || [])) {
        if (row.class_id) {
          const classRes = await supabase.from('classes').select('name').eq('id', row.class_id);
          row.class_name = classRes.data && classRes.data.length > 0 ? classRes.data[0].name : null;
        }
      }
      return { rows: data || [] };
    }

    // 5. SELECT id, username, role FROM users WHERE id = $1
    if (sql.startsWith('SELECT id, username, role FROM users WHERE id =')) {
      const { data, error } = await supabase.from('users').select('id, username, role').eq('id', params[0]);
      if (error) throw error;
      return { rows: data || [] };
    }

    // 6. SELECT * FROM departments
    if (sql.startsWith('SELECT * FROM departments')) {
      const { data, error } = await supabase.from('departments').select('*').order('code', { ascending: true });
      if (error) throw error;
      return { rows: data || [] };
    }

    // 7. SELECT * FROM courses
    if (sql.startsWith('SELECT * FROM courses')) {
      const { data, error } = await supabase.from('courses').select('*');
      if (error) throw error;
      return { rows: data || [] };
    }

    // 8. SELECT * FROM events
    if (sql.startsWith('SELECT * FROM events')) {
      const { data, error } = await supabase.from('events').select('*').order('event_date', { ascending: true });
      if (error) throw error;
      return { rows: data || [] };
    }

    // 9. SELECT * FROM placements
    if (sql.startsWith('SELECT * FROM placements')) {
      const { data, error } = await supabase.from('placements').select('*').order('placed_year', { ascending: false });
      if (error) throw error;
      return { rows: data || [] };
    }

    // 10. SELECT * FROM staff
    if (sql.includes('FROM staff') && sql.startsWith('SELECT')) {
      const { data, error } = await supabase.from('staff').select('*');
      if (error) throw error;
      return { rows: data || [] };
    }

    // ================== AI MENTOR TABLES (c360_*) ==================

    // 11. c360_users upsert or select
    if (sql.includes('INSERT INTO c360_users')) {
      const row = { student_id: params[0], target_career: params[1], preferred_level: params[2], updated_at: new Date().toISOString() };
      const { data, error } = await supabase.from('c360_users').upsert(row, { onConflict: 'student_id' });
      if (error) throw error;
      return { rows: [row] };
    }
    if (sql.includes('FROM c360_users WHERE student_id =')) {
      const { data, error } = await supabase.from('c360_users').select('*').eq('student_id', params[0]).order('updated_at', { ascending: false }).limit(1);
      if (error) throw error;
      return { rows: data || [] };
    }

    // 12. c360_quiz_scores select or insert
    if (sql.includes('INSERT INTO c360_quiz_scores')) {
      const row = { student_id: params[0], score: params[1], target_career: params[2], answers_json: typeof params[3] === 'string' ? JSON.parse(params[3]) : params[3], created_at: new Date().toISOString() };
      const { data, error } = await supabase.from('c360_quiz_scores').insert(row);
      if (error) throw error;
      return { rows: [row] };
    }
    if (sql.includes('FROM c360_quiz_scores WHERE student_id =')) {
      const { data, error } = await supabase.from('c360_quiz_scores').select('*').eq('student_id', params[0]).order('created_at', { ascending: false }).limit(1);
      if (error) throw error;
      return { rows: data || [] };
    }

    // 13. c360_resume_skills select or insert
    if (sql.includes('INSERT INTO c360_resume_skills')) {
      const row = { student_id: params[0], skills_json: typeof params[1] === 'string' ? JSON.parse(params[1]) : params[1], score: params[2], file_name: params[3], uploaded_at: new Date().toISOString() };
      const { data, error } = await supabase.from('c360_resume_skills').insert(row);
      if (error) throw error;
      return { rows: [row] };
    }
    if (sql.includes('FROM c360_resume_skills WHERE student_id =')) {
      const { data, error } = await supabase.from('c360_resume_skills').select('*').eq('student_id', params[0]).order('uploaded_at', { ascending: false }).limit(1);
      if (error) throw error;
      return { rows: data || [] };
    }

    // 14. c360_skill_gap select or insert
    if (sql.includes('INSERT INTO c360_skill_gap')) {
      const row = { student_id: params[0], target_career: params[1], missing_skills_json: typeof params[2] === 'string' ? JSON.parse(params[2]) : params[2], gap_score: params[3], created_at: new Date().toISOString() };
      const { data, error } = await supabase.from('c360_skill_gap').insert(row);
      if (error) throw error;
      return { rows: [row] };
    }
    if (sql.includes('FROM c360_skill_gap WHERE student_id =')) {
      const { data, error } = await supabase.from('c360_skill_gap').select('*').eq('student_id', params[0]).order('created_at', { ascending: false }).limit(1);
      if (error) throw error;
      return { rows: data || [] };
    }

    // 15. c360_performance_scores select or upsert
    if (sql.includes('INSERT INTO c360_performance_scores')) {
      const row = { student_id: params[0], quiz_score: params[1], resume_score: params[2], skill_gap_score: params[3], classification: params[4], created_at: new Date().toISOString() };
      const { data, error } = await supabase.from('c360_performance_scores').upsert(row, { onConflict: 'student_id' });
      if (error) throw error;
      return { rows: [row] };
    }
    if (sql.includes('FROM c360_performance_scores WHERE student_id =')) {
      const { data, error } = await supabase.from('c360_performance_scores').select('*').eq('student_id', params[0]);
      if (error) throw error;
      return { rows: data || [] };
    }
    if (sql.includes('FROM c360_performance_scores') && sql.includes('AVG(')) {
      const { data: listData, error: errList } = await supabase.from('c360_performance_scores').select('*');
      if (errList) throw errList;
      const count = listData.length;
      if (count === 0) {
        return { rows: [{ total_participants: 0, beginner_count: 0, intermediate_count: 0, advanced_count: 0, avg_quiz: 0, avg_resume: 0, avg_gap: 0, avg_total: 0 }] };
      }
      const sumQuiz = listData.reduce((acc, r) => acc + r.quiz_score, 0);
      const sumResume = listData.reduce((acc, r) => acc + r.resume_score, 0);
      const sumGap = listData.reduce((acc, r) => acc + r.skill_gap_score, 0);
      const sumTotal = listData.reduce((acc, r) => acc + (r.quiz_score + r.resume_score + r.skill_gap_score), 0);
      const beginner = listData.filter(r => r.classification === 'Beginner').length;
      const intermediate = listData.filter(r => r.classification === 'Intermediate').length;
      const advanced = listData.filter(r => r.classification === 'Advanced').length;
      
      return { rows: [{
        total_participants: count,
        beginner_count: beginner,
        intermediate_count: intermediate,
        advanced_count: advanced,
        avg_quiz: sumQuiz / count,
        avg_resume: sumResume / count,
        avg_gap: sumGap / count,
        avg_total: sumTotal / count
      }]};
    }
    if (sql.includes('FROM c360_performance_scores p') && sql.includes('JOIN students s')) {
      const { data: scoresData, error: errScores } = await supabase.from('c360_performance_scores').select('*');
      if (errScores) throw errScores;
      const { data: studentsData, error: errStudents } = await supabase.from('students').select('id, first_name, last_name');
      if (errStudents) throw errStudents;
      
      const rows = [];
      scoresData.forEach(p => {
        const stud = studentsData.find(s => s.id === p.student_id);
        if (stud) {
          rows.push({
            quiz_score: p.quiz_score,
            resume_score: p.resume_score,
            skill_gap_score: p.skill_gap_score,
            total_score: p.quiz_score + p.resume_score + p.skill_gap_score,
            classification: p.classification,
            first_name: stud.first_name,
            last_name: stud.last_name
          });
        }
      });
      rows.sort((a, b) => b.total_score - a.total_score);
      return { rows };
    }

    // 16. c360_roadmap select or upsert
    if (sql.includes('INSERT INTO c360_roadmap')) {
      const row = { student_id: params[0], target_career: params[1], level: params[2], steps_json: typeof params[3] === 'string' ? JSON.parse(params[3]) : params[3], created_at: new Date().toISOString() };
      const { data, error } = await supabase.from('c360_roadmap').upsert(row, { onConflict: 'student_id,target_career' });
      if (error) throw error;
      return { rows: [row] };
    }
    if (sql.includes('FROM c360_roadmap WHERE student_id =')) {
      const { data, error } = await supabase.from('c360_roadmap').select('*').eq('student_id', params[0]).order('created_at', { ascending: false }).limit(1);
      if (error) throw error;
      return { rows: data || [] };
    }

    // 17. c360_progress select or upsert
    if (sql.includes('INSERT INTO c360_progress')) {
      const row = { student_id: params[0], completed_steps_json: typeof params[1] === 'string' ? JSON.parse(params[1]) : params[1], percentage: params[2], updated_at: new Date().toISOString() };
      const { data, error } = await supabase.from('c360_progress').upsert(row, { onConflict: 'student_id' });
      if (error) throw error;
      return { rows: [row] };
    }
    if (sql.includes('FROM c360_progress WHERE student_id =')) {
      const { data, error } = await supabase.from('c360_progress').select('*').eq('student_id', params[0]);
      if (error) throw error;
      return { rows: data || [] };
    }

    // 18. c360_admin_logs select or insert
    if (sql.includes('INSERT INTO c360_admin_logs')) {
      const row = { action_type: params[0], student_id: params[1], message: params[2], created_at: new Date().toISOString() };
      const { data, error } = await supabase.from('c360_admin_logs').insert(row);
      if (error) throw error;
      return { rows: [row] };
    }
    if (sql.includes('FROM c360_admin_logs')) {
      const { data, error } = await supabase.from('c360_admin_logs').select('*').order('created_at', { ascending: false }).limit(10);
      if (error) throw error;
      return { rows: data || [] };
    }

    // ================== JOB POSTINGS TABLES ==================
    // 19. SELECT * FROM c360_jobs
    if (sql.startsWith('SELECT * FROM c360_jobs')) {
      const { data, error } = await supabase.from('c360_jobs').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return { rows: data || [] };
    }

    // 20. INSERT INTO c360_jobs
    if (sql.startsWith('INSERT INTO c360_jobs')) {
      const row = {
        id: params[0],
        company_name: params[1],
        role: params[2],
        description: params[3],
        package_lpa: parseFloat(params[4]),
        skills_required: typeof params[5] === 'string' ? JSON.parse(params[5]) : params[5],
        location: params[6] || 'Remote',
        created_at: new Date().toISOString()
      };
      const { data, error } = await supabase.from('c360_jobs').insert(row);
      if (error) throw error;
      return { rows: [row] };
    }

    // 21. DELETE FROM c360_jobs WHERE id = $1
    if (sql.startsWith('DELETE FROM c360_jobs WHERE id =')) {
      const { data, error } = await supabase.from('c360_jobs').delete().eq('id', params[0]);
      if (error) throw error;
      return { rows: [] };
    }

    // 22. INSERT INTO c360_job_applications
    if (sql.startsWith('INSERT INTO c360_job_applications')) {
      const row = {
        id: params[0],
        job_id: params[1],
        student_id: params[2],
        status: params[3] || 'applied',
        created_at: new Date().toISOString()
      };
      const { data, error } = await supabase.from('c360_job_applications').insert(row);
      if (error) throw error;
      return { rows: [row] };
    }

    // 23. SELECT * FROM c360_job_applications WHERE student_id = $1
    if (sql.startsWith('SELECT * FROM c360_job_applications WHERE student_id =')) {
      const { data: apps, error: errApps } = await supabase.from('c360_job_applications').select('*').eq('student_id', params[0]);
      if (errApps) throw errApps;
      const { data: jobs, error: errJobs } = await supabase.from('c360_jobs').select('*');
      if (errJobs) throw errJobs;
      const rows = (apps || []).map(a => {
        const job = (jobs || []).find(j => j.id === a.job_id);
        return {
          ...a,
          company_name: job ? job.company_name : '',
          role: job ? job.role : '',
          package_lpa: job ? job.package_lpa : 0,
          skills_required: job ? job.skills_required : [],
          location: job ? job.location : ''
        };
      });
      return { rows };
    }

    // 24. SELECT a.*, j.company_name, j.role... FROM c360_job_applications a JOIN c360_jobs j ON a.job_id = j.id
    if (sql.includes('FROM c360_job_applications a') && sql.includes('JOIN c360_jobs j')) {
      const { data: apps, error: errApps } = await supabase.from('c360_job_applications').select('*');
      if (errApps) throw errApps;
      const { data: jobs, error: errJobs } = await supabase.from('c360_jobs').select('*');
      if (errJobs) throw errJobs;
      const { data: students, error: errStud } = await supabase.from('students').select('id, first_name, last_name');
      if (errStud) throw errStud;
      
      const rows = (apps || []).map(a => {
        const job = (jobs || []).find(j => j.id === a.job_id);
        const student = (students || []).find(s => s.id === a.student_id);
        return {
          ...a,
          company_name: job ? job.company_name : '',
          role: job ? job.role : '',
          package_lpa: job ? job.package_lpa : 0,
          skills_required: job ? job.skills_required : [],
          location: job ? job.location : '',
          first_name: student ? student.first_name : 'Student',
          last_name: student ? student.last_name : 'User'
        };
      });
      return { rows };
    }

    // Unmapped: Fallback dynamically
    return executeFallbackQuery(text, params);
  } catch (err) {
    console.error('[Supabase Error] Falling back locally:', err.message);
    return executeFallbackQuery(text, params);
  }
};

const queryDb = async (text, params) => {
  if (supabase) {
    return executeSupabaseQuery(text, params);
  }
  if (useJsonFallback) {
    return executeFallbackQuery(text, params);
  }
  try {
    return await pool.query(text, params);
  } catch (e) {
    useJsonFallback = true;
    return executeFallbackQuery(text, params);
  }
};

module.exports = {
  query: queryDb,
  pool: {
    query: queryDb,
    connect: async () => {
      if (useJsonFallback) {
        return mockClient;
      }
      try {
        return await pool.connect();
      } catch (e) {
        useJsonFallback = true;
        return mockClient;
      }
    }
  }
};
