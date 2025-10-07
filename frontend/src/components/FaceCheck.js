// קומפוננט בדיקת פנים אקראית
import React, { useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import { useTranslation } from 'react-i18next';
import './styles/FaceCheck.css';

const FaceCheck = () => {
  const { t } = useTranslation();
  const [showFaceCheck, setShowFaceCheck] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const webcamRef = React.useRef(null);

  useEffect(() => {
    // בדיקת פנים אקראית כל 30 דקות עם 30% סיכוי
    const interval = setInterval(() => {
      const shouldTrigger = Math.random() < 0.3; // 30% סיכוי
      if (shouldTrigger) {
        triggerFaceCheck();
      }
    }, 30 * 60 * 1000); // 30 דקות

    return () => clearInterval(interval);
  }, []);

  const triggerFaceCheck = () => {
    setShowFaceCheck(true);
    setCountdown(10); // 10 שניות להתכוננות
    
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setIsCapturing(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const capturePhoto = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      
      // שליחת התמונה לשרת לאימות
      sendPhotoForVerification(imageSrc);
    }
  };

  const sendPhotoForVerification = async (imageSrc) => {
    try {
      // כאן יהיה שליחה לשרת לאימות פנים
      console.log('שולח תמונה לאימות פנים...');
      
      // סימולציה של תגובה
      setTimeout(() => {
        setIsCapturing(false);
        setShowFaceCheck(false);
        alert('אימות פנים הושלם בהצלחה');
      }, 2000);
      
    } catch (error) {
      console.error('שגיאה באימות פנים:', error);
      setIsCapturing(false);
      setShowFaceCheck(false);
      alert('שגיאה באימות פנים');
    }
  };

  const skipFaceCheck = () => {
    setShowFaceCheck(false);
    setIsCapturing(false);
    setCountdown(0);
    // כאן יהיה שליחת התראה למנהל על דילוג על בדיקת פנים
    console.log('עובד דילג על בדיקת פנים - נשלחת התראה למנהל');
  };

  if (!showFaceCheck) return null;

  return (
    <div className="face-check-overlay">
      <div className="face-check-modal">
        <div className="face-check-header">
          <h2>{t('faceVerification')}</h2>
          <p>נדרש אימות פנים אקראי</p>
        </div>

        <div className="face-check-content">
          {countdown > 0 ? (
            <div className="countdown-section">
              <div className="countdown-circle">
                <span className="countdown-number">{countdown}</span>
              </div>
              <p>התכונן לצילום תוך {countdown} שניות</p>
              <div className="instructions">
                <p>• הסר משקפיים או כובע</p>
                <p>• הבט ישירות למצלמה</p>
                <p>• ודא תאורה טובה</p>
              </div>
            </div>
          ) : isCapturing ? (
            <div className="capture-section">
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                width={300}
                height={300}
                className="webcam"
              />
              <div className="capture-indicator">
                <div className="capture-light"></div>
                <p>מצלם...</p>
              </div>
            </div>
          ) : (
            <div className="ready-section">
              <div className="ready-icon">📷</div>
              <p>מוכן לצילום</p>
              <button className="capture-btn" onClick={capturePhoto}>
                צלם עכשיו
              </button>
            </div>
          )}
        </div>

        <div className="face-check-actions">
          <button className="skip-btn" onClick={skipFaceCheck}>
            דלג (התראה למנהל)
          </button>
        </div>
      </div>
    </div>
  );
};

export default FaceCheck;
