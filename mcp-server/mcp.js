// MCP Server לזיהוי הונאות GPS וניתוח התנהגות
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const geolib = require('geolib');
const winston = require('winston');
const cron = require('node-cron');

// הגדרת logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/fraud-detection.log' }),
    new winston.transports.Console()
  ]
});

// הגדרות זיהוי הונאות
const FRAUD_THRESHOLDS = {
  MAX_GPS_SPEED: 100, // ק"מ/שעה
  STAGNATION_TIME: 15, // דקות
  MAX_MOVEMENT: 10, // מטרים
  DEVICE_CHANGE_SEVERITY: 'HIGH',
  WIFI_ANOMALY_THRESHOLD: 3,
  PATTERN_ANOMALY_THRESHOLD: 0.7
};

class FraudDetectionMCP {
  constructor() {
    this.server = new Server(
      {
        name: 'attendance-fraud-detection',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupTools();
    this.setupCronJobs();
  }

  setupTools() {
    // כלי לבדיקת הונאות מיקום
    this.server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'check_location_fraud':
            return await this.checkLocationFraud(args);
          
          case 'analyze_movement_pattern':
            return await this.analyzeMovementPattern(args);
          
          case 'detect_device_sharing':
            return await this.detectDeviceSharing(args);
          
          case 'trigger_random_face_check':
            return await this.triggerRandomFaceCheck(args);
          
          case 'analyze_attendance_patterns':
            return await this.analyzeAttendancePatterns(args);
          
          case 'detect_wifi_spoofing':
            return await this.detectWiFiSpoofing(args);
          
          default:
            throw new Error(`כלי לא ידוע: ${name}`);
        }
      } catch (error) {
        logger.error(`שגיאה בביצוע כלי ${name}:`, error);
        return {
          content: [
            {
              type: 'text',
              text: `שגיאה: ${error.message}`
            }
          ]
        };
      }
    });

    // רישום כלים זמינים
    this.server.setRequestHandler('tools/list', async () => {
      return {
        tools: [
          {
            name: 'check_location_fraud',
            description: 'בודק הונאות GPS במיקום עובד',
            inputSchema: {
              type: 'object',
              properties: {
                employeeId: { type: 'string', description: 'מזהה עובד' },
                locations: { 
                  type: 'array', 
                  description: 'מערך מיקומים עם timestamps',
                  items: {
                    type: 'object',
                    properties: {
                      lat: { type: 'number' },
                      lng: { type: 'number' },
                      timestamp: { type: 'number' },
                      accuracy: { type: 'number' }
                    }
                  }
                }
              },
              required: ['employeeId', 'locations']
            }
          },
          {
            name: 'analyze_movement_pattern',
            description: 'מנתח דפוסי תזוזה של עובד',
            inputSchema: {
              type: 'object',
              properties: {
                userId: { type: 'string', description: 'מזהה משתמש' },
                timeRange: { type: 'string', description: 'טווח זמן לניתוח' },
                locations: { type: 'array', description: 'מיקומים לניתוח' }
              },
              required: ['userId', 'timeRange']
            }
          },
          {
            name: 'detect_device_sharing',
            description: 'זיהוי שיתוף מכשיר בין עובדים',
            inputSchema: {
              type: 'object',
              properties: {
                userId: { type: 'string', description: 'מזהה משתמש' },
                deviceFingerprint: { type: 'object', description: 'טביעת מכשיר נוכחית' },
                previousFingerprints: { type: 'array', description: 'טביעות מכשיר קודמות' }
              },
              required: ['userId', 'deviceFingerprint']
            }
          },
          {
            name: 'trigger_random_face_check',
            description: 'הפעלת בדיקת פנים אקראית',
            inputSchema: {
              type: 'object',
              properties: {
                userId: { type: 'string', description: 'מזהה משתמש' },
                probability: { type: 'number', description: 'הסתברות לבדיקה (0-1)' }
              },
              required: ['userId']
            }
          },
          {
            name: 'analyze_attendance_patterns',
            description: 'ניתוח דפוסי נוכחות חריגים',
            inputSchema: {
              type: 'object',
              properties: {
                employeeId: { type: 'string', description: 'מזהה עובד' },
                attendanceHistory: { type: 'array', description: 'היסטוריית נוכחות' },
                timeRange: { type: 'string', description: 'טווח זמן לניתוח' }
              },
              required: ['employeeId', 'attendanceHistory']
            }
          },
          {
            name: 'detect_wifi_spoofing',
            description: 'זיהוי WiFi spoofing',
            inputSchema: {
              type: 'object',
              properties: {
                userId: { type: 'string', description: 'מזהה משתמש' },
                currentWiFi: { type: 'array', description: 'רשתות WiFi נוכחיות' },
                knownWiFi: { type: 'array', description: 'רשתות WiFi מוכרות' }
              },
              required: ['userId', 'currentWiFi', 'knownWiFi']
            }
          }
        ]
      };
    });
  }

  // בדיקת הונאות מיקום GPS
  async checkLocationFraud(args) {
    const { employeeId, locations } = args;
    
    if (!locations || locations.length < 2) {
      return {
        content: [{
          type: 'text',
          text: 'נדרשים לפחות 2 מיקומים לבדיקת הונאות'
        }]
      };
    }

    const fraudChecks = {
      gpsJumps: this.detectGPSJumps(locations),
      stagnation: this.detectStagnation(locations),
      patternAnomalies: this.detectPatternAnomalies(locations)
    };

    const riskLevel = this.calculateRiskLevel(fraudChecks);
    const isSuspicious = riskLevel > FRAUD_THRESHOLDS.PATTERN_ANOMALY_THRESHOLD;

    logger.info(`בדיקת הונאות GPS לעובד ${employeeId}`, {
      riskLevel,
      isSuspicious,
      checks: fraudChecks
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          employeeId,
          isSuspicious,
          riskLevel,
          fraudChecks,
          recommendations: this.generateRecommendations(fraudChecks)
        }, null, 2)
      }]
    };
  }

  // ניתוח דפוסי תזוזה
  async analyzeMovementPattern(args) {
    const { userId, timeRange, locations } = args;
    
    const analysis = {
      circularMovement: this.detectCircularMovement(locations),
      gridPattern: this.detectGridPattern(locations),
      unusualTiming: this.detectUnusualTiming(locations),
      speedVariations: this.analyzeSpeedVariations(locations),
      directionChanges: this.analyzeDirectionChanges(locations)
    };

    const anomalyScore = this.calculateAnomalyScore(analysis);
    
    logger.info(`ניתוח דפוסי תזוזה למשתמש ${userId}`, {
      anomalyScore,
      analysis
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          userId,
          timeRange,
          anomalyScore,
          analysis,
          isAnomalous: anomalyScore > 0.7
        }, null, 2)
      }]
    };
  }

  // זיהוי שיתוף מכשיר
  async detectDeviceSharing(args) {
    const { userId, deviceFingerprint, previousFingerprints } = args;
    
    const changes = this.compareDeviceFingerprints(deviceFingerprint, previousFingerprints);
    const riskLevel = this.calculateDeviceSharingRisk(changes);
    
    logger.info(`בדיקת שיתוף מכשיר למשתמש ${userId}`, {
      changes: changes.length,
      riskLevel
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          userId,
          isSuspicious: riskLevel > 0.5,
          riskLevel,
          changes,
          recommendation: riskLevel > 0.7 ? 'REQUEST_ADDITIONAL_AUTH' : 'MONITOR'
        }, null, 2)
      }]
    };
  }

  // הפעלת בדיקת פנים אקראית
  async triggerRandomFaceCheck(args) {
    const { userId, probability = 0.3 } = args;
    
    const shouldTrigger = Math.random() < probability;
    
    if (shouldTrigger) {
      logger.info(`הפעלת בדיקת פנים אקראית למשתמש ${userId}`);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            userId,
            triggered: true,
            timestamp: new Date().toISOString(),
            reason: 'random_verification',
            expiresIn: 300 // 5 דקות
          }, null, 2)
        }]
      };
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          userId,
          triggered: false,
          reason: 'probability_not_met'
        }, null, 2)
      }]
    };
  }

  // ניתוח דפוסי נוכחות
  async analyzeAttendancePatterns(args) {
    const { employeeId, attendanceHistory, timeRange } = args;
    
    const patterns = {
      checkInTimes: this.analyzeCheckInTimes(attendanceHistory),
      checkOutTimes: this.analyzeCheckOutTimes(attendanceHistory),
      workDuration: this.analyzeWorkDuration(attendanceHistory),
      absencePatterns: this.analyzeAbsencePatterns(attendanceHistory),
      punctuality: this.analyzePunctuality(attendanceHistory)
    };

    const anomalyScore = this.calculateAttendanceAnomalyScore(patterns);
    
    logger.info(`ניתוח דפוסי נוכחות לעובד ${employeeId}`, {
      anomalyScore,
      patterns
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          employeeId,
          timeRange,
          anomalyScore,
          patterns,
          isAnomalous: anomalyScore > 0.6,
          recommendations: this.generateAttendanceRecommendations(patterns)
        }, null, 2)
      }]
    };
  }

  // זיהוי WiFi spoofing
  async detectWiFiSpoofing(args) {
    const { userId, currentWiFi, knownWiFi } = args;
    
    const unknownNetworks = currentWiFi.filter(network => 
      !knownWiFi.some(known => known.ssid === network.ssid)
    );
    
    const missingNetworks = knownWiFi.filter(known =>
      !currentWiFi.some(current => current.ssid === known.ssid)
    );
    
    const anomalyScore = (unknownNetworks.length + missingNetworks.length) / 
                        Math.max(knownWiFi.length, 1);
    
    const isSuspicious = anomalyScore > FRAUD_THRESHOLDS.WIFI_ANOMALY_THRESHOLD / 10;
    
    logger.info(`בדיקת WiFi spoofing למשתמש ${userId}`, {
      unknownNetworks: unknownNetworks.length,
      missingNetworks: missingNetworks.length,
      anomalyScore,
      isSuspicious
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          userId,
          isSuspicious,
          anomalyScore,
          unknownNetworks: unknownNetworks.length,
          missingNetworks: missingNetworks.length,
          recommendation: isSuspicious ? 'REQUEST_QR_SCAN' : 'NORMAL'
        }, null, 2)
      }]
    };
  }

  // פונקציות עזר לזיהוי הונאות GPS
  detectGPSJumps(locations) {
    const jumps = [];
    
    for (let i = 1; i < locations.length; i++) {
      const prev = locations[i - 1];
      const curr = locations[i];
      
      const timeDiff = (curr.timestamp - prev.timestamp) / 1000;
      const distance = geolib.getDistance(
        { latitude: prev.lat, longitude: prev.lng },
        { latitude: curr.lat, longitude: curr.lng }
      );
      
      if (timeDiff > 0) {
        const speed = (distance / 1000) / (timeDiff / 3600);
        
        if (speed > FRAUD_THRESHOLDS.MAX_GPS_SPEED) {
          jumps.push({
            from: prev,
            to: curr,
            speed,
            distance,
            timeDiff,
            severity: speed > FRAUD_THRESHOLDS.MAX_GPS_SPEED * 2 ? 'HIGH' : 'MEDIUM'
          });
        }
      }
    }
    
    return jumps;
  }

  detectStagnation(locations) {
    const stagnations = [];
    let stagnationStart = null;
    let stagnationLocations = [];
    
    for (let i = 1; i < locations.length; i++) {
      const prev = locations[i - 1];
      const curr = locations[i];
      
      const distance = geolib.getDistance(
        { latitude: prev.lat, longitude: prev.lng },
        { latitude: curr.lat, longitude: curr.lng }
      );
      
      if (distance <= FRAUD_THRESHOLDS.MAX_MOVEMENT) {
        if (!stagnationStart) {
          stagnationStart = prev.timestamp;
          stagnationLocations = [prev];
        }
        stagnationLocations.push(curr);
      } else {
        if (stagnationStart && stagnationLocations.length > 1) {
          const stagnationDuration = (curr.timestamp - stagnationStart) / (1000 * 60);
          
          if (stagnationDuration >= FRAUD_THRESHOLDS.STAGNATION_TIME) {
            stagnations.push({
              startTime: stagnationStart,
              endTime: curr.timestamp,
              duration: stagnationDuration,
              locations: stagnationLocations.length,
              severity: stagnationDuration > FRAUD_THRESHOLDS.STAGNATION_TIME * 2 ? 'HIGH' : 'MEDIUM'
            });
          }
        }
        
        stagnationStart = null;
        stagnationLocations = [];
      }
    }
    
    return stagnations;
  }

  detectPatternAnomalies(locations) {
    const anomalies = [];
    
    // בדיקת דפוס מעגלי
    if (this.detectCircularMovement(locations)) {
      anomalies.push({ type: 'circular_movement', severity: 'MEDIUM' });
    }
    
    // בדיקת דפוס רשת
    if (this.detectGridPattern(locations)) {
      anomalies.push({ type: 'grid_movement', severity: 'HIGH' });
    }
    
    // בדיקת זמנים חריגים
    if (this.detectUnusualTiming(locations)) {
      anomalies.push({ type: 'unusual_timing', severity: 'MEDIUM' });
    }
    
    return anomalies;
  }

  detectCircularMovement(locations) {
    if (locations.length < 5) return false;
    
    const distances = [];
    for (let i = 1; i < locations.length; i++) {
      const distance = geolib.getDistance(
        { latitude: locations[i-1].lat, longitude: locations[i-1].lng },
        { latitude: locations[i].lat, longitude: locations[i].lng }
      );
      distances.push(distance);
    }
    
    const avgDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
    return distances.every(d => Math.abs(d - avgDistance) < avgDistance * 0.3);
  }

  detectGridPattern(locations) {
    if (locations.length < 5) return false;
    
    const distances = [];
    for (let i = 1; i < locations.length; i++) {
      const distance = geolib.getDistance(
        { latitude: locations[i-1].lat, longitude: locations[i-1].lng },
        { latitude: locations[i].lat, longitude: locations[i].lng }
      );
      distances.push(distance);
    }
    
    const avgDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
    return distances.every(d => Math.abs(d - avgDistance) < 5);
  }

  detectUnusualTiming(locations) {
    const times = locations.map(loc => new Date(loc.timestamp).getHours());
    const avgTime = times.reduce((sum, t) => sum + t, 0) / times.length;
    return avgTime < 6 || avgTime > 22;
  }

  analyzeSpeedVariations(locations) {
    const speeds = [];
    for (let i = 1; i < locations.length; i++) {
      const prev = locations[i - 1];
      const curr = locations[i];
      const timeDiff = (curr.timestamp - prev.timestamp) / 1000;
      const distance = geolib.getDistance(
        { latitude: prev.lat, longitude: prev.lng },
        { latitude: curr.lat, longitude: curr.lng }
      );
      
      if (timeDiff > 0) {
        speeds.push((distance / 1000) / (timeDiff / 3600));
      }
    }
    
    const avgSpeed = speeds.reduce((sum, s) => sum + s, 0) / speeds.length;
    const variance = speeds.reduce((sum, s) => sum + Math.pow(s - avgSpeed, 2), 0) / speeds.length;
    
    return { avgSpeed, variance, speeds };
  }

  analyzeDirectionChanges(locations) {
    const directions = [];
    for (let i = 1; i < locations.length; i++) {
      const prev = locations[i - 1];
      const curr = locations[i];
      const bearing = geolib.getBearing(
        { latitude: prev.lat, longitude: prev.lng },
        { latitude: curr.lat, longitude: curr.lng }
      );
      directions.push(bearing);
    }
    
    const changes = directions.filter((dir, i) => 
      i > 0 && Math.abs(dir - directions[i-1]) > 45
    ).length;
    
    return { changes, totalMovements: directions.length, changeRate: changes / directions.length };
  }

  compareDeviceFingerprints(current, previous) {
    if (!previous || previous.length === 0) return [];
    
    const changes = [];
    const lastFingerprint = previous[previous.length - 1];
    
    const fields = ['userAgent', 'screenResolution', 'timezone', 'language', 'platform'];
    
    fields.forEach(field => {
      if (current[field] !== lastFingerprint[field]) {
        changes.push({
          field,
          old: lastFingerprint[field],
          new: current[field],
          severity: field === 'userAgent' ? 'HIGH' : 'MEDIUM'
        });
      }
    });
    
    return changes;
  }

  calculateDeviceSharingRisk(changes) {
    if (changes.length === 0) return 0;
    
    const highSeverityChanges = changes.filter(c => c.severity === 'HIGH').length;
    const mediumSeverityChanges = changes.filter(c => c.severity === 'MEDIUM').length;
    
    return (highSeverityChanges * 0.8 + mediumSeverityChanges * 0.4) / changes.length;
  }

  analyzeCheckInTimes(attendanceHistory) {
    const checkIns = attendanceHistory.filter(r => r.type === 'check-in');
    const times = checkIns.map(r => new Date(r.timestamp).getHours());
    
    const avgTime = times.reduce((sum, t) => sum + t, 0) / times.length;
    const earlyCheckIns = times.filter(t => t < 7).length;
    const lateCheckIns = times.filter(t => t > 10).length;
    
    return { avgTime, earlyCheckIns, lateCheckIns, totalCheckIns: checkIns.length };
  }

  analyzeCheckOutTimes(attendanceHistory) {
    const checkOuts = attendanceHistory.filter(r => r.type === 'check-out');
    const times = checkOuts.map(r => new Date(r.timestamp).getHours());
    
    const avgTime = times.reduce((sum, t) => sum + t, 0) / times.length;
    const earlyCheckOuts = times.filter(t => t < 16).length;
    const lateCheckOuts = times.filter(t => t > 20).length;
    
    return { avgTime, earlyCheckOuts, lateCheckOuts, totalCheckOuts: checkOuts.length };
  }

  analyzeWorkDuration(attendanceHistory) {
    const durations = [];
    const checkIns = attendanceHistory.filter(r => r.type === 'check-in');
    const checkOuts = attendanceHistory.filter(r => r.type === 'check-out');
    
    checkIns.forEach(checkIn => {
      const checkOut = checkOuts.find(co => 
        new Date(co.timestamp).toDateString() === new Date(checkIn.timestamp).toDateString()
      );
      
      if (checkOut) {
        const duration = (new Date(checkOut.timestamp) - new Date(checkIn.timestamp)) / (1000 * 60 * 60);
        durations.push(duration);
      }
    });
    
    const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const shortDays = durations.filter(d => d < 6).length;
    const longDays = durations.filter(d => d > 10).length;
    
    return { avgDuration, shortDays, longDays, totalDays: durations.length };
  }

  analyzeAbsencePatterns(attendanceHistory) {
    const uniqueDays = new Set(
      attendanceHistory.map(r => new Date(r.timestamp).toDateString())
    ).size;
    
    // הנחה שיש 22 ימי עבודה בחודש
    const expectedDays = 22;
    const absenceRate = 1 - (uniqueDays / expectedDays);
    
    return { uniqueDays, expectedDays, absenceRate };
  }

  analyzePunctuality(attendanceHistory) {
    const checkIns = attendanceHistory.filter(r => r.type === 'check-in');
    const onTimeCheckIns = checkIns.filter(checkIn => {
      const hour = new Date(checkIn.timestamp).getHours();
      return hour >= 7 && hour <= 9;
    });
    
    return {
      totalCheckIns: checkIns.length,
      onTimeCheckIns: onTimeCheckIns.length,
      punctualityRate: checkIns.length > 0 ? (onTimeCheckIns.length / checkIns.length) * 100 : 0
    };
  }

  calculateRiskLevel(fraudChecks) {
    let totalRisk = 0;
    let checkCount = 0;
    
    if (fraudChecks.gpsJumps.length > 0) {
      totalRisk += fraudChecks.gpsJumps.some(j => j.severity === 'HIGH') ? 0.8 : 0.5;
      checkCount++;
    }
    
    if (fraudChecks.stagnation.length > 0) {
      totalRisk += fraudChecks.stagnation.some(s => s.severity === 'HIGH') ? 0.6 : 0.3;
      checkCount++;
    }
    
    if (fraudChecks.patternAnomalies.length > 0) {
      totalRisk += fraudChecks.patternAnomalies.some(p => p.severity === 'HIGH') ? 0.7 : 0.4;
      checkCount++;
    }
    
    return checkCount > 0 ? totalRisk / checkCount : 0;
  }

  calculateAnomalyScore(analysis) {
    let score = 0;
    
    if (analysis.circularMovement) score += 0.3;
    if (analysis.gridPattern) score += 0.8;
    if (analysis.unusualTiming) score += 0.2;
    if (analysis.speedVariations.variance > 100) score += 0.3;
    if (analysis.directionChanges.changeRate > 0.5) score += 0.2;
    
    return Math.min(score, 1);
  }

  calculateAttendanceAnomalyScore(patterns) {
    let score = 0;
    
    if (patterns.checkInTimes.earlyCheckIns > patterns.checkInTimes.totalCheckIns * 0.3) score += 0.3;
    if (patterns.checkOutTimes.lateCheckOuts > patterns.checkOutTimes.totalCheckOuts * 0.3) score += 0.3;
    if (patterns.workDuration.shortDays > patterns.workDuration.totalDays * 0.2) score += 0.2;
    if (patterns.absencePatterns.absenceRate > 0.1) score += 0.4;
    if (patterns.punctuality.punctualityRate < 70) score += 0.3;
    
    return Math.min(score, 1);
  }

  generateRecommendations(fraudChecks) {
    const recommendations = [];
    
    if (fraudChecks.gpsJumps.length > 0) {
      recommendations.push('REQUEST_FACE_VERIFICATION');
    }
    
    if (fraudChecks.stagnation.length > 0) {
      recommendations.push('REQUEST_LOCATION_UPDATE');
    }
    
    if (fraudChecks.patternAnomalies.length > 0) {
      recommendations.push('REQUEST_QR_SCAN');
    }
    
    return recommendations;
  }

  generateAttendanceRecommendations(patterns) {
    const recommendations = [];
    
    if (patterns.punctuality.punctualityRate < 70) {
      recommendations.push('PUNCTUALITY_WARNING');
    }
    
    if (patterns.absencePatterns.absenceRate > 0.1) {
      recommendations.push('ATTENDANCE_WARNING');
    }
    
    if (patterns.workDuration.shortDays > patterns.workDuration.totalDays * 0.2) {
      recommendations.push('WORK_HOURS_WARNING');
    }
    
    return recommendations;
  }

  setupCronJobs() {
    // בדיקה יומית של דפוסי הונאה
    cron.schedule('0 9 * * *', async () => {
      logger.info('הפעלת בדיקה יומית של דפוסי הונאה');
      // כאן יהיה קריאה לניתוח יומי
    });

    // בדיקה שבועית של דפוסי נוכחות
    cron.schedule('0 10 * * 1', async () => {
      logger.info('הפעלת בדיקה שבועית של דפוסי נוכחות');
      // כאן יהיה קריאה לניתוח שבועי
    });
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    logger.info('MCP Server לזיהוי הונאות התחיל');
  }
}

// הפעלת השרת
const fraudDetectionMCP = new FraudDetectionMCP();
fraudDetectionMCP.start().catch(console.error);

module.exports = FraudDetectionMCP;
