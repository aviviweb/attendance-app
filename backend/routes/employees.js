// Routes לניהול עובדים
const express = require('express');
const { getCollection, getDocument, updateDocument, addDocument } = require('../config/firebase');
const { managerOnly, departmentAccess, userAccess } = require('../middleware/auth');
const { logAttendanceEvent } = require('../utils/logger');
const router = express.Router();

// קבלת רשימת כל העובדים (מנהלים בלבד)
router.get('/', managerOnly, async (req, res) => {
  try {
    const { department, status, page = 1, limit = 50 } = req.query;
    
    let whereClauses = [];
    
    // סינון לפי מחלקה
    if (department) {
      whereClauses.push({
        field: 'department',
        operator: '==',
        value: department
      });
    }
    
    // סינון לפי סטטוס
    if (status) {
      whereClauses.push({
        field: 'isActive',
        operator: '==',
        value: status === 'active'
      });
    }

    const employees = await getCollection('users', whereClauses);
    
    // סינון רק עובדים (לא מנהלים)
    const filteredEmployees = employees.filter(emp => emp.role === 'employee');
    
    // פגינציה
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedEmployees = filteredEmployees.slice(startIndex, endIndex);
    
    res.json({
      employees: paginatedEmployees,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredEmployees.length,
        pages: Math.ceil(filteredEmployees.length / limit)
      }
    });

  } catch (error) {
    console.error('שגיאה בקבלת רשימת עובדים:', error);
    res.status(500).json({
      error: 'שגיאה בקבלת רשימת עובדים'
    });
  }
});

// קבלת פרטי עובד ספציפי
router.get('/:employeeId', userAccess, async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    const employee = await getDocument('users', employeeId);
    
    if (!employee) {
      return res.status(404).json({
        error: 'עובד לא נמצא'
      });
    }

    // קבלת נתוני נוכחות אחרונים
    const recentAttendance = await getCollection('attendance', [
      { field: 'employeeId', operator: '==', value: employeeId }
    ]);

    // קבלת נתוני מיקום אחרונים
    const recentLocations = await getCollection('locations', [
      { field: 'employeeId', operator: '==', value: employeeId }
    ]);

    res.json({
      employee: {
        id: employeeId,
        email: employee.email,
        displayName: employee.displayName,
        department: employee.department,
        role: employee.role,
        isActive: employee.isActive,
        createdAt: employee.createdAt,
        lastLogin: employee.lastLogin
      },
      recentAttendance: recentAttendance.slice(0, 10),
      recentLocations: recentLocations.slice(0, 10)
    });

  } catch (error) {
    console.error('שגיאה בקבלת פרטי עובד:', error);
    res.status(500).json({
      error: 'שגיאה בקבלת פרטי עובד'
    });
  }
});

// עדכון פרטי עובד
router.put('/:employeeId', managerOnly, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { displayName, department, isActive } = req.body;
    
    const updateData = {};
    if (displayName) updateData.displayName = displayName;
    if (department) updateData.department = department;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    
    await updateDocument('users', employeeId, updateData);
    
    logAttendanceEvent(employeeId, 'EMPLOYEE_UPDATED', {
      updatedBy: req.user.uid,
      changes: updateData
    });

    res.json({
      message: 'פרטי עובד עודכנו בהצלחה'
    });

  } catch (error) {
    console.error('שגיאה בעדכון עובד:', error);
    res.status(500).json({
      error: 'שגיאה בעדכון עובד'
    });
  }
});

// קבלת סטטיסטיקות עובד
router.get('/:employeeId/stats', userAccess, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate } = req.query;
    
    let whereClauses = [
      { field: 'employeeId', operator: '==', value: employeeId }
    ];
    
    // סינון לפי תאריכים
    if (startDate) {
      whereClauses.push({
        field: 'timestamp',
        operator: '>=',
        value: new Date(startDate)
      });
    }
    
    if (endDate) {
      whereClauses.push({
        field: 'timestamp',
        operator: '<=',
        value: new Date(endDate)
      });
    }

    const attendanceRecords = await getCollection('attendance', whereClauses);
    
    // חישוב סטטיסטיקות
    const stats = {
      totalDays: attendanceRecords.length,
      checkIns: attendanceRecords.filter(r => r.type === 'check-in').length,
      checkOuts: attendanceRecords.filter(r => r.type === 'check-out').length,
      averageWorkHours: calculateAverageWorkHours(attendanceRecords),
      punctuality: calculatePunctuality(attendanceRecords),
      attendanceRate: calculateAttendanceRate(attendanceRecords)
    };

    res.json({
      employeeId,
      period: { startDate, endDate },
      stats
    });

  } catch (error) {
    console.error('שגיאה בקבלת סטטיסטיקות:', error);
    res.status(500).json({
      error: 'שגיאה בקבלת סטטיסטיקות'
    });
  }
});

// קבלת היסטוריית נוכחות של עובד
router.get('/:employeeId/attendance', userAccess, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { page = 1, limit = 50, type } = req.query;
    
    let whereClauses = [
      { field: 'employeeId', operator: '==', value: employeeId }
    ];
    
    if (type) {
      whereClauses.push({
        field: 'type',
        operator: '==',
        value: type
      });
    }

    const attendanceRecords = await getCollection('attendance', whereClauses);
    
    // מיון לפי תאריך (החדש ביותר ראשון)
    attendanceRecords.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // פגינציה
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedRecords = attendanceRecords.slice(startIndex, endIndex);
    
    res.json({
      attendance: paginatedRecords,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: attendanceRecords.length,
        pages: Math.ceil(attendanceRecords.length / limit)
      }
    });

  } catch (error) {
    console.error('שגיאה בקבלת היסטוריית נוכחות:', error);
    res.status(500).json({
      error: 'שגיאה בקבלת היסטוריית נוכחות'
    });
  }
});

// פונקציות עזר לחישוב סטטיסטיקות
const calculateAverageWorkHours = (records) => {
  const checkIns = records.filter(r => r.type === 'check-in');
  const checkOuts = records.filter(r => r.type === 'check-out');
  
  let totalHours = 0;
  let validDays = 0;
  
  checkIns.forEach(checkIn => {
    const checkOut = checkOuts.find(co => 
      new Date(co.timestamp).toDateString() === new Date(checkIn.timestamp).toDateString()
    );
    
    if (checkOut) {
      const hours = (new Date(checkOut.timestamp) - new Date(checkIn.timestamp)) / (1000 * 60 * 60);
      totalHours += hours;
      validDays++;
    }
  });
  
  return validDays > 0 ? totalHours / validDays : 0;
};

const calculatePunctuality = (records) => {
  const checkIns = records.filter(r => r.type === 'check-in');
  const onTimeCheckIns = checkIns.filter(checkIn => {
    const checkInHour = new Date(checkIn.timestamp).getHours();
    return checkInHour >= 7 && checkInHour <= 9; // כניסה בין 7-9 נחשבת בזמן
  });
  
  return checkIns.length > 0 ? (onTimeCheckIns.length / checkIns.length) * 100 : 0;
};

const calculateAttendanceRate = (records) => {
  const uniqueDays = new Set(
    records.map(r => new Date(r.timestamp).toDateString())
  ).size;
  
  // הנחה שיש 22 ימי עבודה בחודש
  const expectedDays = 22;
  
  return Math.min((uniqueDays / expectedDays) * 100, 100);
};

module.exports = router;
