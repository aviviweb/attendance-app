import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './styles/LanguageSelector.css';

const LanguageSelector = () => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'he', name: 'עברית', flag: '🇮🇱', dir: 'rtl' },
    { code: 'en', name: 'English', flag: '🇺🇸', dir: 'ltr' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦', dir: 'rtl' },
    { code: 'ru', name: 'Русский', flag: '🇷🇺', dir: 'ltr' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳', dir: 'ltr' },
    { code: 'es', name: 'Español', flag: '🇪🇸', dir: 'ltr' },
    { code: 'fr', name: 'Français', flag: '🇫🇷', dir: 'ltr' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪', dir: 'ltr' },
    { code: 'zh', name: '中文', flag: '🇨🇳', dir: 'ltr' },
    { code: 'ja', name: '日本語', flag: '🇯🇵', dir: 'ltr' }
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (languageCode) => {
    i18n.changeLanguage(languageCode);
    setIsOpen(false);
    
    // עדכון כיוון המסמך
    const selectedLang = languages.find(lang => lang.code === languageCode);
    if (selectedLang) {
      document.documentElement.dir = selectedLang.dir;
      document.documentElement.lang = languageCode;
    }

    // שמירת בחירת השפה
    localStorage.setItem('selectedLanguage', languageCode);
    
    // הודעת הצלחה
    showLanguageChangeNotification(selectedLang?.name);
  };

  const showLanguageChangeNotification = (languageName) => {
    const notification = document.createElement('div');
    notification.className = 'language-change-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-icon">🌐</div>
        <div class="notification-text">
          <h4>${t('language')} ${t('success')}</h4>
          <p>${languageName} - ${t('language')} הוחלפה בהצלחה</p>
        </div>
        <button class="notification-close">×</button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // הסרה אוטומטית אחרי 3 שניות
    setTimeout(() => {
      notification.remove();
    }, 3000);
    
    // כפתור סגירה
    notification.querySelector('.notification-close').onclick = () => {
      notification.remove();
    };
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleKeyDown = (event, languageCode) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleLanguageChange(languageCode);
    }
  };

  return (
    <div className="language-selector">
      <button 
        className="language-button"
        onClick={toggleDropdown}
        aria-label={`${t('language')} - ${currentLanguage.name}`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="language-flag">{currentLanguage.flag}</span>
        <span className="language-name">{currentLanguage.name}</span>
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="language-dropdown" role="listbox">
          <div className="dropdown-header">
            <h4>{t('language')}</h4>
            <button 
              className="close-dropdown"
              onClick={() => setIsOpen(false)}
              aria-label={t('close')}
            >
              ×
            </button>
          </div>
          
          <div className="language-list">
            {languages.map((language) => (
              <button
                key={language.code}
                className={`language-option ${i18n.language === language.code ? 'active' : ''}`}
                onClick={() => handleLanguageChange(language.code)}
                onKeyDown={(e) => handleKeyDown(e, language.code)}
                role="option"
                aria-selected={i18n.language === language.code}
                tabIndex={0}
              >
                <span className="option-flag">{language.flag}</span>
                <span className="option-name">{language.name}</span>
                {i18n.language === language.code && (
                  <span className="option-check">✓</span>
                )}
              </button>
            ))}
          </div>

          <div className="dropdown-footer">
            <div className="language-info">
              <p>🌐 {languages.length} {t('language')} זמינות</p>
              <p>📱 תמיכה מלאה ב-RTL ו-LTR</p>
            </div>
          </div>
        </div>
      )}

      {isOpen && (
        <div 
          className="language-overlay"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default LanguageSelector;

