require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');
const morgan = require('morgan');

const { errorHandler } = require('./src/middleware/errorHandler');
const { apiLimiter } = require('./src/middleware/rateLimiter');

const authRoutes = require('./src/routes/auth');
const studentRoutes = require('./src/routes/students');
const staffRoutes = require('./src/routes/staff');
const hodRoutes = require('./src/routes/hod');
const subjectRoutes = require('./src/routes/subjects');
const coursePlanRoutes = require('./src/routes/coursePlan');
const timetableRoutes = require('./src/routes/timetable');

const app = express();
app.set('trust proxy', 1); // Trust first behind proxy/Nginx for rate limiter

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ─── Security Middleware ────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── Rate Limiting ──────────────────────────────────────────
app.use('/api/', apiLimiter);

// ─── Body Parsing ───────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Logging ────────────────────────────────────────────────
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ─── Health Check ───────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ─── API Routes ─────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/students', studentRoutes);  // frontend uses plural
app.use('/api/subjects', subjectRoutes);  // standalone subjects endpoint
app.use('/api/staff', staffRoutes);
app.use('/api/hod', hodRoutes);

// ─── Course Plan Routes ─────────────────────────────────────
const { authenticate } = require('./src/middleware/auth');
const { authorize } = require('./src/middleware/roles');
app.use('/api/faculty/course-plan', authenticate, authorize('staff'), coursePlanRoutes.faculty);
app.use('/api/hod/course-plan', authenticate, authorize('hod'), coursePlanRoutes.hod);
app.use('/api/student/materials', authenticate, authorize('student'), coursePlanRoutes.student);
app.use('/api/student/notifications', authenticate, authorize('student'), coursePlanRoutes.notifications);

// ─── Timetable Routes ───────────────────────────────────────
app.use('/api/hod/timetable', authenticate, authorize('hod'), timetableRoutes.hod);
app.use('/api/staff/timetable', authenticate, authorize('staff', 'hod'), timetableRoutes.staff);
app.use('/api/student/timetable', authenticate, authorize('student'), timetableRoutes.student);

// ─── Serve uploaded files statically ────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure upload directories exist
['uploads/course-plans', 'uploads/proof-images', 'uploads/topic-materials', 'uploads/timetables'].forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });
});

// ─── 404 Handler ────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// ─── Global Error Handler ───────────────────────────────────
app.use(errorHandler);

// ─── Start Server ───────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 College LMS API Server`);
  console.log(`   Environment : ${NODE_ENV}`);
  console.log(`   Port        : ${PORT}`);
  console.log(`   Health      : http://localhost:${PORT}/api/health\n`);
});

module.exports = app;
