const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const cron = require('node-cron');
const db = require('./db');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const attendanceRoutes = require('./routes/attendance');
const adminRoutes = require('./routes/admin');
const assessmentRoutes = require('./routes/assessments');
const feedRoutes = require('./routes/feed');
const libraryRoutes = require('./routes/library');
const notificationRoutes = require('./routes/notifications');
const studentRoutes = require('./routes/students');
const campuscoreAIRoutes = require('./routes/campuscoreAI');
const { recalculatePeriodAttendance } = require('./controllers/attendanceController');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Save socket.io instance to app context for controllers
app.set('socketio', io);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/campus360', campuscoreAIRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Socket.io Connection
io.on('connection', (socket) => {
  console.log(`WebSocket client connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`WebSocket client disconnected: ${socket.id}`);
  });
});

// ================= Cron Jobs =================

// 1. Daily Absentee Parent Notification (runs daily at 9:30 AM)
// Cron expression: 30 9 * * * (At 09:30 AM every day)
cron.schedule('30 9 * * *', async () => {
  console.log('[Cron] Running daily absenteeism checks...');
  try {
    // We trigger the internal endpoint logic
    const { dispatchNotifications } = require('./controllers/notificationController');
    // Mock req/res to call controller directly
    const mockRes = {
      json: (data) => console.log('[Cron] Absentee notification results:', data),
      status: () => mockRes
    };
    await dispatchNotifications({}, mockRes);
  } catch (err) {
    console.error('[Cron] Error running daily absenteeism checks:', err);
  }
});

// 2. Period Auto-marking (runs at the end of class hours daily, e.g. 5:00 PM)
// Cron expression: 0 17 * * * (At 05:00 PM every day)
// For demonstration/testing, we also trigger it periodically (every hour: 0 * * * *)
cron.schedule('0 17 * * *', async () => {
  console.log('[Cron] Running period auto-marking for unscanned students...');
  await autoMarkPeriodAbsentees();
});

// Helper for Period Auto-marking / Recalculation
async function autoMarkPeriodAbsentees() {
  const todayStr = new Date().toISOString().split('T')[0];

  try {
    const studentsRes = await db.query("SELECT id, class_id FROM students WHERE enrollment_status = 'active'");
    
    for (const student of studentsRes.rows) {
      if (student.class_id) {
        await recalculatePeriodAttendance(student.id, student.class_id, todayStr);
      }
    }
    console.log(`[Cron] Completed daily period attendance recalculation check.`);
  } catch (err) {
    console.error('[Cron] Error during period auto-marking:', err);
  }
}

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`CampusCore backend server running on port ${PORT}`);
});
