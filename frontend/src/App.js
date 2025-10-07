// קובץ App.js הראשי
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './i18n';
import './styles/App.css';
import { loadCompanySettings, getBackgroundStyle } from './config/companySettings';

// קומפוננטים
import Login from './components/Login';
import EmployeeApp from './components/EmployeeApp';
import ManagerApp from './components/ManagerApp';
import Dashboard from './components/Dashboard';
import PWAInstaller from './components/PWAInstaller';
import AIAssistant from './components/AIAssistant';

function App() {
  const { t } = useTranslation();

  // טעינת הגדרות המפעל
  useEffect(() => {
    loadCompanySettings();
  }, []);

  return (
    <Router>
      <div className="App" style={{ background: getBackgroundStyle() }}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/employee" element={<EmployeeApp />} />
          <Route path="/manager" element={<ManagerApp />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
        <PWAInstaller />
        <AIAssistant />
      </div>
    </Router>
  );
}

export default App;