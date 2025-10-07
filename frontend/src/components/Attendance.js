// קומפוננט רישום נוכחות
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './styles/Attendance.css';

const Attendance = ({ isCheckedIn, onCheckIn, onCheckOut, loading }) => {
  const { t } = useTranslation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

  useEffect(() => {
    // עדכון זמן כל שנייה
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // קבלת מיקום GPS
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
          setLocationError(null);
        },
        (error) => {
          setLocationError('לא ניתן לקבל מיקום GPS');
          console.error('שגיאה במיקום:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      setLocationError('הדפדפן לא תומך ב-GPS');
    }
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('he-IL', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="attendance-container">
      <div className="attendance-header">
        <h2>{t('attendance')}</h2>
        <div className="time-display">
          <div className="current-time">{formatTime(currentTime)}</div>
          <div className="current-date">{formatDate(currentTime)}</div>
        </div>
      </div>

      <div className="attendance-status">
        <div className={`status-indicator ${isCheckedIn ? 'checked-in' : 'checked-out'}`}>
          <div className="status-icon">
            {isCheckedIn ? '✓' : '○'}
          </div>
          <div className="status-text">
            {isCheckedIn ? 'נוכח במשמרת' : 'לא נוכח במשמרת'}
          </div>
        </div>
      </div>

      <div className="location-section">
        <h3>מיקום נוכחי</h3>
        {location ? (
          <div className="location-info">
            <div className="location-coords">
              <span>קו רוחב: {location.lat.toFixed(6)}</span>
              <span>קו אורך: {location.lng.toFixed(6)}</span>
              <span>דיוק: ±{Math.round(location.accuracy)} מטר</span>
            </div>
            <div className="location-status success">
              ✓ מיקום GPS פעיל
            </div>
          </div>
        ) : locationError ? (
          <div className="location-error">
            <div className="error-icon">⚠</div>
            <div className="error-text">{locationError}</div>
          </div>
        ) : (
          <div className="location-loading">
            <div className="loading-spinner"></div>
            <span>מקבל מיקום...</span>
          </div>
        )}
      </div>

      <div className="attendance-actions">
        {!isCheckedIn ? (
          <button 
            className="checkin-btn"
            onClick={onCheckIn}
            disabled={loading || !location}
          >
            {loading ? t('loading') : t('checkIn')}
          </button>
        ) : (
          <button 
            className="checkout-btn"
            onClick={onCheckOut}
            disabled={loading}
          >
            {loading ? t('loading') : t('checkOut')}
          </button>
        )}
      </div>

      {!location && (
        <div className="location-warning">
          <div className="warning-icon">⚠</div>
          <div className="warning-text">
            נדרש מיקום GPS כדי לבצע כניסה/יציאה
          </div>
        </div>
      )}

      <div className="attendance-history">
        <h3>היסטוריית נוכחות היום</h3>
        <div className="history-list">
          <div className="history-item">
            <span className="history-time">08:00</span>
            <span className="history-action">כניסה</span>
            <span className="history-status success">✓</span>
          </div>
          <div className="history-item">
            <span className="history-time">12:00</span>
            <span className="history-action">יציאה להפסקה</span>
            <span className="history-status warning">⚠</span>
          </div>
          <div className="history-item">
            <span className="history-time">13:00</span>
            <span className="history-action">חזרה מהפסקה</span>
            <span className="history-status success">✓</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
