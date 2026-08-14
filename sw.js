const CACHE_NAME = 'wetravel-v123'; // 建議升級版本號
const ASSETS = [
  './index.html',
  './manifest.json',
  './vendor/tailwind-3.4.16.js',
  './vendor/vue-3.5.13.esm-browser.prod.js',
  './vendor/sortable-1.15.6.min.js',
  './vendor/phosphor/bold/style.css',
  './vendor/phosphor/bold/Phosphor-Bold.woff2',
  './vendor/phosphor/fill/style.css',
  './vendor/phosphor/fill/Phosphor-Fill.woff2',
  './vendor/phosphor/duotone/style.css',
  './vendor/phosphor/duotone/Phosphor-Duotone.woff2',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Noto+Sans+JP:wght@400;500;700;900&family=Noto+Sans+TC:wght@300;400;500;700&display=swap'
];

// 不快取的網址模式（API、Firestore、動態資源）
const NO_CACHE_PATTERNS = [
  'firestore.googleapis.com',
  'www.googleapis.com',
  'identitytoolkit.googleapis.com',
  'securetoken.googleapis.com',
  'nominatim.openstreetmap.org',
  'api.open-meteo.com',
  'api.exchangerate-api.com',
  'firebase',
  'google.com/images/cleardot.gif',
  'app.js',
  'checklist-data.js'
];

// 需要 Network First 的檔案
const NETWORK_FIRST_PATTERNS = [
  'index.html',
  'manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', event => {
  // 清除舊版快取
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(
        names
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      )
    ).then(() => clients.claim())
      .then(() => {
        // 通知所有客戶端（頁面）新版本已啟用，觸發重載
        self.clients.matchAll({ type: 'window' }).then(clients => {
          clients.forEach(client => client.postMessage({ type: 'SW_UPDATED' }));
        });
      })
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = request.url;

  // 1. 只有 GET 請求能進快取機制（Firestore 的 POST/OPTIONS 請求直接忽略）
  if (request.method !== 'GET') {
    return;
  }

  // 2. 如果請求符合 NO_CACHE_PATTERNS，【直接不呼叫 respondWith】，完全交給瀏覽器原生網路處理！
  const shouldSkipCache = NO_CACHE_PATTERNS.some(pattern => url.includes(pattern));
  if (shouldSkipCache) {
    return; // 🔥 這一步是關鍵修復：不經由 Service Worker 攔截，徹底解決 Channel Closed 錯！
  }

  // 3. Network First (index.html, manifest.json)
  const isNetworkFirst = NETWORK_FIRST_PATTERNS.some(pattern => url.includes(pattern));
  if (isNetworkFirst) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // 4. 其餘靜態資源：快取優先
  event.respondWith(
    caches.match(request).then((response) => {
      return response || fetch(request);
    })
  );
});
