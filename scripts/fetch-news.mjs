// Fetches the latest news from jw.org's newsroom landing page and writes
// src/data/news.json for the home-page Discover feed.
// On failure: exits 0 and leaves the previous news.json untouched (stale fallback).
// Runs automatically before every build (prebuild) — i.e. every app release.
import { writeFileSync, existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(root, 'src', 'data', 'news.json')

function text(s) { return s.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim() }

try {
  const res = await fetch('https://www.jw.org/en/news/', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36' },
    signal: AbortSignal.timeout(45000),
  })
  if (!res.ok) throw new Error('HTTP ' + res.status)
  const html = await res.text()

  // each news card lives in a `synopsis` block; title + teaser + date + image
  const chunks = html.split(/<div class="synopsis/)
  const byUrl = new Map()
  for (const c of chunks) {
    if (!c.includes('pubDate')) continue
    const urlM = c.match(/href="(\/en\/news\/region\/[a-z]+\/[a-zA-Z0-9-]+)\/"/)
    const dateM = c.match(/class="meta pubDate">(\d{4}-\d{2}-\d{2})</)
    if (!urlM || !dateM) continue
    const titleM = c.match(/<h3>\s*<a[^>]*>([\s\S]*?)<\/a>/)
    const descM = c.match(/<p class="desc">([\s\S]*?)<\/p>/)
    const imgM = c.match(/data-img-type='lsr'[^>]*data-img-size-lg='([^']+)'/) || c.match(/data-img-type='pnr'[^>]*data-img-size-lg='([^']+)'/) || c.match(/data-img-size-md='([^']+)'/)
    if (!titleM) continue
    const title = text(titleM[1])
    if (!title) continue
    byUrl.set(urlM[1], {
      title,
      url: 'https://www.jw.org' + urlM[1] + '/',
      date: dateM[1],
      teaser: descM ? text(descM[1]).slice(0, 220) : '',
      img: imgM ? imgM[1] : '',
    })
  }
  // teasers/images sometimes only appear in the desktop variant block — merge across chunks
  for (const c of chunks) {
    if (!c.includes('pubDate')) continue
    const urlM = c.match(/href="(\/en\/news\/region\/[a-z]+\/[a-zA-Z0-9-]+)\/"/)
    if (!urlM || !byUrl.has(urlM[1])) continue
    const it = byUrl.get(urlM[1])
    const descM = c.match(/<p class="desc">([\s\S]*?)<\/p>/)
    const imgM = c.match(/data-img-type='lsr'[^>]*data-img-size-lg='([^']+)'/) || c.match(/data-img-type='pnr'[^>]*data-img-size-lg='([^']+)'/) || c.match(/data-img-size-md='([^']+)'/)
    if (descM && !it.teaser) it.teaser = text(descM[1]).slice(0, 220)
    if (imgM && !it.img) it.img = imgM[1]
  }
  const items = [...byUrl.values()].slice(0, 12)
  if (items.length < 3) throw new Error('parsed only ' + items.length + ' items')

  // many list items only expose a small square image; the wide 1200x600 lsr_lg
  // variant exists on the CDN for the same pub id — verify before using it
  for (const it of items) {
    const m = it.img.match(/\/img\/p\/(\d+)\//)
    if (!m) continue
    const wide = `https://cms-imgp.jw-cdn.org/img/p/${m[1]}/univ/art/${m[1]}_univ_lsr_lg.jpg`
    try {
      const r = await fetch(wide, { method: 'GET', headers: { 'Range': 'bytes=0-1' }, signal: AbortSignal.timeout(20000) })
      if (r.status === 206 || r.status === 200) it.img = wide
    } catch { /* keep the square image */ }
  }

  // keep the freshest fetch, but never regress to an older fetchedAt
  let prev = { fetchedAt: '' }
  try { prev = JSON.parse(readFileSync(out, 'utf8')) } catch { /* first run */ }
  const prevMap = new Map((prev.items ?? []).map((it) => [it.url, it]))
  for (const it of items) {
    if (prevMap.has(it.url) && !it.teaser) it.teaser = prevMap.get(it.url).teaser
    if (prevMap.has(it.url) && !it.img) it.img = prevMap.get(it.url).img
  }
  writeFileSync(out, JSON.stringify({ fetchedAt: new Date().toISOString(), items }, null, 1))
  console.log('news.json written: ' + items.length + ' items, latest ' + items[0]?.date)
} catch (e) {
  if (existsSync(out)) console.log('news fetch failed (' + e.message + ') — keeping previous news.json')
  else {
    writeFileSync(out, JSON.stringify({ fetchedAt: new Date().toISOString(), items: [] }, null, 1))
    console.log('news fetch failed (' + e.message + ') — wrote empty news.json')
  }
}
