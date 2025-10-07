// קומפוננט מפה פשוטה
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './styles/Map.css';

const Map = ({ location, polygons = [], attendanceData = [] }) => {
  const { t } = useTranslation();
  const [showAttendance, setShowAttendance] = useState(false);
  const [mapError, setMapError] = useState(false);

  // נתוני נוכחות לדוגמה
  const sampleAttendanceData = [
    { id: 1, name: 'יוסי כהן', lat: 31.6695, lng: 34.5716, status: 'checked-in', time: '08:30' },
    { id: 2, name: 'שרה לוי', lat: 31.6690, lng: 34.5710, status: 'checked-in', time: '08:45' },
    { id: 3, name: 'דוד כהן', lat: 31.6688, lng: 34.5720, status: 'checked-out', time: '17:30' },
    { id: 4, name: 'רחל אברהם', lat: 31.6700, lng: 34.5712, status: 'checked-in', time: '09:00' },
  ];

  // שילוב נתוני נוכחות
  const allAttendanceData = [...sampleAttendanceData, ...attendanceData];

  // מיקום המפעל - חוצות היוצר באשקלון
  const factoryLocation = { lat: 31.6693, lng: 34.5714 };
  const mapCenter = location || factoryLocation;

  // יצירת מפת לווין אמיתית עם OpenStreetMap
  const createMapDisplay = () => {
    const centerLat = mapCenter.lat;
    const centerLng = mapCenter.lng;
    const zoom = 17;
    
    // פוליגון מרכזי למפעל
    const mainFactoryPolygon = [
      [centerLat - 0.001, centerLng - 0.001],
      [centerLat - 0.001, centerLng + 0.001],
      [centerLat + 0.001, centerLng + 0.001],
      [centerLat + 0.001, centerLng - 0.001],
      [centerLat - 0.001, centerLng - 0.001]
    ];

    // 5 פוליגונים למחלקות
    const departmentPolygons = [
      {
        name: 'מחלקת ייצור',
        color: '#ff6b6b',
        coords: [
          [centerLat - 0.0008, centerLng - 0.0008],
          [centerLat - 0.0008, centerLng - 0.0002],
          [centerLat - 0.0002, centerLng - 0.0002],
          [centerLat - 0.0002, centerLng - 0.0008],
          [centerLat - 0.0008, centerLng - 0.0008]
        ]
      },
      {
        name: 'מחלקת איכות',
        color: '#4ecdc4',
        coords: [
          [centerLat - 0.0008, centerLng + 0.0002],
          [centerLat - 0.0008, centerLng + 0.0008],
          [centerLat - 0.0002, centerLng + 0.0008],
          [centerLat - 0.0002, centerLng + 0.0002],
          [centerLat - 0.0008, centerLng + 0.0002]
        ]
      },
      {
        name: 'מחלקת לוגיסטיקה',
        color: '#45b7d1',
        coords: [
          [centerLat + 0.0002, centerLng - 0.0008],
          [centerLat + 0.0002, centerLng - 0.0002],
          [centerLat + 0.0008, centerLng - 0.0002],
          [centerLat + 0.0008, centerLng - 0.0008],
          [centerLat + 0.0002, centerLng - 0.0008]
        ]
      },
      {
        name: 'מחלקת מחקר',
        color: '#96ceb4',
        coords: [
          [centerLat + 0.0002, centerLng + 0.0002],
          [centerLat + 0.0002, centerLng + 0.0008],
          [centerLat + 0.0008, centerLng + 0.0008],
          [centerLat + 0.0008, centerLng + 0.0002],
          [centerLat + 0.0002, centerLng + 0.0002]
        ]
      },
      {
        name: 'מחלקת ניהול',
        color: '#feca57',
        coords: [
          [centerLat - 0.0003, centerLng - 0.0003],
          [centerLat - 0.0003, centerLng + 0.0003],
          [centerLat + 0.0003, centerLng + 0.0003],
          [centerLat + 0.0003, centerLng - 0.0003],
          [centerLat - 0.0003, centerLng - 0.0003]
        ]
      }
    ];

    return (
      <div className="satellite-map">
        {!mapError ? (
          /* Google Maps iframe */
          <iframe
            src="https://maps.google.com/maps?q=חוצות+היוצר+44+אשקלון&t=k&z=14&output=embed"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Google Maps Satellite - חוצות היוצר 44 אשקלון"
            onError={() => setMapError(true)}
          ></iframe>
        ) : (
          /* Fallback - מפה פשוטה */
          <div className="fallback-map">
            <div className="fallback-header">
              <h4>📍 מפעל חוצות היוצר 44, אשקלון</h4>
              <p>קואורדינטות: 31.6693°N, 34.5714°E</p>
            </div>
            <div className="fallback-content">
              <div className="factory-location">
                <div className="factory-marker">🏭</div>
                <div className="factory-name">Wolfman Industries</div>
              </div>
              <div className="departments-fallback">
                <div className="dept-item">🔴 מחלקת ייצור</div>
                <div className="dept-item">🔵 מחלקת איכות</div>
                <div className="dept-item">🟢 מחלקת מחקר</div>
                <div className="dept-item">🟠 מחלקת ניהול</div>
                <div className="dept-item">🟦 מחלקת לוגיסטיקה</div>
              </div>
            </div>
          </div>
        )}
        
        {/* פוליגון מרכזי */}
        <div className="main-factory-polygon">
          <div className="polygon-label">מפעל מרכזי</div>
        </div>

        {/* פוליגונים למחלקות */}
        {departmentPolygons.map((dept, index) => (
          <div 
            key={index}
            className="department-polygon"
            style={{ 
              backgroundColor: dept.color,
              left: `${20 + (index % 3) * 25}%`,
              top: `${30 + Math.floor(index / 3) * 30}%`
            }}
          >
            <div className="polygon-label">{dept.name}</div>
          </div>
        ))}

        {/* מרקרים של עובדים */}
        {showAttendance && allAttendanceData.map((employee, index) => (
          <div 
            key={employee.id}
            className={`employee-marker ${employee.status}`}
            style={{
              left: `${15 + (index * 12)}%`,
              top: `${20 + (index % 4) * 15}%`
            }}
            title={`${employee.name} - ${employee.status === 'checked-in' ? 'נוכח' : 'יצא'}`}
          >
            {index + 1}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="map-container">
      {/* כותרת המפה */}
      <div className="map-header">
        <h3>🛰️ מפת לווין - מפעל חוצות היוצר 44 אשקלון</h3>
        <div className="map-location">📍 חוצות היוצר 44, אשקלון, ישראל</div>
      <div className="map-controls">
        <button 
          className={`control-button ${showAttendance ? 'active' : ''}`}
          onClick={() => setShowAttendance(!showAttendance)}
        >
            {showAttendance ? 'הסתר נוכחות' : 'הצג נוכחות'}
        </button>
        </div>
      </div>
      
      {/* המפה */}
      <div className="map-content">
        {createMapDisplay()}
      </div>
      
      {/* מקרא המפה */}
      <div className="map-legend">
        <h4>מקרא</h4>
          <div className="legend-items">
            <div className="legend-item">
              <div className="legend-color checked-in"></div>
            <span>עובד במפעל</span>
            </div>
            <div className="legend-item">
              <div className="legend-color checked-out"></div>
            <span>עובד מחוץ לאזור</span>
            </div>
          <div className="legend-item">
            <div className="legend-color work-area"></div>
            <span>אזור עבודה</span>
          </div>
        </div>
      </div>

      {/* רשימת עובדים */}
      {showAttendance && (
        <div className="attendance-list">
          <h4>רשימת עובדים</h4>
          <div className="employee-list">
            {allAttendanceData.map((employee) => (
              <div key={employee.id} className="employee-item">
                <div className={`status-indicator ${employee.status}`}></div>
                <div className="employee-info">
                  <span className="employee-name">{employee.name}</span>
                  <span className="employee-time">{employee.time}</span>
                </div>
                <div className={`employee-status ${employee.status}`}>
                  {employee.status === 'checked-in' ? 'נוכח' : 'יצא'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Map;