# הגדרת Firebase לאפליקציית נוכחות עובדים

## שלב 1: יצירת פרויקט Firebase

1. לך ל-[Firebase Console](https://console.firebase.google.com)
2. לחץ על "Create a project" או "Add project"
3. הזן שם לפרויקט: `attendance-app` (או שם אחר)
4. בחר אם להפעיל Google Analytics (אופציונלי)
5. לחץ על "Create project"

## שלב 2: הפעלת שירותים

### Firestore Database
1. במסך הראשי של הפרויקט, לחץ על "Firestore Database"
2. לחץ על "Create database"
3. בחר "Start in test mode" (לפיתוח) או "Start in production mode"
4. בחר מיקום לשרת (למשל: us-central1)
5. לחץ על "Done"

### Authentication
1. במסך הראשי של הפרויקט, לחץ על "Authentication"
2. לחץ על "Get started"
3. לך לטאב "Sign-in method"
4. הפעל "Email/Password" provider
5. לחץ על "Save"

### Storage (אופציונלי)
1. במסך הראשי של הפרויקט, לחץ על "Storage"
2. לחץ על "Get started"
3. בחר "Start in test mode"
4. בחר מיקום לשרת
5. לחץ על "Next" ו-"Done"

## שלב 3: קבלת מפתחות API

### Frontend Configuration
1. במסך הראשי של הפרויקט, לחץ על ⚙️ (Settings) > "Project settings"
2. לך לטאב "General"
3. גלול למטה ל-"Your apps"
4. לחץ על "Add app" > "Web" (</>)
5. הזן שם לאפליקציה: `attendance-frontend`
6. לחץ על "Register app"
7. העתק את קוד ההגדרה:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

### Backend Service Account
1. במסך הראשי של הפרויקט, לחץ על ⚙️ (Settings) > "Project settings"
2. לך לטאב "Service accounts"
3. לחץ על "Generate new private key"
4. לחץ על "Generate key"
5. הורד את הקובץ JSON ושמור אותו כ-`serviceAccountKey.json` בתיקיית `backend/`

## שלב 4: יצירת Collections ב-Firestore

### Collection: users
```javascript
// מבנה מסמך:
{
  uid: "string", // מזהה Firebase Auth
  email: "string",
  displayName: "string",
  role: "employee" | "manager" | "admin",
  department: "string",
  isActive: boolean,
  createdAt: timestamp,
  updatedAt: timestamp,
  lastLogin: timestamp,
  phoneNumber: "string" // אופציונלי
}
```

### Collection: attendance
```javascript
// מבנה מסמך:
{
  employeeId: "string",
  type: "check-in" | "check-out",
  location: {
    lat: number,
    lng: number,
    accuracy: number
  },
  timestamp: timestamp,
  deviceInfo: object,
  wifiNetworks: array,
  geofenceArea: "string",
  fraudCheck: {
    passed: boolean,
    checks: object
  }
}
```

### Collection: locations
```javascript
// מבנה מסמך:
{
  employeeId: "string",
  location: {
    lat: number,
    lng: number,
    accuracy: number
  },
  timestamp: timestamp,
  deviceInfo: object,
  fraudCheck: {
    passed: boolean,
    checks: object
  }
}
```

### Collection: work_areas
```javascript
// מבנה מסמך:
{
  name: "string",
  department: "string",
  coordinates: [
    { lat: number, lng: number },
    // ... נקודות נוספות
  ],
  bufferZone: number, // מטרים
  isActive: boolean,
  createdAt: timestamp
}
```

### Collection: fraud_alerts
```javascript
// מבנה מסמך:
{
  employeeId: "string",
  type: "GPS_JUMP" | "STAGNATION" | "DEVICE_SHARING" | "WIFI_SPOOFING",
  severity: "LOW" | "MEDIUM" | "HIGH",
  location: object,
  riskLevel: number,
  checks: object,
  timestamp: timestamp,
  status: "active" | "resolved" | "dismissed"
}
```

### Collection: notifications
```javascript
// מבנה מסמך:
{
  userId: "string",
  type: "fraud_alert" | "attendance_reminder" | "face_check_request",
  data: object,
  priority: "low" | "normal" | "high" | "urgent",
  timestamp: timestamp,
  status: "pending" | "sent" | "read",
  deliveryMethods: array
}
```

### Collection: verifications
```javascript
// מבנה מסמך:
{
  employeeId: "string",
  type: "face-verification" | "qr-scan" | "device-check",
  timestamp: timestamp,
  result: {
    verified: boolean,
    confidence: number,
    method: string
  }
}
```

### Collection: device_info
```javascript
// מבנה מסמך:
{
  employeeId: "string",
  userAgent: "string",
  screenResolution: "string",
  timezone: "string",
  language: "string",
  platform: "string",
  timestamp: timestamp
}
```

### Collection: wifi_networks
```javascript
// מבנה מסמך:
{
  employeeId: "string",
  networks: [
    {
      ssid: "string",
      bssid: "string",
      signal: number,
      frequency: number
    }
  ],
  timestamp: timestamp
}
```

## שלב 5: הגדרת Rules ב-Firestore

### Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // משתמשים יכולים לקרוא ולעדכן רק את הנתונים שלהם
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // מנהלים יכולים לקרוא את כל הנתונים
    match /{document=**} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['manager', 'admin'];
    }
    
    // עובדים יכולים ליצור רשומות נוכחות ומיקום
    match /attendance/{document} {
      allow create: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'employee' &&
        request.auth.uid == resource.data.employeeId;
    }
    
    match /locations/{document} {
      allow create: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'employee' &&
        request.auth.uid == resource.data.employeeId;
    }
  }
}
```

## שלב 6: הגדרת Environment Variables

### Frontend (.env)
```bash
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

### Backend (.env)
```bash
FIREBASE_SERVICE_ACCOUNT=./serviceAccountKey.json
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
```

## שלב 7: יצירת משתמשים ראשונים

### יצירת מנהל ראשון
```javascript
// הרץ בקונסול Firebase או ב-Frontend
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

const createManager = async (email, password, displayName) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  
  await updateProfile(user, { displayName });
  
  await setDoc(doc(db, 'users', user.uid), {
    uid: user.uid,
    email: user.email,
    displayName: displayName,
    role: 'manager',
    department: 'management',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });
};
```

## שלב 8: הגדרת Push Notifications (אופציונלי)

1. במסך הראשי של הפרויקט, לחץ על "Cloud Messaging"
2. לחץ על "Get started"
3. לך לטאב "Web Push certificates"
4. לחץ על "Generate key pair"
5. העתק את ה-VAPID key
6. הוסף ל-Frontend:

```javascript
// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
```

## שלב 9: בדיקת החיבור

### Frontend
```javascript
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// בדיקת חיבור
const testConnection = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'users'));
    console.log('Firebase connection successful!');
    console.log('Users count:', querySnapshot.size);
  } catch (error) {
    console.error('Firebase connection failed:', error);
  }
};
```

### Backend
```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// בדיקת חיבור
const testConnection = async () => {
  try {
    const snapshot = await db.collection('users').get();
    console.log('Firebase Admin connection successful!');
    console.log('Users count:', snapshot.size);
  } catch (error) {
    console.error('Firebase Admin connection failed:', error);
  }
};
```

## שלב 10: הגדרת Mapbox

1. לך ל-[Mapbox](https://www.mapbox.com)
2. צור חשבון או התחבר
3. לך ל-"Access tokens"
4. צור token חדש או השתמש ב-Default public token
5. העתק את ה-token והוסף ל-Frontend:

```bash
REACT_APP_MAPBOX_TOKEN=pk.your-mapbox-token-here
```

## סיכום

לאחר השלמת כל השלבים:
1. Firebase יהיה מוכן לשימוש
2. כל ה-Collections יהיו מוגדרים
3. Security Rules יהיו מוגדרים
4. Environment variables יהיו מוגדרים
5. החיבור יהיה פעיל

**חשוב**: שמור את כל המפתחות והקבצים במקום בטוח ואל תחלוק אותם בפומבי!
