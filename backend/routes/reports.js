// Routes לדוחות וניתוח
const express = require('express');
const { getCollection } = require('../config/firebase');
const { managerOnly, departmentAccess } = require('../middleware/auth');
const router = express.Router();

// דוח נוכחות יומי
router.get('/daily', managerOnly, async (req, res) => {
  try {
    const { date, department } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    
    // קבלת כל רשומות הנוכחות לתאריך
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    let whereClauses = [
      { field: 'timestamp', operator: '>=', value: startOfDay },
      { field: 'timestamp', operator: '<=', value: endOfDay }
    ];

    const attendanceRecords = await getCollection('attendance', whereClauses);
    
    // קבלת רשימת עובדים לפי מחלקה
    let employeeWhereClauses = [];
    if (department) {
      employeeWhereClauses.push({
        field: 'department',
        operator: '==',
        value: department
      });
    }

    const employees = await getCollection('users', employeeWhereClauses);
    const activeEmployees = employees.filter(emp => emp.role === 'employee' && emp.isActive);

    // ניתוח נתונים
    const report = generateDailyReport(attendanceRecords, activeEmployees);

    res.json({
      date: targetDate.toISOString().split('T')[0],
      department: department || 'all',
      summary: report.summary,
      employees: report.employees,
      statistics: report.statistics
    });

  } catch (error) {
    console.error('שגיאה ביצירת דוח יומי:', error);
    res.status(500).json({
      error: 'שגיאה ביצירת דוח יומי'
    });
  }
});

// דוח נוכחות שבועי
router.get('/weekly', managerOnly, async (req, res) => {
  try {
    const { weekStart, department } = req.query;
    const startDate = weekStart ? new Date(weekStart) : getWeekStart(new Date());
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);

    let whereClauses = [
      { field: 'timestamp', operator: '>=', value: startDate },
      { field: 'timestamp', operator: '<=', value: endDate }
    ];

    const attendanceRecords = await getCollection('attendance', whereClauses);
    
    // קבלת רשימת עובדים
    let employeeWhereClauses = [];
    if (department) {
      employeeWhereClauses.push({
        field: 'department',
        operator: '==',
        value: department
      });
    }

    const employees = await getCollection('users', employeeWhereClauses);
    const activeEmployees = employees.filter(emp => emp.role === 'employee' && emp.isActive);

    // ניתוח נתונים שבועי
    const report = generateWeeklyReport(attendanceRecords, activeEmployees, startDate);

    res.json({
      weekStart: startDate.toISOString().split('T')[0],
      weekEnd: endDate.toISOString().split('T')[0],
      department: department || 'all',
      summary: report.summary,
      dailyBreakdown: report.dailyBreakdown,
      employees: report.employees
    });

  } catch (error) {
    console.error('שגיאה ביצירת דוח שבועי:', error);
    res.status(500).json({
      error: 'שגיאה ביצירת דוח שבועי'
    });
  }
});

// דוח נוכחות חודשי
router.get('/monthly', managerOnly, async (req, res) => {
  try {
    const { year, month, department } = req.query;
    const targetYear = parseInt(year) || new Date().getFullYear();
    const targetMonth = parseInt(month) || new Date().getMonth() + 1;
    
    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0);
    endDate.setHours(23, 59, 59, 999);

    let whereClauses = [
      { field: 'timestamp', operator: '>=', value: startDate },
      { field: 'timestamp', operator: '<=', value: endDate }
    ];

    const attendanceRecords = await getCollection('attendance', whereClauses);
    
    // קבלת רשימת עובדים
    let employeeWhereClauses = [];
    if (department) {
      employeeWhereClauses.push({
        field: 'department',
        operator: '==',
        value: department
      });
    }

    const employees = await getCollection('users', employeeWhereClauses);
    const activeEmployees = employees.filter(emp => emp.role === 'employee' && emp.isActive);

    // ניתוח נתונים חודשי
    const report = generateMonthlyReport(attendanceRecords, activeEmployees, startDate, endDate);

    res.json({
      year: targetYear,
      month: targetMonth,
      department: department || 'all',
      summary: report.summary,
      weeklyBreakdown: report.weeklyBreakdown,
      employees: report.employees,
      trends: report.trends
    });

  } catch (error) {
    console.error('שגיאה ביצירת דוח חודשי:', error);
    res.status(500).json({
      error: 'שגיאה ביצירת דוח חודשי'
    });
  }
});

// דוח הונאות
router.get('/fraud', managerOnly, async (req, res) => {
  try {
    const { startDate, endDate, severity } = req.query;
    
    let whereClauses = [];
    
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

    // קבלת רשומות הונאה
    const fraudRecords = await getCollection('fraud_alerts', whereClauses);
    
    // סינון לפי חומרה
    const filteredRecords = severity ? 
      fraudRecords.filter(record => record.severity === severity) : 
      fraudRecords;

    // ניתוח נתוני הונאה
    const fraudReport = generateFraudReport(filteredRecords);

    res.json({
      period: { startDate, endDate },
      severity: severity || 'all',
      summary: fraudReport.summary,
      incidents: fraudReport.incidents,
      trends: fraudReport.trends,
      topOffenders: fraudReport.topOffenders
    });

  } catch (error) {
    console.error('שגיאה ביצירת דוח הונאות:', error);
    res.status(500).json({
      error: 'שגיאה ביצירת דוח הונאות'
    });
  }
});

// פונקציות עזר לניתוח נתונים
const generateDailyReport = (records, employees) => {
  const checkIns = records.filter(r => r.type === 'check-in');
  const checkOuts = records.filter(r => r.type === 'check-out');
  
  const presentEmployees = new Set([
    ...checkIns.map(r => r.employeeId),
    ...checkOuts.map(r => r.employeeId)
  ]);

  const employeeStats = employees.map(emp => {
    const empCheckIns = checkIns.filter(r => r.employeeId === emp.uid);
    const empCheckOuts = checkOuts.filter(r => r.employeeId === emp.uid);
    
    return {
      employeeId: emp.uid,
      name: emp.displayName,
      department: emp.department,
      checkedIn: empCheckIns.length > 0,
      checkedOut: empCheckOuts.length > 0,
      firstCheckIn: empCheckIns[0]?.timestamp || null,
      lastCheckOut: empCheckOuts[empCheckOuts.length - 1]?.timestamp || null,
      workHours: calculateWorkHours(empCheckIns, empCheckOuts)
    };
  });

  return {
    summary: {
      totalEmployees: employees.length,
      presentEmployees: presentEmployees.size,
      absentEmployees: employees.length - presentEmployees.size,
      attendanceRate: (presentEmployees.size / employees.length) * 100
    },
    employees: employeeStats,
    statistics: {
      averageWorkHours: calculateAverageWorkHours(employeeStats),
      punctualityRate: calculatePunctualityRate(checkIns)
    }
  };
};

const generateWeeklyReport = (records, employees, weekStart) => {
  const dailyReports = [];
  
  for (let i = 0; i < 7; i++) {
    const dayStart = new Date(weekStart);
    dayStart.setDate(dayStart.getDate() + i);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);
    
    const dayRecords = records.filter(r => 
      new Date(r.timestamp) >= dayStart && new Date(r.timestamp) <= dayEnd
    );
    
    const dayReport = generateDailyReport(dayRecords, employees);
    dailyReports.push({
      date: dayStart.toISOString().split('T')[0],
      ...dayReport.summary
    });
  }

  return {
    summary: {
      totalDays: 7,
      averageAttendanceRate: dailyReports.reduce((sum, day) => sum + day.attendanceRate, 0) / 7,
      totalPresentDays: dailyReports.reduce((sum, day) => sum + day.presentEmployees, 0)
    },
    dailyBreakdown: dailyReports,
    employees: employees.map(emp => ({
      employeeId: emp.uid,
      name: emp.displayName,
      department: emp.department,
      presentDays: dailyReports.filter(day => 
        records.some(r => r.employeeId === emp.uid && 
          new Date(r.timestamp).toDateString() === new Date(day.date).toDateString())
      ).length
    }))
  };
};

const generateMonthlyReport = (records, employees, startDate, endDate) => {
  const weeklyReports = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const weekStart = getWeekStart(currentDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const weekRecords = records.filter(r => 
      new Date(r.timestamp) >= weekStart && new Date(r.timestamp) <= weekEnd
    );
    
    const weekReport = generateWeeklyReport(weekRecords, employees, weekStart);
    weeklyReports.push({
      weekStart: weekStart.toISOString().split('T')[0],
      ...weekReport.summary
    });
    
    currentDate.setDate(currentDate.getDate() + 7);
  }

  return {
    summary: {
      totalWeeks: weeklyReports.length,
      averageWeeklyAttendanceRate: weeklyReports.reduce((sum, week) => sum + week.averageAttendanceRate, 0) / weeklyReports.length,
      totalPresentDays: weeklyReports.reduce((sum, week) => sum + week.totalPresentDays, 0)
    },
    weeklyBreakdown: weeklyReports,
    employees: employees.map(emp => ({
      employeeId: emp.uid,
      name: emp.displayName,
      department: emp.department,
      presentWeeks: weeklyReports.filter(week => 
        records.some(r => r.employeeId === emp.uid && 
          isDateInWeek(new Date(r.timestamp), new Date(week.weekStart)))
      ).length
    })),
    trends: {
      attendanceTrend: calculateTrend(weeklyReports.map(w => w.averageAttendanceRate)),
      consistencyScore: calculateConsistencyScore(weeklyReports.map(w => w.averageAttendanceRate))
    }
  };
};

const generateFraudReport = (fraudRecords) => {
  const fraudTypes = {};
  const employees = {};
  const dailyFraud = {};
  
  fraudRecords.forEach(record => {
    // ספירת סוגי הונאה
    fraudTypes[record.type] = (fraudTypes[record.type] || 0) + 1;
    
    // ספירת הונאות לפי עובד
    employees[record.employeeId] = (employees[record.employeeId] || 0) + 1;
    
    // ספירת הונאות יומית
    const date = new Date(record.timestamp).toISOString().split('T')[0];
    dailyFraud[date] = (dailyFraud[date] || 0) + 1;
  });

  return {
    summary: {
      totalIncidents: fraudRecords.length,
      uniqueEmployees: Object.keys(employees).length,
      fraudTypes: Object.keys(fraudTypes).length,
      averageDailyIncidents: Object.values(dailyFraud).reduce((sum, count) => sum + count, 0) / Object.keys(dailyFraud).length || 0
    },
    incidents: fraudRecords.map(record => ({
      id: record.id,
      employeeId: record.employeeId,
      type: record.type,
      severity: record.severity,
      timestamp: record.timestamp,
      details: record.details
    })),
    trends: {
      fraudTypes,
      dailyBreakdown: dailyFraud
    },
    topOffenders: Object.entries(employees)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([employeeId, count]) => ({ employeeId, incidentCount: count }))
  };
};

// פונקציות עזר נוספות
const getWeekStart = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

const calculateWorkHours = (checkIns, checkOuts) => {
  if (checkIns.length === 0 || checkOuts.length === 0) return 0;
  
  const totalMs = checkOuts.reduce((sum, checkOut) => {
    const checkIn = checkIns.find(ci => 
      new Date(ci.timestamp).toDateString() === new Date(checkOut.timestamp).toDateString()
    );
    return sum + (checkIn ? new Date(checkOut.timestamp) - new Date(checkIn.timestamp) : 0);
  }, 0);
  
  return totalMs / (1000 * 60 * 60); // המרה לשעות
};

const calculateAverageWorkHours = (employeeStats) => {
  const totalHours = employeeStats.reduce((sum, emp) => sum + emp.workHours, 0);
  return employeeStats.length > 0 ? totalHours / employeeStats.length : 0;
};

const calculatePunctualityRate = (checkIns) => {
  const onTimeCheckIns = checkIns.filter(checkIn => {
    const hour = new Date(checkIn.timestamp).getHours();
    return hour >= 7 && hour <= 9;
  });
  
  return checkIns.length > 0 ? (onTimeCheckIns.length / checkIns.length) * 100 : 0;
};

const isDateInWeek = (date, weekStart) => {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  return date >= weekStart && date <= weekEnd;
};

const calculateTrend = (values) => {
  if (values.length < 2) return 'stable';
  
  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
  
  const change = ((secondAvg - firstAvg) / firstAvg) * 100;
  
  if (change > 5) return 'increasing';
  if (change < -5) return 'decreasing';
  return 'stable';
};

const calculateConsistencyScore = (values) => {
  if (values.length < 2) return 100;
  
  const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
  const standardDeviation = Math.sqrt(variance);
  
  return Math.max(0, 100 - (standardDeviation / avg) * 100);
};

module.exports = router;
