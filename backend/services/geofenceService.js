// שירות בדיקת geofence
const { getCollection } = require('../config/firebase');
const geolib = require('geolib');

class GeofenceService {
  constructor() {
    this.workAreas = [];
    this.loadWorkAreas();
  }

  // טעינת אזורי עבודה מ-Firebase
  async loadWorkAreas() {
    try {
      const areas = await getCollection('work_areas');
      this.workAreas = areas.map(area => ({
        id: area.id,
        name: area.name,
        department: area.department,
        coordinates: area.coordinates,
        bufferZone: area.bufferZone || 0,
        isActive: area.isActive !== false
      }));
      
      console.log(`נטענו ${this.workAreas.length} אזורי עבודה`);
    } catch (error) {
      console.error('שגיאה בטעינת אזורי עבודה:', error);
      this.workAreas = [];
    }
  }

  // בדיקה אם מיקום נמצא באזור עבודה
  async checkWorkArea(location) {
    try {
      const { lat, lng } = location;
      
      for (const area of this.workAreas) {
        if (!area.isActive) continue;
        
        // בדיקה אם הנקודה בתוך הפוליגון
        const isInside = geolib.isPointInPolygon(
          { latitude: lat, longitude: lng },
          area.coordinates.map(coord => ({
            latitude: coord.lat,
            longitude: coord.lng
          }))
        );
        
        if (isInside) {
          return {
            isInArea: true,
            areaName: area.name,
            areaId: area.id,
            department: area.department,
            distance: 0
          };
        }
        
        // בדיקה אם הנקודה באזור החיץ
        if (area.bufferZone > 0) {
          const distanceToBorder = this.calculateDistanceToPolygonBorder(location, area.coordinates);
          
          if (distanceToBorder <= area.bufferZone) {
            return {
              isInArea: true,
              areaName: area.name,
              areaId: area.id,
              department: area.department,
              distance: distanceToBorder,
              inBufferZone: true
            };
          }
        }
      }
      
      // מציאת האזור הקרוב ביותר
      const nearestArea = this.findNearestArea(location);
      
      return {
        isInArea: false,
        areaName: null,
        areaId: null,
        department: null,
        distance: nearestArea.distance,
        nearestArea: nearestArea.area
      };
      
    } catch (error) {
      console.error('שגיאה בבדיקת אזור עבודה:', error);
      return {
        isInArea: false,
        areaName: null,
        areaId: null,
        department: null,
        distance: Infinity,
        error: error.message
      };
    }
  }

  // חישוב מרחק מהגבול הקרוב ביותר של פוליגון
  calculateDistanceToPolygonBorder(location, coordinates) {
    try {
      const point = { latitude: location.lat, longitude: location.lng };
      let minDistance = Infinity;
      
      // בדיקת מרחק לכל צלע של הפוליגון
      for (let i = 0; i < coordinates.length; i++) {
        const start = {
          latitude: coordinates[i].lat,
          longitude: coordinates[i].lng
        };
        
        const end = {
          latitude: coordinates[(i + 1) % coordinates.length].lat,
          longitude: coordinates[(i + 1) % coordinates.length].lng
        };
        
        const distance = geolib.getDistanceToLine(point, start, end);
        minDistance = Math.min(minDistance, distance);
      }
      
      return minDistance;
    } catch (error) {
      console.error('שגיאה בחישוב מרחק לגבול:', error);
      return Infinity;
    }
  }

  // מציאת האזור הקרוב ביותר
  findNearestArea(location) {
    let nearestArea = null;
    let minDistance = Infinity;
    
    for (const area of this.workAreas) {
      if (!area.isActive) continue;
      
      const distance = this.calculateDistanceToPolygonBorder(location, area.coordinates);
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestArea = area;
      }
    }
    
    return {
      area: nearestArea,
      distance: minDistance
    };
  }

  // בדיקה אם מיקום נמצא בטווח מיקום אחר
  isWithinRange(location1, location2, maxDistance) {
    try {
      const distance = geolib.getDistance(
        { latitude: location1.lat, longitude: location1.lng },
        { latitude: location2.lat, longitude: location2.lng }
      );
      
      return distance <= maxDistance;
    } catch (error) {
      console.error('שגיאה בבדיקת טווח:', error);
      return false;
    }
  }

  // יצירת אזור חיץ סביב פוליגון
  createBufferZone(coordinates, bufferDistance) {
    try {
      // כאן יהיה לוגיקה מתקדמת יותר ליצירת אזור חיץ
      // כרגע נחזיר את הפוליגון המקורי
      return coordinates;
    } catch (error) {
      console.error('שגיאה ביצירת אזור חיץ:', error);
      return coordinates;
    }
  }

  // עדכון אזורי עבודה
  async updateWorkAreas() {
    await this.loadWorkAreas();
  }

  // קבלת רשימת אזורי עבודה
  getWorkAreas() {
    return this.workAreas.filter(area => area.isActive);
  }

  // קבלת אזור עבודה לפי ID
  getWorkAreaById(areaId) {
    return this.workAreas.find(area => area.id === areaId);
  }

  // קבלת אזורי עבודה לפי מחלקה
  getWorkAreasByDepartment(department) {
    return this.workAreas.filter(area => 
      area.isActive && area.department === department
    );
  }

  // בדיקת תקינות פוליגון
  validatePolygon(coordinates) {
    try {
      if (!Array.isArray(coordinates) || coordinates.length < 3) {
        return { valid: false, error: 'פוליגון חייב להכיל לפחות 3 נקודות' };
      }
      
      // בדיקה שהנקודות תקינות
      for (const coord of coordinates) {
        if (typeof coord.lat !== 'number' || typeof coord.lng !== 'number') {
          return { valid: false, error: 'נקודות הפוליגון חייבות להכיל lat ו-lng תקינים' };
        }
        
        if (coord.lat < -90 || coord.lat > 90) {
          return { valid: false, error: 'קו רוחב חייב להיות בין -90 ל-90' };
        }
        
        if (coord.lng < -180 || coord.lng > 180) {
          return { valid: false, error: 'קו אורך חייב להיות בין -180 ל-180' };
        }
      }
      
      // בדיקה שהפוליגון לא חופף לעצמו
      const polygon = coordinates.map(coord => ({
        latitude: coord.lat,
        longitude: coord.lng
      }));
      
      // בדיקה בסיסית - כאן ניתן להוסיף בדיקות מתקדמות יותר
      return { valid: true };
      
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  // חישוב שטח פוליגון
  calculatePolygonArea(coordinates) {
    try {
      const polygon = coordinates.map(coord => ({
        latitude: coord.lat,
        longitude: coord.lng
      }));
      
      return geolib.getAreaOfPolygon(polygon);
    } catch (error) {
      console.error('שגיאה בחישוב שטח פוליגון:', error);
      return 0;
    }
  }

  // בדיקה אם שני פוליגונים חופפים
  doPolygonsOverlap(coordinates1, coordinates2) {
    try {
      const polygon1 = coordinates1.map(coord => ({
        latitude: coord.lat,
        longitude: coord.lng
      }));
      
      const polygon2 = coordinates2.map(coord => ({
        latitude: coord.lat,
        longitude: coord.lng
      }));
      
      // בדיקה אם נקודה מפוליגון אחד נמצאת בפוליגון השני
      for (const point of polygon1) {
        if (geolib.isPointInPolygon(point, polygon2)) {
          return true;
        }
      }
      
      for (const point of polygon2) {
        if (geolib.isPointInPolygon(point, polygon1)) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('שגיאה בבדיקת חפיפה:', error);
      return false;
    }
  }
}

// יצירת instance גלובלי
const geofenceService = new GeofenceService();

// עדכון אזורי עבודה כל 5 דקות
setInterval(() => {
  geofenceService.updateWorkAreas();
}, 5 * 60 * 1000);

module.exports = geofenceService;
