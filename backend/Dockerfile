# Dockerfile ל-Backend
FROM node:18-alpine

# הגדרת תיקיית עבודה
WORKDIR /app

# העתקת קבצי package.json
COPY package*.json ./

# התקנת dependencies
RUN npm ci --only=production

# העתקת קוד האפליקציה
COPY . .

# יצירת תיקיית logs
RUN mkdir -p logs

# יצירת משתמש לא-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# שינוי בעלות על הקבצים
RUN chown -R nodejs:nodejs /app
USER nodejs

# חשיפת פורט
EXPOSE 5000

# הגדרת משתני סביבה
ENV NODE_ENV=production
ENV PORT=5000

# בדיקת בריאות
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# הפעלת האפליקציה
CMD ["node", "server.js"]
