// קומפוננט כניסה ראשי
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './styles/Login.css';

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleEmployeeLogin = async () => {
    setLoading(true);
    try {
      // כאן יהיה לוגיקת אימות עובד
      navigate('/employee');
    } catch (error) {
      console.error('שגיאה בכניסת עובד:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManagerLogin = async () => {
    setLoading(true);
    try {
      // כאן יהיה לוגיקת אימות מנהל
      navigate('/manager');
    } catch (error) {
      console.error('שגיאה בכניסת מנהל:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="app-title">{t('welcome')}</h1>
        <p className="app-subtitle">אפליקציית נוכחות עובדים</p>
        
        <div className="login-buttons">
          <button 
            className="login-btn employee-btn"
            onClick={handleEmployeeLogin}
            disabled={loading}
          >
            {loading ? t('loading') : t('employee')}
          </button>
          
          <button 
            className="login-btn manager-btn"
            onClick={handleManagerLogin}
            disabled={loading}
          >
            {loading ? t('loading') : t('manager')}
          </button>
        </div>
        
        <div className="language-selector">
          <select onChange={(e) => {
            // כאן יהיה שינוי שפה
            console.log('שפה נבחרה:', e.target.value);
          }}>
            <option value="he">עברית</option>
            <option value="en">English</option>
            <option value="ar">العربية</option>
            <option value="ru">Русский</option>
            <option value="hi">हिन्दी</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default Login;
