const CACHE_NAME = 'ob-calculator-v1.0';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/ios-style.css',
  './js/app.js',
  './js/ob-engine.js',
  './js/date-keypad.js',
  './js/picker-wheel.js',
  './js/wheel-canvas.js',
  './manifest.json',
  './apple-touch-icon.png',
  './icon_192.png',
  './icon_512.png'
];

// 1. 安裝 Service Worker 並預先載入所有靜態檔案至離線快取
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching offline assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// 2. 啟動並清理舊版快取
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. 攔截請求：優先使用離線快取 (Cache First)，斷網或飛航模式照樣秒開！
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // 背景嘗試更新最新資源 (Stale-While-Revalidate)
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {
          // 離線狀態，忽略網路失敗
        });
        return cachedResponse;
      }

      // 若快取無直接匹配，走網路請求並寫入快取
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      }).catch(() => {
        // 若完全斷網且非靜態資源，返回 index.html
        if (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html')) {
          return caches.match('./index.html');
        }
      });
    })
  );
});
