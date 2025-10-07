import React, { useState, useEffect } from 'react';
import './styles/Reports.css';

const Reports = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [reportType, setReportType] = useState('attendance');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  // נתונים לדוגמה
  const sampleData = {
    attendance: {
      week: {
        labels: ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'],
        datasets: [
          {
            label: 'נוכחות',
            data: [95, 87, 92, 89, 94, 78, 0],
            backgroundColor: 'rgba(0, 102, 221, 0.2)',
            borderColor: 'rgba(0, 102, 221, 1)',
            borderWidth: 2
          },
          {
            label: 'איחורים',
            data: [5, 13, 8, 11, 6, 22, 0],
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 2
          }
        ]
      },
      month: {
        labels: ['שבוע 1', 'שבוע 2', 'שבוע 3', 'שבוע 4'],
        datasets: [
          {
            label: 'נוכחות ממוצעת',
            data: [92, 88, 95, 91],
            backgroundColor: 'rgba(0, 102, 221, 0.2)',
            borderColor: 'rgba(0, 102, 221, 1)',
            borderWidth: 2
          }
        ]
      }
    },
    productivity: {
      week: {
        labels: ['מחלקה א', 'מחלקה ב', 'מחלקה ג', 'מחלקה ד'],
        datasets: [
          {
            label: 'תפוקה',
            data: [85, 92, 78, 88],
            backgroundColor: [
              'rgba(255, 99, 132, 0.8)',
              'rgba(54, 162, 235, 0.8)',
              'rgba(255, 205, 86, 0.8)',
              'rgba(75, 192, 192, 0.8)'
            ]
          }
        ]
      }
    },
    location: {
      week: {
        labels: ['אזור A', 'אזור B', 'אזור C', 'אזור D'],
        datasets: [
          {
            label: 'זמן באזור (שעות)',
            data: [8.5, 7.2, 6.8, 5.5],
            backgroundColor: [
              'rgba(255, 99, 132, 0.8)',
              'rgba(54, 162, 235, 0.8)',
              'rgba(255, 205, 86, 0.8)',
              'rgba(75, 192, 192, 0.8)'
            ]
          }
        ]
      }
    }
  };

  useEffect(() => {
    setLoading(true);
    // סימולציה של טעינת נתונים
    setTimeout(() => {
      const currentData = sampleData[reportType] && sampleData[reportType][selectedPeriod];
      if (currentData) {
        setData(currentData);
      } else {
        // נתונים ברירת מחדל אם אין נתונים
        setData({
          labels: ['אין נתונים'],
          datasets: [{
            label: 'אין נתונים',
            data: [0],
            backgroundColor: 'rgba(128, 128, 128, 0.2)',
            borderColor: 'rgba(128, 128, 128, 1)',
            borderWidth: 2
          }]
        });
      }
      setLoading(false);
    }, 500);
  }, [reportType, selectedPeriod]);

  const handleExportReport = () => {
    // לוגיקה לייצוא דוח
    alert('הדוח יוצא בהצלחה!');
  };

  const handlePrintReport = () => {
    window.print();
  };

  const handleBackToManager = () => {
    window.location.href = '/manager';
  };

  return (
    <div className="reports-container">
      <div className="reports-header">
        <div className="header-left">
          <button className="back-to-manager-btn" onClick={handleBackToManager}>
            ← חזור ללוח בקרה
          </button>
          <div className="header-title">
            <h1>📊 דוחות מתקדמים</h1>
            <p>ניתוח נתונים וסטטיסטיקות מפורטות</p>
          </div>
        </div>
      </div>

      <div className="reports-controls">
        <div className="control-group">
          <label>סוג דוח:</label>
          <select 
            value={reportType} 
            onChange={(e) => setReportType(e.target.value)}
            className="report-select"
          >
            <option value="attendance">נוכחות</option>
            <option value="productivity">תפוקה</option>
            <option value="location">מיקום</option>
            <option value="overtime">שעות נוספות</option>
            <option value="breaks">הפסקות</option>
          </select>
        </div>

        <div className="control-group">
          <label>תקופה:</label>
          <select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="period-select"
          >
            <option value="week">שבוע</option>
            <option value="month">חודש</option>
            <option value="quarter">רבעון</option>
            <option value="year">שנה</option>
          </select>
        </div>

        <div className="control-group">
          <button className="btn-export" onClick={handleExportReport}>
            📤 ייצא דוח
          </button>
          <button className="btn-print" onClick={handlePrintReport}>
            🖨️ הדפס
          </button>
        </div>
      </div>

      <div className="reports-content">
        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <h3>סה"כ עובדים</h3>
              <p className="stat-number">127</p>
              <span className="stat-change positive">+5%</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <h3>נוכחות ממוצעת</h3>
              <p className="stat-number">91.2%</p>
              <span className="stat-change positive">+2.1%</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⏰</div>
            <div className="stat-info">
              <h3>איחורים ממוצעים</h3>
              <p className="stat-number">8.5%</p>
              <span className="stat-change negative">-1.2%</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-info">
              <h3>תפוקה ממוצעת</h3>
              <p className="stat-number">87.3%</p>
              <span className="stat-change positive">+3.4%</span>
            </div>
          </div>
        </div>

        <div className="chart-container">
          <div className="chart-header">
            <h3>גרף {reportType === 'attendance' ? 'נוכחות' : 
                      reportType === 'productivity' ? 'תפוקה' : 
                      reportType === 'location' ? 'מיקום' : 'נתונים'}</h3>
            <div className="chart-controls">
              <button className="chart-btn active">📊 עמודות</button>
              <button className="chart-btn">📈 קו</button>
              <button className="chart-btn">🥧 עוגה</button>
            </div>
          </div>
          
          <div className="chart-placeholder">
            {loading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>טוען נתונים...</p>
              </div>
            ) : data ? (
              <div className="chart-mock">
                <div className="chart-bars">
                  {data.datasets[0]?.data.map((value, index) => (
                    <div key={index} className="chart-bar">
                      <div 
                        className="bar-fill" 
                        style={{ 
                          height: `${(value / Math.max(...data.datasets[0].data)) * 100}%`,
                          backgroundColor: data.datasets[0].backgroundColor
                        }}
                      ></div>
                      <span className="bar-label">{data.labels[index]}</span>
                      <span className="bar-value">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="no-data">
                <p>אין נתונים להצגה</p>
              </div>
            )}
          </div>
        </div>

        <div className="detailed-stats">
          <div className="stats-section">
            <h3>📋 סיכום מפורט</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">שעות עבודה סה"כ:</span>
                <span className="stat-value">1,247 שעות</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">שעות נוספות:</span>
                <span className="stat-value">89 שעות</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">הפסקות ממוצעות:</span>
                <span className="stat-value">45 דקות</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">יעילות ממוצעת:</span>
                <span className="stat-value">87.3%</span>
              </div>
            </div>
          </div>

          <div className="alerts-section">
            <h3>⚠️ התראות ובעיות</h3>
            <div className="alerts-list">
              <div className="alert-item warning">
                <span className="alert-icon">⚠️</span>
                <span className="alert-text">3 עובדים עם איחורים חוזרים</span>
              </div>
              <div className="alert-item info">
                <span className="alert-icon">ℹ️</span>
                <span className="alert-text">תפוקה גבוהה במחלקה ב</span>
              </div>
              <div className="alert-item success">
                <span className="alert-icon">✅</span>
                <span className="alert-text">נוכחות מעולה השבוע</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;

