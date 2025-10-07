// שרת Express הראשי
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// ייבוא routes
const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const attendanceRoutes = require('./routes/attendance');
const reportsRoutes = require('./routes/reports');

// ייבוא services
const geofenceService = require('./services/geofenceService');
const fraudService = require('./services/fraudService');
const notificationService = require('./services/notificationService');

// ייבוא middleware
const { authMiddleware } = require('./middleware/auth');
const { logger } = require('./utils/logger');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Middleware כללי
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 דקות
  max: 100, // מקסימום 100 בקשות לכל IP
  message: 'יותר מדי בקשות, נסה שוב מאוחר יותר'
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', authMiddleware, employeeRoutes);
app.use('/api/attendance', authMiddleware, attendanceRoutes);
app.use('/api/reports', authMiddleware, reportsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Socket.IO connections
io.on('connection', (socket) => {
  logger.info(`משתמש התחבר: ${socket.id}`);

  // הצטרפות לחדר של עובד
  socket.on('join-employee-room', (employeeId) => {
    socket.join(`employee-${employeeId}`);
    logger.info(`עובד ${employeeId} הצטרף לחדר`);
  });

  // הצטרפות לחדר של מנהל
  socket.on('join-manager-room', (managerId) => {
    socket.join(`manager-${managerId}`);
    logger.info(`מנהל ${managerId} הצטרף לחדר`);
  });

  // עדכון מיקום עובד
  socket.on('employee-location-update', async (data) => {
    try {
      const { employeeId, location, timestamp } = data;
      
      // בדיקת הונאות
      const fraudCheck = await fraudService.checkLocationFraud(employeeId, location);
      
      if (fraudCheck.isSuspicious) {
        // שליחת התראה למנהלים
        io.to('managers').emit('fraud-alert', {
          employeeId,
          location,
          fraudType: fraudCheck.type,
          severity: fraudCheck.severity,
          timestamp
        });
      }

      // עדכון מיקום לכל המנהלים
      io.to('managers').emit('location-update', {
        employeeId,
        location,
        timestamp
      });

      logger.info(`מיקום עודכן לעובד ${employeeId}: ${location.lat}, ${location.lng}`);
    } catch (error) {
      logger.error('שגיאה בעדכון מיקום:', error);
      socket.emit('error', { message: 'שגיאה בעדכון מיקום' });
    }
  });

  // כניסה/יציאה של עובד
  socket.on('attendance-update', (data) => {
    const { employeeId, type, timestamp, location } = data;
    
    // עדכון כל המנהלים
    io.to('managers').emit('attendance-update', {
      employeeId,
      type, // 'check-in' או 'check-out'
      timestamp,
      location
    });

    logger.info(`עובד ${employeeId} ${type === 'check-in' ? 'נכנס' : 'יצא'}`);
  });

  // בקשה לבדיקת פנים אקראית
  socket.on('request-face-check', (employeeId) => {
    io.to(`employee-${employeeId}`).emit('face-check-request', {
      timestamp: Date.now(),
      reason: 'random-verification'
    });
    
    logger.info(`נשלחה בקשה לבדיקת פנים לעובד ${employeeId}`);
  });

  // תגובה לבדיקת פנים
  socket.on('face-check-response', async (data) => {
    try {
      const { employeeId, imageData, timestamp } = data;
      
      // כאן יהיה אימות התמונה
      const verificationResult = await fraudService.verifyFaceImage(employeeId, imageData);
      
      // שליחת תוצאה למנהלים
      io.to('managers').emit('face-check-result', {
        employeeId,
        verified: verificationResult.verified,
        confidence: verificationResult.confidence,
        timestamp
      });

      logger.info(`תוצאת בדיקת פנים לעובד ${employeeId}: ${verificationResult.verified ? 'אומת' : 'לא אומת'}`);
    } catch (error) {
      logger.error('שגיאה בבדיקת פנים:', error);
    }
  });

  // התנתקות
  socket.on('disconnect', () => {
    logger.info(`משתמש התנתק: ${socket.id}`);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('שגיאה בשרת:', err);
  res.status(500).json({ 
    error: 'שגיאה פנימית בשרת',
    message: process.env.NODE_ENV === 'development' ? err.message : 'שגיאה פנימית'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'מסלול לא נמצא' });
});

// התחלת השרת
server.listen(PORT, () => {
  logger.info(`שרת פועל על פורט ${PORT}`);
  logger.info(`סביבה: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('קבלת SIGTERM, סוגר שרת...');
  server.close(() => {
    logger.info('שרת נסגר');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('קבלת SIGINT, סוגר שרת...');
  server.close(() => {
    logger.info('שרת נסגר');
    process.exit(0);
  });
});

module.exports = app;
