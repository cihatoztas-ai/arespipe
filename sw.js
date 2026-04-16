/* ═══════════════════════════════════════════════
   AresPipe Service Worker
   Strateji: Stale-While-Revalidate (statik assets)
   Supabase API çağrıları cache'lenmez
═══════════════════════════════════════════════ */

var CACHE = 'arespipe-v2';

var STATIK = [
  '/mobile/is_baslat.html',
  '/mobile/index.html',
  '/mobile/devreler.html',
  '/mobile/devre_detay.html',
  '/mobile/spool_detay.html',
  '/mobile/ares-mobile.js',
  '/mobile/ares-mobile.css',
  '/ares-store.js',
  '/ares-lang.js',
  '/lang/tr.json',
  '/lang/en.json',
  '/lang/ar.json'
];

/* ── Install: kritik dosyaları önceden cache'le ── */
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return Promise.allSettled(
        STATIK.map(function(url) {
          return cache.add(url).catch(function(err) {
            console.warn('[SW] Cache edilemedi:', url, err.message);
          });
        })
      );
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

/* ── Activate: eski cache'leri temizle ── */
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

/* ── Fetch: Stale-While-Revalidate ── */
self.addEventListener('fetch', function(e) {
  var url = new URL(e.request.url);

  /* Supabase API, storage, auth — cache'leme */
  if (url.hostname.includes('supabase.co') ||
      url.hostname.includes('supabase.io') ||
      url.pathname.includes('/auth/') ||
      url.pathname.includes('/rest/') ||
      url.pathname.includes('/storage/')) {
    return;
  }

  /* POST istekleri cache'leme */
  if (e.request.method !== 'GET') return;

  /* Statik dosyalar: cache varsa hemen dön, arka planda güncelle */
  e.respondWith(
    caches.open(CACHE).then(function(cache) {
      return cache.match(e.request).then(function(cached) {
        var fetchPromise = fetch(e.request).then(function(response) {
          if (response && response.ok && response.status < 400) {
            cache.put(e.request, response.clone());
          }
          return response;
        }).catch(function() {
          /* Network yok — cached varsa onu dön */
          return cached;
        });

        /* Cache varsa hemen dön (stale), yoksa network bekle */
        return cached || fetchPromise;
      });
    })
  );
});

/* ── Background sync mesajları ── */
self.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
