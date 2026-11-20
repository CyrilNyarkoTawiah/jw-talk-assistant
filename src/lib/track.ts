/**
 * Visitor tracking — persistent anonymous per-install id.
 *
 * Privacy model (one sentence you can say out loud): the app remembers its own
 * random id so it can count visits; it never sends your IP, location or identity,
 * and it only knows your name if you typed one in the profile.
 *
 * DORMANT until the worker is deployed: TRACK_URL is empty, so nothing is ever sent.
 * After deploying backend/worker.js, set TRACK_URL to the /track endpoint and rebuild.
 */

export const TRACK_URL = 'https://jwtalk-worker.cyrilnt.workers.dev/track'

const ID_KEY = 'jwtalk_visitor_id'

export function visitorId(): string {
  let id = ''
  try { id = localStorage.getItem(ID_KEY) ?? '' } catch { return '' }
  if (!id) {
    id = (crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`)
    try { localStorage.setItem(ID_KEY, id) } catch { return '' }
  }
  return id
}

/** Fire-and-forget visit beacon. Never throws, never blocks rendering. */
export function trackPage(page: string) {
  if (!TRACK_URL) return
  try {
    const payload = JSON.stringify({
      id: visitorId(),
      name: (localStorage.getItem('jwtalk_user') || '').slice(0, 40),
      page: page.slice(0, 120),
    })
    const blob = new Blob([payload], { type: 'application/json' })
    if (navigator.sendBeacon?.(TRACK_URL, blob)) return
    void fetch(TRACK_URL, { method: 'POST', body: payload, keepalive: true })
  } catch { /* tracking must never break the app */ }
}
