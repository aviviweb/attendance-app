import React, { useState, useEffect } from 'react';
import './styles/PWAInstaller.css';

const PWAInstaller = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [installStats, setInstallStats] = useState({
    totalInstalls: 0,
    todayInstalls: 0,
    weeklyInstalls: 0,
    monthlyInstalls: 0
  });

  useEffect(() => {
    // בדיקה אם האפליקציה כבר מותקנת
    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone === true) {
      setIsInstalled(true);
    }

    // האזנה לאירוע התקנה
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    // האזנה לאירוע התקנה מוצלחת
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      
      // עדכון סטטיסטיקות
      updateInstallStats();
      
      // הצגת הודעת הצלחה
      showInstallSuccessMessage();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // טעינת סטטיסטיקות התקנה
    loadInstallStats();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      // הצגת prompt התקנה
      deferredPrompt.prompt();
      
      // המתנה לתוצאה
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    } catch (error) {
      console.error('Error during installation:', error);
    }
  };

  const updateInstallStats = () => {
    const stats = JSON.parse(localStorage.getItem('pwa-install-stats') || '{}');
    const today = new Date().toDateString();
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toDateString();
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toDateString();

    stats.totalInstalls = (stats.totalInstalls || 0) + 1;
    stats.todayInstalls = (stats.todayInstalls || 0) + 1;
    stats.weeklyInstalls = (stats.weeklyInstalls || 0) + 1;
    stats.monthlyInstalls = (stats.monthlyInstalls || 0) + 1;
    stats.lastInstall = today;

    localStorage.setItem('pwa-install-stats', JSON.stringify(stats));
    setInstallStats(stats);
  };

  const loadInstallStats = () => {
    const stats = JSON.parse(localStorage.getItem('pwa-install-stats') || '{}');
    setInstallStats({
      totalInstalls: stats.totalInstalls || 0,
      todayInstalls: stats.todayInstalls || 0,
      weeklyInstalls: stats.weeklyInstalls || 0,
      monthlyInstalls: stats.monthlyInstalls || 0
    });
  };

  const showInstallSuccessMessage = () => {
    // יצירת התראה יפה
    const notification = document.createElement('div');
    notification.className = 'install-success-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-icon">🎉</div>
        <div class="notification-text">
          <h3>התקנה הושלמה בהצלחה!</h3>
          <p>האפליקציה הותקנה במכשיר שלך</p>
        </div>
        <button class="notification-close">×</button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // הסרה אוטומטית אחרי 5 שניות
    setTimeout(() => {
      notification.remove();
    }, 5000);
    
    // כפתור סגירה
    notification.querySelector('.notification-close').onclick = () => {
      notification.remove();
    };
  };

  const handleShareApp = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'אפליקציית נוכחות עובדים',
          text: 'אפליקציה מתקדמת לניהול נוכחות עובדים',
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // fallback - העתקה ללוח
      navigator.clipboard.writeText(window.location.href);
      alert('הקישור הועתק ללוח!');
    }
  };

  const handleAddToHomeScreen = () => {
    // הוראות להוספה ידנית
    const instructions = `
הוספה למסך הבית:

iOS (Safari):
1. לחץ על כפתור השיתוף
2. בחר "הוסף למסך הבית"
3. לחץ "הוסף"

Android (Chrome):
1. לחץ על תפריט הדפדפן
2. בחר "הוסף למסך הבית"
3. לחץ "הוסף"

Desktop (Chrome/Edge):
1. לחץ על סמל ההתקנה בשורת הכתובת
2. לחץ "התקן"
    `;
    
    alert(instructions);
  };

  if (isInstalled) {
    return (
      <div className="pwa-installer installed">
        <div className="installer-content">
          <div className="installer-icon">✅</div>
          <div className="installer-text">
            <h3>האפליקציה מותקנת!</h3>
            <p>האפליקציה זמינה במכשיר שלך</p>
          </div>
          <div className="installer-actions">
            <button className="action-btn share" onClick={handleShareApp}>
              📤 שתף
            </button>
            <button className="action-btn stats" onClick={loadInstallStats}>
              📊 סטטיסטיקות
            </button>
          </div>
        </div>
        
        <div className="install-stats">
          <div className="stat-item">
            <span className="stat-label">התקנות סה"כ:</span>
            <span className="stat-value">{installStats.totalInstalls}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">היום:</span>
            <span className="stat-value">{installStats.todayInstalls}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">השבוע:</span>
            <span className="stat-value">{installStats.weeklyInstalls}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">החודש:</span>
            <span className="stat-value">{installStats.monthlyInstalls}</span>
          </div>
        </div>
      </div>
    );
  }

  if (showInstallPrompt) {
    return (
      <div className="pwa-installer prompt">
        <div className="installer-content">
          <div className="installer-icon">📱</div>
          <div className="installer-text">
            <h3>התקן את האפליקציה!</h3>
            <p>קבל גישה מהירה ופיצ'רים מתקדמים</p>
            <ul className="install-benefits">
              <li>🚀 גישה מהירה מהמסך הראשי</li>
              <li>📱 עבודה ללא אינטרנט</li>
              <li>🔔 התראות Push</li>
              <li>📊 דוחות מתקדמים</li>
            </ul>
          </div>
          <div className="installer-actions">
            <button className="install-btn primary" onClick={handleInstallClick}>
              📥 התקן עכשיו
            </button>
            <button className="install-btn secondary" onClick={handleAddToHomeScreen}>
              📋 הוראות התקנה
            </button>
            <button className="install-btn close" onClick={() => setShowInstallPrompt(false)}>
              ✕ סגור
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pwa-installer hidden">
      <button 
        className="install-trigger"
        onClick={() => setShowInstallPrompt(true)}
      >
        📱 התקן אפליקציה
      </button>
    </div>
  );
};

export default PWAInstaller;

