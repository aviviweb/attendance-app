// קובץ זיהוי הונאות GPS
import { calculateDistance, isWithinRange } from './geofence';

/**
 * זיהוי קפיצות GPS חריגות
 * @param {Array} locations - מערך של מיקומים עם timestamps
 * @param {number} maxSpeed - מהירות מקסימלית מותרת בק"מ/שעה
 * @returns {Array} - מערך של קפיצות חריגות
 */
export const detectGPSJumps = (locations, maxSpeed = 100) => {
  const jumps = [];
  
  for (let i = 1; i < locations.length; i++) {
    const prev = locations[i - 1];
    const curr = locations[i];
    
    // חישוב זמן בין נקודות (בשניות)
    const timeDiff = (curr.timestamp - prev.timestamp) / 1000;
    
    if (timeDiff > 0) {
      // חישוב מרחק בין נקודות (במטרים)
      const distance = calculateDistance(
        prev.lat, prev.lng,
        curr.lat, curr.lng
      );
      
      // חישוב מהירות (ק"מ/שעה)
      const speed = (distance / 1000) / (timeDiff / 3600);
      
      if (speed > maxSpeed) {
        jumps.push({
          type: 'GPS_JUMP',
          severity: speed > maxSpeed * 2 ? 'HIGH' : 'MEDIUM',
          from: prev,
          to: curr,
          distance,
          speed,
          timeDiff,
          timestamp: curr.timestamp
        });
      }
    }
  }
  
  return jumps;
};

/**
 * זיהוי תקיעות במקום
 * @param {Array} locations - מערך של מיקומים
 * @param {number} stagnationTime - זמן תקיעה בדקות
 * @param {number} maxMovement - תזוזה מקסימלית במטרים
 * @returns {Array} - מערך של תקיעות
 */
export const detectStagnation = (locations, stagnationTime = 15, maxMovement = 10) => {
  const stagnations = [];
  let stagnationStart = null;
  let stagnationLocations = [];
  
  for (let i = 1; i < locations.length; i++) {
    const prev = locations[i - 1];
    const curr = locations[i];
    
    const distance = calculateDistance(
      prev.lat, prev.lng,
      curr.lat, curr.lng
    );
    
    if (distance <= maxMovement) {
      // עובד לא זז הרבה
      if (!stagnationStart) {
        stagnationStart = prev.timestamp;
        stagnationLocations = [prev];
      }
      stagnationLocations.push(curr);
    } else {
      // עובד זז - בדיקה אם הייתה תקיעה
      if (stagnationStart && stagnationLocations.length > 1) {
        const stagnationDuration = (curr.timestamp - stagnationStart) / (1000 * 60); // בדקות
        
        if (stagnationDuration >= stagnationTime) {
          stagnations.push({
            type: 'STAGNATION',
            severity: stagnationDuration > stagnationTime * 2 ? 'HIGH' : 'MEDIUM',
            startTime: stagnationStart,
            endTime: curr.timestamp,
            duration: stagnationDuration,
            locations: stagnationLocations,
            centerLocation: calculateCenterLocation(stagnationLocations)
          });
        }
      }
      
      stagnationStart = null;
      stagnationLocations = [];
    }
  }
  
  return stagnations;
};

/**
 * חישוב מיקום מרכזי מקבוצת נקודות
 * @param {Array} locations - מערך של מיקומים
 * @returns {Object} - מיקום מרכזי
 */
const calculateCenterLocation = (locations) => {
  const totalLat = locations.reduce((sum, loc) => sum + loc.lat, 0);
  const totalLng = locations.reduce((sum, loc) => sum + loc.lng, 0);
  
  return {
    lat: totalLat / locations.length,
    lng: totalLng / locations.length
  };
};

/**
 * זיהוי דפוסי התנהגות חריגים
 * @param {Array} attendanceHistory - היסטוריית נוכחות
 * @returns {Array} - דפוסים חריגים
 */
export const detectAnomalousPatterns = (attendanceHistory) => {
  const anomalies = [];
  
  // בדיקת זמני כניסה/יציאה חריגים
  const checkInTimes = attendanceHistory
    .filter(record => record.type === 'CHECK_IN')
    .map(record => new Date(record.timestamp).getHours());
  
  const checkOutTimes = attendanceHistory
    .filter(record => record.type === 'CHECK_OUT')
    .map(record => new Date(record.timestamp).getHours());
  
  // בדיקת כניסות מוקדמות מדי או מאוחרות מדי
  const earlyCheckIns = checkInTimes.filter(hour => hour < 6 || hour > 10);
  const lateCheckOuts = checkOutTimes.filter(hour => hour < 16 || hour > 22);
  
  if (earlyCheckIns.length > checkInTimes.length * 0.3) {
    anomalies.push({
      type: 'EARLY_CHECK_INS',
      severity: 'MEDIUM',
      count: earlyCheckIns.length,
      percentage: (earlyCheckIns.length / checkInTimes.length) * 100
    });
  }
  
  if (lateCheckOuts.length > checkOutTimes.length * 0.3) {
    anomalies.push({
      type: 'LATE_CHECK_OUTS',
      severity: 'MEDIUM',
      count: lateCheckOuts.length,
      percentage: (lateCheckOuts.length / checkOutTimes.length) * 100
    });
  }
  
  return anomalies;
};

/**
 * זיהוי שיתוף מכשיר
 * @param {Object} currentDevice - מאפייני מכשיר נוכחיים
 * @param {Object} previousDevice - מאפייני מכשיר קודמים
 * @returns {Object} - תוצאות בדיקה
 */
export const detectDeviceSharing = (currentDevice, previousDevice) => {
  const changes = [];
  
  // בדיקת שינויים במאפייני המכשיר
  if (currentDevice.userAgent !== previousDevice.userAgent) {
    changes.push({
      field: 'userAgent',
      old: previousDevice.userAgent,
      new: currentDevice.userAgent,
      severity: 'HIGH'
    });
  }
  
  if (currentDevice.screenResolution !== previousDevice.screenResolution) {
    changes.push({
      field: 'screenResolution',
      old: previousDevice.screenResolution,
      new: currentDevice.screenResolution,
      severity: 'MEDIUM'
    });
  }
  
  if (currentDevice.timezone !== previousDevice.timezone) {
    changes.push({
      field: 'timezone',
      old: previousDevice.timezone,
      new: currentDevice.timezone,
      severity: 'HIGH'
    });
  }
  
  if (currentDevice.language !== previousDevice.language) {
    changes.push({
      field: 'language',
      old: previousDevice.language,
      new: currentDevice.language,
      severity: 'LOW'
    });
  }
  
  return {
    isSuspicious: changes.length > 0,
    changes,
    riskLevel: changes.some(c => c.severity === 'HIGH') ? 'HIGH' : 
               changes.some(c => c.severity === 'MEDIUM') ? 'MEDIUM' : 'LOW'
  };
};

/**
 * זיהוי WiFi spoofing
 * @param {Array} currentWiFi - רשתות WiFi נוכחיות
 * @param {Array} knownWiFi - רשתות WiFi מוכרות
 * @returns {Object} - תוצאות בדיקה
 */
export const detectWiFiSpoofing = (currentWiFi, knownWiFi) => {
  const unknownNetworks = currentWiFi.filter(network => 
    !knownWiFi.some(known => known.ssid === network.ssid)
  );
  
  const missingNetworks = knownWiFi.filter(known =>
    !currentWiFi.some(current => current.ssid === known.ssid)
  );
  
  return {
    isSuspicious: unknownNetworks.length > 2 || missingNetworks.length > 2,
    unknownNetworks,
    missingNetworks,
    riskLevel: unknownNetworks.length > 5 ? 'HIGH' : 
               unknownNetworks.length > 2 ? 'MEDIUM' : 'LOW'
  };
};

/**
 * ניתוח כללי של הונאות
 * @param {Object} data - נתוני עובד
 * @returns {Object} - סיכום הונאות
 */
export const analyzeFraudPatterns = (data) => {
  const { locations, attendanceHistory, deviceInfo, wifiNetworks } = data;
  
  const gpsJumps = detectGPSJumps(locations);
  const stagnations = detectStagnation(locations);
  const patterns = detectAnomalousPatterns(attendanceHistory);
  const deviceSharing = detectDeviceSharing(deviceInfo.current, deviceInfo.previous);
  const wifiSpoofing = detectWiFiSpoofing(wifiNetworks.current, wifiNetworks.known);
  
  const totalRisk = [
    ...gpsJumps.map(j => j.severity === 'HIGH' ? 3 : 1),
    ...stagnations.map(s => s.severity === 'HIGH' ? 2 : 1),
    ...patterns.map(p => p.severity === 'HIGH' ? 2 : 1),
    deviceSharing.riskLevel === 'HIGH' ? 3 : deviceSharing.riskLevel === 'MEDIUM' ? 2 : 0,
    wifiSpoofing.riskLevel === 'HIGH' ? 2 : wifiSpoofing.riskLevel === 'MEDIUM' ? 1 : 0
  ].reduce((sum, risk) => sum + risk, 0);
  
  return {
    gpsJumps,
    stagnations,
    patterns,
    deviceSharing,
    wifiSpoofing,
    totalRisk,
    riskLevel: totalRisk > 10 ? 'HIGH' : totalRisk > 5 ? 'MEDIUM' : 'LOW',
    recommendations: generateRecommendations(gpsJumps, stagnations, patterns, deviceSharing, wifiSpoofing)
  };
};

/**
 * יצירת המלצות על בסיס ניתוח הונאות
 * @param {Array} gpsJumps - קפיצות GPS
 * @param {Array} stagnations - תקיעות
 * @param {Array} patterns - דפוסים חריגים
 * @param {Object} deviceSharing - שיתוף מכשיר
 * @param {Object} wifiSpoofing - WiFi spoofing
 * @returns {Array} - המלצות
 */
const generateRecommendations = (gpsJumps, stagnations, patterns, deviceSharing, wifiSpoofing) => {
  const recommendations = [];
  
  if (gpsJumps.length > 0) {
    recommendations.push({
      type: 'GPS_JUMP',
      action: 'REQUEST_FACE_VERIFICATION',
      message: 'זוהו קפיצות GPS חריגות - נדרש אימות פנים'
    });
  }
  
  if (stagnations.length > 0) {
    recommendations.push({
      type: 'STAGNATION',
      action: 'REQUEST_LOCATION_UPDATE',
      message: 'זוהתה תקיעה במקום - נדרש עדכון מיקום'
    });
  }
  
  if (deviceSharing.isSuspicious) {
    recommendations.push({
      type: 'DEVICE_SHARING',
      action: 'REQUEST_ADDITIONAL_AUTH',
      message: 'זוהה שינוי במכשיר - נדרש אימות נוסף'
    });
  }
  
  if (wifiSpoofing.isSuspicious) {
    recommendations.push({
      type: 'WIFI_SPOOFING',
      action: 'REQUEST_QR_SCAN',
      message: 'זוהה WiFi חריג - נדרש סריקת QR'
    });
  }
  
  return recommendations;
};
