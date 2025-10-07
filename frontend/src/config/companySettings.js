// הגדרות מפעל - White Label Configuration
const companySettings = {
  // פרטי המפעל
  company: {
    name: "ולפמן תעשיות",
    industry: "ייצור מתכת",
    address: "רחוב התעשייה 123, תל אביב",
    phone: "03-1234567",
    email: "info@wolfman.co.il",
    website: "https://www.wolfman.co.il",
    logo: "/logo-wolfman.png",
    icon: "/icon-wolfman.png"
  },

  // מיתוג וצבעים
  branding: {
    primaryColor: "#004466",
    secondaryColor: "#0066dd",
    accentColor: "#28a745",
    backgroundColor: "linear-gradient(135deg, #004466 0%, #0066dd 50%, #004466 100%)",
    textColor: "#ffffff",
    cardBackground: "rgba(255, 255, 255, 0.95)"
  },

  // הגדרות מערכת
  system: {
    language: "he",
    timezone: "Asia/Jerusalem",
    distanceUnit: "km",
    dateFormat: "dd/mm/yyyy",
    currency: "ILS",
    currencySymbol: "₪"
  },

  // הגדרות אבטחה
  security: {
    securityLevel: "medium", // low, medium, high
    passwordExpiryDays: 90,
    twoFactorAuth: false,
    biometricAuth: false,
    sessionTimeout: 30 // דקות
  },

  // הגדרות נוכחות
  attendance: {
    workHours: {
      start: "08:00",
      end: "17:00",
      breakStart: "12:00",
      breakEnd: "13:00"
    },
    geofenceRadius: 100, // מטרים
    maxLateMinutes: 15,
    requirePhoto: true,
    requireLocation: true
  },

  // הגדרות התראות
  notifications: {
    email: true,
    sms: false,
    push: true,
    reminderMinutes: 15
  },

  // הגדרות דוחות
  reports: {
    defaultPeriod: "monthly",
    includePhotos: true,
    includeLocation: true,
    exportFormats: ["pdf", "excel", "csv"]
  }
};

// פונקציות עזר
export const getCompanyName = () => companySettings.company.name;
export const getCompanyLogo = () => companySettings.company.logo;
export const getPrimaryColor = () => companySettings.branding.primaryColor;
export const getSecondaryColor = () => companySettings.branding.secondaryColor;
export const getBackgroundStyle = () => companySettings.branding.backgroundColor;

// פונקציה לעדכון הגדרות
export const updateCompanySettings = (newSettings) => {
  Object.assign(companySettings, newSettings);
  // כאן ניתן להוסיף שמירה ל-localStorage או לשרת
  localStorage.setItem('companySettings', JSON.stringify(companySettings));
};

// פונקציה לטעינת הגדרות
export const loadCompanySettings = () => {
  const saved = localStorage.getItem('companySettings');
  if (saved) {
    Object.assign(companySettings, JSON.parse(saved));
  }
  return companySettings;
};

// פונקציה לאיפוס הגדרות
export const resetCompanySettings = () => {
  localStorage.removeItem('companySettings');
  // טעינה מחדש של הגדרות ברירת מחדל
  window.location.reload();
};

export default companySettings;


