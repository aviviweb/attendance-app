# מדריך התקנה והרצה מקומית

## דרישות מערכת

- Node.js 18+ 
- npm או yarn
- Git
- Firebase Account
- Mapbox Account

## שלב 1: שכפול הפרויקט

```bash
git clone https://github.com/your-username/attendance-app.git
cd attendance-app
```

## שלב 2: התקנת Dependencies

### התקנה מהירה (כל הפרויקט)
```bash
npm run install-all
```

### התקנה ידנית
```bash
# Frontend
cd frontend
npm install
cd ..

# Backend
cd backend
npm install
cd ..

# MCP Server
cd mcp-server
npm install
cd ..
```

## שלב 3: הגדרת Environment Variables

### Frontend
```bash
cd frontend
cp env.example .env
```

ערוך את `.env`:
```bash
REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef123456
REACT_APP_MAPBOX_TOKEN=pk.your-mapbox-token-here
REACT_APP_BACKEND_URL=http://localhost:5000
```

### Backend
```bash
cd backend
cp env.example .env
```

ערוך את `.env`:
```bash
NODE_ENV=development
PORT=5000
FIREBASE_SERVICE_ACCOUNT=./serviceAccountKey.json
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FRONTEND_URL=http://localhost:3000
LOG_LEVEL=debug
```

## שלב 4: הגדרת Firebase

1. לך ל-[Firebase Console](https://console.firebase.google.com)
2. צור פרויקט חדש
3. הפעל Firestore Database ו-Authentication
4. הורד את `serviceAccountKey.json` ושמור ב-`backend/`
5. הגדר את ה-Collections לפי `firebase-setup.md`

## שלב 5: הגדרת Mapbox

1. לך ל-[Mapbox](https://www.mapbox.com)
2. צור חשבון
3. קבל API token
4. הוסף ל-`.env` של Frontend

## שלב 6: הרצה מקומית

### אפשרות 1: הרצה עם Docker
```bash
# התקנת Docker ו-Docker Compose
docker-compose up -d
```

### אפשרות 2: הרצה ידנית

#### Terminal 1 - Backend
```bash
cd backend
npm start
```

#### Terminal 2 - Frontend
```bash
cd frontend
npm start
```

#### Terminal 3 - MCP Server (אופציונלי)
```bash
cd mcp-server
npm start
```

## שלב 7: בדיקת החיבור

### בדיקת Frontend
1. פתח http://localhost:3000
2. בדוק שהאפליקציה נטענת
3. בדוק את Console לראות שגיאות

### בדיקת Backend
```bash
curl http://localhost:5000/api/health
```

### בדיקת Firebase
1. נסה להתחבר באפליקציה
2. בדוק ב-Firebase Console שהמשתמש נוצר

## שלב 8: יצירת משתמשים ראשונים

### יצירת מנהל ראשון
```javascript
// הרץ בקונסול הדפדפן
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

const createManager = async () => {
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
};

createManager();
```

### יצירת עובד לדוגמה
```javascript
const createEmployee = async () => {
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
};

createEmployee();
```

## שלב 9: הגדרת אזורי עבודה

```javascript
// הרץ בקונסול הדפדפן
import { collection, addDoc } from 'firebase/firestore';

const createWorkArea = async () => {
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
};

createWorkArea();
```

## שלב 10: בדיקת תכונות

### בדיקת כניסה/יציאה
1. התחבר כעובד
2. נסה לבצע כניסה למשמרת
3. בדוק שהנתונים נשמרים ב-Firebase

### בדיקת מפה
1. לך למסך המפה
2. בדוק שהמפה נטענת
3. בדוק שהמיקום שלך מוצג

### בדיקת זיהוי הונאות
1. נסה לבצע כניסה מחוץ לאזור העבודה
2. בדוק שהמערכת מזהה הונאה

## שלב 11: פתרון בעיות נפוצות

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
**פתרון**: ודא שה-Backend מגדיר CORS נכון

### שגיאת Port
```
Error: listen EADDRINUSE: address already in use :::5000
```
**פתרון**: שנה את הפורט ב-`.env` או עצור תהליך אחר

## שלב 12: פיתוח נוסף

### הוספת תכונות חדשות
1. צור branch חדש
2. פיתוח התכונה
3. בדיקה מקומית
4. Pull Request

### עדכון Dependencies
```bash
# Frontend
cd frontend
npm update

# Backend
cd backend
npm update

# MCP Server
cd mcp-server
npm update
```

### בדיקת איכות קוד
```bash
# Frontend
cd frontend
npm run lint
npm test

# Backend
cd backend
npm test
```

## שלב 13: הכנה לפרסום

### Build לבדיקה
```bash
# Frontend
cd frontend
npm run build
npm install -g serve
serve -s build

# Backend
cd backend
NODE_ENV=production npm start
```

### בדיקת Production
1. בדוק שהכל עובד עם `NODE_ENV=production`
2. בדוק את הביצועים
3. בדוק את ה-Logging

## סיכום

לאחר השלמת כל השלבים:
1. ✅ הפרויקט מותקן מקומית
2. ✅ Firebase מוגדר
3. ✅ Mapbox מוגדר
4. ✅ האפליקציה רצה
5. ✅ משתמשים נוצרו
6. ✅ אזורי עבודה מוגדרים
7. ✅ תכונות נבדקו
8. ✅ בעיות נפתרו

**חשוב**: שמור את כל המפתחות והקבצים במקום בטוח!
