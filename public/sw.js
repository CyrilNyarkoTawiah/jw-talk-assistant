/* JW Talk Assistant service worker — app-shell cache for offline phone use */
const CACHE = 'jwtalk-v3'
const CORE = [
  '/jw-talk-assistant/',
  '/jw-talk-assistant/index.html',
  '/jw-talk-assistant/manifest.webmanifest',
  '/jw-talk-assistant/icon-192.png',
  '/jw-talk-assistant/icon-512.png',
]

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return
  const url = new URL(e.request.url)
  if (url.origin !== location.origin) return // never intercept WOL / fonts cross-origin
  e.respondWith(
    caches.match(e.request).then((hit) => {
      const net = fetch(e.request).then((res) => {
        if (res.ok) caches.open(CACHE).then((c) => c.put(e.request, res.clone()))
        return res
      }).catch(() => hit)
      return hit || net
    }),
  )
})
