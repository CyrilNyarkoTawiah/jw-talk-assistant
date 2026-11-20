import { useState } from 'react'
import {
  BookOpenCheck, Mic2, Sparkles, ArrowRight, ArrowLeft, CalendarDays, Compass, ShieldCheck,
} from 'lucide-react'

const SLIDES = [
  {
    ico: BookOpenCheck,
    color: 'var(--mint)',
    title: 'Your whole week, already prepared',
    body: 'Open Life & Ministry or Watchtower Study and every question for this week is answered — meeting comments, NWT scriptures, insights and application. No digging, no pasting. The daily text greets you on Home each day.',
  },
  {
    ico: CalendarDays,
    color: 'var(--blue)',
    title: 'Two weeks at a time',
    body: 'The week pill at the top of the study pages lets you switch between weeks — the current one and the next are open, each fully prepared. Further weeks stay locked until the Friday before they begin, so you prepare one week at a time like a real steward.',
  },
  {
    ico: Mic2,
    color: 'var(--peach)',
    title: 'A talk coach, not a ghostwriter',
    body: 'Paste your talk outline and the assistant becomes your coach: it points you to your scriptures in the New World Translation, suggests how to develop each point, what to research on jw.org, and how to open, land and close. You still build the talk — so it comes from your heart, in your own words.',
  },
  {
    ico: Compass,
    color: 'var(--purple, var(--blue))',
    title: 'More than meetings',
    body: 'Bible reading with insights, a Spiritual Gems coach, meeting notes you can look back on, a personal library, a talk-delivery checklist, and Ask — your own Bible-question assistant. Everything stays on your device, with backup and restore in Settings.',
  },
  {
    ico: ShieldCheck,
    color: 'var(--green)',
    title: 'Private, offline, always yours',
    body: 'Install it from your browser menu and it works offline like an app. Scriptures are always the New World Translation. The app is not affiliated with JW.ORG — it is a personal study tool built to serve, not to watch you.',
  },
]

export default function Onboarding({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0)
  const s = SLIDES[i]
  const last = i === SLIDES.length - 1
  return (
    <div className="onboard">
      <div className="slide" key={i}>
        <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'absolute', top: 'calc(18px + env(safe-area-inset-top))', left: 26 }}>
          <div className="brand-logo"><BookOpenCheck size={17} /></div>
          <div className="brand-name">JW Study Assistant</div>
        </div>
        <div className="illus" style={{ background: s.color }}><s.ico size={84} strokeWidth={1.4} /></div>
        <h2>{s.title}</h2>
        <p>{s.body}</p>
        <div className="dots">
          {SLIDES.map((_, j) => <span key={j} className={j === i ? 'on' : ''} />)}
        </div>
      </div>
      <div className="foot">
        {i > 0 && (
          <button className="btn ghost" onClick={() => setI(i - 1)}><ArrowLeft size={15} /> Previous</button>
        )}
        {!last && i === 0 && (
          <button className="btn ghost" onClick={onDone}>Skip</button>
        )}
        <button className="btn primary" style={{ marginLeft: 'auto', padding: '14px 26px', fontSize: 15, animation: last ? 'pulseGlow 2.2s ease-in-out infinite' : undefined }} onClick={() => (last ? onDone() : setI(i + 1))}>
          {last ? 'Get started' : 'Next'} {last ? <Sparkles size={16} /> : <ArrowRight size={16} />}
        </button>
      </div>
    </div>
  )
}
