const CACHE_NAME = 'opentcu-cache-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './config.js',
  './manifest.json',
  './images/icon-192.png',
  './images/icon-512.png'
];

// インストール時に静的ファイルをキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// アクティベート時に古いキャッシュをクリーンアップ
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// フェッチ要求に対するキャッシュファースト（Stale-While-Revalidate）戦略
self.addEventListener('fetch', (event) => {
  // アプリ内部のAPIや外部GASのフェッチは対象外に（LocalStorageでキャッシュするため）
  if (event.request.url.includes('menu.json') || event.request.url.includes('script.google.com')) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchedResponse = fetch(event.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          // ネットワークエラー時はキャッシュから返す（すでにキャッシュがあれば）
        });

        return cachedResponse || fetchedResponse;
      });
    })
  );
});
