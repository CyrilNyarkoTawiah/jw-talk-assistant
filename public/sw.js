/* JW Talk Assistant service worker — app-shell cache for offline phone use */
const CACHE = 'jwtalk-v5'
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

const verOf = (k) => k.replace(/^jwtalk-v/, '')
const cmpVer = (a, b) => {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  return (pa[0] - pb[0]) || (pa[1] - pb[1]) || (pa[2] - pb[2])
}

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    // Keep the current cache AND the most recent previous generation: a page
    // still loading from the old shell must never hit a purged asset (this is
    // what made the installed app go blank after an update). Older generations
    // are cleaned here; the previous one is removed on the NEXT activation.
    const keys = await caches.keys()
    const others = keys
      .filter((k) => k !== CACHE && /^jwtalk-v/.test(k))
      .sort((a, b) => cmpVer(verOf(b), verOf(a)))
    const doomed = others.slice(1)
      .concat(keys.filter((k) => k !== CACHE && !/^jwtalk-v/.test(k)))
    await Promise.all(doomed.map((k) => caches.delete(k)))
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return
  const url = new URL(e.request.url)
  if (url.origin !== location.origin) return // never intercept WOL / fonts cross-origin
  const isShell = e.request.mode === 'navigate' || url.pathname.endsWith('/index.html')
  if (isShell) {
    // network-first: the app shell must always be the latest deployed version
    e.respondWith(
      fetch(e.request).then((res) => {
        if (res.ok) caches.open(CACHE).then((c) => c.put(e.request, res.clone()))
        return res
      }).catch(() => caches.match(e.request, { ignoreSearch: true })),
    )
    return
  }
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
