# 🚀 מדריך הרצה צעד אחר צעד - אפליקציית נוכחות עובדים

## שלב 1: התקנת Node.js (חובה!)

### אפשרות A: הורדה ישירה (מומלץ)
1. לך ל-[nodejs.org](https://nodejs.org)
2. הורד את הגרסה LTS (18.x או 20.x)
3. הרץ את הקובץ `.msi` שהורדת
4. התקן עם כל ההגדרות ברירת מחדל
5. **הפעל מחדש את PowerShell** (חשוב!)

### אפשרות B: עם Chocolatey
```powershell
# התקנת Chocolatey קודם
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# התקנת Node.js
choco install nodejs

# הפעל מחדש PowerShell
```

### אפשרות C: עם Winget
```powershell
winget install OpenJS.NodeJS
# הפעל מחדש PowerShell
```

## שלב 2: בדיקת התקנה
לאחר הפעלה מחדש של PowerShell, הרץ:
```powershell
node --version
npm --version
```

אמור להציג משהו כמו:
```
v18.17.0
9.6.7
```

## שלב 3: התקנת Dependencies
```powershell
# חזור לתיקיית הפרויקט
cd C:\dev\attendance-app

# התקנת dependencies ראשיים
npm install

# התקנת dependencies לכל חלק
npm run install-all
```

## שלב 4: יצירת קבצי Environment

### Frontend
```powershell
cd frontend
echo "# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your-firebase-api-key-here
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# Mapbox Configuration
REACT_APP_MAPBOX_TOKEN=pk.your-mapbox-token-here

# Backend Configuration
REACT_APP_BACKEND_URL=http://localhost:5000

# Development
GENERATE_SOURCEMAP=false" > .env
```

### Backend
```powershell
cd ..\backend
echo "# Server Configuration
PORT=5000
NODE_ENV=development

# Firebase Configuration
FIREBASE_SERVICE_ACCOUNT=./serviceAccountKey.json
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
FIREBASE_STORAGE_BUCKET=your-project.appspot.com

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Logging
LOG_LEVEL=debug

# Security
JWT_SECRET=your-jwt-secret-here
ENCRYPTION_KEY=your-encryption-key-here

# External Services
MAPBOX_API_KEY=your-mapbox-api-key
SMS_API_KEY=your-sms-api-key
EMAIL_API_KEY=your-email-api-key

# Database
DB_CONNECTION_STRING=mongodb://localhost:27017/attendance-app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Fraud Detection
FRAUD_DETECTION_ENABLED=true
MAX_GPS_SPEED_KMH=100
STAGNATION_THRESHOLD_MINUTES=15
DEVICE_CHANGE_THRESHOLD=3
WIFI_ANOMALY_THRESHOLD=3

# Notifications
PUSH_NOTIFICATIONS_ENABLED=true
EMAIL_NOTIFICATIONS_ENABLED=true
SMS_NOTIFICATIONS_ENABLED=false

# File Upload
MAX_FILE_SIZE_MB=10
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif

# Cache
REDIS_URL=redis://localhost:6379
CACHE_TTL_SECONDS=3600" > .env
```

## שלב 5: הגדרת Firebase (חובה!)

### 5.1 יצירת פרויקט Firebase
1. לך ל-[Firebase Console](https://console.firebase.google.com)
2. לחץ על "Create a project"
3. הזן שם: `attendance-app`
4. בחר אם להפעיל Google Analytics
5. לחץ על "Create project"

### 5.2 הפעלת שירותים
1. **Firestore Database**:
   - לחץ על "Firestore Database"
   - לחץ על "Create database"
   - בחר "Start in test mode"
   - בחר מיקום (us-central1)

2. **Authentication**:
   - לחץ על "Authentication"
   - לחץ על "Get started"
   - לך לטאב "Sign-in method"
   - הפעל "Email/Password"
   - לחץ על "Save"

### 5.3 קבלת מפתחות API
1. לחץ על ⚙️ (Settings) > "Project settings"
2. לך לטאב "General"
3. גלול למטה ל-"Your apps"
4. לחץ על "Add app" > "Web" (</>)
5. הזן שם: `attendance-frontend`
6. לחץ על "Register app"
7. העתק את קוד ההגדרה

### 5.4 הורדת Service Account
1. לך לטאב "Service accounts"
2. לחץ על "Generate new private key"
3. לחץ על "Generate key"
4. הורד את הקובץ JSON
5. שמור אותו כ-`serviceAccountKey.json` בתיקיית `backend/`

## שלב 6: הגדרת Mapbox (חובה!)

1. לך ל-[Mapbox](https://www.mapbox.com)
2. צור חשבון או התחבר
3. לך ל-"Access tokens"
4. צור token חדש או השתמש ב-Default public token
5. העתק את ה-token

## שלב 7: עדכון קבצי Environment

ערוך את הקבצים `.env` שיצרת עם הערכים האמיתיים:

### Frontend (.env)
```bash
REACT_APP_FIREBASE_API_KEY=AIzaSyC... # העתק מ-Firebase
REACT_APP_FIREBASE_AUTH_DOMAIN=attendance-app.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=attendance-app
REACT_APP_FIREBASE_STORAGE_BUCKET=attendance-app.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef123456
REACT_APP_MAPBOX_TOKEN=pk.eyJ1... # העתק מ-Mapbox
REACT_APP_BACKEND_URL=http://localhost:5000
```

### Backend (.env)
```bash
PORT=5000
NODE_ENV=development
FIREBASE_SERVICE_ACCOUNT=./serviceAccountKey.json
FIREBASE_DATABASE_URL=https://attendance-app.firebaseio.com
FIREBASE_STORAGE_BUCKET=attendance-app.appspot.com
FRONTEND_URL=http://localhost:3000
LOG_LEVEL=debug
```

## שלב 8: הרצה ראשונית

### Terminal 1 - Backend
```powershell
cd backend
npm start
```

אמור לראות:
```
שרת פועל על פורט 5000
סביבה: development
```

### Terminal 2 - Frontend
```powershell
cd frontend
npm start
```

אמור לראות:
```
Local:            http://localhost:3000
On Your Network:  http://192.168.1.100:3000
```

## שלב 9: בדיקת החיבור

1. פתח http://localhost:3000 בדפדפן
2. אמור לראות את מסך הכניסה
3. בדוק את Console (F12) לראות שגיאות

## שלב 10: יצירת משתמשים ראשונים

### יצירת מנהל ראשון
1. פתח את Console בדפדפן (F12)
2. הרץ את הקוד הבא:

```javascript
// יצירת מנהל ראשון
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from './src/firebase';

const createManager = async () => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, 'admin@example.com', 'password123');
    const user = userCredential.user;
    
    await updateProfile(user, { displayName: 'מנהל ראשי' });
    
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: 'מנהל ראשי',
      role: 'manager',
      department: 'management',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('מנהל נוצר בהצלחה!');
  } catch (error) {
    console.error('שגיאה:', error);
  }
};

createManager();
```

### יצירת עובד לדוגמה
```javascript
const createEmployee = async () => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, 'employee@example.com', 'password123');
    const user = userCredential.user;
    
    await updateProfile(user, { displayName: 'עובד לדוגמה' });
    
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: 'עובד לדוגמה',
      role: 'employee',
      department: 'production',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('עובד נוצר בהצלחה!');
  } catch (error) {
    console.error('שגיאה:', error);
  }
};

createEmployee();
```

## שלב 11: יצירת אזור עבודה

```javascript
import { collection, addDoc } from 'firebase/firestore';
import { db } from './src/firebase';

const createWorkArea = async () => {
  try {
    await addDoc(collection(db, 'work_areas'), {
      name: 'מחלקת ייצור A',
      department: 'production',
      coordinates: [
        { lat: 32.0853, lng: 34.7818 },
        { lat: 32.0853, lng: 34.7828 },
        { lat: 32.0843, lng: 34.7828 },
        { lat: 32.0843, lng: 34.7818 }
      ],
      bufferZone: 50,
      isActive: true,
      createdAt: new Date()
    });
    
    console.log('אזור עבודה נוצר בהצלחה!');
  } catch (error) {
    console.error('שגיאה:', error);
  }
};

createWorkArea();
```

## שלב 12: בדיקת תכונות

### בדיקת כניסה/יציאה
1. התחבר כעובד (employee@example.com / password123)
2. נסה לבצע כניסה למשמרת
3. בדוק שהנתונים נשמרים ב-Firebase

### בדיקת מפה
1. לך למסך המפה
2. בדוק שהמפה נטענת
3. בדוק שהמיקום שלך מוצג

### בדיקת מנהל
1. התחבר כמנהל (admin@example.com / password123)
2. בדוק את לוח הבקרה
3. בדוק את רשימת העובדים

## פתרון בעיות נפוצות

### שגיאת Firebase
```
Error: Firebase: No Firebase App '[DEFAULT]' has been created
```
**פתרון**: ודא שה-`.env` מוגדר נכון

### שגיאת Mapbox
```
Error: Invalid access token
```
**פתרון**: ודא שה-Mapbox token תקין

### שגיאת CORS
```
Access to fetch at 'http://localhost:5000' from origin 'http://localhost:3000' has been blocked by CORS policy
```
**פתרון**: ודא שה-Backend רץ

### שגיאת Port
```
Error: listen EADDRINUSE: address already in use :::5000
```
**פתרון**: עצור תהליך אחר או שנה פורט

## סיכום

לאחר השלמת כל השלבים:
1. ✅ Node.js מותקן
2. ✅ Dependencies מותקנים
3. ✅ Firebase מוגדר
4. ✅ Mapbox מוגדר
5. ✅ Environment variables מוגדרים
6. ✅ האפליקציה רצה
7. ✅ משתמשים נוצרו
8. ✅ אזורי עבודה מוגדרים
9. ✅ תכונות נבדקו

**האפליקציה מוכנה לשימוש!** 🎉
