import { useState } from 'react'
import { Link } from 'react-router-dom'
import { currentWeek, isCurrent, JW_LINKS, useLibrary, type WeekEntry } from '../lib/app'
import { preparedCurrent } from '../lib/prepared'
import { loadAiConfig, buildTalkPrompt, SYSTEM_INSTRUCTIONS } from '../lib/ai'
import { BookOpen, Landmark, Mic2, Copy, Check, ExternalLink, CalendarDays, ArrowRight } from 'lucide-react'

const TONES = ['Warm and encouraging', 'Conversational', 'Persuasive', 'Reflective', 'Teaching style', 'Balanced']
const ILLUS = ['Include several illustrations', 'One or two strong illustrations', 'Where necessary only', 'None', 'Let AI decide']
const ILLUS_TYPES = ['Everyday life', 'Family', 'Nature & creation', 'Bible accounts', 'Modern-day situations', 'Hypothetical scenario', 'Analogy']

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 style={{ fontSize: 19, margin: '30px 0 12px' }}>{children}</h2>
}

export default function Home() {
  const week = currentWeek()
  const prepared = preparedCurrent()
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  return (
    <div>
      <p className="tag">{today}</p>
      <h1 style={{ fontSize: 26, margin: '10px 0 6px' }}>Welcome</h1>
      <p className="muted" style={{ maxWidth: 620 }}>
        Your daily text, this week's meetings, and the talk assistant — in one calm place.
        Everything links back to the official JW.ORG source material.
      </p>

      {/* ---- Daily text ---- */}
      <div className="card" style={{ marginTop: 20, borderLeft: '4px solid var(--gold)', padding: '20px 22px' }}>
        <span className="tag">Daily text</span>
        <h2 style={{ fontSize: 20, margin: '10px 0 4px' }}>{week ? `Week of ${week.weekStart}` : 'Daily text'}</h2>
        <p className="muted">
          Today's scripture reference and commentary live on the official Daily Text page — always
          current, never a stale copy. Tap through to read, reflect and pray over it.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
          <a className="btn gold" href={week?.dailyText ?? JW_LINKS.dailyText} target="_blank" rel="noreferrer">
            <BookOpen size={16} /> Open today's text on WOL
          </a>
          <a className="btn ghost" href={JW_LINKS.studyBible} target="_blank" rel="noreferrer">
            <ExternalLink size={16} /> Study Bible (NWT)
          </a>
        </div>
      </div>

      {/* ---- Weekly meetings ---- */}
      <SectionTitle>This week's meetings</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        <MeetingCard
          icon={<BookOpen size={20} />}
          label="Life and Ministry"
          sub="Midweek meeting"
          title={week?.lifeAndMinistry.publication ?? 'Meeting Workbook'}
          url={week?.lifeAndMinistry.sourceUrl}
          linkText="Meeting Workbook on WOL"
          sections={week?.lifeAndMinistry.sections}
          to="/life-and-ministry"
          current={week ? isCurrent(week) : false}
          ready={!!prepared}
        />
        <MeetingCard
          icon={<Landmark size={20} />}
          label="Watchtower Study"
          sub="Weekend meeting"
          title={week?.watchtower.articleTitle ?? 'Study article'}
          url={week?.watchtower.sourceUrl}
          linkText="Study article on WOL"
          to="/watchtower"
          current={week ? isCurrent(week) : false}
          ready={!!prepared}
        />
      </div>

      {/* ---- Meetings session ---- */}
      <SectionTitle>Meetings session</SectionTitle>
      <div className="card grey" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
        {['Midweek preparation', 'Weekend preparation', 'Assignments', 'Bible-reading schedule', 'Study notes', 'Meeting comments', 'Song & programme notes', 'Preparation checklist'].map((x) => (
          <Link key={x} to="/meetings" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'var(--surface)', borderRadius: 10, fontSize: 13.5, fontWeight: 600 }}>
            <CalendarDays size={15} /> {x}
          </Link>
        ))}
      </div>

      {/* ---- Talk generator teaser ---- */}
      <SectionTitle>Prepare your public talk with AI</SectionTitle>
      <TalkTeaser />
    </div>
  )
}

function MeetingCard(props: {
  icon: React.ReactNode; label: string; sub: string; title: string;
  url?: string; linkText: string; sections?: string[]; to: string; current: boolean; ready?: boolean
}) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--navy)' }}>
        {props.icon}
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{props.label}</div>
          <div className="muted" style={{ fontSize: 12 }}>{props.sub}</div>
        </div>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {props.ready && <span className="tag" style={{ background: 'rgba(62,107,79,0.14)', color: 'var(--green)' }}>Prepared ✓</span>}
          {props.current && <span className="tag">Current week</span>}
        </span>
      </div>
      <strong style={{ fontSize: 14.5 }}>{props.title}</strong>
      {props.sections && (
        <ul style={{ listStyle: 'none', fontSize: 13, color: 'var(--muted)', display: 'grid', gap: 3 }}>
          {props.sections.map((s) => <li key={s}>• {s}</li>)}
        </ul>
      )}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
        <Link className="btn" to={props.to}><ArrowRight size={15} /> Open module</Link>
        {props.url && <a className="btn ghost" href={props.url} target="_blank" rel="noreferrer"><ExternalLink size={14} /> {props.linkText}</a>}
      </div>
    </div>
  )
}

function TalkTeaser() {
  const [outline, setOutline] = useState(() => localStorage.getItem('jwtalk_home_outline') ?? '')
  const [duration, setDuration] = useState(30)
  const [tone, setTone] = useState(TONES[0])
  const [illus, setIllus] = useState(ILLUS[4])
  const [types, setTypes] = useState<string[]>([])
  const [copied, setCopied] = useState(false)
  const { add } = useLibrary()

  const goFull = () => {
    localStorage.setItem('jwtalk_home_outline', outline)
    localStorage.setItem('jwtalk_talk_seed', JSON.stringify({ outline, duration, tone, illus, types }))
  }

  const quickGenerate = async () => {
    if (!outline.trim()) return
    goFull()
    const prompt = buildTalkPrompt(outline, {
      durationMin: duration, tone, illustrations: illus, illustrationTypes: types,
    })
    try { await navigator.clipboard.writeText(prompt); setCopied(true); setTimeout(() => setCopied(false), 2500) }
    catch { window.prompt('Copy your Hermes prompt (Ctrl+C):', prompt) }
  }

  return (
    <div className="card">
      <p style={{ fontSize: 14, color: 'var(--muted)', maxWidth: 640 }}>
        Paste your complete public talk outline and let the AI develop it into a fully written,
        scripture-supported talk you can practise and deliver. The outline is preserved exactly —
        every point, every scripture, in order.
      </p>
      <textarea
        style={{ minHeight: 150, marginTop: 12 }}
        placeholder="Paste your complete talk outline here, including the theme, main points, subpoints, scriptures, instructions and allocated time…"
        value={outline}
        onChange={(e) => setOutline(e.target.value)}
      />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginTop: 12 }}>
        <label style={{ fontSize: 12.5, fontWeight: 600 }}>
          Duration
          <select value={duration} onChange={(e) => setDuration(+e.target.value)} style={{ marginTop: 4 }}>
            {[5, 10, 15, 30, 45, 60].map((m) => <option key={m} value={m}>{m} minutes</option>)}
          </select>
        </label>
        <label style={{ fontSize: 12.5, fontWeight: 600 }}>
          Tone
          <select value={tone} onChange={(e) => setTone(e.target.value)} style={{ marginTop: 4 }}>
            {TONES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </label>
        <label style={{ fontSize: 12.5, fontWeight: 600 }}>
          Illustrations
          <select value={illus} onChange={(e) => setIllus(e.target.value)} style={{ marginTop: 4 }}>
            {ILLUS.map((t) => <option key={t}>{t}</option>)}
          </select>
        </label>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
        {ILLUS_TYPES.map((t) => (
          <button key={t} onClick={() => setTypes((ts) => ts.includes(t) ? ts.filter((x) => x !== t) : [...ts, t])}
            style={{
              border: '1px solid var(--line)', background: types.includes(t) ? 'var(--navy)' : 'var(--surface)',
              color: types.includes(t) ? '#fff' : 'var(--ink)', borderRadius: 20, padding: '5px 12px', fontSize: 12, fontWeight: 600,
            }}>{t}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
        <button className="btn green" style={{ padding: '12px 22px', fontSize: 15 }} onClick={quickGenerate} disabled={!outline.trim()}>
          {copied ? <><Check size={16} /> Prompt copied — paste into Hermes</> : <><Mic2 size={16} /> Generate full talk</>}
        </button>
        <Link className="btn ghost" to="/talk-assistant" onClick={goFull}>Open full Talk Assistant <ArrowRight size={15} /></Link>
      </div>
      <p className="muted" style={{ marginTop: 10, fontSize: 12.5 }}>
        {loadAiConfig().mode === 'bridge'
          ? 'Bridge mode: the button copies a fully-structured prompt. Paste it into your Hermes chat, then keep the returned manuscript in the Talk Assistant or My Library.'
          : 'Endpoint mode: generation goes through your configured secure backend.'}
      </p>
    </div>
  )
}
