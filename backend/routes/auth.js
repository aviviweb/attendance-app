// Routes לאימות משתמשים
const express = require('express');
const { createUser, verifyIdToken, createCustomToken, getDocument } = require('../config/firebase');
const { logSecurityEvent } = require('../utils/logger');
const router = express.Router();

// רישום משתמש חדש
router.post('/register', async (req, res) => {
  try {
    const { 
      email, 
      password, 
      displayName, 
      role = 'employee', 
      department,
      firstName,
      lastName,
      idNumber,
      birthDate,
      phone,
      address,
      emergencyPhone,
      position,
      startDate,
      employeeType,
      workPermitExpiry,
      workPermitNumber,
      visaExpiry,
      visaNumber,
      photo,
      documents,
      registrationToken
    } = req.body;

    // בדיקת נתונים נדרשים
    if (!email || !password || !displayName) {
      return res.status(400).json({
        error: 'חסרים נתונים נדרשים',
        required: ['email', 'password', 'displayName']
      });
    }

    // בדיקת תקינות email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'כתובת email לא תקינה'
      });
    }

    // בדיקת חוזק סיסמה
    if (password.length < 6) {
      return res.status(400).json({
        error: 'הסיסמה חייבת להכיל לפחות 6 תווים'
      });
    }

    // יצירת משתמש חדש
    const userRecord = await createUser({
      email,
      password,
      displayName,
      role,
      department
    });

    logSecurityEvent('USER_REGISTERED', {
      email,
      role,
      department,
      uid: userRecord.uid
    });

    res.status(201).json({
      message: 'משתמש נוצר בהצלחה',
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        role,
        department
      }
    });

  } catch (error) {
    console.error('שגיאה ברישום:', error);
    
    if (error.code === 'auth/email-already-exists') {
      return res.status(409).json({
        error: 'כתובת email כבר קיימת במערכת'
      });
    }
    
    if (error.code === 'auth/weak-password') {
      return res.status(400).json({
        error: 'הסיסמה חלשה מדי'
      });
    }

    res.status(500).json({
      error: 'שגיאה ביצירת משתמש'
    });
  }
});

// התחברות משתמש
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'נדרשים email וסיסמה'
      });
    }

    // כאן יהיה לוגיקת התחברות עם Firebase Auth
    // כרגע נחזיר token דמה
    const customToken = await createCustomToken('dummy-uid', {
      email,
      role: 'employee'
    });

    logSecurityEvent('USER_LOGIN', {
      email,
      success: true
    });

    res.json({
      message: 'התחברות הצליחה',
      token: customToken,
      user: {
        email,
        role: 'employee'
      }
    });

  } catch (error) {
    console.error('שגיאה בהתחברות:', error);
    
    logSecurityEvent('USER_LOGIN', {
      email: req.body.email,
      success: false,
      error: error.message
    });

    res.status(401).json({
      error: 'פרטי התחברות לא נכונים'
    });
  }
});

// אימות token
router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: 'נדרש token לאימות'
      });
    }

    const decodedToken = await verifyIdToken(token);
    const userData = await getDocument('users', decodedToken.uid);

    if (!userData) {
      return res.status(404).json({
        error: 'משתמש לא נמצא'
      });
    }

    res.json({
      valid: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        role: userData.role,
        department: userData.department,
        displayName: userData.displayName
      }
    });

  } catch (error) {
    console.error('שגיאה באימות token:', error);
    
    res.status(401).json({
      valid: false,
      error: 'Token לא תקין'
    });
  }
});

// עדכון פרופיל משתמש
router.put('/profile', async (req, res) => {
  try {
    const { displayName, department } = req.body;
    const userId = req.user.uid;

    // כאן יהיה עדכון נתוני המשתמש ב-Firebase
    // כרגע נחזיר הצלחה

    logSecurityEvent('PROFILE_UPDATED', {
      userId,
      changes: { displayName, department }
    });

    res.json({
      message: 'פרופיל עודכן בהצלחה'
    });

  } catch (error) {
    console.error('שגיאה בעדכון פרופיל:', error);
    
    res.status(500).json({
      error: 'שגיאה בעדכון פרופיל'
    });
  }
});

// שינוי סיסמה
router.put('/password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.uid;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'נדרשים סיסמה נוכחית וסיסמה חדשה'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'הסיסמה החדשה חייבת להכיל לפחות 6 תווים'
      });
    }

    // כאן יהיה לוגיקת שינוי סיסמה
    // כרגע נחזיר הצלחה

    logSecurityEvent('PASSWORD_CHANGED', {
      userId
    });

    res.json({
      message: 'סיסמה שונתה בהצלחה'
    });

  } catch (error) {
    console.error('שגיאה בשינוי סיסמה:', error);
    
    res.status(500).json({
      error: 'שגיאה בשינוי סיסמה'
    });
  }
});

// התנתקות
router.post('/logout', async (req, res) => {
  try {
    const userId = req.user.uid;

    logSecurityEvent('USER_LOGOUT', {
      userId
    });

    res.json({
      message: 'התנתקות הצליחה'
    });

  } catch (error) {
    console.error('שגיאה בהתנתקות:', error);
    
    res.status(500).json({
      error: 'שגיאה בהתנתקות'
    });
  }
});

module.exports = router;
