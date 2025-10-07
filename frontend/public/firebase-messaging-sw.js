// Service Worker מתקדם לאפליקציית נוכחות עובדים
const CACHE_NAME = 'attendance-app-v2';
const STATIC_CACHE = 'static-v2';
const DYNAMIC_CACHE = 'dynamic-v2';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/logo192.png',
  '/logo512.png',
  '/logo144.png',
  '/logo96.png',
  '/shortcut-attendance.png',
  '/shortcut-reports.png',
  '/shortcut-map.png'
];

// התקנה
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// הפעלה
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // החזר מהמטמון אם קיים
        if (response) {
          return response;
        }

        // אחרת, בקש מהרשת
        return fetch(event.request).then((response) => {
          // בדוק אם התגובה תקינה
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // שמור במטמון
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
  );
});

// Push Notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'התראה חדשה',
    icon: '/logo192.png',
    badge: '/logo192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'צפייה',
        icon: '/logo192.png'
      },
      {
        action: 'close',
        title: 'סגור',
        icon: '/logo192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('נוכחות עובדים', options)
  );
});

// Background Sync מתקדם
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'attendance-sync') {
    event.waitUntil(syncAttendanceData());
  } else if (event.tag === 'reports-sync') {
    event.waitUntil(syncReportsData());
  } else if (event.tag === 'notifications-sync') {
    event.waitUntil(syncNotifications());
  }
});

// סנכרון נתוני נוכחות
async function syncAttendanceData() {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    const requests = await cache.keys();
    
    for (const request of requests) {
      if (request.url.includes('/api/attendance')) {
        await fetch(request);
      }
    }
    console.log('Attendance data synced successfully');
  } catch (error) {
    console.error('Failed to sync attendance data:', error);
  }
}

// סנכרון דוחות
async function syncReportsData() {
  try {
    const response = await fetch('/api/reports/sync');
    if (response.ok) {
      console.log('Reports data synced successfully');
    }
  } catch (error) {
    console.error('Failed to sync reports data:', error);
  }
}

// סנכרון התראות
async function syncNotifications() {
  try {
    const response = await fetch('/api/notifications/sync');
    if (response.ok) {
      console.log('Notifications synced successfully');
    }
  } catch (error) {
    console.error('Failed to sync notifications:', error);
  }
}

// Periodic Background Sync
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'attendance-periodic-sync') {
    event.waitUntil(syncAttendanceData());
  }
});

// Message handling
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// Share Target API
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/share')) {
    event.respondWith(handleShareRequest(event.request));
  }
});

async function handleShareRequest(request) {
  if (request.method === 'POST') {
    const formData = await request.formData();
    const title = formData.get('title');
    const text = formData.get('text');
    const url = formData.get('url');
    const file = formData.get('attendance_file');
    
    // שמירת נתונים במטמון
    const cache = await caches.open(DYNAMIC_CACHE);
    await cache.put('/shared-data', new Response(JSON.stringify({
      title, text, url, file: file ? file.name : null
    })));
    
    // פתיחת האפליקציה
    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/manager?view=reports&shared=true'
      }
    });
  }
  
  return fetch(request);
}

// File System Access API
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/upload')) {
    event.respondWith(handleFileUpload(event.request));
  }
});

async function handleFileUpload(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      // שמירת קובץ במטמון
      const cache = await caches.open(DYNAMIC_CACHE);
      await cache.put(request.url, response.clone());
    }
    return response;
  } catch (error) {
    console.error('File upload failed:', error);
    return new Response('Upload failed', { status: 500 });
  }
}

// Advanced caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Cache First for static assets
  if (request.destination === 'image' || 
      request.destination === 'style' || 
      request.destination === 'script') {
    event.respondWith(cacheFirst(request));
  }
  // Network First for API calls
  else if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
  }
  // Stale While Revalidate for HTML
  else if (request.destination === 'document') {
    event.respondWith(staleWhileRevalidate(request));
  }
});

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  return cachedResponse || fetch(request);
}

async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(DYNAMIC_CACHE);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Offline', { status: 503 });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then(networkResponse => {
    cache.put(request, networkResponse.clone());
    return networkResponse;
  });
  
  return cachedResponse || fetchPromise;
}
