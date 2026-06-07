/**
 * SERVICE WORKER — Asset Path Resolution for Deep-Route SPA
 *
 * FIX APPLIED: Cache cleanup logic in 'activate' handler was inverted.
 * Old code:
 *   .filter(name => !name.startsWith(CACHE_VERSION) && !PREVIOUS_CACHES.includes(name))
 * This kept PREVIOUS_CACHES alive forever (they're NOT the current version
 * AND they ARE in PREVIOUS_CACHES → condition evaluates false → not deleted).
 *
 * Fixed code:
 *   .filter(name => !name.startsWith(CACHE_VERSION))
 * This correctly deletes everything that is NOT the current cache version.
 */

const CACHE_VERSION = 'v4-portfolio-2026';
const ASSET_CACHE   = `${CACHE_VERSION}-assets`;
const DOCUMENT_CACHE = `${CACHE_VERSION}-docs`;

const ASSET_PATTERNS = [
  /\.css$/i,
  /\.js$/i,
  /\.(png|jpg|jpeg|gif|svg|webp)$/i,
  /\.(woff|woff2|ttf|eot)$/i,
];

function isAssetRequest(pathname) {
  return ASSET_PATTERNS.some(p => p.test(pathname));
}

function isDocumentRequest(pathname) {
  return (
    pathname === '/' ||
    /\.(html)$/i.test(pathname) ||
    /^\/(blog|resume|about)(\/[^.]*)?$/.test(pathname)
  );
}

function isValidAssetResponse(pathname, contentType) {
  if (pathname.endsWith('.css'))                    return contentType.includes('text/css');
  if (pathname.endsWith('.js'))                     return contentType.includes('javascript');
  if (/\.(png|jpg|jpeg|gif|svg|webp)$/i.test(pathname)) return contentType.includes('image');
  if (/\.(woff|woff2|ttf|eot)$/i.test(pathname))   return contentType.includes('font') || contentType.includes('octet-stream');
  return true;
}

/* ── Install ── */
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(ASSET_CACHE),
      caches.open(DOCUMENT_CACHE),
    ]).then(() => self.skipWaiting())
  );
});

/* ── Activate: delete ALL caches that are not the current version ── */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          /* FIX: was !startsWith(CACHE_VERSION) && !PREVIOUS_CACHES.includes(name)
             which kept old caches alive. Now we simply delete anything not current. */
          .filter((name) => !name.startsWith(CACHE_VERSION))
          .map((name) => {
            console.log(`[SW] Deleting old cache: ${name}`);
            return caches.delete(name);
          })
      )
    ).then(() => {
      console.log(`[SW] Active. Cache version: ${CACHE_VERSION}`);
      return self.clients.claim();
    })
  );
});

/* ── Fetch ── */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.includes('sw.js')) return;
  if (url.pathname.startsWith('/api/')) return; /* Never intercept API calls */

  /* JSON data: network-first, fall back to cache offline */
  if (url.pathname.endsWith('.json') || url.pathname.includes('/data/')) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(ASSET_CACHE).then((c) => c.put(request, clone));
          }
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  /* Assets: cache-first with MIME type validation */
  if (isAssetRequest(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          if (res.ok) {
            const ct = res.headers.get('content-type') || '';
            if (isValidAssetResponse(url.pathname, ct)) {
              const clone = res.clone();
              caches.open(ASSET_CACHE).then((c) => c.put(request, clone));
            } else {
              console.warn(`[SW] MIME mismatch: ${url.pathname} → ${ct}`);
            }
          }
          return res;
        }).catch(() => new Response('', { status: 503 }));
      })
    );
    return;
  }

  /* Documents: network-first, fall back to cache */
  if (isDocumentRequest(url.pathname)) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(DOCUMENT_CACHE).then((c) => c.put(request, clone));
          }
          return res;
        })
        .catch(() =>
          caches.match(request).then(
            (cached) => cached || new Response('Offline — cached page unavailable', { status: 503 })
          )
        )
    );
  }
});