// קובץ מעקב מיקום רציף
class LocationTracker {
  constructor(options = {}) {
    this.options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
      distanceFilter: 5, // מטרים
      timeFilter: 30000, // מילישניות
      ...options
    };
    
    this.watchId = null;
    this.lastLocation = null;
    this.locationHistory = [];
    this.isTracking = false;
    this.callbacks = {
      onLocationUpdate: null,
      onError: null,
      onPermissionDenied: null
    };
  }

  /**
   * התחלת מעקב מיקום
   * @param {Function} onLocationUpdate - callback לעדכון מיקום
   * @param {Function} onError - callback לשגיאות
   * @returns {Promise<boolean>} - האם המעקב התחיל בהצלחה
   */
  async startTracking(onLocationUpdate, onError) {
    try {
      // בדיקת תמיכה ב-Geolocation API
      if (!navigator.geolocation) {
        throw new Error('הדפדפן לא תומך ב-Geolocation API');
      }

      // בדיקת הרשאות
      const permission = await this.checkPermission();
      if (permission !== 'granted') {
        if (this.callbacks.onPermissionDenied) {
          this.callbacks.onPermissionDenied(permission);
        }
        return false;
      }

      // הגדרת callbacks
      this.callbacks.onLocationUpdate = onLocationUpdate;
      this.callbacks.onError = onError;

      // התחלת מעקב
      this.watchId = navigator.geolocation.watchPosition(
        (position) => this.handleLocationUpdate(position),
        (error) => this.handleError(error),
        this.options
      );

      this.isTracking = true;
      console.log('מעקב מיקום התחיל');
      return true;

    } catch (error) {
      console.error('שגיאה בהתחלת מעקב מיקום:', error);
      if (onError) onError(error);
      return false;
    }
  }

  /**
   * עצירת מעקב מיקום
   */
  stopTracking() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      this.isTracking = false;
      console.log('מעקב מיקום נעצר');
    }
  }

  /**
   * בדיקת הרשאות מיקום
   * @returns {Promise<string>} - סטטוס הרשאה
   */
  async checkPermission() {
    if (!navigator.permissions) {
      return 'unknown';
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      return permission.state;
    } catch (error) {
      console.error('שגיאה בבדיקת הרשאות:', error);
      return 'unknown';
    }
  }

  /**
   * טיפול בעדכון מיקום
   * @param {GeolocationPosition} position - מיקום חדש
   */
  handleLocationUpdate(position) {
    const newLocation = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude,
      heading: position.coords.heading,
      speed: position.coords.speed,
      timestamp: position.timestamp || Date.now()
    };

    // בדיקה אם המיקום השתנה מספיק
    if (this.shouldUpdateLocation(newLocation)) {
      this.lastLocation = newLocation;
      this.locationHistory.push(newLocation);
      
      // שמירת רק 100 מיקומים אחרונים
      if (this.locationHistory.length > 100) {
        this.locationHistory = this.locationHistory.slice(-100);
      }

      // קריאה ל-callback
      if (this.callbacks.onLocationUpdate) {
        this.callbacks.onLocationUpdate(newLocation);
      }

      console.log('מיקום עודכן:', newLocation);
    }
  }

  /**
   * בדיקה אם יש לעדכן מיקום
   * @param {Object} newLocation - מיקום חדש
   * @returns {boolean} - האם לעדכן
   */
  shouldUpdateLocation(newLocation) {
    if (!this.lastLocation) {
      return true;
    }

    // בדיקת מרחק
    const distance = this.calculateDistance(
      this.lastLocation.lat, this.lastLocation.lng,
      newLocation.lat, newLocation.lng
    );

    if (distance < this.options.distanceFilter) {
      return false;
    }

    // בדיקת זמן
    const timeDiff = newLocation.timestamp - this.lastLocation.timestamp;
    if (timeDiff < this.options.timeFilter) {
      return false;
    }

    return true;
  }

  /**
   * חישוב מרחק בין שתי נקודות
   * @param {number} lat1 - קו רוחב ראשון
   * @param {number} lng1 - קו אורך ראשון
   * @param {number} lat2 - קו רוחב שני
   * @param {number} lng2 - קו אורך שני
   * @returns {number} - מרחק במטרים
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371e3; // רדיוס כדור הארץ במטרים
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  /**
   * טיפול בשגיאות
   * @param {GeolocationPositionError} error - שגיאה
   */
  handleError(error) {
    let errorMessage = 'שגיאה לא ידועה במיקום';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'הגישה למיקום נדחתה על ידי המשתמש';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'מיקום לא זמין';
        break;
      case error.TIMEOUT:
        errorMessage = 'בקשת המיקום פגה';
        break;
    }

    console.error('שגיאת מיקום:', errorMessage, error);
    
    if (this.callbacks.onError) {
      this.callbacks.onError(error, errorMessage);
    }
  }

  /**
   * קבלת מיקום נוכחי
   * @returns {Object|null} - מיקום נוכחי
   */
  getCurrentLocation() {
    return this.lastLocation;
  }

  /**
   * קבלת היסטוריית מיקומים
   * @returns {Array} - היסטוריית מיקומים
   */
  getLocationHistory() {
    return [...this.locationHistory];
  }

  /**
   * קבלת סטטיסטיקות מעקב
   * @returns {Object} - סטטיסטיקות
   */
  getTrackingStats() {
    return {
      isTracking: this.isTracking,
      totalLocations: this.locationHistory.length,
      lastUpdate: this.lastLocation ? this.lastLocation.timestamp : null,
      averageAccuracy: this.calculateAverageAccuracy(),
      totalDistance: this.calculateTotalDistance()
    };
  }

  /**
   * חישוב דיוק ממוצע
   * @returns {number} - דיוק ממוצע במטרים
   */
  calculateAverageAccuracy() {
    if (this.locationHistory.length === 0) return 0;
    
    const totalAccuracy = this.locationHistory.reduce(
      (sum, location) => sum + location.accuracy, 0
    );
    
    return totalAccuracy / this.locationHistory.length;
  }

  /**
   * חישוב מרחק כולל
   * @returns {number} - מרחק כולל במטרים
   */
  calculateTotalDistance() {
    if (this.locationHistory.length < 2) return 0;
    
    let totalDistance = 0;
    for (let i = 1; i < this.locationHistory.length; i++) {
      const prev = this.locationHistory[i - 1];
      const curr = this.locationHistory[i];
      
      totalDistance += this.calculateDistance(
        prev.lat, prev.lng,
        curr.lat, curr.lng
      );
    }
    
    return totalDistance;
  }

  /**
   * ניקוי היסטוריית מיקומים
   */
  clearHistory() {
    this.locationHistory = [];
    this.lastLocation = null;
    console.log('היסטוריית מיקומים נוקתה');
  }

  /**
   * עדכון הגדרות מעקב
   * @param {Object} newOptions - הגדרות חדשות
   */
  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions };
    console.log('הגדרות מעקב עודכנו:', this.options);
  }
}

// יצירת instance גלובלי
export const locationTracker = new LocationTracker();

// פונקציות עזר
export const requestLocationPermission = async () => {
  try {
    const permission = await navigator.permissions.query({ name: 'geolocation' });
    return permission.state;
  } catch (error) {
    console.error('שגיאה בבדיקת הרשאות:', error);
    return 'unknown';
  }
};

export const getCurrentLocationOnce = (options = {}) => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('הדפדפן לא תומך ב-Geolocation API'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp || Date.now()
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
        ...options
      }
    );
  });
};

export default LocationTracker;
