const db = require('../db');
const crypto = require('crypto');

const getBooks = async (req, res) => {
  try {
    const booksRes = await db.query('SELECT * FROM books ORDER BY title ASC');
    res.json(booksRes.rows);
  } catch (err) {
    console.error('getBooks error:', err);
    res.status(500).json({ error: 'Failed to retrieve books.' });
  }
};

const addBook = async (req, res) => {
  const { rfid_uid, title, author, isbn } = req.body;

  if (!rfid_uid || !title || !author) {
    return res.status(400).json({ error: 'rfid_uid, title, and author are required.' });
  }

  try {
    const checkBook = await db.query('SELECT id FROM books WHERE rfid_uid = $1', [rfid_uid]);
    if (checkBook.rows.length > 0) {
      return res.status(400).json({ error: 'Book with this RFID UID already exists.' });
    }

    const result = await db.query(
      `INSERT INTO books (rfid_uid, title, author, isbn, status) 
       VALUES ($1, $2, $3, $4, 'available') RETURNING *`,
      [rfid_uid, title, author, isbn]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('addBook error:', err);
    res.status(500).json({ error: 'Failed to add book.' });
  }
};

const issueBook = async (req, res) => {
  const { student_rfid, book_rfid, loan_days } = req.body;

  if (!student_rfid || !book_rfid) {
    return res.status(400).json({ error: 'student_rfid and book_rfid are required.' });
  }

  const days = loan_days ? parseInt(loan_days, 10) : 14;

  try {
    // 1. Find student
    const studentRes = await db.query('SELECT id, first_name, last_name FROM students WHERE rfid_uid = $1', [student_rfid]);
    if (studentRes.rows.length === 0) {
      return res.status(404).json({ error: 'Student with this RFID not found.' });
    }
    const studentId = studentRes.rows[0].id;

    // 2. Find book
    const bookRes = await db.query('SELECT id, title, status FROM books WHERE rfid_uid = $1', [book_rfid]);
    if (bookRes.rows.length === 0) {
      return res.status(404).json({ error: 'Book with this RFID not found.' });
    }
    const book = bookRes.rows[0];

    if (book.status !== 'available') {
      return res.status(400).json({ error: `Book is currently ${book.status}.` });
    }

    // 3. Issue Loan
    const issueDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + days);

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // Update book status
      await client.query("UPDATE books SET status = 'issued' WHERE id = $1", [book.id]);

      // Create loan record
      const loanRes = await client.query(
        `INSERT INTO library_loans (book_id, student_id, issue_date, due_date) 
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [book.id, studentId, issueDate, dueDate]
      );

      // Audit Log entry
      const lastAuditRes = await client.query('SELECT row_hash FROM audit_log ORDER BY id DESC LIMIT 1');
      const previousHash = lastAuditRes.rows.length > 0 ? lastAuditRes.rows[0].row_hash : "GENESIS_HASH_CAMPUS_CORE";
      
      const payloadStr = JSON.stringify({
        action: 'BOOK_ISSUE',
        student_id: studentId,
        book_id: book.id,
        loan_id: loanRes.rows[0].id,
        timestamp: new Date()
      });
      const rowHash = crypto.createHash('sha256').update(payloadStr + previousHash).digest('hex');
      await client.query(
        'INSERT INTO audit_log (action_type, payload, previous_hash, row_hash) VALUES ($1, $2, $3, $4)',
        ['LIBRARY_LOAN_ISSUE', payloadStr, previousHash, rowHash]
      );

      await client.query('COMMIT');
      client.release();

      res.status(201).json({
        message: 'Book issued successfully.',
        loan: loanRes.rows[0],
        student_name: `${studentRes.rows[0].first_name} ${studentRes.rows[0].last_name}`,
        book_title: book.title
      });
    } catch (txErr) {
      await client.query('ROLLBACK');
      client.release();
      throw txErr;
    }
  } catch (err) {
    console.error('issueBook error:', err);
    res.status(500).json({ error: 'Failed to issue book loan.' });
  }
};

const returnBook = async (req, res) => {
  const { book_rfid } = req.body;

  if (!book_rfid) {
    return res.status(400).json({ error: 'book_rfid is required.' });
  }

  try {
    // 1. Find book
    const bookRes = await db.query('SELECT id, title, status FROM books WHERE rfid_uid = $1', [book_rfid]);
    if (bookRes.rows.length === 0) {
      return res.status(404).json({ error: 'Book with this RFID not found.' });
    }
    const book = bookRes.rows[0];

    if (book.status !== 'issued') {
      return res.status(400).json({ error: 'Book is not currently checked out.' });
    }

    // 2. Find active loan
    const loanRes = await db.query(
      `SELECT * FROM library_loans 
       WHERE book_id = $1 AND return_date IS NULL 
       ORDER BY issue_date DESC LIMIT 1`,
      [book.id]
    );

    if (loanRes.rows.length === 0) {
      return res.status(404).json({ error: 'No active loan found for this book.' });
    }

    const loan = loanRes.rows[0];

    // 3. Return Book & Calculate Fines
    const returnDate = new Date();
    const dueDate = new Date(loan.due_date);
    let fineAmount = 0.00;

    // Check if overdue
    if (returnDate > dueDate) {
      const diffTime = Math.abs(returnDate - dueDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      fineAmount = diffDays * 2.00; // Rs. 2.00 fine per day overdue
    }

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // Update book status
      await client.query("UPDATE books SET status = 'available' WHERE id = $1", [book.id]);

      // Update loan record
      await client.query(
        `UPDATE library_loans 
         SET return_date = $1, fine_amount = $2 
         WHERE id = $3`,
        [returnDate, fineAmount, loan.id]
      );

      // Audit Log
      const lastAuditRes = await client.query('SELECT row_hash FROM audit_log ORDER BY id DESC LIMIT 1');
      const previousHash = lastAuditRes.rows.length > 0 ? lastAuditRes.rows[0].row_hash : "GENESIS_HASH_CAMPUS_CORE";
      
      const payloadStr = JSON.stringify({
        action: 'BOOK_RETURN',
        student_id: loan.student_id,
        book_id: book.id,
        loan_id: loan.id,
        fine: fineAmount,
        timestamp: new Date()
      });
      const rowHash = crypto.createHash('sha256').update(payloadStr + previousHash).digest('hex');
      await client.query(
        'INSERT INTO audit_log (action_type, payload, previous_hash, row_hash) VALUES ($1, $2, $3, $4)',
        ['LIBRARY_LOAN_RETURN', payloadStr, previousHash, rowHash]
      );

      await client.query('COMMIT');
      client.release();

      res.json({
        message: 'Book returned successfully.',
        fine: fineAmount,
        book_title: book.title
      });
    } catch (txErr) {
      await client.query('ROLLBACK');
      client.release();
      throw txErr;
    }
  } catch (err) {
    console.error('returnBook error:', err);
    res.status(500).json({ error: 'Failed to process book return.' });
  }
};

const getLoans = async (req, res) => {
  try {
    const loansRes = await db.query(
      `SELECT ll.*, b.title, b.author, s.first_name, s.last_name, s.email 
       FROM library_loans ll
       JOIN books b ON ll.book_id = b.id
       JOIN students s ON ll.student_id = s.id
       ORDER BY ll.issue_date DESC`
    );
    res.json(loansRes.rows);
  } catch (err) {
    console.error('getLoans error:', err);
    res.status(500).json({ error: 'Failed to fetch library loans.' });
  }
};

const getStudentLoans = async (req, res) => {
  const { studentId } = req.params;

  if (req.user.role === 'student' && req.user.id !== studentId) {
    return res.status(403).json({ error: 'Access denied.' });
  }

  try {
    const loansRes = await db.query(
      `SELECT ll.*, b.title, b.author, b.isbn 
       FROM library_loans ll
       JOIN books b ON ll.book_id = b.id
       WHERE ll.student_id = $1 
       ORDER BY ll.issue_date DESC`,
      [studentId]
    );
    res.json(loansRes.rows);
  } catch (err) {
    console.error('getStudentLoans error:', err);
    res.status(500).json({ error: 'Failed to retrieve student loans.' });
  }
};

module.exports = {
  getBooks,
  addBook,
  issueBook,
  returnBook,
  getLoans,
  getStudentLoans
};
