import { useState } from 'react'
import { currentWeek, JW_LINKS } from '../lib/app'
import { Check, ExternalLink } from 'lucide-react'

const DEFAULT_CHECKS = [
  'Read this week’s Bible-reading chapters',
  'Treasures talk prepared',
  'Spiritual Gems comment ready',
  'Student assignment practised',
  'Watchtower study questions reviewed',
  'Song numbers noted',
  'Meeting comments practised aloud',
]

export default function Meetings() {
  const week = currentWeek()
  const [checks, setChecks] = useState<boolean[]>(() => {
    try { return JSON.parse(localStorage.getItem('jwtalk_checks') ?? 'null') ?? DEFAULT_CHECKS.map(() => false) } catch { return DEFAULT_CHECKS.map(() => false) }
  })
  const [notes, setNotes] = useState(() => localStorage.getItem('jwtalk_meeting_notes') ?? '')
  const toggle = (i: number) => {
    const next = [...checks]; next[i] = !next[i]
    setChecks(next); localStorage.setItem('jwtalk_checks', JSON.stringify(next))
  }
  return (
    <div>
      <h1 style={{ fontSize: 24 }}>Meetings</h1>
      <p className="muted" style={{ marginTop: 4 }}>
        {week ? <>Week of {week.weekStart} · <a href={week.meetingsHub} target="_blank" rel="noreferrer">Open this week's material on WOL <ExternalLink size={11} /></a></> : 'No week configured yet.'}
      </p>

      <div className="card" style={{ marginTop: 16 }}>
        <span className="tag">Personal preparation checklist</span>
        <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
          {DEFAULT_CHECKS.map((c, i) => (
            <label key={c} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, cursor: 'pointer' }}>
              <input type="checkbox" checked={checks[i]} onChange={() => toggle(i)} style={{ width: 17, height: 17, accentColor: 'var(--green)' }} />
              <span style={{ textDecoration: checks[i] ? 'line-through' : 'none', color: checks[i] ? 'var(--green)' : 'var(--ink)' }}>{c}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <span className="tag">Meeting notes</span>
        <textarea style={{ minHeight: 180, marginTop: 10 }}
          placeholder="Comments prepared, songs, programme notes, things to follow up…"
          value={notes} onChange={(e) => { setNotes(e.target.value); localStorage.setItem('jwtalk_meeting_notes', notes) }} />
      </div>

      <div className="card grey" style={{ marginTop: 14 }}>
        <span className="tag">Official material</span>
        <div style={{ display: 'grid', gap: 8, marginTop: 10, fontSize: 13.5 }}>
          <a href={week?.lifeAndMinistry.sourceUrl ?? JW_LINKS.meetingWorkbook} target="_blank" rel="noreferrer">Life and Ministry Meeting Workbook <ExternalLink size={11} /></a>
          <a href={week?.watchtower.sourceUrl ?? JW_LINKS.magazines} target="_blank" rel="noreferrer">Watchtower study article <ExternalLink size={11} /></a>
          <a href={JW_LINKS.dailyText} target="_blank" rel="noreferrer">Daily text <ExternalLink size={11} /></a>
        </div>
      </div>
    </div>
  )
}
