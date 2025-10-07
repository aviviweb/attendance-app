// Routes לניהול נוכחות
const express = require('express');
const { addDocument, getCollection, getDocument } = require('../config/firebase');
const { userAccess } = require('../middleware/auth');
const { logAttendanceEvent, logFraudDetection } = require('../utils/logger');
const fraudService = require('../services/fraudService');
const geofenceService = require('../services/geofenceService');
const router = express.Router();

// כניסה למשמרת
router.post('/checkin', async (req, res) => {
  try {
    const { employeeId, location, timestamp, deviceInfo, wifiNetworks } = req.body;
    
    // בדיקת נתונים נדרשים
    if (!employeeId || !location || !location.lat || !location.lng) {
      return res.status(400).json({
        error: 'חסרים נתונים נדרשים לכניסה',
        required: ['employeeId', 'location.lat', 'location.lng']
      });
    }

    // בדיקת הונאות GPS
    const fraudCheck = await fraudService.checkLocationFraud(employeeId, location, {
      deviceInfo,
      wifiNetworks
    });

    if (fraudCheck.isSuspicious) {
      logFraudDetection(employeeId, fraudCheck.type, {
        location,
        severity: fraudCheck.severity,
        details: fraudCheck.details
      });

      return res.status(400).json({
        error: 'זוהתה פעילות חשודה',
        fraudType: fraudCheck.type,
        severity: fraudCheck.severity,
        message: 'נדרש אימות נוסף'
      });
    }

    // בדיקת geofence
    const geofenceCheck = await geofenceService.checkWorkArea(location);
    
    if (!geofenceCheck.isInArea) {
      return res.status(400).json({
        error: 'המיקום לא נמצא באזור עבודה מאושר',
        message: 'יש להיות באזור העבודה כדי לבצע כניסה'
      });
    }

    // יצירת רשומת כניסה
    const checkInRecord = {
      employeeId,
      type: 'check-in',
      location: {
        lat: location.lat,
        lng: location.lng,
        accuracy: location.accuracy || 0
      },
      timestamp: timestamp || new Date(),
      deviceInfo,
      wifiNetworks,
      geofenceArea: geofenceCheck.areaName,
      fraudCheck: {
        passed: true,
        checks: fraudCheck.checks
      }
    };

    const recordId = await addDocument('attendance', checkInRecord);

    logAttendanceEvent(employeeId, 'CHECK_IN', {
      recordId,
      location,
      geofenceArea: geofenceCheck.areaName
    });

    res.status(201).json({
      message: 'כניסה למשמרת נרשמה בהצלחה',
      recordId,
      geofenceArea: geofenceCheck.areaName,
      timestamp: checkInRecord.timestamp
    });

  } catch (error) {
    console.error('שגיאה בכניסה למשמרת:', error);
    res.status(500).json({
      error: 'שגיאה ברישום כניסה למשמרת'
    });
  }
});

// יציאה ממשמרת
router.post('/checkout', async (req, res) => {
  try {
    const { employeeId, location, timestamp, deviceInfo, wifiNetworks } = req.body;
    
    // בדיקת נתונים נדרשים
    if (!employeeId || !location || !location.lat || !location.lng) {
      return res.status(400).json({
        error: 'חסרים נתונים נדרשים ליציאה',
        required: ['employeeId', 'location.lat', 'location.lng']
      });
    }

    // בדיקת הונאות GPS
    const fraudCheck = await fraudService.checkLocationFraud(employeeId, location, {
      deviceInfo,
      wifiNetworks
    });

    if (fraudCheck.isSuspicious) {
      logFraudDetection(employeeId, fraudCheck.type, {
        location,
        severity: fraudCheck.severity,
        details: fraudCheck.details
      });

      return res.status(400).json({
        error: 'זוהתה פעילות חשודה',
        fraudType: fraudCheck.type,
        severity: fraudCheck.severity,
        message: 'נדרש אימות נוסף'
      });
    }

    // בדיקת geofence
    const geofenceCheck = await geofenceService.checkWorkArea(location);
    
    if (!geofenceCheck.isInArea) {
      return res.status(400).json({
        error: 'המיקום לא נמצא באזור עבודה מאושר',
        message: 'יש להיות באזור העבודה כדי לבצע יציאה'
      });
    }

    // יצירת רשומת יציאה
    const checkOutRecord = {
      employeeId,
      type: 'check-out',
      location: {
        lat: location.lat,
        lng: location.lng,
        accuracy: location.accuracy || 0
      },
      timestamp: timestamp || new Date(),
      deviceInfo,
      wifiNetworks,
      geofenceArea: geofenceCheck.areaName,
      fraudCheck: {
        passed: true,
        checks: fraudCheck.checks
      }
    };

    const recordId = await addDocument('attendance', checkOutRecord);

    logAttendanceEvent(employeeId, 'CHECK_OUT', {
      recordId,
      location,
      geofenceArea: geofenceCheck.areaName
    });

    res.status(201).json({
      message: 'יציאה ממשמרת נרשמה בהצלחה',
      recordId,
      geofenceArea: geofenceCheck.areaName,
      timestamp: checkOutRecord.timestamp
    });

  } catch (error) {
    console.error('שגיאה ביציאה ממשמרת:', error);
    res.status(500).json({
      error: 'שגיאה ברישום יציאה ממשמרת'
    });
  }
});

// עדכון מיקום עובד
router.post('/location', async (req, res) => {
  try {
    const { employeeId, location, timestamp, deviceInfo } = req.body;
    
    if (!employeeId || !location) {
      return res.status(400).json({
        error: 'חסרים נתונים נדרשים לעדכון מיקום'
      });
    }

    // בדיקת הונאות GPS
    const fraudCheck = await fraudService.checkLocationFraud(employeeId, location, {
      deviceInfo
    });

    if (fraudCheck.isSuspicious) {
      logFraudDetection(employeeId, fraudCheck.type, {
        location,
        severity: fraudCheck.severity,
        details: fraudCheck.details
      });

      // שליחת התראה למנהלים
      // כאן יהיה שליחה דרך Socket.IO
    }

    // שמירת מיקום
    const locationRecord = {
      employeeId,
      location: {
        lat: location.lat,
        lng: location.lng,
        accuracy: location.accuracy || 0
      },
      timestamp: timestamp || new Date(),
      deviceInfo,
      fraudCheck: {
        passed: !fraudCheck.isSuspicious,
        checks: fraudCheck.checks
      }
    };

    await addDocument('locations', locationRecord);

    res.json({
      message: 'מיקום עודכן בהצלחה',
      fraudCheck: {
        isSuspicious: fraudCheck.isSuspicious,
        type: fraudCheck.type
      }
    });

  } catch (error) {
    console.error('שגיאה בעדכון מיקום:', error);
    res.status(500).json({
      error: 'שגיאה בעדכון מיקום'
    });
  }
});

// אימות פנים
router.post('/verify-face', async (req, res) => {
  try {
    const { employeeId, imageData, timestamp } = req.body;
    
    if (!employeeId || !imageData) {
      return res.status(400).json({
        error: 'חסרים נתונים נדרשים לאימות פנים'
      });
    }

    // כאן יהיה לוגיקת אימות פנים
    const verificationResult = await fraudService.verifyFaceImage(employeeId, imageData);

    // שמירת תוצאת האימות
    const verificationRecord = {
      employeeId,
      type: 'face-verification',
      timestamp: timestamp || new Date(),
      result: {
        verified: verificationResult.verified,
        confidence: verificationResult.confidence,
        method: verificationResult.method
      }
    };

    await addDocument('verifications', verificationRecord);

    logAttendanceEvent(employeeId, 'FACE_VERIFICATION', {
      verified: verificationResult.verified,
      confidence: verificationResult.confidence
    });

    res.json({
      message: 'אימות פנים הושלם',
      verified: verificationResult.verified,
      confidence: verificationResult.confidence
    });

  } catch (error) {
    console.error('שגיאה באימות פנים:', error);
    res.status(500).json({
      error: 'שגיאה באימות פנים'
    });
  }
});

// קבלת סטטוס נוכחות נוכחי
router.get('/status/:employeeId', userAccess, async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    // קבלת רשומת כניסה אחרונה
    const lastCheckIn = await getCollection('attendance', [
      { field: 'employeeId', operator: '==', value: employeeId },
      { field: 'type', operator: '==', value: 'check-in' }
    ]);

    // קבלת רשומת יציאה אחרונה
    const lastCheckOut = await getCollection('attendance', [
      { field: 'employeeId', operator: '==', value: employeeId },
      { field: 'type', operator: '==', value: 'check-out' }
    ]);

    const isCheckedIn = lastCheckIn.length > 0 && 
      (lastCheckOut.length === 0 || 
       new Date(lastCheckIn[0].timestamp) > new Date(lastCheckOut[0].timestamp));

    res.json({
      employeeId,
      isCheckedIn,
      lastCheckIn: lastCheckIn[0] || null,
      lastCheckOut: lastCheckOut[0] || null,
      currentSession: isCheckedIn ? {
        startTime: lastCheckIn[0].timestamp,
        duration: Date.now() - new Date(lastCheckIn[0].timestamp).getTime()
      } : null
    });

  } catch (error) {
    console.error('שגיאה בקבלת סטטוס נוכחות:', error);
    res.status(500).json({
      error: 'שגיאה בקבלת סטטוס נוכחות'
    });
  }
});

module.exports = router;
