// Middleware לאימות משתמשים
const { verifyIdToken, getDocument } = require('../config/firebase');
const { logger } = require('../utils/logger');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'לא סופק token אימות',
        code: 'NO_TOKEN'
      });
    }

    const token = authHeader.substring(7); // הסרת "Bearer "
    
    // אימות ה-token
    const decodedToken = await verifyIdToken(token);
    
    // קבלת נתוני המשתמש
    const userData = await getDocument('users', decodedToken.uid);
    
    if (!userData) {
      return res.status(401).json({ 
        error: 'משתמש לא נמצא',
        code: 'USER_NOT_FOUND'
      });
    }

    if (!userData.isActive) {
      return res.status(403).json({ 
        error: 'חשבון המשתמש לא פעיל',
        code: 'USER_INACTIVE'
      });
    }

    // הוספת נתוני המשתמש ל-request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: userData.role,
      department: userData.department,
      displayName: userData.displayName,
      ...userData
    };

    logger.info(`משתמש מאומת: ${req.user.email} (${req.user.role})`);
    next();

  } catch (error) {
    logger.error('שגיאה באימות:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ 
        error: 'Token פג תוקף',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.code === 'auth/invalid-id-token') {
      return res.status(401).json({ 
        error: 'Token לא תקין',
        code: 'INVALID_TOKEN'
      });
    }

    return res.status(401).json({ 
      error: 'שגיאה באימות',
      code: 'AUTH_ERROR'
    });
  }
};

// Middleware לבדיקת הרשאות מנהל
const managerOnly = (req, res, next) => {
  if (req.user.role !== 'manager' && req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'אין הרשאה לגשת למשאב זה',
      code: 'INSUFFICIENT_PERMISSIONS'
    });
  }
  next();
};

// Middleware לבדיקת הרשאות עובד
const employeeOnly = (req, res, next) => {
  if (req.user.role !== 'employee') {
    return res.status(403).json({ 
      error: 'אין הרשאה לגשת למשאב זה',
      code: 'INSUFFICIENT_PERMISSIONS'
    });
  }
  next();
};

// Middleware לבדיקת הרשאות לפי מחלקה
const departmentAccess = (allowedDepartments) => {
  return (req, res, next) => {
    if (!allowedDepartments.includes(req.user.department)) {
      return res.status(403).json({ 
        error: 'אין הרשאה לגשת למחלקה זו',
        code: 'DEPARTMENT_ACCESS_DENIED'
      });
    }
    next();
  };
};

// Middleware לבדיקת הרשאות לפי משתמש ספציפי
const userAccess = (req, res, next) => {
  const targetUserId = req.params.userId || req.params.employeeId;
  
  // מנהלים יכולים לגשת לכל המשתמשים
  if (req.user.role === 'manager' || req.user.role === 'admin') {
    return next();
  }
  
  // עובדים יכולים לגשת רק לעצמם
  if (req.user.uid === targetUserId) {
    return next();
  }
  
  return res.status(403).json({ 
    error: 'אין הרשאה לגשת לנתונים של משתמש אחר',
    code: 'USER_ACCESS_DENIED'
  });
};

// Middleware לרישום פעילות אבטחה
const securityLogger = (action) => {
  return (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // רישום רק אם הבקשה הצליחה
      if (res.statusCode < 400) {
        logger.info('Security Action', {
          action,
          userId: req.user?.uid,
          userEmail: req.user?.email,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          timestamp: new Date().toISOString()
        });
      }
      
      originalSend.call(this, data);
    };
    
    next();
  };
};

module.exports = {
  authMiddleware,
  managerOnly,
  employeeOnly,
  departmentAccess,
  userAccess,
  securityLogger
};
