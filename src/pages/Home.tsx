import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { currentWeek, isCurrent, JW_LINKS, useLibrary, weekRange, type WeekEntry } from '../lib/app'
import { useTheme } from '../App'
import { preparedCurrent } from '../lib/prepared'
import { BookOpen, Landmark, Mic2, Search, CalendarDays, ChevronRight, ChevronDown, ChevronUp, CheckCircle2, Quote, Library as LibraryIcon, MessageCircleQuestion, Bell, ExternalLink } from 'lucide-react'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function Home() {
  const nav = useNavigate()
  const week = currentWeek()
  const prepared = preparedCurrent()
  const { theme, setTheme } = useTheme()
  const userName = localStorage.getItem('jwtalk_user') || ''
  const [askQ, setAskQ] = useState('')
  const [askBusy, setAskBusy] = useState(false)
  const [askResults, setAskResults] = useState<{ title: string; href: string; pub: string }[] | null>(null)
  const [askErr, setAskErr] = useState('')
  const [remindOn, setRemindOn] = useState(() => localStorage.getItem('jwtalk_remind') === '1' && 'Notification' in window && Notification.permission === 'granted')

  useEffect(() => {
    const tick = () => {
      if (!('Notification' in window) || Notification.permission !== 'granted') return
      if (localStorage.getItem('jwtalk_remind') !== '1') return
      const [hh, mm] = (localStorage.getItem('jwtalk_remind_time') ?? '07:00').split(':').map(Number)
      const now = new Date()
      if (now.getHours() < hh || (now.getHours() === hh && now.getMinutes() < mm)) return
      const today = now.toISOString().slice(0, 10)
      if (localStorage.getItem('jwtalk_last_notify') === today) return
      const prep = preparedCurrent()
      const dt = prep?.daily?.find((d) => d.date === today)
      try {
        new Notification('Daily Text — ' + (dt?.ref ?? 'JW Study Assistant'), {
          body: (dt?.scripture ?? 'Your daily text is waiting.') + ' Open the app to read it.',
        })
        localStorage.setItem('jwtalk_last_notify', today)
      } catch { /* notifications unsupported */ }
    }
    tick()
    const t = setInterval(tick, 30000)
    return () => clearInterval(t)
  }, [])

  async function runAsk() {
    const q = askQ.trim()
    if (!q || askBusy) return
    setAskBusy(true); setAskErr(''); setAskResults(null)
    const url = 'https://wol.jw.org/en/wol/s/r1/lp-e?q=' + encodeURIComponent(q)
    const parseMd = (md: string) => {
      const out: { title: string; href: string; pub: string }[] = []
      const arr = md.split('\n')
      for (let i = 0; i < arr.length && out.length < 8; i++) {
        const m = arr[i].match(/^\*\s+\[([^\]]+)\]\((https:\/\/wol\.jw\.org\/en\/wol\/d\/r1\/lp-e\/\d+)[^)]*\)/)
        if (!m) continue
        let pub = ''
        for (let j = i + 1; j < Math.min(i + 5, arr.length); j++) {
          if (arr[j].includes('](')) break
          const pm = arr[j].match(/^\*\s+\*\s+([^*\[]+?)\s*$/)
          if (pm) { pub = pm[1].trim(); break }
        }
        if (!out.some((o) => o.href === m[2])) out.push({ title: m[1].trim(), href: m[2], pub })
      }
      return out
    }
    const done = (out: { title: string; href: string; pub: string }[]) => {
      try { localStorage.setItem('jwtalk_ask_cache', JSON.stringify({ out })) } catch { /* noop */ }
      setAskResults(out); setAskBusy(false)
    }
    // 1) r.jina.ai reader (CORS-friendly markdown) — 2 attempts with backoff
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        if (attempt > 0) await new Promise((r) => setTimeout(r, 2500))
        const c1 = new AbortController(); const k1 = setTimeout(() => c1.abort(), 20000)
        const r1 = await fetch('https://r.jina.ai/' + url, { signal: c1.signal })
        clearTimeout(k1)
        if (!r1.ok) continue
        const out = parseMd(await r1.text())
        if (out.length) { done(out); return }
      } catch { /* retry or fall through */ }
    }
    // 2) HTML via CORS proxies (fallback)
    const proxies = [
      'https://api.allorigins.win/raw?url=' + encodeURIComponent(url),
      'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(url),
    ]
    for (const purl of proxies) {
      try {
        const ctrl = new AbortController()
        const kill = setTimeout(() => ctrl.abort(), 15000)
        const res = await fetch(purl, { signal: ctrl.signal })
        clearTimeout(kill)
        if (!res.ok) continue
        const html = await res.text()
        const doc = new DOMParser().parseFromString(html, 'text/html')
        const out: { title: string; href: string; pub: string }[] = []
        doc.querySelectorAll('ul.directory.resultContentTopic').forEach((ul) => {
          if (out.length >= 8) return
          const a = ul.querySelector('li.caption a.lnk')
          const pub = ul.querySelector('li.ref')
          if (a && a.getAttribute('href')) {
            out.push({ title: (a.textContent ?? '').trim(), href: 'https://wol.jw.org' + a.getAttribute('href'), pub: (pub?.textContent ?? '').trim() })
          }
        })
        if (out.length) { done(out); return }
      } catch { /* next proxy */ }
    }
    // 3) last successful results from this device
    try {
      const cached = JSON.parse(localStorage.getItem('jwtalk_ask_cache') ?? 'null')
      if (cached?.out?.length) {
        setAskResults(cached.out as { title: string; href: string; pub: string }[])
        setAskErr('Showing your last successful results — jw.org could not be reached just now.')
        setAskBusy(false)
        return
      }
    } catch { /* noop */ }
    setAskErr("Couldn't reach jw.org just now — check your connection and try again.")
    setAskBusy(false)
  }
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)
  const daily = prepared?.daily?.find((d) => d.date === todayStr) ?? prepared?.daily?.[0]
  const { items } = useLibrary()
  const [dailyOpen, setDailyOpen] = useState(false)

  return (
    <div>
      {/* greeting row */}
      <div className="rise d1" style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
        <div>
          <h1 style={{ fontSize: 25, margin: 0, color: 'var(--navy)' }}>{greeting()}{userName ? ', ' + userName : ''}</h1>
          <p className="muted" style={{ margin: '3px 0 0', fontWeight: 600, fontSize: 13 }}>
            {today.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* daily text hero */}
      {daily && (
        <div className="card hero rise d2 press" style={{ marginTop: 16, padding: '18px 20px' }} onClick={() => nav('/research')}>
          <span className="tag">Daily text · {daily.weekday}</span>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginTop: 10 }}>
            <Quote size={26} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ margin: 0, fontSize: 15.5, fontWeight: 700, lineHeight: 1.45 }}>{daily.scripture ?? ''}</p>
              {daily.ref && <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#ffd9a0', fontWeight: 700 }}>{daily.ref}</p>}
            </div>
          </div>
          {daily.comment && (
            <p
              className="muted"
              onClick={(e) => { e.stopPropagation(); setDailyOpen(!dailyOpen) }}
              style={{
                marginTop: 10, fontSize: 12.5, lineHeight: 1.55, cursor: 'pointer',
                ...(dailyOpen ? {} : { display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }),
              }}
            >
              {daily.comment}
            </p>
          )}
          {daily.comment && (
            <button
              onClick={(e) => { e.stopPropagation(); setDailyOpen(!dailyOpen) }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 800,
                marginTop: 8, color: '#ffd9a0', background: 'rgba(255,255,255,0.08)', border: 'none',
                borderRadius: 999, padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {dailyOpen ? 'Show less' : 'Read full text'} {dailyOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          )}
          <a href={JW_LINKS.dailyText} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 800, marginTop: 10, marginLeft: daily.comment ? 8 : 0, color: '#ffd9a0' }}>
            WOL <ChevronRight size={13} />
          </a>
        </div>
      )}

      {/* this week's meetings */}
      <div className="rise d3" style={{ display: 'flex', alignItems: 'center', marginTop: 22, marginBottom: 10 }}>
        <h2 style={{ fontSize: 17, margin: 0 }}>This week’s meetings</h2>
        {week && <span className="tag soft-navy" style={{ marginLeft: 'auto' }}>Week {weekRange(week)}</span>}
      </div>

      {week && (
        <div className="tiles rise d4">
          <MeetingTile
            icon={<BookOpen size={20} />} bg="var(--mint)"
            title="Life & Ministry" sub="Midweek meeting"
            ready={!!prepared}
            onClick={() => nav('/life-and-ministry')}
          />
          <MeetingTile
            icon={<Landmark size={20} />} bg="var(--lav)"
            title="Watchtower Study" sub="Weekend meeting"
            ready={!!prepared}
            onClick={() => nav('/watchtower')}
          />
        </div>
      )}

      {/* quick actions */}
      <div className="rise d5" style={{ display: 'flex', alignItems: 'center', marginTop: 22, marginBottom: 10 }}>
        <h2 style={{ fontSize: 17, margin: 0 }}>Do something now</h2>
      </div>
      <div className="tiles rise d6">
        <Tile icon={<Mic2 size={20} />} bg="var(--peach)" title="Prepare a talk" desc="Outline in, full manuscript out" onClick={() => nav('/talk-assistant')} />
        <Tile icon={<Search size={20} />} bg="var(--blue)" title="Look up a scripture" desc="NWT-only, every book" onClick={() => nav('/bible-study')} />
        <Tile icon={<CalendarDays size={20} />} bg="var(--mint)" title="Meeting checklist" desc="Tick off your preparation" onClick={() => nav('/meetings')} />
        <Tile icon={<LibraryIcon size={20} />} bg="var(--lav)" title="My Library" desc={`${items.length} saved ${items.length === 1 ? 'item' : 'items'}`} onClick={() => nav('/library')} />
      </div>

      {/* weekly progress */}
      {prepared && (
        <WeekProgress rise="d7" />
      )}

      {/* ask jw.org */}
      <div className="card rise d7" style={{ marginTop: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="tag">Ask jw.org</span>
          <Bell
            size={16} style={{ marginLeft: 'auto', color: remindOn ? 'var(--green)' : 'var(--muted)', cursor: 'pointer' }}
            onClick={async () => {
              if (!('Notification' in window)) return
              if (remindOn) { localStorage.setItem('jwtalk_remind', '0'); setRemindOn(false); return }
              const perm = await Notification.requestPermission()
              if (perm === 'granted') { localStorage.setItem('jwtalk_remind', '1'); setRemindOn(true) }
            }}
          />
        </div>
        <div className="ask-row">
          <input
            placeholder="Ask anything — e.g. why pray in Jesus' name?"
            value={askQ} onChange={(e) => setAskQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') runAsk() }}
          />
          <button className="btn primary" onClick={runAsk} disabled={askBusy || !askQ.trim()} style={{ whiteSpace: 'nowrap', padding: '10px 16px' }}>
            {askBusy ? 'Searching…' : 'Search'}
          </button>
        </div>
        {remindOn && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <p className="muted" style={{ fontSize: 11.5, margin: 0 }}>🔔 Daily-text reminder on at</p>
            <input type="time" defaultValue={localStorage.getItem('jwtalk_remind_time') ?? '07:00'}
              onChange={(e) => { localStorage.setItem('jwtalk_remind_time', e.target.value || '07:00') }}
              style={{ width: 'auto', padding: '5px 8px', fontSize: 12.5 }} />
          </div>
        )}
        {askErr && <p className="muted" style={{ fontSize: 12.5, marginTop: 10, color: 'var(--danger)' }}>{askErr}</p>}
        {askResults && (
          <div style={{ marginTop: 8 }}>
            {askResults.map((r, i) => (
              <div className="ask-result" key={i}>
                <a href={r.href} target="_blank" rel="noreferrer">
                  {r.title} <ExternalLink size={11} />
                </a>
                {r.pub && <div className="ask-pub">{r.pub}</div>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* official links strip */}
      <div className="card grey rise d8" style={{ marginTop: 20, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <span className="muted" style={{ fontSize: 12, fontWeight: 700 }}>Official:</span>
        <a className="btn ghost press" style={{ padding: '7px 13px', fontSize: 12, background: 'var(--surface)' }} href={JW_LINKS.meetingWorkbook} target="_blank" rel="noreferrer">Workbook</a>
        <a className="btn ghost press" style={{ padding: '7px 13px', fontSize: 12, background: 'var(--surface)' }} href={JW_LINKS.magazines} target="_blank" rel="noreferrer">Magazines</a>
        <a className="btn ghost press" style={{ padding: '7px 13px', fontSize: 12, background: 'var(--surface)' }} href={JW_LINKS.jwOrg} target="_blank" rel="noreferrer">JW.ORG</a>
      </div>

      <p className="muted rise d8" style={{ marginTop: 16, fontSize: 11, textAlign: 'center' }}>
        JW Study Assistant · personal tool, not affiliated with JW.ORG · scriptures: NWT (2013)
      </p>
    </div>
  )
}

function MeetingTile({ icon, bg, title, sub, ready, onClick }: { icon: React.ReactNode; bg: string; title: string; sub: string; ready: boolean; onClick: () => void }) {
  return (
    <button className="tile press" style={{ textAlign: 'left', fontFamily: 'inherit', cursor: 'pointer' }} onClick={onClick}>
      <div style={{ display: 'flex', width: '100%', alignItems: 'flex-start' }}>
        <span className="ico" style={{ background: bg }}>{icon}</span>
        {ready
          ? <span className="tag" style={{ marginLeft: 'auto', background: 'var(--green-soft)', color: 'var(--green)', display: 'inline-flex', alignItems: 'center', gap: 4 }}><CheckCircle2 size={11} /> Ready</span>
          : <span className="tag soft-navy" style={{ marginLeft: 'auto' }}>Soon</span>}
      </div>
      <div>
        <strong>{title}</strong>
        <span className="desc">{sub}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent-deep)', fontWeight: 800, fontSize: 12, marginTop: 'auto' }}>
        {ready ? 'Open prepared study' : 'Open module'} <ChevronRight size={14} />
      </div>
    </button>
  )
}

function Tile({ icon, bg, title, desc, onClick }: { icon: React.ReactNode; bg: string; title: string; desc: string; onClick: () => void }) {
  return (
    <button className="tile press" style={{ textAlign: 'left', fontFamily: 'inherit', cursor: 'pointer' }} onClick={onClick}>
      <span className="ico" style={{ background: bg }}>{icon}</span>
      <div>
        <strong>{title}</strong>
        <span className="desc">{desc}</span>
      </div>
    </button>
  )
}

function WeekProgress({ rise }: { rise: string }) {
  // preparation progress from the meetings checklist
  let checks: boolean[] = []
  try { checks = JSON.parse(localStorage.getItem('jwtalk_checks') ?? 'null') ?? [] } catch { /* noop */ }
  const done = checks.filter(Boolean).length
  const pct = checks.length ? Math.round((done / checks.length) * 100) : 0
  return (
    <div className={`card ${rise}`} style={{ marginTop: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className="tag">Your preparation</span>
        <strong style={{ marginLeft: 'auto', fontSize: 14 }}>{pct}%</strong>
      </div>
      <div className="progress-track" style={{ marginTop: 12 }}>
        <div className="progress-fill" style={{ width: `${Math.max(pct, 3)}%` }} />
      </div>
      <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
        {done} of {checks.length || 7} checklist items done · <a href="#/meetings">open checklist</a>
      </p>
    </div>
  )
}
