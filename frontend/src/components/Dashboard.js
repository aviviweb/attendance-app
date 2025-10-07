import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './styles/Dashboard.css';

const Dashboard = () => {
  const { t } = useTranslation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentEmployees: 0,
    absentEmployees: 0,
    lateEmployees: 0,
    fraudAlerts: 0
  });
  const [activeTab, setActiveTab] = useState('overview');

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Sample data for demonstration
  useEffect(() => {
    setStats({
      totalEmployees: 45,
      presentEmployees: 38,
      absentEmployees: 7,
      lateEmployees: 3,
      fraudAlerts: 2
    });
  }, []);

  const attendanceRate = stats.totalEmployees > 0 
    ? Math.round((stats.presentEmployees / stats.totalEmployees) * 100) 
    : 0;

  // פונקציות לכפתורים
  const handleQuickAction = (action) => {
    switch(action) {
      case 'reports':
        // מעבר לדוח נוכחות במנהל
        window.location.href = '/manager?view=reports';
        break;
      case 'map':
        // מעבר למפת עובדים במנהל
        window.location.href = '/manager?view=map';
        break;
      case 'fraud':
        // מעבר להתראות הונאה במנהל
        window.location.href = '/manager?view=fraud';
        break;
      case 'settings':
        // מעבר להגדרות במנהל
        window.location.href = '/manager?view=developer';
        break;
      case 'employees':
        // מעבר לניהול עובדים במנהל
        window.location.href = '/manager?view=employees';
        break;
      case 'attendance':
        // מעבר לנוכחות במנהל
        window.location.href = '/manager?view=attendance';
        break;
      default:
        console.log('Action:', action);
    }
  };

  // פונקציה לחזרה ללוח בקרה
  const handleBackToManager = () => {
    window.location.href = '/manager';
  };

  const handleEmployeeClick = (employeeId) => {
    alert(`פרטי עובד: ${employeeId}\nלחץ OK כדי לראות פרטים נוספים`);
    console.log('Employee clicked:', employeeId);
    // כאן ניתן להוסיף ניווט לפרטי עובד
  };

  const handleFraudAlertClick = (alertId) => {
    alert(`התראת הונאה: ${alertId}\nלחץ OK כדי לראות פרטים נוספים`);
    console.log('Fraud alert clicked:', alertId);
    // כאן ניתן להוסיף ניווט לפרטי התראת הונאה
  };

  const recentActivities = [
    {
      id: 1,
      employee: 'יוסי כהן',
      action: 'checked-in',
      time: '08:30',
      location: 'חוצות היוצר 44',
      status: 'success'
    },
    {
      id: 2,
      employee: 'שרה לוי',
      action: 'checked-out',
      time: '17:00',
      location: 'חוצות היוצר 44',
      status: 'success'
    },
    {
      id: 3,
      employee: 'משה כהן',
      action: 'fraud-alert',
      time: '09:15',
      location: 'GPS Jump Detected',
      status: 'warning'
    },
    {
      id: 4,
      employee: 'דנה לוי',
      action: 'late-arrival',
      time: '09:45',
      location: 'חוצות היוצר 44',
      status: 'warning'
    }
  ];

  const fraudAlerts = [
    {
      id: 1,
      employee: 'משה כהן',
      type: 'GPS Jump',
      severity: 'HIGH',
      time: '09:15',
      description: 'Impossible speed detected: 150 km/h'
    },
    {
      id: 2,
      employee: 'אבי ישראלי',
      type: 'Device Change',
      severity: 'MEDIUM',
      time: '10:30',
      description: 'Device fingerprint changed'
    }
  ];

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-title">
          <button className="back-to-manager-btn" onClick={handleBackToManager}>
            ← חזור ללוח בקרה
          </button>
          <h1>📊 Dashboard - חוצות היוצר 44</h1>
          <p className="dashboard-subtitle">מערכת ניהול נוכחות עובדים</p>
        </div>
        <div className="dashboard-time">
          <div className="current-time">
            {currentTime.toLocaleTimeString('he-IL')}
          </div>
          <div className="current-date">
            {currentTime.toLocaleDateString('he-IL')}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-number">{stats.totalEmployees}</div>
            <div className="stat-label">סה"כ עובדים</div>
          </div>
        </div>

        <div className="stat-card present">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-number">{stats.presentEmployees}</div>
            <div className="stat-label">נוכחים</div>
          </div>
        </div>

        <div className="stat-card absent">
          <div className="stat-icon">❌</div>
          <div className="stat-content">
            <div className="stat-number">{stats.absentEmployees}</div>
            <div className="stat-label">נעדרים</div>
          </div>
        </div>

        <div className="stat-card late">
          <div className="stat-icon">⏰</div>
          <div className="stat-content">
            <div className="stat-number">{stats.lateEmployees}</div>
            <div className="stat-label">איחורים</div>
          </div>
        </div>

        <div className="stat-card fraud">
          <div className="stat-icon">🚨</div>
          <div className="stat-content">
            <div className="stat-number">{stats.fraudAlerts}</div>
            <div className="stat-label">התראות הונאה</div>
          </div>
        </div>

        <div className="stat-card rate">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <div className="stat-number">{attendanceRate}%</div>
            <div className="stat-label">אחוז נוכחות</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Left Column */}
        <div className="dashboard-left">
          {/* Recent Activities */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3>🕐 פעילות אחרונה</h3>
            </div>
            <div className="card-content">
              <div className="activity-list">
                {recentActivities.map(activity => (
                  <div key={activity.id} className={`activity-item ${activity.status}`} onClick={() => handleEmployeeClick(activity.id)}>
                    <div className="activity-icon">
                      {activity.action === 'checked-in' && '✅'}
                      {activity.action === 'checked-out' && '🚪'}
                      {activity.action === 'fraud-alert' && '🚨'}
                      {activity.action === 'late-arrival' && '⏰'}
                    </div>
                    <div className="activity-details">
                      <div className="activity-employee">{activity.employee}</div>
                      <div className="activity-action">
                        {activity.action === 'checked-in' && 'נכנס לעבודה'}
                        {activity.action === 'checked-out' && 'יצא מהעבודה'}
                        {activity.action === 'fraud-alert' && 'התראת הונאה'}
                        {activity.action === 'late-arrival' && 'איחור'}
                      </div>
                      <div className="activity-location">{activity.location}</div>
                    </div>
                    <div className="activity-time">{activity.time}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Fraud Alerts */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3>🚨 התראות הונאה</h3>
            </div>
            <div className="card-content">
              <div className="fraud-list">
                {fraudAlerts.map(alert => (
                  <div key={alert.id} className={`fraud-item ${alert.severity.toLowerCase()}`} onClick={() => handleFraudAlertClick(alert.id)}>
                    <div className="fraud-icon">
                      {alert.severity === 'HIGH' && '🔴'}
                      {alert.severity === 'MEDIUM' && '🟡'}
                      {alert.severity === 'LOW' && '🟢'}
                    </div>
                    <div className="fraud-details">
                      <div className="fraud-employee">{alert.employee}</div>
                      <div className="fraud-type">{alert.type}</div>
                      <div className="fraud-description">{alert.description}</div>
                    </div>
                    <div className="fraud-time">{alert.time}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="dashboard-right">
          {/* Quick Actions */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3>⚡ פעולות מהירות</h3>
            </div>
            <div className="card-content">
              <div className="quick-actions">
                <button className="action-btn primary" onClick={() => handleQuickAction('reports')}>
                  <span className="btn-icon">📊</span>
                  <span className="btn-text">דוח נוכחות</span>
                </button>
                <button className="action-btn secondary" onClick={() => handleQuickAction('map')}>
                  <span className="btn-icon">🗺️</span>
                  <span className="btn-text">מפת עובדים</span>
                </button>
                <button className="action-btn warning" onClick={() => handleQuickAction('fraud')}>
                  <span className="btn-icon">🚨</span>
                  <span className="btn-text">התראות הונאה</span>
                </button>
                <button className="action-btn success" onClick={() => handleQuickAction('settings')}>
                  <span className="btn-icon">⚙️</span>
                  <span className="btn-text">הגדרות</span>
                </button>
                <button className="action-btn info" onClick={() => handleQuickAction('employees')}>
                  <span className="btn-icon">👥</span>
                  <span className="btn-text">ניהול עובדים</span>
                </button>
                <button className="action-btn primary" onClick={() => handleQuickAction('attendance')}>
                  <span className="btn-icon">📋</span>
                  <span className="btn-text">נוכחות</span>
                </button>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3>🔧 סטטוס מערכת</h3>
            </div>
            <div className="card-content">
              <div className="system-status">
                <div className="status-item">
                  <div className="status-label">GPS Tracking</div>
                  <div className="status-indicator active">🟢 פעיל</div>
                </div>
                <div className="status-item">
                  <div className="status-label">Fraud Detection</div>
                  <div className="status-indicator active">🟢 פעיל</div>
                </div>
                <div className="status-item">
                  <div className="status-label">Face Recognition</div>
                  <div className="status-indicator active">🟢 פעיל</div>
                </div>
                <div className="status-item">
                  <div className="status-label">Notifications</div>
                  <div className="status-indicator active">🟢 פעיל</div>
                </div>
              </div>
            </div>
          </div>

          {/* Attendance Chart Placeholder */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3>📈 גרף נוכחות</h3>
            </div>
            <div className="card-content">
              <div className="chart-placeholder">
                <div className="chart-icon">📊</div>
                <div className="chart-text">גרף נוכחות שבועי</div>
                <div className="chart-subtext">7 ימים אחרונים</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
