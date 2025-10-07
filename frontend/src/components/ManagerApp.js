// קומפוננט אפליקציית מנהל
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Map from './Map';
import Reports from './Reports';
import Notifications from './Notifications';
import './styles/ManagerApp.css';
import { updateCompanySettings, loadCompanySettings, resetCompanySettings, getCompanyName } from '../config/companySettings';

const ManagerApp = () => {
  const { t } = useTranslation();
  const [currentView, setCurrentView] = useState('dashboard');

  // Check URL parameters for view
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const viewParam = urlParams.get('view');
    if (viewParam) {
      setCurrentView(viewParam);
    }
  }, []);
  
  // State for new employee registration
  const [newEmployee, setNewEmployee] = useState({
    firstName: '',
    lastName: '',
    idNumber: '',
    birthDate: '',
    email: '',
    phone: '',
    address: '',
    emergencyPhone: '',
    department: '',
    position: '',
    startDate: '',
    employeeType: '',
    workPermitExpiry: '',
    workPermitNumber: '',
    visaExpiry: '',
    visaNumber: '',
    photo: null,
    documents: [],
    registrationToken: null
  });
  const [employees, setEmployees] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [fraudAlerts, setFraudAlerts] = useState([]);
  // const [loading, setLoading] = useState(false); // יוסר בעתיד

  // Employee registration functions
  const handleEmployeeRegistration = async (e) => {
    e.preventDefault();
    
    try {
      // Validate required fields
      if (!newEmployee.firstName || !newEmployee.lastName || !newEmployee.email || !newEmployee.phone) {
        alert('אנא מלא את כל השדות הנדרשים');
        return;
      }

      // Create employee data
      const employeeData = {
        ...newEmployee,
        displayName: `${newEmployee.firstName} ${newEmployee.lastName}`,
        role: 'employee',
        isActive: true,
        createdAt: new Date().toISOString(),
        registrationToken: newEmployee.registrationToken || generateRegistrationToken()
      };

      // Send to backend
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(employeeData)
      });

      if (response.ok) {
        alert('עובד נרשם בהצלחה! קישור לאפליקציה נשלח למייל');
        setCurrentView('employees');
        resetNewEmployeeForm();
      } else {
        const error = await response.json();
        alert(`שגיאה ברישום: ${error.error}`);
      }
    } catch (error) {
      console.error('Error registering employee:', error);
      alert('שגיאה ברישום העובד');
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setNewEmployee({...newEmployee, photo: e.target.result});
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = () => {
    // This would integrate with device camera
    alert('פונקציית צילום תמונה תהיה זמינה בקרוב');
  };

  const handleDocumentScan = () => {
    // This would integrate with document scanning
    alert('פונקציית סריקת מסמכים תהיה זמינה בקרוב');
  };

  const handleDocumentUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const newDoc = {
          name: file.name,
          type: file.type,
          size: file.size,
          status: 'מוכן',
          file: file
        };
        setNewEmployee({
          ...newEmployee, 
          documents: [...newEmployee.documents, newDoc]
        });
      }
    };
    input.click();
  };

  const removeDocument = (index) => {
    const updatedDocs = newEmployee.documents.filter((_, i) => i !== index);
    setNewEmployee({...newEmployee, documents: updatedDocs});
  };

  const generateAppLink = () => {
    const token = generateRegistrationToken();
    setNewEmployee({...newEmployee, registrationToken: token});
    alert('קישור לאפליקציה נוצר בהצלחה!');
  };

  const sendAppLink = () => {
    if (!newEmployee.registrationToken) {
      alert('אנא צור קישור לאפליקציה קודם');
      return;
    }

    const appLink = `${window.location.origin}/employee?token=${newEmployee.registrationToken}`;
    
    // This would integrate with email service
    alert(`קישור לאפליקציה נשלח למייל: ${newEmployee.email}\n\nקישור: ${appLink}`);
  };

  const generateRegistrationToken = () => {
    return 'EMP_' + Math.random().toString(36).substr(2, 9).toUpperCase();
  };

  const resetNewEmployeeForm = () => {
    setNewEmployee({
      firstName: '',
      lastName: '',
      idNumber: '',
      birthDate: '',
      email: '',
      phone: '',
      address: '',
      emergencyPhone: '',
      department: '',
      position: '',
      startDate: '',
      employeeType: '',
      workPermitExpiry: '',
      workPermitNumber: '',
      visaExpiry: '',
      visaNumber: '',
      photo: null,
      documents: [],
      registrationToken: null
    });
  };

  // נתוני נוכחות לדוגמה
  const sampleAttendanceData = [
    { id: 1, name: 'יוסי כהן', lat: 32.0853, lng: 34.7818, status: 'checked-in', time: '08:30' },
    { id: 2, name: 'שרה לוי', lat: 32.0863, lng: 34.7828, status: 'checked-in', time: '08:45' },
    { id: 3, name: 'דוד ישראלי', lat: 32.0843, lng: 34.7808, status: 'checked-out', time: '17:00' }
  ];

  // פונקציות לניהול הגדרות
  const handleSaveSettings = () => {
    const settings = {
      company: {
        name: document.querySelector('input[placeholder="ולפמן תעשיות"]')?.value || 'ולפמן תעשיות',
        industry: document.querySelector('input[placeholder="ייצור מתכת"]')?.value || 'ייצור מתכת',
        address: document.querySelector('input[placeholder="רחוב התעשייה 123, תל אביב"]')?.value || 'רחוב התעשייה 123, תל אביב',
        phone: document.querySelector('input[placeholder="03-1234567"]')?.value || '03-1234567',
        email: document.querySelector('input[placeholder="info@wolfman.co.il"]')?.value || 'info@wolfman.co.il',
        website: document.querySelector('input[placeholder="https://www.wolfman.co.il"]')?.value || 'https://www.wolfman.co.il'
      },
      branding: {
        primaryColor: document.querySelector('input[type="color"]')?.value || '#004466',
        secondaryColor: document.querySelectorAll('input[type="color"]')[1]?.value || '#0066dd'
      },
      system: {
        language: document.querySelector('select[defaultValue="he"]')?.value || 'he',
        timezone: document.querySelector('select[defaultValue="Asia/Jerusalem"]')?.value || 'Asia/Jerusalem',
        distanceUnit: document.querySelector('select[defaultValue="km"]')?.value || 'km',
        dateFormat: document.querySelector('select[defaultValue="dd/mm/yyyy"]')?.value || 'dd/mm/yyyy'
      },
      security: {
        securityLevel: document.querySelector('select[defaultValue="medium"]')?.value || 'medium',
        passwordExpiryDays: parseInt(document.querySelector('input[placeholder="90"]')?.value) || 90,
        twoFactorAuth: document.getElementById('two-factor')?.checked || false,
        biometricAuth: document.getElementById('biometric')?.checked || false
      }
    };
    
    updateCompanySettings(settings);
    alert('הגדרות נשמרו בהצלחה!');
  };

  const handleResetSettings = () => {
    // eslint-disable-next-line no-restricted-globals
    if (confirm('האם אתה בטוח שברצונך לאפס את כל ההגדרות?')) {
      resetCompanySettings();
      alert('הגדרות אופסו בהצלחה!');
      window.location.reload();
    }
  };

  const handlePreviewSettings = () => {
    alert('תצוגה מקדימה - האפליקציה תתעדכן עם ההגדרות החדשות');
    // כאן ניתן להוסיף לוגיקה לתצוגה מקדימה
  };

  useEffect(() => {
    // טעינת נתוני עובדים ונוכחות
    loadEmployees();
    loadAttendanceData();
    loadFraudAlerts();
  }, []);

  const loadEmployees = async () => {
    try {
      // כאן יהיה קריאה ל-API לקבלת רשימת עובדים
      setEmployees([
        { id: 1, name: 'יוסי כהן', department: 'ייצור', status: 'checked-in' },
        { id: 2, name: 'שרה לוי', department: 'מכירות', status: 'checked-out' },
        { id: 3, name: 'דוד ישראלי', department: 'ייצור', status: 'checked-in' }
      ]);
    } catch (error) {
      console.error('שגיאה בטעינת עובדים:', error);
    }
  };

  const loadAttendanceData = async () => {
    try {
      // כאן יהיה קריאה ל-API לקבלת נתוני נוכחות
      setAttendanceData([
        { date: '2024-01-01', totalEmployees: 25, present: 23, absent: 2 },
        { date: '2024-01-02', totalEmployees: 25, present: 24, absent: 1 },
        { date: '2024-01-03', totalEmployees: 25, present: 22, absent: 3 }
      ]);
    } catch (error) {
      console.error('שגיאה בטעינת נתוני נוכחות:', error);
    }
  };

  const loadFraudAlerts = async () => {
    try {
      // כאן יהיה קריאה ל-API לקבלת התראות הונאה
      setFraudAlerts([
        { id: 1, employee: 'יוסי כהן', type: 'GPS Jump', time: '10:30', severity: 'high' },
        { id: 2, employee: 'שרה לוי', type: 'Stagnation', time: '14:15', severity: 'medium' }
      ]);
    } catch (error) {
      console.error('שגיאה בטעינת התראות הונאה:', error);
    }
  };

  return (
    <div className="manager-app">
      <header className="app-header">
        <h1>לוח בקרה - {getCompanyName()}</h1>
        <div className="header-stats">
          <div className="stat">
            <span className="stat-number">{employees.length}</span>
            <span className="stat-label">עובדים</span>
          </div>
          <div className="stat">
            <span className="stat-number">{employees.filter(e => e.status === 'checked-in').length}</span>
            <span className="stat-label">נוכחים</span>
          </div>
          <div className="stat">
            <span className="stat-number">{fraudAlerts.length}</span>
            <span className="stat-label">התראות</span>
          </div>
        </div>
      </header>

      <nav className="app-nav">
        <button 
          className={currentView === 'dashboard' ? 'active' : ''}
          onClick={() => setCurrentView('dashboard')}
        >
          לוח בקרה
        </button>
        <button 
          className={currentView === 'main-dashboard' ? 'active' : ''}
          onClick={() => window.location.href = '/dashboard'}
        >
          📊 Dashboard
        </button>
        <button 
          className={currentView === 'employees' ? 'active' : ''}
          onClick={() => setCurrentView('employees')}
        >
          עובדים
        </button>
        <button 
          className={currentView === 'reports' ? 'active' : ''}
          onClick={() => setCurrentView('reports')}
        >
          {t('reports')}
        </button>
        <button 
          className={currentView === 'map' ? 'active' : ''}
          onClick={() => setCurrentView('map')}
        >
          מפה
        </button>
        <button 
          className={currentView === 'polygons' ? 'active' : ''}
          onClick={() => setCurrentView('polygons')}
        >
          הגדרת אזורים
        </button>
        <button 
          className={currentView === 'alerts' ? 'active' : ''}
          onClick={() => setCurrentView('alerts')}
        >
          התראות
        </button>
        <button 
          className={currentView === 'installation' ? 'active' : ''}
          onClick={() => setCurrentView('installation')}
        >
          לינק התקנה
        </button>
        <button 
          className={currentView === 'developer' ? 'active' : ''}
          onClick={() => setCurrentView('developer')}
        >
          🔧 מפתח
        </button>
      </nav>

      <main className="app-main">
        {currentView === 'dashboard' && (
          <div className="dashboard">
            {/* Stats Cards */}
            <div className="stats-cards">
              <div className="stat-card">
                <div className="stat-icon">⏰</div>
                <div className="stat-content">
                  <div className="stat-value">8.4 שעות</div>
                  <div className="stat-label">זמן ממוצע במפעל</div>
                  <div className="stat-subtitle">היום</div>
                  <div className="stat-trend">+0.7 שעות היום</div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">⚠️</div>
                <div className="stat-content">
                  <div className="stat-value">{fraudAlerts.length}</div>
                  <div className="stat-label">התראות קריטיות</div>
                  <div className="stat-trend">-3 מהשבוע</div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-content">
                  <div className="stat-value">{employees.filter(e => e.status === 'checked-in').length}</div>
                  <div className="stat-label">עובדים נוכחים</div>
                  <div className="stat-subtitle">{Math.round((employees.filter(e => e.status === 'checked-in').length / employees.length) * 100)}% נוכחות</div>
                  <div className="stat-trend">+15% מאתמול</div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon">👤</div>
                <div className="stat-content">
                  <div className="stat-value">{employees.length}</div>
                  <div className="stat-label">סה"כ עובדים</div>
                  <div className="stat-trend">+12 השבוע</div>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="dashboard-grid">
              {/* Left Side Panels */}
              <div className="left-panels">
                <div className="dashboard-card">
                  <h3>התראות Anti-Fraud</h3>
                  <div className="fraud-alerts">
                    {fraudAlerts.map(alert => (
                      <div key={alert.id} className="fraud-alert-item">
                        <div className="alert-icon">🛡️</div>
                        <div className="alert-content">
                          <div className="alert-employee">{alert.employee}</div>
                          <div className="alert-type">התראה לא ידועה</div>
                          <div className="alert-time">בעוד כשעה</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="dashboard-card">
                  <h3>אשרות בתהליך פקיעה</h3>
                  <div className="expiry-info">
                    <div className="expiry-icon">📄</div>
                    <div className="expiry-text">אין אשרות שפגות בקרוב.</div>
                  </div>
                </div>
              </div>

              {/* Main Map */}
              <div className="main-map">
                <div className="dashboard-card map-card">
                  <h3>מפת מיקום חיה</h3>
                  <div className="map-container">
                    <Map 
                      location={{ lat: 32.0853, lng: 34.7818 }}
                      polygons={[]}
                      attendanceData={sampleAttendanceData}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'employees' && (
          <div className="employees-view">
            <div className="employees-header">
              <h2>ניהול עובדים</h2>
              <button className="add-employee-btn" onClick={() => setCurrentView('add-employee')}>
                + הוסף עובד חדש
              </button>
            </div>
            
            <div className="employees-table-container">
              <table className="employees-table">
                <thead>
                  <tr>
                    <th>שם מלא</th>
                    <th>אימייל</th>
                    <th>מחלקה</th>
                    <th>תפקיד</th>
                    <th>סטטוס</th>
                    <th>פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map(employee => (
                    <tr key={employee.id}>
                      <td>
                        <div className="employee-info">
                          <div className="employee-avatar-small">
                            {employee.name.charAt(0)}
                          </div>
                          <span>{employee.name}</span>
                        </div>
                      </td>
                      <td>{employee.email || 'employee@wolfman.co.il'}</td>
                      <td>{employee.department}</td>
                      <td>{employee.position || 'עובד'}</td>
                      <td>
                        <span className={`status-badge ${employee.status}`}>
                          {employee.status === 'checked-in' ? '🟢 נוכח' : '🔴 לא נוכח'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn-edit">ערוך</button>
                          <button className="btn-delete">מחק</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {currentView === 'add-employee' && (
          <div className="add-employee-view">
            <div className="add-employee-header">
              <h2>📝 רישום עובד חדש</h2>
              <button className="back-btn" onClick={() => setCurrentView('employees')}>
                ← חזור לרשימה
              </button>
            </div>
            
            <div className="employee-form-container">
              <form className="employee-form" onSubmit={handleEmployeeRegistration}>
                {/* פרטים אישיים */}
                <div className="form-section">
                  <h3>👤 פרטים אישיים</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>שם פרטי *</label>
                      <input 
                        type="text" 
                        placeholder="הכנס שם פרטי" 
                        value={newEmployee.firstName}
                        onChange={(e) => setNewEmployee({...newEmployee, firstName: e.target.value})}
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label>שם משפחה *</label>
                      <input 
                        type="text" 
                        placeholder="הכנס שם משפחה" 
                        value={newEmployee.lastName}
                        onChange={(e) => setNewEmployee({...newEmployee, lastName: e.target.value})}
                        required 
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>תעודת זהות *</label>
                      <input 
                        type="text" 
                        placeholder="123456789" 
                        value={newEmployee.idNumber}
                        onChange={(e) => setNewEmployee({...newEmployee, idNumber: e.target.value})}
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label>תאריך לידה *</label>
                      <input 
                        type="date" 
                        value={newEmployee.birthDate}
                        onChange={(e) => setNewEmployee({...newEmployee, birthDate: e.target.value})}
                        required 
                      />
                    </div>
                  </div>
                </div>

                {/* פרטי קשר */}
                <div className="form-section">
                  <h3>📞 פרטי קשר</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>אימייל *</label>
                      <input 
                        type="email" 
                        placeholder="employee@wolfman.co.il" 
                        value={newEmployee.email}
                        onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label>טלפון *</label>
                      <input 
                        type="tel" 
                        placeholder="050-1234567" 
                        value={newEmployee.phone}
                        onChange={(e) => setNewEmployee({...newEmployee, phone: e.target.value})}
                        required 
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>כתובת מגורים</label>
                      <input 
                        type="text" 
                        placeholder="רחוב, עיר, מיקוד" 
                        value={newEmployee.address}
                        onChange={(e) => setNewEmployee({...newEmployee, address: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>טלפון חירום</label>
                      <input 
                        type="tel" 
                        placeholder="050-9876543" 
                        value={newEmployee.emergencyPhone}
                        onChange={(e) => setNewEmployee({...newEmployee, emergencyPhone: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* פרטי עבודה */}
                <div className="form-section">
                  <h3>💼 פרטי עבודה</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>מחלקה *</label>
                      <select 
                        value={newEmployee.department}
                        onChange={(e) => setNewEmployee({...newEmployee, department: e.target.value})}
                        required
                      >
                        <option value="">בחר מחלקה</option>
                        <option value="ייצור">ייצור</option>
                        <option value="איכות">איכות</option>
                        <option value="מחקר">מחקר</option>
                        <option value="ניהול">ניהול</option>
                        <option value="לוגיסטיקה">לוגיסטיקה</option>
                        <option value="מכירות">מכירות</option>
                        <option value="שיווק">שיווק</option>
                        <option value="משאבי אנוש">משאבי אנוש</option>
                        <option value="IT">IT</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>תפקיד *</label>
                      <input 
                        type="text" 
                        placeholder="הכנס תפקיד" 
                        value={newEmployee.position}
                        onChange={(e) => setNewEmployee({...newEmployee, position: e.target.value})}
                        required 
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>תאריך התחלה *</label>
                      <input 
                        type="date" 
                        value={newEmployee.startDate}
                        onChange={(e) => setNewEmployee({...newEmployee, startDate: e.target.value})}
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label>סוג עובד *</label>
                      <select 
                        value={newEmployee.employeeType}
                        onChange={(e) => setNewEmployee({...newEmployee, employeeType: e.target.value})}
                        required
                      >
                        <option value="">בחר סוג עובד</option>
                        <option value="עובד רגיל">עובד רגיל</option>
                        <option value="מנהל">מנהל</option>
                        <option value="סטאז\'ר">סטאז\'ר</option>
                        <option value="עובד זמני">עובד זמני</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* מסמכים ואשרות */}
                <div className="form-section">
                  <h3>📄 מסמכים ואשרות</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>תוקף אשרת עבודה</label>
                      <input 
                        type="date" 
                        value={newEmployee.workPermitExpiry}
                        onChange={(e) => setNewEmployee({...newEmployee, workPermitExpiry: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>מספר אשרת עבודה</label>
                      <input 
                        type="text" 
                        placeholder="מספר אשרת עבודה" 
                        value={newEmployee.workPermitNumber}
                        onChange={(e) => setNewEmployee({...newEmployee, workPermitNumber: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>תוקף ויזה</label>
                      <input 
                        type="date" 
                        value={newEmployee.visaExpiry}
                        onChange={(e) => setNewEmployee({...newEmployee, visaExpiry: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>מספר ויזה</label>
                      <input 
                        type="text" 
                        placeholder="מספר ויזה" 
                        value={newEmployee.visaNumber}
                        onChange={(e) => setNewEmployee({...newEmployee, visaNumber: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* תמונת עובד */}
                <div className="form-section">
                  <h3>📸 תמונת עובד</h3>
                  <div className="photo-upload-section">
                    <div className="photo-preview">
                      {newEmployee.photo ? (
                        <img src={newEmployee.photo} alt="תמונת עובד" className="employee-photo" />
                      ) : (
                        <div className="photo-placeholder">
                          <span>📷</span>
                          <p>אין תמונה</p>
                        </div>
                      )}
                    </div>
                    <div className="photo-actions">
                      <input 
                        type="file" 
                        id="photo-upload" 
                        accept="image/*" 
                        onChange={handlePhotoUpload}
                        style={{ display: 'none' }}
                      />
                      <label htmlFor="photo-upload" className="btn-upload-photo">
                        📷 העלה תמונה
                      </label>
                      <button 
                        type="button" 
                        className="btn-camera"
                        onClick={handleCameraCapture}
                      >
                        📱 צלם עכשיו
                      </button>
                    </div>
                  </div>
                </div>

                {/* סריקת מסמכים */}
                <div className="form-section">
                  <h3>📋 סריקת מסמכים</h3>
                  <div className="documents-section">
                    <div className="document-list">
                      {newEmployee.documents.map((doc, index) => (
                        <div key={index} className="document-item">
                          <span className="document-name">{doc.name}</span>
                          <span className="document-status">{doc.status}</span>
                          <button 
                            type="button" 
                            className="btn-remove-doc"
                            onClick={() => removeDocument(index)}
                          >
                            ❌
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="document-actions">
                      <button 
                        type="button" 
                        className="btn-scan-document"
                        onClick={handleDocumentScan}
                      >
                        📄 סרוק מסמך
                      </button>
                      <button 
                        type="button" 
                        className="btn-upload-document"
                        onClick={handleDocumentUpload}
                      >
                        📁 העלה מסמך
                      </button>
                    </div>
                  </div>
                </div>

                {/* שליחת קישור לאפליקציה */}
                <div className="form-section">
                  <h3>📱 שליחת קישור לאפליקציה</h3>
                  <div className="app-link-section">
                    <div className="link-preview">
                      <p><strong>קישור לאפליקציה:</strong></p>
                      <div className="app-link">
                        {window.location.origin}/employee?token={newEmployee.registrationToken || 'NEW_TOKEN'}
                      </div>
                    </div>
                    <div className="link-actions">
                      <button 
                        type="button" 
                        className="btn-generate-link"
                        onClick={generateAppLink}
                      >
                        🔗 צור קישור
                      </button>
                      <button 
                        type="button" 
                        className="btn-send-link"
                        onClick={sendAppLink}
                        disabled={!newEmployee.registrationToken}
                      >
                        📧 שלח קישור
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="form-actions">
                  <button type="button" className="btn-cancel" onClick={() => setCurrentView('employees')}>
                    ביטול
                  </button>
                  <button type="submit" className="btn-save">
                    💾 שמור עובד ושלח קישור
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {currentView === 'reports' && (
          <Reports />
        )}

        {currentView === 'map' && (
          <Map />
        )}

        {currentView === 'fraud' && (
          <div className="fraud-alerts-view">
            <div className="fraud-header">
              <h2>🚨 התראות הונאה</h2>
              <button className="back-btn" onClick={() => setCurrentView('dashboard')}>
                ← חזור ללוח בקרה
              </button>
            </div>
            
            <div className="fraud-content">
              <div className="fraud-summary">
                <div className="fraud-stat">
                  <h3>התראות פעילות</h3>
                  <p className="fraud-count">2</p>
                </div>
                <div className="fraud-stat">
                  <h3>רמת סיכון גבוהה</h3>
                  <p className="fraud-count">1</p>
                </div>
                <div className="fraud-stat">
                  <h3>רמת סיכון בינונית</h3>
                  <p className="fraud-count">1</p>
                </div>
              </div>
              
              <div className="fraud-list">
                <div className="fraud-item high">
                  <div className="fraud-icon">🔴</div>
                  <div className="fraud-details">
                    <h4>קפיצת GPS חריגה</h4>
                    <p>שרה לוי - מחלקת ייצור</p>
                    <span className="fraud-time">לפני 15 דקות</span>
                  </div>
                  <div className="fraud-actions">
                    <button className="btn-investigate">חקור</button>
                    <button className="btn-dismiss">סגור</button>
                  </div>
                </div>
                
                <div className="fraud-item medium">
                  <div className="fraud-icon">🟡</div>
                  <div className="fraud-details">
                    <h4>שינוי מכשיר חשוד</h4>
                    <p>אלי כהן - מחלקת איכות</p>
                    <span className="fraud-time">לפני 3 שעות</span>
                  </div>
                  <div className="fraud-actions">
                    <button className="btn-investigate">חקור</button>
                    <button className="btn-dismiss">סגור</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'polygons' && (
          <div className="polygons-view">
            <h2>הגדרת אזורי עבודה</h2>
            
            {/* פוליגון מרכזי למפעל */}
            <div className="polygon-section">
              <h3>🏭 אזור המפעל המרכזי</h3>
              <div className="polygon-card">
                <div className="polygon-info">
                  <div className="polygon-name">מפעל מרכזי - חוצות היוצר 44</div>
                  <div className="polygon-coords">
                    <span>צפון: 31.6703°</span>
                    <span>דרום: 31.6683°</span>
                    <span>מזרח: 34.5724°</span>
                    <span>מערב: 34.5704°</span>
                  </div>
                </div>
                <div className="polygon-actions">
                  <button className="btn-edit">ערוך</button>
                  <button className="btn-delete">מחק</button>
                </div>
              </div>
            </div>

            {/* פוליגונים למחלקות */}
            <div className="polygon-section">
              <h3>🏢 אזורי מחלקות</h3>
              <div className="departments-grid">
                {[
                  { name: 'מחלקת ייצור', color: '#ff6b6b', coords: '31.6685°-31.6695°, 34.5705°-34.5715°' },
                  { name: 'מחלקת איכות', color: '#4ecdc4', coords: '31.6685°-31.6695°, 34.5715°-34.5725°' },
                  { name: 'מחלקת לוגיסטיקה', color: '#45b7d1', coords: '31.6695°-31.6705°, 34.5705°-34.5715°' },
                  { name: 'מחלקת מחקר', color: '#96ceb4', coords: '31.6695°-31.6705°, 34.5715°-34.5725°' },
                  { name: 'מחלקת ניהול', color: '#feca57', coords: '31.6690°-31.6700°, 34.5710°-34.5720°' }
                ].map((dept, index) => (
                  <div key={index} className="department-card">
                    <div className="department-header">
                      <div 
                        className="department-color" 
                        style={{ backgroundColor: dept.color }}
                      ></div>
                      <div className="department-name">{dept.name}</div>
                    </div>
                    <div className="department-coords">{dept.coords}</div>
                    <div className="department-actions">
                      <button className="btn-edit">ערוך</button>
                      <button className="btn-delete">מחק</button>
                    </div>
                  </div>
                ))}
              </div>
              
              <button className="btn-add-department">
                + הוסף מחלקה חדשה
              </button>
            </div>

            {/* הוראות */}
            <div className="instructions-section">
              <h3>📋 הוראות שימוש</h3>
              <div className="instructions-card">
                <ul>
                  <li>לחץ על "ערוך" כדי לשנות את גבולות האזור</li>
                  <li>גרור את הפינות כדי לשנות את גודל האזור</li>
                  <li>לחץ על "מחק" כדי להסיר אזור</li>
                  <li>לחץ על "הוסף מחלקה חדשה" כדי ליצור מחלקה נוספת</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {currentView === 'alerts' && (
          <Notifications />
        )}

        {currentView === 'installation' && (
          <div className="installation-view">
            <h2>לינק התקנה לעובדים</h2>
            <div className="installation-card">
              <div className="installation-header">
                <h3>📱 לינק התקנה לאפליקציה</h3>
                <p>שלח את הלינק הזה לעובדים כדי שיוכלו להתקין את האפליקציה</p>
              </div>
              
              <div className="installation-link">
                <div className="link-container">
                  <input 
                    type="text" 
                    value="https://attendance-app.vercel.app/install" 
                    readOnly 
                    className="link-input"
                  />
                  <button 
                    className="copy-btn"
                    onClick={() => {
                      navigator.clipboard.writeText('https://attendance-app.vercel.app/install');
                      alert('הלינק הועתק ללוח!');
                    }}
                  >
                    העתק
                  </button>
                </div>
              </div>

              <div className="installation-steps">
                <h4>הוראות התקנה לעובדים:</h4>
                <ol>
                  <li>לחץ על הלינק למעלה</li>
                  <li>בטלפון: לחץ על "הוסף למסך הבית"</li>
                  <li>במחשב: לחץ על "התקן" בשורת הכתובת</li>
                  <li>אשר את ההתקנה</li>
                  <li>האפליקציה תופיע במסך הבית</li>
                </ol>
              </div>

              <div className="qr-code-section">
                <h4>QR Code להפצה מהירה:</h4>
                <div className="qr-placeholder">
                  <div className="qr-code">
                    <div className="qr-pattern">
                      <div className="qr-square"></div>
                      <div className="qr-square"></div>
                      <div className="qr-square"></div>
                      <div className="qr-square"></div>
                    </div>
                    <p>QR Code</p>
                  </div>
                  <p className="qr-instruction">הדפס והצג לעובדים לסריקה מהירה</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'developer' && (
          <div className="developer-view">
            <div className="developer-header">
              <h2>🔧 אזור מפתח - הגדרות White Label</h2>
              <p>הגדר את האפליקציה עבור המפעל שלך</p>
            </div>
            
            <div className="settings-container">
              <div className="settings-section">
                <h3>🏭 פרטי המפעל</h3>
                <div className="settings-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>שם המפעל</label>
                      <input type="text" placeholder="ולפמן תעשיות" defaultValue="ולפמן תעשיות" />
                    </div>
                    <div className="form-group">
                      <label>תחום פעילות</label>
                      <input type="text" placeholder="ייצור מתכת" defaultValue="ייצור מתכת" />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>כתובת</label>
                      <input type="text" placeholder="רחוב התעשייה 123, תל אביב" defaultValue="רחוב התעשייה 123, תל אביב" />
                    </div>
                    <div className="form-group">
                      <label>טלפון</label>
                      <input type="tel" placeholder="03-1234567" defaultValue="03-1234567" />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>אימייל</label>
                      <input type="email" placeholder="info@wolfman.co.il" defaultValue="info@wolfman.co.il" />
                    </div>
                    <div className="form-group">
                      <label>אתר אינטרנט</label>
                      <input type="url" placeholder="https://www.wolfman.co.il" defaultValue="https://www.wolfman.co.il" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="settings-section">
                <h3>🎨 מיתוג וצבעים</h3>
                <div className="branding-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>צבע ראשי</label>
                      <div className="color-input-group">
                        <input type="color" defaultValue="#004466" />
                        <input type="text" placeholder="#004466" defaultValue="#004466" />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>צבע משני</label>
                      <div className="color-input-group">
                        <input type="color" defaultValue="#0066dd" />
                        <input type="text" placeholder="#0066dd" defaultValue="#0066dd" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>לוגו המפעל</label>
                      <div className="logo-upload">
                        <input type="file" accept="image/*" />
                        <button className="upload-btn">העלה לוגו</button>
                        <div className="logo-preview">
                          <span>לוגו נוכחי: WOLFMAN</span>
                        </div>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>אייקון האפליקציה</label>
                      <div className="icon-upload">
                        <input type="file" accept="image/*" />
                        <button className="upload-btn">העלה אייקון</button>
                        <div className="icon-preview">
                          <span>📱 אייקון נוכחי</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="settings-section">
                <h3>⚙️ הגדרות מערכת</h3>
                <div className="system-settings">
                  <div className="form-row">
                    <div className="form-group">
                      <label>שפת האפליקציה</label>
                      <select defaultValue="he">
                        <option value="he">עברית</option>
                        <option value="en">English</option>
                        <option value="ar">العربية</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>אזור זמן</label>
                      <select defaultValue="Asia/Jerusalem">
                        <option value="Asia/Jerusalem">ישראל</option>
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">ניו יורק</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>יחידת מרחק</label>
                      <select defaultValue="km">
                        <option value="km">קילומטרים</option>
                        <option value="miles">מיילים</option>
                        <option value="meters">מטרים</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>פורמט תאריך</label>
                      <select defaultValue="dd/mm/yyyy">
                        <option value="dd/mm/yyyy">יום/חודש/שנה</option>
                        <option value="mm/dd/yyyy">חודש/יום/שנה</option>
                        <option value="yyyy-mm-dd">שנה-חודש-יום</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="settings-section">
                <h3>🔐 הגדרות אבטחה</h3>
                <div className="security-settings">
                  <div className="form-row">
                    <div className="form-group">
                      <label>רמת אבטחה</label>
                      <select defaultValue="medium">
                        <option value="low">נמוכה</option>
                        <option value="medium">בינונית</option>
                        <option value="high">גבוהה</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>זמן פג תוקף סיסמה (ימים)</label>
                      <input type="number" placeholder="90" defaultValue="90" />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>הפעל אימות דו-שלבי</label>
                      <div className="toggle-switch">
                        <input type="checkbox" id="two-factor" />
                        <label htmlFor="two-factor"></label>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>הפעל זיהוי ביומטרי</label>
                      <div className="toggle-switch">
                        <input type="checkbox" id="biometric" />
                        <label htmlFor="biometric"></label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="settings-actions">
                <button className="btn-reset" onClick={handleResetSettings}>איפוס הגדרות</button>
                <button className="btn-preview" onClick={handlePreviewSettings}>תצוגה מקדימה</button>
                <button className="btn-save-settings" onClick={handleSaveSettings}>שמור הגדרות</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ManagerApp;
