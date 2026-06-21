// Service Worker برای آموزش لغات انگلیسی
// نکته: این فایل فقط زمانی کار می‌کند که از طریق http:// یا https:// سرو شود،
// نه با باز کردن مستقیم فایل از روی دیسک (file://).

const CACHE_NAME = 'vocab-app-v1';
const ASSETS_TO_CACHE = [
    './index.html',
    './manifest.json',
    './icon-192.png',
    './icon-512.png'
];

// نصب: همه فایل‌های لازم برای کارکرد آفلاین را کش کن
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS_TO_CACHE))
            .then(() => self.skipWaiting())
    );
});

// فعال‌سازی: کش‌های نسخه قبلی را پاک کن
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys.filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            )
        ).then(() => self.clients.claim())
    );
});

// استراتژی cache-first: اول از کش بخوان، اگر نبود از شبکه بگیر و کش کن
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;

            return fetch(event.request).then((networkResponse) => {
                // پاسخ‌های نامعتبر را کش نکن
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    return networkResponse;
                }
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });
                return networkResponse;
            }).catch(() => {
                // اگر آفلاین بودیم و چیزی در کش هم نبود، صفحه اصلی را برگردان
                return caches.match('./index.html');
            });
        })
    );
});
