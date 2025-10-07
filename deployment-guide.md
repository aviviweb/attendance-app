# מדריך פרסום אפליקציית נוכחות עובדים

## סקירה כללית

אפליקציית נוכחות עובדים מורכבת מ-3 חלקים עיקריים:
- **Frontend**: React PWA (Vercel)
- **Backend**: Node.js + Express (Render)
- **MCP Server**: שרת AI לזיהוי הונאות (Render)

## שלב 1: הכנה לפרסום

### 1.1 הכנת קבצי Environment
```bash
# Frontend (.env)
REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef123456
REACT_APP_MAPBOX_TOKEN=pk.your-mapbox-token-here
REACT_APP_BACKEND_URL=https://your-backend-url.onrender.com

# Backend (.env)
NODE_ENV=production
PORT=5000
FIREBASE_SERVICE_ACCOUNT=./serviceAccountKey.json
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FRONTEND_URL=https://your-frontend-url.vercel.app
LOG_LEVEL=info
```

### 1.2 הכנת Firebase
1. הורד את `serviceAccountKey.json` מ-Firebase Console
2. העתק אותו לתיקיית `backend/`
3. ודא שה-Security Rules מוגדרים נכון

## שלב 2: פרסום Frontend ל-Vercel

### 2.1 הכנה
```bash
cd frontend
npm install
npm run build
```

### 2.2 העלאה ל-Vercel
1. לך ל-[Vercel](https://vercel.com)
2. התחבר עם GitHub
3. לחץ על "New Project"
4. בחר את repository שלך
5. הגדר:
   - **Framework Preset**: Create React App
   - **Root Directory**: frontend
   - **Build Command**: npm run build
   - **Output Directory**: build

### 2.3 הגדרת Environment Variables
ב-Vercel Dashboard:
1. לך ל-Project Settings > Environment Variables
2. הוסף את כל המשתנים מ-`.env`
3. לחץ על "Save"

### 2.4 הגדרת Custom Domain (אופציונלי)
1. לך ל-Domains
2. הוסף domain מותאם אישית
3. הגדר DNS records לפי ההוראות

## שלב 3: פרסום Backend ל-Render

### 3.1 הכנה
```bash
cd backend
npm install --production
```

### 3.2 העלאה ל-Render
1. לך ל-[Render](https://render.com)
2. התחבר עם GitHub
3. לחץ על "New +" > "Web Service"
4. בחר את repository שלך
5. הגדר:
   - **Name**: attendance-backend
   - **Environment**: Node
   - **Build Command**: npm install
   - **Start Command**: node server.js
   - **Root Directory**: backend

### 3.3 הגדרת Environment Variables
ב-Render Dashboard:
1. לך ל-Environment
2. הוסף את כל המשתנים מ-`.env`
3. ודא שה-`serviceAccountKey.json` מועלה

### 3.4 הגדרת Health Check
1. לך ל-Settings > Health Check Path
2. הגדר: `/api/health`

## שלב 4: פרסום MCP Server ל-Render

### 4.1 הכנה
```bash
cd mcp-server
npm install --production
```

### 4.2 העלאה ל-Render
1. ב-Render Dashboard
2. לחץ על "New +" > "Background Worker"
3. הגדר:
   - **Name**: attendance-mcp-server
   - **Environment**: Node
   - **Build Command**: npm install
   - **Start Command**: node mcp.js
   - **Root Directory**: mcp-server

## שלב 5: הגדרת DNS ו-SSL

### 5.1 Custom Domain
1. קנה domain מותאם אישית
2. הגדר DNS records:
   ```
   A    @        your-vercel-ip
   CNAME www     your-frontend-url.vercel.app
   CNAME api     your-backend-url.onrender.com
   ```

### 5.2 SSL Certificates
- Vercel מספק SSL אוטומטי
- Render מספק SSL אוטומטי
- עבור Custom Domain, השתמש ב-Let's Encrypt

## שלב 6: בדיקות לאחר הפרסום

### 6.1 בדיקת Frontend
```bash
# בדיקת חיבור ל-Firebase
curl https://your-frontend-url.vercel.app

# בדיקת PWA
# פתח את האפליקציה בדפדפן ובדוק:
# - Service Worker פעיל
# - Manifest.json נטען
# - אייקונים מוצגים
```

### 6.2 בדיקת Backend
```bash
# בדיקת Health Check
curl https://your-backend-url.onrender.com/api/health

# בדיקת API
curl -X POST https://your-backend-url.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

### 6.3 בדיקת MCP Server
```bash
# בדיקת חיבור
curl https://your-mcp-url.onrender.com/health
```

## שלב 7: הגדרת Monitoring ו-Logging

### 7.1 Vercel Analytics
1. ב-Vercel Dashboard
2. לך ל-Analytics
3. הפעל Web Analytics

### 7.2 Render Monitoring
1. ב-Render Dashboard
2. לך ל-Metrics
3. הגדר Alerts

### 7.3 Firebase Analytics
1. ב-Firebase Console
2. הפעל Google Analytics
3. הגדר Custom Events

## שלב 8: הגדרת CI/CD

### 8.1 GitHub Actions
צור `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          working-directory: ./frontend

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Render
        uses: render-actions/deploy@v1
        with:
          service-id: ${{ secrets.RENDER_SERVICE_ID }}
          api-key: ${{ secrets.RENDER_API_KEY }}
```

## שלב 9: הגדרת Backup ו-Recovery

### 9.1 Firebase Backup
1. הגדר Firestore Export
2. הגדר Storage Backup
3. הגדר Authentication Backup

### 9.2 Database Backup
```bash
# Firestore Export
gcloud firestore export gs://your-backup-bucket/backup-$(date +%Y%m%d)
```

## שלב 10: הגדרת Security

### 10.1 Security Headers
- הגדר ב-Nginx או Vercel
- השתמש ב-Helmet.js ב-Backend

### 10.2 Rate Limiting
- הגדר ב-Nginx
- השתמש ב-express-rate-limit

### 10.3 CORS
```javascript
// Backend
app.use(cors({
  origin: ['https://your-frontend-url.vercel.app'],
  credentials: true
}));
```

## שלב 11: הגדרת Performance

### 11.1 Frontend Optimization
- הפעל Code Splitting
- השתמש ב-Lazy Loading
- הגדר Service Worker

### 11.2 Backend Optimization
- השתמש ב-Redis Cache
- הגדר Compression
- השתמש ב-Cluster Mode

### 11.3 CDN
- Vercel מספק CDN אוטומטי
- Render מספק CDN אוטומטי

## שלב 12: הגדרת Alerts ו-Notifications

### 12.1 Uptime Monitoring
- השתמש ב-UptimeRobot
- הגדר Alerts ל-Email/SMS

### 12.2 Error Monitoring
- השתמש ב-Sentry
- הגדר Error Alerts

### 12.3 Performance Monitoring
- השתמש ב-New Relic
- הגדר Performance Alerts

## שלב 13: הגדרת Scaling

### 13.1 Auto Scaling
- Vercel: אוטומטי
- Render: הגדר ב-Settings

### 13.2 Load Balancing
- השתמש ב-Nginx
- הגדר Multiple Instances

## שלב 14: הגדרת Maintenance

### 14.1 Scheduled Tasks
```javascript
// Backend
cron.schedule('0 2 * * *', () => {
  // ניקוי נתונים ישנים
});
```

### 14.2 Database Maintenance
- הגדר Firestore Cleanup
- הגדר Index Optimization

## שלב 15: הגדרת Documentation

### 15.1 API Documentation
- השתמש ב-Swagger
- צור API Docs

### 15.2 User Documentation
- צור User Manual
- צור Admin Guide

## סיכום

לאחר השלמת כל השלבים:
1. ✅ Frontend יהיה זמין ב-Vercel
2. ✅ Backend יהיה זמין ב-Render
3. ✅ MCP Server יהיה זמין ב-Render
4. ✅ SSL יהיה מוגדר
5. ✅ Monitoring יהיה פעיל
6. ✅ CI/CD יהיה מוגדר
7. ✅ Backup יהיה מוגדר
8. ✅ Security יהיה מוגדר
9. ✅ Performance יהיה מותאם
10. ✅ Alerts יהיו מוגדרים

**חשוב**: בדוק את כל הקישורים והחיבורים לפני העברה ל-Production!
