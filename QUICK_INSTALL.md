# הוראות התקנה מהירה

## דרישות מערכת
- Windows 10/11
- Node.js 18+ (לא מותקן כרגע)
- Git (לא מותקן כרגע)

## שלב 1: התקנת Node.js

### אפשרות 1: הורדה ישירה
1. לך ל-[nodejs.org](https://nodejs.org)
2. הורד את הגרסה LTS (18.x)
3. הרץ את הקובץ `.msi`
4. התקן עם הגדרות ברירת מחדל
5. הפעל מחדש את PowerShell

### אפשרות 2: עם Chocolatey
```powershell
# התקנת Chocolatey (אם לא מותקן)
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# התקנת Node.js
choco install nodejs

# התקנת Git
choco install git
```

### אפשרות 3: עם Winget
```powershell
# התקנת Node.js
winget install OpenJS.NodeJS

# התקנת Git
winget install Git.Git
```

## שלב 2: בדיקת התקנה
```powershell
node --version
npm --version
git --version
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

## שלב 4: הגדרת Environment Variables

### Frontend
```powershell
cd frontend
copy env.example .env
```

ערוך את `.env` עם הערכים שלך:
```
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
```powershell
cd ..\backend
copy env.example .env
```

ערוך את `.env`:
```
NODE_ENV=development
PORT=5000
FIREBASE_SERVICE_ACCOUNT=./serviceAccountKey.json
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FRONTEND_URL=http://localhost:3000
LOG_LEVEL=debug
```

## שלב 5: הרצה ראשונית

### Terminal 1 - Backend
```powershell
cd backend
npm start
```

### Terminal 2 - Frontend
```powershell
cd frontend
npm start
```

## שלב 6: בדיקת החיבור

1. פתח http://localhost:3000
2. בדוק שהאפליקציה נטענת
3. בדוק את Console לראות שגיאות

## פתרון בעיות נפוצות

### שגיאת PowerShell Execution Policy
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### שגיאת Port כבר בשימוש
```powershell
# מצא תהליך שמשתמש בפורט 5000
netstat -ano | findstr :5000

# עצור את התהליך
taskkill /PID <PID_NUMBER> /F
```

### שגיאת Firebase
- ודא שה-`.env` מוגדר נכון
- ודא שה-`serviceAccountKey.json` קיים ב-`backend/`

### שגיאת Mapbox
- ודא שה-Mapbox token תקין
- ודא שה-token מוגדר ב-`.env`

## סיכום

לאחר השלמת כל השלבים:
1. ✅ Node.js מותקן
2. ✅ Git מותקן
3. ✅ Dependencies מותקנים
4. ✅ Environment variables מוגדרים
5. ✅ האפליקציה רצה
6. ✅ החיבור נבדק

**חשוב**: ודא שכל המפתחות והקבצים מוגדרים נכון לפני ההרצה!
