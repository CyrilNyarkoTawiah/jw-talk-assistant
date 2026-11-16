import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { currentWeek, isCurrent, JW_LINKS, useLibrary, type WeekEntry } from '../lib/app'
import { useTheme } from '../App'
import { preparedCurrent } from '../lib/prepared'
import { BookOpen, Landmark, Mic2, Search, Flame, CalendarDays, Sun, Moon, ChevronRight, Sparkles, CheckCircle2, Quote, Library as LibraryIcon } from 'lucide-react'

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
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)
  const daily = prepared?.daily?.find((d) => d.date === todayStr) ?? prepared?.daily?.[0]
  const { items } = useLibrary()

  return (
    <div>
      {/* greeting row */}
      <div className="rise d1" style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
        <div>
          <h1 style={{ fontSize: 25, margin: 0, color: 'var(--navy)' }}>{greeting()}, Cyril</h1>
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
            <p className="muted" style={{ marginTop: 10, fontSize: 12.5, lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {daily.comment}
            </p>
          )}
          <a href={JW_LINKS.dailyText} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 800, marginTop: 10, color: '#ffd9a0' }}>
            Full text on WOL <ChevronRight size={13} />
          </a>
        </div>
      )}

      {/* this week's meetings */}
      <div className="rise d3" style={{ display: 'flex', alignItems: 'center', marginTop: 22, marginBottom: 10 }}>
        <h2 style={{ fontSize: 17, margin: 0 }}>This week’s meetings</h2>
        {week && <span className="tag soft-navy" style={{ marginLeft: 'auto' }}>Week of {week.weekStart.slice(5)}</span>}
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
