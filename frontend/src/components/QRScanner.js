// קומפוננט סורק QR למחלקות
import React, { useState } from 'react';
import { QrReader } from 'react-qr-reader';
import { useTranslation } from 'react-i18next';
import './styles/QRScanner.css';

const QRScanner = () => {
  const { t } = useTranslation();
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);

  const handleScan = (result) => {
    if (result) {
      const scanData = {
        id: Date.now(),
        data: result,
        timestamp: new Date(),
        location: 'מחלקת ייצור A' // כאן יהיה מיקום אמיתי
      };
      
      setLastScan(scanData);
      setScanHistory(prev => [scanData, ...prev.slice(0, 9)]); // שמירת 10 סריקות אחרונות
      
      // שליחה לשרת לאימות
      verifyQRCode(result);
    }
  };

  const handleError = (error) => {
    console.error('שגיאה בסריקת QR:', error);
  };

  const verifyQRCode = async (qrData) => {
    try {
      // כאן יהיה שליחה לשרת לאימות QR
      console.log('מאמת QR Code:', qrData);
      
      // סימולציה של תגובה
      setTimeout(() => {
        alert('QR Code אומת בהצלחה!');
      }, 1000);
      
    } catch (error) {
      console.error('שגיאה באימות QR:', error);
      alert('שגיאה באימות QR Code');
    }
  };

  const startScanning = () => {
    setScanning(true);
  };

  const stopScanning = () => {
    setScanning(false);
  };

  return (
    <div className="qr-scanner-container">
      <div className="qr-scanner-header">
        <h2>{t('qrScan')}</h2>
        <p>סרוק QR Code של המחלקה</p>
      </div>

      <div className="qr-scanner-content">
        {scanning ? (
          <div className="scanner-active">
            <div className="scanner-frame">
              <QrReader
                onResult={handleScan}
                onError={handleError}
                style={{ width: '100%', maxWidth: '400px' }}
                constraints={{
                  facingMode: 'environment' // מצלמה אחורית
                }}
              />
              <div className="scanner-overlay">
                <div className="scanner-corner top-left"></div>
                <div className="scanner-corner top-right"></div>
                <div className="scanner-corner bottom-left"></div>
                <div className="scanner-corner bottom-right"></div>
              </div>
            </div>
            
            <div className="scanner-instructions">
              <p>כוון את המצלמה ל-QR Code</p>
              <p>ודא שהקוד נמצא בתוך המסגרת</p>
            </div>
            
            <button className="stop-scan-btn" onClick={stopScanning}>
              עצור סריקה
            </button>
          </div>
        ) : (
          <div className="scanner-inactive">
            <div className="scanner-icon">📱</div>
            <h3>מוכן לסריקה</h3>
            <p>לחץ על הכפתור כדי להתחיל לסרוק QR Code</p>
            
            <button className="start-scan-btn" onClick={startScanning}>
              התחל סריקה
            </button>
          </div>
        )}
      </div>

      {lastScan && (
        <div className="last-scan-result">
          <h3>סריקה אחרונה</h3>
          <div className="scan-info">
            <div className="scan-data">
              <strong>נתונים:</strong> {lastScan.data}
            </div>
            <div className="scan-time">
              <strong>זמן:</strong> {lastScan.timestamp.toLocaleTimeString('he-IL')}
            </div>
            <div className="scan-location">
              <strong>מיקום:</strong> {lastScan.location}
            </div>
          </div>
        </div>
      )}

      {scanHistory.length > 0 && (
        <div className="scan-history">
          <h3>היסטוריית סריקות</h3>
          <div className="history-list">
            {scanHistory.map(scan => (
              <div key={scan.id} className="history-item">
                <div className="history-time">
                  {scan.timestamp.toLocaleTimeString('he-IL')}
                </div>
                <div className="history-data">
                  {scan.data.substring(0, 20)}...
                </div>
                <div className="history-location">
                  {scan.location}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QRScanner;
