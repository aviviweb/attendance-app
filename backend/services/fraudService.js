// שירות זיהוי הונאות
const { getCollection, addDocument } = require('../config/firebase');
const geolib = require('geolib');
const { logFraudDetection } = require('../utils/logger');

class FraudService {
  constructor() {
    this.fraudThresholds = {
      maxSpeed: 100, // ק"מ/שעה
      stagnationTime: 15, // דקות
      maxMovement: 10, // מטרים
      deviceChangeSeverity: 'HIGH',
      wifiAnomalyThreshold: 3
    };
    
    this.fraudPatterns = new Map(); // cache לדפוסי הונאה
  }

  // בדיקת הונאות GPS
  async checkLocationFraud(employeeId, location, additionalData = {}) {
    try {
      const { deviceInfo, wifiNetworks } = additionalData;
      
      // קבלת היסטוריית מיקומים אחרונה
      const recentLocations = await this.getRecentLocations(employeeId, 10);
      
      const fraudChecks = {
        gpsJump: this.checkGPSJump(recentLocations, location),
        stagnation: this.checkStagnation(recentLocations),
        deviceSharing: this.checkDeviceSharing(employeeId, deviceInfo),
        wifiSpoofing: this.checkWiFiSpoofing(employeeId, wifiNetworks),
        patternAnomaly: this.checkPatternAnomaly(employeeId, recentLocations)
      };
      
      // חישוב רמת סיכון כוללת
      const riskLevel = this.calculateRiskLevel(fraudChecks);
      
      const isSuspicious = riskLevel >= 0.7; // 70% סיכון ומעלה
      
      if (isSuspicious) {
        // רישום התראת הונאה
        await this.recordFraudAlert(employeeId, fraudChecks, location, riskLevel);
      }
      
      return {
        isSuspicious,
        riskLevel,
        checks: fraudChecks,
        type: this.getPrimaryFraudType(fraudChecks),
        severity: this.getSeverityLevel(riskLevel),
        details: this.getFraudDetails(fraudChecks)
      };
      
    } catch (error) {
      console.error('שגיאה בבדיקת הונאות GPS:', error);
      return {
        isSuspicious: false,
        riskLevel: 0,
        checks: {},
        type: 'ERROR',
        severity: 'LOW',
        details: { error: error.message }
      };
    }
  }

  // בדיקת קפיצות GPS
  checkGPSJump(recentLocations, currentLocation) {
    if (recentLocations.length === 0) {
      return { suspicious: false, reason: 'no_history' };
    }
    
    const lastLocation = recentLocations[recentLocations.length - 1];
    const timeDiff = (currentLocation.timestamp - lastLocation.timestamp) / 1000; // בשניות
    
    if (timeDiff <= 0) {
      return { suspicious: false, reason: 'invalid_time' };
    }
    
    const distance = geolib.getDistance(
      { latitude: lastLocation.lat, longitude: lastLocation.lng },
      { latitude: currentLocation.lat, longitude: currentLocation.lng }
    );
    
    const speed = (distance / 1000) / (timeDiff / 3600); // ק"מ/שעה
    
    if (speed > this.fraudThresholds.maxSpeed) {
      return {
        suspicious: true,
        reason: 'excessive_speed',
        speed,
        distance,
        timeDiff,
        severity: speed > this.fraudThresholds.maxSpeed * 2 ? 'HIGH' : 'MEDIUM'
      };
    }
    
    return { suspicious: false, reason: 'normal_speed', speed };
  }

  // בדיקת תקיעות במקום
  checkStagnation(recentLocations) {
    if (recentLocations.length < 3) {
      return { suspicious: false, reason: 'insufficient_data' };
    }
    
    const stagnationThreshold = this.fraudThresholds.stagnationTime * 60 * 1000; // מילישניות
    const maxMovement = this.fraudThresholds.maxMovement;
    
    let stagnationStart = null;
    let stagnationLocations = [];
    
    for (let i = 1; i < recentLocations.length; i++) {
      const prev = recentLocations[i - 1];
      const curr = recentLocations[i];
      
      const distance = geolib.getDistance(
        { latitude: prev.lat, longitude: prev.lng },
        { latitude: curr.lat, longitude: curr.lng }
      );
      
      if (distance <= maxMovement) {
        if (!stagnationStart) {
          stagnationStart = prev.timestamp;
          stagnationLocations = [prev];
        }
        stagnationLocations.push(curr);
      } else {
        if (stagnationStart && stagnationLocations.length > 1) {
          const stagnationDuration = curr.timestamp - stagnationStart;
          
          if (stagnationDuration >= stagnationThreshold) {
            return {
              suspicious: true,
              reason: 'prolonged_stagnation',
              duration: stagnationDuration / (1000 * 60), // בדקות
              locations: stagnationLocations.length,
              severity: stagnationDuration > stagnationThreshold * 2 ? 'HIGH' : 'MEDIUM'
            };
          }
        }
        
        stagnationStart = null;
        stagnationLocations = [];
      }
    }
    
    return { suspicious: false, reason: 'normal_movement' };
  }

  // בדיקת שיתוף מכשיר
  async checkDeviceSharing(employeeId, currentDeviceInfo) {
    if (!currentDeviceInfo) {
      return { suspicious: false, reason: 'no_device_info' };
    }
    
    try {
      // קבלת מידע מכשיר קודם
      const previousDeviceInfo = await this.getPreviousDeviceInfo(employeeId);
      
      if (!previousDeviceInfo) {
        // שמירת מידע מכשיר חדש
        await this.saveDeviceInfo(employeeId, currentDeviceInfo);
        return { suspicious: false, reason: 'first_device' };
      }
      
      const changes = this.compareDeviceInfo(previousDeviceInfo, currentDeviceInfo);
      
      if (changes.length > 0) {
        const severity = changes.some(c => c.severity === 'HIGH') ? 'HIGH' : 'MEDIUM';
        
        return {
          suspicious: true,
          reason: 'device_changes',
          changes,
          severity
        };
      }
      
      return { suspicious: false, reason: 'no_changes' };
      
    } catch (error) {
      console.error('שגיאה בבדיקת שיתוף מכשיר:', error);
      return { suspicious: false, reason: 'error', error: error.message };
    }
  }

  // בדיקת WiFi spoofing
  async checkWiFiSpoofing(employeeId, currentWiFiNetworks) {
    if (!currentWiFiNetworks || !Array.isArray(currentWiFiNetworks)) {
      return { suspicious: false, reason: 'no_wifi_info' };
    }
    
    try {
      // קבלת רשתות WiFi מוכרות
      const knownNetworks = await this.getKnownWiFiNetworks(employeeId);
      
      if (knownNetworks.length === 0) {
        // שמירת רשתות חדשות
        await this.saveWiFiNetworks(employeeId, currentWiFiNetworks);
        return { suspicious: false, reason: 'first_wifi_scan' };
      }
      
      const unknownNetworks = currentWiFiNetworks.filter(network => 
        !knownNetworks.some(known => known.ssid === network.ssid)
      );
      
      const missingNetworks = knownNetworks.filter(known =>
        !currentWiFiNetworks.some(current => current.ssid === known.ssid)
      );
      
      const anomalyScore = unknownNetworks.length + missingNetworks.length;
      
      if (anomalyScore > this.fraudThresholds.wifiAnomalyThreshold) {
        return {
          suspicious: true,
          reason: 'wifi_anomaly',
          unknownNetworks: unknownNetworks.length,
          missingNetworks: missingNetworks.length,
          anomalyScore,
          severity: anomalyScore > this.fraudThresholds.wifiAnomalyThreshold * 2 ? 'HIGH' : 'MEDIUM'
        };
      }
      
      return { suspicious: false, reason: 'normal_wifi', anomalyScore };
      
    } catch (error) {
      console.error('שגיאה בבדיקת WiFi spoofing:', error);
      return { suspicious: false, reason: 'error', error: error.message };
    }
  }

  // בדיקת דפוסי התנהגות חריגים
  checkPatternAnomaly(employeeId, recentLocations) {
    try {
      // בדיקת דפוסי תזוזה חריגים
      const movementPatterns = this.analyzeMovementPatterns(recentLocations);
      
      // בדיקת זמני פעילות חריגים
      const timePatterns = this.analyzeTimePatterns(recentLocations);
      
      const anomalies = [];
      
      if (movementPatterns.isCircular) {
        anomalies.push({ type: 'circular_movement', severity: 'MEDIUM' });
      }
      
      if (movementPatterns.isGridLike) {
        anomalies.push({ type: 'grid_movement', severity: 'HIGH' });
      }
      
      if (timePatterns.isUnusual) {
        anomalies.push({ type: 'unusual_timing', severity: 'MEDIUM' });
      }
      
      if (anomalies.length > 0) {
        return {
          suspicious: true,
          reason: 'pattern_anomaly',
          anomalies,
          severity: anomalies.some(a => a.severity === 'HIGH') ? 'HIGH' : 'MEDIUM'
        };
      }
      
      return { suspicious: false, reason: 'normal_patterns' };
      
    } catch (error) {
      console.error('שגיאה בבדיקת דפוסי התנהגות:', error);
      return { suspicious: false, reason: 'error', error: error.message };
    }
  }

  // אימות תמונת פנים
  async verifyFaceImage(employeeId, imageData) {
    try {
      // כאן יהיה לוגיקת אימות פנים מתקדמת
      // כרגע נחזיר תוצאה דמה
      
      // שמירת תמונה לאימות
      await this.saveFaceVerificationImage(employeeId, imageData);
      
      // סימולציה של אימות
      const confidence = Math.random() * 0.4 + 0.6; // 60%-100%
      const verified = confidence > 0.8;
      
      return {
        verified,
        confidence,
        method: 'face_recognition',
        timestamp: new Date()
      };
      
    } catch (error) {
      console.error('שגיאה באימות פנים:', error);
      return {
        verified: false,
        confidence: 0,
        method: 'error',
        error: error.message
      };
    }
  }

  // פונקציות עזר
  async getRecentLocations(employeeId, limit = 10) {
    try {
      const locations = await getCollection('locations', [
        { field: 'employeeId', operator: '==', value: employeeId }
      ]);
      
      return locations
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit)
        .map(loc => ({
          lat: loc.location.lat,
          lng: loc.location.lng,
          timestamp: loc.timestamp
        }));
    } catch (error) {
      console.error('שגיאה בקבלת מיקומים אחרונים:', error);
      return [];
    }
  }

  async getPreviousDeviceInfo(employeeId) {
    try {
      const deviceRecords = await getCollection('device_info', [
        { field: 'employeeId', operator: '==', value: employeeId }
      ]);
      
      return deviceRecords.length > 0 ? deviceRecords[0] : null;
    } catch (error) {
      console.error('שגיאה בקבלת מידע מכשיר קודם:', error);
      return null;
    }
  }

  async saveDeviceInfo(employeeId, deviceInfo) {
    try {
      await addDocument('device_info', {
        employeeId,
        ...deviceInfo,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('שגיאה בשמירת מידע מכשיר:', error);
    }
  }

  compareDeviceInfo(previous, current) {
    const changes = [];
    
    const fields = ['userAgent', 'screenResolution', 'timezone', 'language', 'platform'];
    
    fields.forEach(field => {
      if (previous[field] !== current[field]) {
        changes.push({
          field,
          old: previous[field],
          new: current[field],
          severity: field === 'userAgent' ? 'HIGH' : 'MEDIUM'
        });
      }
    });
    
    return changes;
  }

  async getKnownWiFiNetworks(employeeId) {
    try {
      const wifiRecords = await getCollection('wifi_networks', [
        { field: 'employeeId', operator: '==', value: employeeId }
      ]);
      
      return wifiRecords.length > 0 ? wifiRecords[0].networks : [];
    } catch (error) {
      console.error('שגיאה בקבלת רשתות WiFi מוכרות:', error);
      return [];
    }
  }

  async saveWiFiNetworks(employeeId, networks) {
    try {
      await addDocument('wifi_networks', {
        employeeId,
        networks,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('שגיאה בשמירת רשתות WiFi:', error);
    }
  }

  analyzeMovementPatterns(locations) {
    if (locations.length < 5) {
      return { isCircular: false, isGridLike: false };
    }
    
    // בדיקה פשוטה לדפוסים חריגים
    const distances = [];
    for (let i = 1; i < locations.length; i++) {
      const distance = geolib.getDistance(
        { latitude: locations[i-1].lat, longitude: locations[i-1].lng },
        { latitude: locations[i].lat, longitude: locations[i].lng }
      );
      distances.push(distance);
    }
    
    // בדיקת דפוס מעגלי (מרחקים דומים)
    const avgDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
    const isCircular = distances.every(d => Math.abs(d - avgDistance) < avgDistance * 0.3);
    
    // בדיקת דפוס רשת (מרחקים קבועים)
    const isGridLike = distances.every(d => Math.abs(d - avgDistance) < 5);
    
    return { isCircular, isGridLike };
  }

  analyzeTimePatterns(locations) {
    if (locations.length < 3) {
      return { isUnusual: false };
    }
    
    const times = locations.map(loc => new Date(loc.timestamp).getHours());
    const avgTime = times.reduce((sum, t) => sum + t, 0) / times.length;
    
    // בדיקה אם הזמנים חריגים (לא בשעות עבודה רגילות)
    const isUnusual = avgTime < 6 || avgTime > 22;
    
    return { isUnusual };
  }

  calculateRiskLevel(fraudChecks) {
    let totalRisk = 0;
    let checkCount = 0;
    
    Object.values(fraudChecks).forEach(check => {
      if (check.suspicious) {
        const risk = check.severity === 'HIGH' ? 0.8 : 
                    check.severity === 'MEDIUM' ? 0.5 : 0.2;
        totalRisk += risk;
      }
      checkCount++;
    });
    
    return checkCount > 0 ? totalRisk / checkCount : 0;
  }

  getPrimaryFraudType(fraudChecks) {
    const suspiciousChecks = Object.entries(fraudChecks)
      .filter(([, check]) => check.suspicious)
      .sort(([, a], [, b]) => {
        const severityOrder = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });
    
    return suspiciousChecks.length > 0 ? suspiciousChecks[0][0] : 'NONE';
  }

  getSeverityLevel(riskLevel) {
    if (riskLevel >= 0.8) return 'HIGH';
    if (riskLevel >= 0.5) return 'MEDIUM';
    return 'LOW';
  }

  getFraudDetails(fraudChecks) {
    const details = {};
    
    Object.entries(fraudChecks).forEach(([type, check]) => {
      if (check.suspicious) {
        details[type] = {
          reason: check.reason,
          severity: check.severity,
          ...check
        };
      }
    });
    
    return details;
  }

  async recordFraudAlert(employeeId, fraudChecks, location, riskLevel) {
    try {
      const alertData = {
        employeeId,
        type: this.getPrimaryFraudType(fraudChecks),
        severity: this.getSeverityLevel(riskLevel),
        location,
        riskLevel,
        checks: fraudChecks,
        timestamp: new Date(),
        status: 'active'
      };
      
      await addDocument('fraud_alerts', alertData);
      
      logFraudDetection(employeeId, alertData.type, {
        severity: alertData.severity,
        riskLevel,
        location
      });
      
    } catch (error) {
      console.error('שגיאה ברישום התראת הונאה:', error);
    }
  }

  async saveFaceVerificationImage(employeeId, imageData) {
    try {
      await addDocument('face_verifications', {
        employeeId,
        imageData,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('שגיאה בשמירת תמונת אימות פנים:', error);
    }
  }
}

module.exports = new FraudService();
