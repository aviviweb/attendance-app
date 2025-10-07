import React, { useState, useEffect } from 'react';
import './styles/Notifications.css';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [settings, setSettings] = useState({
    email: true,
    sms: false,
    push: true,
    sound: true
  });
  const [newNotification, setNewNotification] = useState({
    type: 'attendance',
    title: '',
    message: '',
    recipients: 'all',
    priority: 'medium'
  });

  // נתונים לדוגמה
  const sampleNotifications = [
    {
      id: 1,
      type: 'attendance',
      title: 'איחור של עובד',
      message: 'יוסי כהן איחר לעבודה ב-15 דקות',
      timestamp: new Date().toISOString(),
      priority: 'high',
      status: 'unread',
      recipients: ['manager@wolfman.co.il'],
      sent: true
    },
    {
      id: 2,
      type: 'fraud',
      title: 'זיהוי פעילות חשודה',
      message: 'זוהה GPS jump של שרה לוי',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      priority: 'critical',
      status: 'read',
      recipients: ['security@wolfman.co.il', 'manager@wolfman.co.il'],
      sent: true
    },
    {
      id: 3,
      type: 'system',
      title: 'עדכון מערכת',
      message: 'המערכת עודכנה לגרסה 2.1.0',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      priority: 'low',
      status: 'read',
      recipients: ['admin@wolfman.co.il'],
      sent: true
    }
  ];

  useEffect(() => {
    setNotifications(sampleNotifications);
  }, []);

  const handleSendNotification = () => {
    if (!newNotification.title || !newNotification.message) {
      alert('אנא מלא את כל השדות הנדרשים');
      return;
    }

    const notification = {
      id: Date.now(),
      ...newNotification,
      timestamp: new Date().toISOString(),
      status: 'sent',
      sent: true
    };

    setNotifications([notification, ...notifications]);
    setNewNotification({
      type: 'attendance',
      title: '',
      message: '',
      recipients: 'all',
      priority: 'medium'
    });

    alert('התראה נשלחה בהצלחה!');
  };

  const handleMarkAsRead = (id) => {
    setNotifications(notifications.map(notif => 
      notif.id === id ? { ...notif, status: 'read' } : notif
    ));
  };

  const handleDeleteNotification = (id) => {
    setNotifications(notifications.filter(notif => notif.id !== id));
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return '#dc3545';
      case 'high': return '#fd7e14';
      case 'medium': return '#ffc107';
      case 'low': return '#6c757d';
      default: return '#6c757d';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'attendance': return '👥';
      case 'fraud': return '🚨';
      case 'system': return '⚙️';
      case 'security': return '🔒';
      default: return '📢';
    }
  };

  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <h1>🔔 התראות חכמות</h1>
        <p>ניהול התראות SMS, אימייל ו-Push</p>
      </div>

      <div className="notifications-content">
        <div className="notifications-sidebar">
          <div className="notification-settings">
            <h3>⚙️ הגדרות התראות</h3>
            <div className="settings-group">
              <label className="setting-item">
                <input 
                  type="checkbox" 
                  checked={settings.email}
                  onChange={(e) => setSettings({...settings, email: e.target.checked})}
                />
                <span>📧 אימייל</span>
              </label>
              <label className="setting-item">
                <input 
                  type="checkbox" 
                  checked={settings.sms}
                  onChange={(e) => setSettings({...settings, sms: e.target.checked})}
                />
                <span>📱 SMS</span>
              </label>
              <label className="setting-item">
                <input 
                  type="checkbox" 
                  checked={settings.push}
                  onChange={(e) => setSettings({...settings, push: e.target.checked})}
                />
                <span>🔔 Push</span>
              </label>
              <label className="setting-item">
                <input 
                  type="checkbox" 
                  checked={settings.sound}
                  onChange={(e) => setSettings({...settings, sound: e.target.checked})}
                />
                <span>🔊 צליל</span>
              </label>
            </div>
          </div>

          <div className="send-notification">
            <h3>📤 שליחת התראה</h3>
            <div className="notification-form">
              <div className="form-group">
                <label>סוג התראה:</label>
                <select 
                  value={newNotification.type}
                  onChange={(e) => setNewNotification({...newNotification, type: e.target.value})}
                >
                  <option value="attendance">נוכחות</option>
                  <option value="fraud">הונאה</option>
                  <option value="system">מערכת</option>
                  <option value="security">אבטחה</option>
                </select>
              </div>

              <div className="form-group">
                <label>כותרת:</label>
                <input 
                  type="text"
                  value={newNotification.title}
                  onChange={(e) => setNewNotification({...newNotification, title: e.target.value})}
                  placeholder="הזן כותרת התראה"
                />
              </div>

              <div className="form-group">
                <label>הודעה:</label>
                <textarea 
                  value={newNotification.message}
                  onChange={(e) => setNewNotification({...newNotification, message: e.target.value})}
                  placeholder="הזן תוכן ההודעה"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>נמענים:</label>
                <select 
                  value={newNotification.recipients}
                  onChange={(e) => setNewNotification({...newNotification, recipients: e.target.value})}
                >
                  <option value="all">כל העובדים</option>
                  <option value="managers">מנהלים בלבד</option>
                  <option value="department">מחלקה ספציפית</option>
                  <option value="custom">רשימה מותאמת</option>
                </select>
              </div>

              <div className="form-group">
                <label>עדיפות:</label>
                <select 
                  value={newNotification.priority}
                  onChange={(e) => setNewNotification({...newNotification, priority: e.target.value})}
                >
                  <option value="low">נמוכה</option>
                  <option value="medium">בינונית</option>
                  <option value="high">גבוהה</option>
                  <option value="critical">קריטית</option>
                </select>
              </div>

              <button className="send-btn" onClick={handleSendNotification}>
                📤 שלח התראה
              </button>
            </div>
          </div>
        </div>

        <div className="notifications-list">
          <div className="list-header">
            <h3>📋 היסטוריית התראות</h3>
            <div className="list-filters">
              <select>
                <option>כל ההתראות</option>
                <option>לא נקראו</option>
                <option>נוכחות</option>
                <option>הונאה</option>
                <option>מערכת</option>
              </select>
            </div>
          </div>

          <div className="notifications-items">
            {notifications.map(notification => (
              <div 
                key={notification.id} 
                className={`notification-item ${notification.status} ${notification.priority}`}
                onClick={() => handleMarkAsRead(notification.id)}
              >
                <div className="notification-icon">
                  {getTypeIcon(notification.type)}
                </div>
                
                <div className="notification-content">
                  <div className="notification-header">
                    <h4>{notification.title}</h4>
                    <div className="notification-meta">
                      <span className="priority-badge" style={{backgroundColor: getPriorityColor(notification.priority)}}>
                        {notification.priority}
                      </span>
                      <span className="timestamp">
                        {new Date(notification.timestamp).toLocaleString('he-IL')}
                      </span>
                    </div>
                  </div>
                  
                  <p className="notification-message">{notification.message}</p>
                  
                  <div className="notification-footer">
                    <div className="recipients">
                      <span>נשלח ל: {notification.recipients.join(', ')}</span>
                    </div>
                    <div className="notification-actions">
                      <button 
                        className="action-btn delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNotification(notification.id);
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="notification-stats">
        <div className="stat-card">
          <div className="stat-icon">📤</div>
          <div className="stat-info">
            <h3>התראות נשלחו</h3>
            <p className="stat-number">{notifications.length}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">📖</div>
          <div className="stat-info">
            <h3>נקראו</h3>
            <p className="stat-number">{notifications.filter(n => n.status === 'read').length}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🚨</div>
          <div className="stat-info">
            <h3>קריטיות</h3>
            <p className="stat-number">{notifications.filter(n => n.priority === 'critical').length}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">⚡</div>
          <div className="stat-info">
            <h3>היום</h3>
            <p className="stat-number">{notifications.filter(n => 
              new Date(n.timestamp).toDateString() === new Date().toDateString()
            ).length}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;

