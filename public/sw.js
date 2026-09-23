const CACHE_NAME = 'labu-v1'

const STATIC_ASSETS = [
  '/manifest.json',
  '/_1A1A1A.png',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
  '/icons/icon-maskable-512x512.png',
]

// Rutas que NUNCA se cachean — siempre van a la red
function isNoCacheRoute(url) {
  const pathname = new URL(url).pathname
  return (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/data/') ||
    url.includes('.supabase.co')
  )
}

// Assets estáticos que se sirven desde caché primero
function isStaticAsset(url) {
  const pathname = new URL(url).pathname
  return (
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/_next/static/') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.ico') ||
    pathname === '/manifest.json'
  )
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = request.url

  // Supabase y rutas de API: siempre network
  if (isNoCacheRoute(url)) return

  // Assets estáticos: cache first
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        })
      })
    )
    return
  }

  // Navegación HTML: network first, fallback a caché
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        })
        .catch(() => caches.match(request))
    )
  }
})

self.addEventListener('push', (event) => {
  let title = 'Labu'
  let body  = 'Tenés una nueva notificación'
  let url   = '/panel'
  let icon  = '/icons/icon-192x192.png'

  if (event.data) {
    let rawText = ''
    try { rawText = event.data.text() } catch { /* ignorar */ }

    if (rawText) {
      try {
        const parsed = JSON.parse(rawText)
        title = parsed.title || title
        body  = parsed.body  || body
        url   = parsed.url   || url
        icon  = parsed.icon  || icon
      } catch {
        // Texto plano (ej: test desde DevTools)
        body = rawText || body
      }
    }
  }

  const options = {
    body,
    icon,
    badge: '/icons/icon-72x72.png',
    data: { url },
    vibrate: [200, 100, 200],
  }

  // event.waitUntil siempre se llama para mantener el SW activo hasta mostrar la notif
  event.waitUntil(
    self.registration.showNotification(title, options)
      .catch((err) => { console.error('[SW] showNotification falló:', err) })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/panel'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.focus()
          client.postMessage({ type: 'NAVIGATE', url })
          return
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url)
      }
    })
  )
})
