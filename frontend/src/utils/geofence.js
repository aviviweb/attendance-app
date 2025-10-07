// קובץ בדיקת geofence - point in polygon
import * as turf from '@turf/turf';

/**
 * בודק אם נקודה נמצאת בתוך פוליגון
 * @param {number} lat - קו רוחב
 * @param {number} lng - קו אורך
 * @param {Array} polygon - מערך של נקודות הפוליגון
 * @returns {boolean} - true אם הנקודה בתוך הפוליגון
 */
export const isPointInPolygon = (lat, lng, polygon) => {
  try {
    // יצירת נקודה
    const point = turf.point([lng, lat]);
    
    // יצירת פוליגון
    const polygonFeature = turf.polygon([polygon]);
    
    // בדיקה אם הנקודה בתוך הפוליגון
    return turf.booleanPointInPolygon(point, polygonFeature);
  } catch (error) {
    console.error('שגיאה בבדיקת geofence:', error);
    return false;
  }
};

/**
 * מחשב מרחק בין שתי נקודות במטרים
 * @param {number} lat1 - קו רוחב נקודה ראשונה
 * @param {number} lng1 - קו אורך נקודה ראשונה
 * @param {number} lat2 - קו רוחב נקודה שנייה
 * @param {number} lng2 - קו אורך נקודה שנייה
 * @returns {number} - מרחק במטרים
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
  try {
    const from = turf.point([lng1, lat1]);
    const to = turf.point([lng2, lat2]);
    
    return turf.distance(from, to, { units: 'meters' });
  } catch (error) {
    console.error('שגיאה בחישוב מרחק:', error);
    return 0;
  }
};

/**
 * בודק אם עובד נמצא באזור עבודה מאושר
 * @param {Object} location - מיקום נוכחי {lat, lng}
 * @param {Array} workAreas - מערך של אזורי עבודה
 * @returns {Object} - {isInArea: boolean, areaName: string}
 */
export const checkWorkArea = (location, workAreas) => {
  for (const area of workAreas) {
    if (isPointInPolygon(location.lat, location.lng, area.polygon)) {
      return {
        isInArea: true,
        areaName: area.name,
        areaId: area.id
      };
    }
  }
  
  return {
    isInArea: false,
    areaName: null,
    areaId: null
  };
};

/**
 * מחשב מרחק מהגבול הקרוב ביותר של פוליגון
 * @param {number} lat - קו רוחב
 * @param {number} lng - קו אורך
 * @param {Array} polygon - מערך של נקודות הפוליגון
 * @returns {number} - מרחק מהגבול במטרים
 */
export const distanceToPolygonBorder = (lat, lng, polygon) => {
  try {
    const point = turf.point([lng, lat]);
    const polygonFeature = turf.polygon([polygon]);
    
    return turf.pointToLineDistance(point, polygonFeature, { units: 'meters' });
  } catch (error) {
    console.error('שגיאה בחישוב מרחק לגבול:', error);
    return Infinity;
  }
};

/**
 * יוצר אזור חיץ סביב פוליגון
 * @param {Array} polygon - מערך של נקודות הפוליגון
 * @param {number} bufferDistance - מרחק החיץ במטרים
 * @returns {Array} - פוליגון מורחב
 */
export const createBufferZone = (polygon, bufferDistance) => {
  try {
    const polygonFeature = turf.polygon([polygon]);
    const buffered = turf.buffer(polygonFeature, bufferDistance, { units: 'meters' });
    
    return buffered.geometry.coordinates[0];
  } catch (error) {
    console.error('שגיאה ביצירת אזור חיץ:', error);
    return polygon;
  }
};

/**
 * בודק אם מיקום נמצא בטווח מיקום אחר
 * @param {Object} location1 - מיקום ראשון
 * @param {Object} location2 - מיקום שני
 * @param {number} maxDistance - מרחק מקסימלי במטרים
 * @returns {boolean} - true אם המרחק קטן מהמקסימום
 */
export const isWithinRange = (location1, location2, maxDistance) => {
  const distance = calculateDistance(
    location1.lat, location1.lng,
    location2.lat, location2.lng
  );
  
  return distance <= maxDistance;
};

/**
 * מחזיר את הפוליגון הקרוב ביותר לנקודה
 * @param {Object} location - מיקום נוכחי
 * @param {Array} polygons - מערך של פוליגונים
 * @returns {Object} - {polygon, distance, index}
 */
export const findNearestPolygon = (location, polygons) => {
  let nearest = null;
  let minDistance = Infinity;
  let nearestIndex = -1;
  
  polygons.forEach((polygon, index) => {
    const distance = distanceToPolygonBorder(location.lat, location.lng, polygon.coordinates);
    
    if (distance < minDistance) {
      minDistance = distance;
      nearest = polygon;
      nearestIndex = index;
    }
  });
  
  return {
    polygon: nearest,
    distance: minDistance,
    index: nearestIndex
  };
};
