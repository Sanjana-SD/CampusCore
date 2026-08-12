const { pool } = require('../db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

async function seed() {
  const client = await pool.connect();
  try {
    console.log('Seeding database...');
    await client.query('BEGIN');

    // 1. Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    // 2. Seed Config
    const configRes = await client.query(`
      INSERT INTO config (late_cutoff_time, absenteeism_threshold, parent_notification_time, email_from_address)
      VALUES ('09:15:00', 75.00, '09:30:00', 'noreply@campuscore.edu')
      RETURNING id
    `);
    console.log('Seeded global config.');

    // 3. Seed Audit Log Genesis Block
    const genesisPayload = JSON.stringify({ message: "CampusCore System Initialized" });
    const genesisPrevHash = "0000000000000000000000000000000000000000000000000000000000000000";
    const genesisRowHash = crypto.createHash('sha256').update(genesisPayload + genesisPrevHash).digest('hex');
    await client.query(`
      INSERT INTO audit_log (action_type, payload, previous_hash, row_hash)
      VALUES ($1, $2, $3, $4)
    `, ['SYSTEM_INIT', genesisPayload, genesisPrevHash, genesisRowHash]);
    console.log('Seeded audit log genesis block.');

    // 4. Create Users for all roles
    // Admin User
    const adminUser = await client.query(`
      INSERT INTO users (username, password_hash, role)
      VALUES ('admin', $1, 'admin') RETURNING id
    `, [passwordHash]);

    // Faculty Users
    const faculty1 = await client.query(`INSERT INTO users (username, password_hash, role) VALUES ('faculty1', $1, 'faculty') RETURNING id`, [passwordHash]);
    const faculty2 = await client.query(`INSERT INTO users (username, password_hash, role) VALUES ('faculty2', $1, 'faculty') RETURNING id`, [passwordHash]);

    // Librarian User
    const librarianUser = await client.query(`INSERT INTO users (username, password_hash, role) VALUES ('librarian', $1, 'librarian') RETURNING id`, [passwordHash]);

    // Parent Users
    const parent1 = await client.query(`INSERT INTO users (username, password_hash, role) VALUES ('parent1', $1, 'parent') RETURNING id`, [passwordHash]);
    const parent2 = await client.query(`INSERT INTO users (username, password_hash, role) VALUES ('parent2', $1, 'parent') RETURNING id`, [passwordHash]);

    // Students Users
    const student1 = await client.query(`INSERT INTO users (username, password_hash, role) VALUES ('student1', $1, 'student') RETURNING id`, [passwordHash]);
    const student2 = await client.query(`INSERT INTO users (username, password_hash, role) VALUES ('student2', $1, 'student') RETURNING id`, [passwordHash]);
    
    // Class Representative (CR)
    const studentCR = await client.query(`INSERT INTO users (username, password_hash, role) VALUES ('classrep1', $1, 'class_rep') RETURNING id`, [passwordHash]);

    // Extra students for bulk view
    const extraStudents = [];
    for (let i = 4; i <= 20; i++) {
      const studentUser = await client.query(`INSERT INTO users (username, password_hash, role) VALUES ('student${i}', $1, 'student') RETURNING id`, [passwordHash]);
      extraStudents.push(studentUser.rows[0].id);
    }

    console.log('Seeded users table.');

    // 5. Seed Staff Table (Faculty & Librarian details)
    await client.query(`
      INSERT INTO staff (id, first_name, last_name, email, phone, department)
      VALUES 
      ($1, 'Yathish Aradhya', 'B C', 'yathish.aradhya@kit.edu', '9876543210', 'Computer Science & Engineering'),
      ($2, 'Suman', 'K R', 'suman.kr@kit.edu', '9876543211', 'Computer Science & Engineering'),
      ($3, 'Anila', 'Kumara', 'anila.kumara@kit.edu', '9876543212', 'Library Science')
    `, [faculty1.rows[0].id, faculty2.rows[0].id, librarianUser.rows[0].id]);
    console.log('Seeded staff profiles.');

    // 6. Seed Classes
    const classA = await client.query(`
      INSERT INTO classes (name, department, faculty_id)
      VALUES ('6th Sem CS-A', 'Computer Science & Engineering', $1) RETURNING id
    `, [faculty1.rows[0].id]);
    const classB = await client.query(`
      INSERT INTO classes (name, department, faculty_id)
      VALUES ('6th Sem CS-B', 'Computer Science & Engineering', $1) RETURNING id
    `, [faculty2.rows[0].id]);
    console.log('Seeded classes.');

    // 7. Seed Students Table
    // Student 1 (Mohammed Taha Shariff)
    await client.query(`
      INSERT INTO students (id, rfid_uid, first_name, last_name, email, phone, parent_name, parent_email, parent_phone, parent_user_id, class_id, enrollment_status)
      VALUES ($1, '83A2C51B', 'Mohammed Taha', 'Shariff', 'taha.shariff@student.kit.edu', '9998887771', 'Shariff Sr.', 'parent1@email.com', '8887776661', $2, $3, 'active')
    `, [student1.rows[0].id, parent1.rows[0].id, classA.rows[0].id]);

    // Student 2 (Nafisa)
    await client.query(`
      INSERT INTO students (id, rfid_uid, first_name, last_name, email, phone, parent_name, parent_email, parent_phone, parent_user_id, class_id, enrollment_status)
      VALUES ($1, 'A5D3F27E', 'Nafisa', 'Syed', 'nafisa@student.kit.edu', '9998887772', 'Nafisa Sr.', 'parent2@email.com', '8887776662', $2, $3, 'active')
    `, [student2.rows[0].id, parent2.rows[0].id, classA.rows[0].id]);

    // Student 3 - Class Rep (Naushin)
    await client.query(`
      INSERT INTO students (id, rfid_uid, first_name, last_name, email, phone, parent_name, parent_email, parent_phone, parent_user_id, class_id, enrollment_status)
      VALUES ($1, '72B4D8A9', 'Naushin', 'Taj', 'naushin@student.kit.edu', '9998887773', 'Naushin Sr.', 'parent1@email.com', '8887776663', $2, $3, 'active')
    `, [studentCR.rows[0].id, parent1.rows[0].id, classA.rows[0].id]);

    // Extra students
    const names = [
      ['Sanjana', 'S D'], ['Amit', 'Kumar'], ['Priya', 'Rao'], ['Karan', 'Singh'], ['Anjali', 'Sharma'],
      ['Deepak', 'Patel'], ['Sneha', 'Nair'], ['Rahul', 'Verma'], ['Neha', 'Gupta'], ['Vijay', 'Joshi'],
      ['Aditi', 'Mishra'], ['Rohan', 'Das'], ['Divya', 'Reddy'], ['Sanjay', 'Gowda'], ['Aishwarya', 'Patil'],
      ['Abhishek', 'Bhat'], ['Meghana', 'Kulkarni']
    ];

    for (let i = 0; i < extraStudents.length; i++) {
      const rfId = `RFID_STD_${String(i + 4).padStart(2, '0')}`;
      const namePair = names[i] || ['Student', `Num ${i}`];
      await client.query(`
        INSERT INTO students (id, rfid_uid, first_name, last_name, email, phone, parent_name, parent_email, parent_phone, class_id, enrollment_status)
        VALUES ($1, $2, $3, $4, $5, '9000000000', 'Parent Name', 'parent@email.com', '9000000001', $6, 'active')
      `, [
        extraStudents[i],
        rfId,
        namePair[0],
        namePair[1],
        `${namePair[0].toLowerCase()}.${namePair[1].replace(/\s+/g, '').toLowerCase()}@student.kit.edu`,
        i % 2 === 0 ? classA.rows[0].id : classB.rows[0].id
      ]);
    }
    console.log('Seeded students.');

    // 8. Seed Timetable
    // Setup period 1 (09:00 - 10:00), period 2 (10:00 - 11:00), period 3 (11:15 - 12:15)
    // We seed days of week 1 to 5 (Mon-Fri)
    for (let day = 1; day <= 5; day++) {
      // Class A Timetable
      await client.query(`
        INSERT INTO timetables (class_id, faculty_id, subject, day_of_week, start_time, end_time, room)
        VALUES 
        ($1, $2, 'Computer Networks', $3, '09:00:00', '10:00:00', 'LH-301'),
        ($1, $2, 'Software Engineering', $3, '10:00:00', '11:00:00', 'LH-301'),
        ($1, $4, 'Database Systems', $3, '11:15:00', '12:15:00', 'LH-301')
      `, [classA.rows[0].id, faculty1.rows[0].id, day, faculty2.rows[0].id]);

      // Class B Timetable
      await client.query(`
        INSERT INTO timetables (class_id, faculty_id, subject, day_of_week, start_time, end_time, room)
        VALUES 
        ($1, $2, 'Database Systems', $3, '09:00:00', '10:00:00', 'LH-302'),
        ($1, $4, 'Computer Networks', $3, '10:00:00', '11:00:00', 'LH-302'),
        ($1, $4, 'Software Engineering', $3, '11:15:00', '12:15:00', 'LH-302')
      `, [classB.rows[0].id, faculty1.rows[0].id, day, faculty2.rows[0].id]);
    }
    console.log('Seeded timetable slots.');

    // 9. Seed Books (Library Catalog)
    await client.query(`
      INSERT INTO books (rfid_uid, title, author, isbn, status)
      VALUES 
      ('BOOK_UID_01', 'Computer Networks', 'Andrew S. Tanenbaum', '978-0132126953', 'available'),
      ('BOOK_UID_02', 'Database System Concepts', 'Abraham Silberschatz', '978-0073523323', 'available'),
      ('BOOK_UID_03', 'Introduction to Algorithms', 'Thomas H. Cormen', '978-0262033848', 'available'),
      ('BOOK_UID_04', 'Clean Code', 'Robert C. Martin', '978-0132350884', 'available'),
      ('BOOK_UID_05', 'Design Patterns', 'Erich Gamma', '978-0201633610', 'available')
    `);
    console.log('Seeded library catalog.');

    // 10. Seed Announcements / Feed
    await client.query(`
      INSERT INTO class_feeds (class_id, title, content, posted_by)
      VALUES 
      (NULL, 'Welcome to CampusCore!', 'Welcome to the smart campus portal. Keep your RFID cards handy for gate attendance.', $1),
      ($2, 'Assignment 1 Released', 'CS-A students, please find your Computer Networks assignment in the academic files.', $3)
    `, [adminUser.rows[0].id, classA.rows[0].id, faculty1.rows[0].id]);
    console.log('Seeded announcements.');

    // 11. Seed Fee Status
    await client.query(`
      INSERT INTO fee_status (student_id, term, amount_due, amount_paid, status, due_date)
      VALUES 
      ($1, '6th Semester', 25000.00, 15000.00, 'partial', '2026-08-31'),
      ($2, '6th Semester', 25000.00, 25000.00, 'paid', '2026-08-31'),
      ($3, '6th Semester', 25000.00, 0.00, 'unpaid', '2026-08-31')
    `, [student1.rows[0].id, student2.rows[0].id, studentCR.rows[0].id]);
    console.log('Seeded fee statuses.');

    await client.query('COMMIT');
    console.log('Seeding completed successfully.');
    process.exit(0);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error seeding database:', err);
    process.exit(1);
  } finally {
    client.release();
  }
}

seed();
