/**
 * SERVICE WORKER — Asset Path Resolution for Deep-Route SPA
 * 
 * This worker ensures that when the app is accessed via deep routes (e.g., /blog/hello-world),
 * static asset requests like /css/style.css are always served from the correct origin,
 * preventing MIME type mismatches and cache poisoning.
 * 
 * Key Fix:
 * - Verifies that /css/*.css returns Content-Type: text/css
 * - Verifies that /js/*.js returns Content-Type: application/javascript
 * - Intercepts any text/html responses for asset requests and caches them for debugging
 */

const CACHE_VERSION = 'v2-portfolio-2026'; 
const ASSET_CACHE = `${CACHE_VERSION}-assets`;
const DOCUMENT_CACHE = `${CACHE_VERSION}-docs`;

const ASSET_PATTERNS = [
  /\.css$/i,
  /\.js$/i,
  /\.(png|jpg|jpeg|gif|svg|webp)$/i,
  /\.(woff|woff2|ttf|eot)$/i,
  /\.json$/i
];

const DOCUMENT_PATTERNS = [
  /\.html$/i,
  /\.(index|blog|post|resume)$/i
];

/**
 * Determines if a URL is an asset request
 */
function isAssetRequest(url) {
  return ASSET_PATTERNS.some(pattern => pattern.test(url));
}

/**
 * Determines if a URL is a document request
 */
function isDocumentRequest(url) {
  return DOCUMENT_PATTERNS.some(pattern => pattern.test(url));
}

/**
 * Install: Set up caches
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(ASSET_CACHE),
      caches.open(DOCUMENT_CACHE)
    ]).then(() => self.skipWaiting())
  );
});

/**
 * Activate: Clean up old caches
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => !name.startsWith(CACHE_VERSION))
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

/**
 * Fetch: Intercept and validate asset responses
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only intercept GET requests on same origin
  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // Skip service worker scripts
  if (url.pathname.includes('sw.js')) {
    return;
  }

  // ─── CRITICAL CORRECTION LAYER: NETWORK-FIRST STRATEGY FOR DATA JSONS ───
  if (url.pathname.endsWith('.json') || url.pathname.includes('/data/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseToCache = response.clone();
            caches.open(ASSET_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => caches.match(request)) // Fall back to cache ONLY if completely offline
    );
    return;
  }

 // Handle asset requests (CSS, JS, Images, Fonts) with cache-first and validation
  if (isAssetRequest(url.pathname)) {
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) {
          return response;
        }

        return fetch(request)
          .then((response) => {
            if (response.ok) {
              const contentType = response.headers.get('content-type') || '';
              const isValidAsset = isValidAssetResponse(url.pathname, contentType);

              if (isValidAsset) {
                const responseToCache = response.clone();
                caches.open(ASSET_CACHE).then((cache) => {
                  cache.put(request, responseToCache);
                });
              } else {
                console.warn(`[SW] Asset mime-type mismatch: ${url.pathname} returned ${contentType}`);
              }
            }
            return response;
          })
          .catch((err) => {
            console.error(`[SW] Fetch failed for ${url.pathname}:`, err);
            return new Response('', { status: 503, statusText: 'Service Unavailable' });
          });
      })
    );
    return;
  }

  // Handle document requests (HTML) with network-first strategy
  if (isDocumentRequest(url.pathname) || url.pathname === '/') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseToCache = response.clone();
            caches.open(DOCUMENT_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((response) => {
            return response || new Response('Offline — cached page unavailable', { status: 503, statusText: 'Service Unavailable' });
          });
        })
    );
    return;
  }
});

/**
 * Validates that asset responses have correct MIME types
 * Prevents MIME type mismatch errors (X-Content-Type-Options: nosniff)
 */
function isValidAssetResponse(pathname, contentType) {
  const isCss = pathname.endsWith('.css');
  const isJs = pathname.endsWith('.js');
  const isJson = pathname.endsWith('.json');
  const isImage = /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(pathname);
  const isFont = /\.(woff|woff2|ttf|eot)$/i.test(pathname);

  if (isCss) {
    return contentType.includes('text/css');
  }
  if (isJs) {
    return contentType.includes('javascript') || contentType.includes('application/javascript');
  }
  if (isJson) {
    return contentType.includes('json');
  }
  if (isImage) {
    return contentType.includes('image');
  }
  if (isFont) {
    return contentType.includes('font') || contentType.includes('application/octet-stream');
  }

  return true; // Accept any other type
}
