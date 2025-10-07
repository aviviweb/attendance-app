# 🏢 אפליקציית נוכחות עובדים מתקדמת

אפליקציה מתקדמת לניהול נוכחות עובדים עם מניעת הונאות GPS וטכנולוגיות AI מתקדמות.

## ✨ תכונות עיקריות

### 🔐 מערכת אימות מתקדמת
- כניסה לעובדים ומנהלים עם Firebase Auth
- אימות פנים אקראי עם AI
- בדיקת מיקום GPS בזמן אמת
- Device fingerprinting

### 📍 מעקב מיקום חכם
- מפת Mapbox אינטראקטיבית עם פוליגונים
- Geofencing לאזורי עבודה
- מעקב GPS רציף עם זיהוי הונאות
- WiFi triangulation

### 🚫 מניעת הונאות מתקדמת
- **GPS Jump Detection** - זיהוי קפיצות > 100 ק"מ/שעה
- **Stagnation Detection** - זיהוי תקיעות > 15 דקות
- **Device Sharing Detection** - זיהוי שיתוף מכשיר
- **WiFi Spoofing Detection** - זיהוי WiFi מזויף
- **Pattern Analysis** - ניתוח דפוסי התנהגות חריגים
- **Random Face Verification** - בדיקות פנים אקראיות

### 📊 דוחות וניתוח
- דוחות נוכחות יומיים, שבועיים וחודשיים
- ניתוח התנהגות עובדים עם AI
- התראות בזמן אמת למנהלים
- סטטיסטיקות מפורטות

### 📱 Progressive Web App (PWA)
- התקנה כאפליקציה מקומית
- עבודה offline עם Service Worker
- Push Notifications
- עיצוב רספונסיבי

## 🏗️ מבנה הפרויקט

```
attendance-app/
├── frontend/           # React PWA עם כל התכונות
│   ├── src/
│   │   ├── components/ # קומפוננטים עיקריים
│   │   ├── utils/     # פונקציות עזר
│   │   └── styles/    # עיצוב רספונסיבי
│   ├── public/        # קבצים סטטיים
│   └── .env          # הגדרות סביבה
├── backend/            # Node.js + Express + Socket.IO
│   ├── routes/        # API endpoints
│   ├── services/      # שירותים עסקיים
│   ├── middleware/    # middleware לאבטחה
│   └── .env          # הגדרות סביבה
├── mcp-server/         # MCP AI Server לזיהוי הונאות
│   ├── mcp.js        # שרת AI עם כלים מתקדמים
│   └── config.json   # הגדרות MCP
├── assets/             # תמונות ואייקונים
├── docker-compose.yml # הגדרות Docker
├── vercel.json        # הגדרות Vercel
├── render.yaml        # הגדרות Render
└── README.md
```

## 🚀 התקנה מהירה

### דרישות מערכת
- Node.js 18+
- npm או yarn
- Firebase Account
- Mapbox Account

### 1. התקנת Node.js
```bash
# Windows עם Chocolatey
choco install nodejs

# או הורדה מ-nodejs.org
```

### 2. התקנת Dependencies
```bash
# התקנה מהירה (כל הפרויקט)
npm run install-all

# או התקנה ידנית
cd frontend && npm install
cd ../backend && npm install
cd ../mcp-server && npm install
```

### 3. הגדרת Environment Variables

**Frontend (.env):**
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

**Backend (.env):**
```bash
PORT=5000
NODE_ENV=development
FIREBASE_SERVICE_ACCOUNT=./serviceAccountKey.json
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FRONTEND_URL=http://localhost:3000
LOG_LEVEL=debug
```

### 4. הגדרת Firebase
1. צור פרויקט ב-[Firebase Console](https://console.firebase.google.com)
2. הפעל Firestore Database ו-Authentication
3. הורד `serviceAccountKey.json` ושמור ב-`backend/`
4. הגדר Collections לפי `firebase-setup.md`

### 5. הגדרת Mapbox
1. צור חשבון ב-[Mapbox](https://www.mapbox.com)
2. קבל API token
3. הוסף ל-`frontend/.env`

### 6. הרצה מקומית
```bash
# Terminal 1 - Backend
npm run dev-backend

# Terminal 2 - Frontend  
npm run dev-frontend

# Terminal 3 - MCP Server (אופציונלי)
npm run dev-mcp
```

## 🌐 פרסום ל-Production

### Frontend (Vercel)
1. העלה את תיקיית `frontend/` ל-Vercel
2. הגדר environment variables
3. Deploy אוטומטי עם `vercel.json`

### Backend (Render)
1. העלה את תיקיית `backend/` ל-Render
2. הגדר environment variables
3. Deploy אוטומטי עם `render.yaml`

### Docker
```bash
# הרצה עם Docker Compose
docker-compose up -d
```

## 🌍 תמיכה בינלאומית
- **עברית** (RTL) - שפת ברירת מחדל
- **אנגלית** - תמיכה מלאה
- **רוסית** - תמיכה מלאה
- **ערבית** (RTL) - תמיכה מלאה
- **הינדי** - תמיכה מלאה

## 🛠️ טכנולוגיות

### Frontend
- **React 18** - UI Framework
- **PWA** - Progressive Web App
- **Mapbox GL JS** - מפות אינטראקטיביות
- **Socket.IO Client** - עדכונים בזמן אמת
- **Firebase SDK** - אימות ומסד נתונים
- **i18next** - תרגום רב-לשוני
- **React Router** - ניתוב
- **Axios** - HTTP requests

### Backend
- **Node.js** - Runtime
- **Express** - Web Framework
- **Socket.IO** - Real-time communication
- **Firebase Admin** - Backend services
- **Winston** - Logging
- **Helmet** - Security
- **CORS** - Cross-origin requests
- **Rate Limiting** - API protection

### AI & Fraud Detection
- **MCP Server** - AI tools
- **Geolib** - GPS calculations
- **Pattern Analysis** - Behavioral analysis
- **Device Fingerprinting** - Device identification
- **WiFi Analysis** - Network verification

### Database & Storage
- **Firebase Firestore** - NoSQL database
- **Firebase Authentication** - User management
- **Firebase Storage** - File storage
- **Firebase Cloud Messaging** - Push notifications

## 📋 רשימת TODO להשלמה

1. **התקנת Node.js** - הורד והתקן מ-nodejs.org
2. **הגדרת Firebase** - צור פרויקט והגדר Collections
3. **הגדרת Mapbox** - צור חשבון וקבל token
4. **הגדרת Environment** - מלא את כל ה-`.env` files
5. **הרצה מקומית** - בדוק שהכל עובד
6. **יצירת משתמשים** - מנהל ראשון ועובדים לדוגמה
7. **הגדרת אזורי עבודה** - פוליגונים במפה
8. **בדיקת תכונות** - כניסה/יציאה, מפה, זיהוי הונאות
9. **פרסום** - העלאה ל-Vercel ו-Render
10. **הגדרת Domain** - Custom domain ו-SSL

## 📚 תיעוד נוסף

- `firebase-setup.md` - הוראות הגדרת Firebase מפורטות
- `deployment-guide.md` - מדריך פרסום מלא
- `installation-guide.md` - הוראות התקנה מפורטות
- `STEP_BY_STEP_GUIDE.md` - מדריך הרצה צעד אחר צעד

## 🔒 אבטחה

- **JWT Authentication** - אימות מאובטח
- **CORS Protection** - הגנה מפני cross-origin attacks
- **Rate Limiting** - הגבלת בקשות
- **Helmet.js** - Security headers
- **Input Validation** - בדיקת קלט
- **SQL Injection Protection** - הגנה מפני SQL injection

## 📊 ביצועים

- **Code Splitting** - טעינה מהירה
- **Lazy Loading** - טעינה לפי דרישה
- **Service Worker** - מטמון חכם
- **CDN** - הפצה גלובלית
- **Compression** - דחיסת נתונים
- **Caching** - מטמון מתקדם

## 🤝 תרומה לפרויקט

1. Fork את הפרויקט
2. צור branch חדש (`git checkout -b feature/amazing-feature`)
3. Commit את השינויים (`git commit -m 'Add amazing feature'`)
4. Push ל-branch (`git push origin feature/amazing-feature`)
5. פתח Pull Request

## 📄 רישיון

פרויקט זה מופץ תחת רישיון MIT. ראה `LICENSE` לפרטים נוספים.

## 📞 תמיכה

אם נתקלת בבעיות או יש לך שאלות:
1. בדוק את `STEP_BY_STEP_GUIDE.md`
2. פתח Issue ב-GitHub
3. צור קשר עם המפתחים

---

**הפרויקט מוכן לשימוש!** 🎉

פשוט התקן Node.js, הגדר את ה-Environment Variables, והרץ את האפליקציה.

#   a t t e n d a n c e - a p p  
 