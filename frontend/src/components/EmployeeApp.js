// קומפוננט אפליקציית עובד
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Map from './Map';
import Attendance from './Attendance';
import FaceCheck from './FaceCheck';
import QRScanner from './QRScanner';
import './styles/EmployeeApp.css';

const EmployeeApp = () => {
  const { t } = useTranslation();
  const [currentView, setCurrentView] = useState('attendance');
  const [location, setLocation] = useState(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // קבלת מיקום GPS
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('שגיאה בקבלת מיקום:', error);
        }
      );
    }
  }, []);

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      // לוגיקת כניסה
      setIsCheckedIn(true);
      console.log('עובד נכנס למשמרת');
    } catch (error) {
      console.error('שגיאה בכניסה:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    try {
      // לוגיקת יציאה
      setIsCheckedIn(false);
      console.log('עובד יצא מהמשמרת');
    } catch (error) {
      console.error('שגיאה ביציאה:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="employee-app">
      <header className="app-header">
        <h1>{t('attendance')}</h1>
        <div className="location-info">
          {location ? (
            <span>מיקום: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>
          ) : (
            <span>מקבל מיקום...</span>
          )}
        </div>
      </header>

      <nav className="app-nav">
        <button 
          className={currentView === 'attendance' ? 'active' : ''}
          onClick={() => setCurrentView('attendance')}
        >
          {t('attendance')}
        </button>
        <button 
          className={currentView === 'map' ? 'active' : ''}
          onClick={() => setCurrentView('map')}
        >
          {t('location')}
        </button>
        <button 
          className={currentView === 'qr' ? 'active' : ''}
          onClick={() => setCurrentView('qr')}
        >
          {t('qrScan')}
        </button>
      </nav>

      <main className="app-main">
        {currentView === 'attendance' && (
          <Attendance 
            isCheckedIn={isCheckedIn}
            onCheckIn={handleCheckIn}
            onCheckOut={handleCheckOut}
            loading={loading}
          />
        )}
        
        {currentView === 'map' && (
          <Map location={location} />
        )}
        
        {currentView === 'qr' && (
          <QRScanner />
        )}
      </main>

      <FaceCheck />
    </div>
  );
};

export default EmployeeApp;
