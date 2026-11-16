import { useState } from 'react'
import { BookOpenCheck, Mic2, Sparkles, ArrowRight } from 'lucide-react'

const SLIDES = [
  {
    ico: BookOpenCheck,
    color: 'var(--mint)',
    title: 'Your whole week, already prepared',
    body: 'Open Life & Ministry or Watchtower Study and every question for this week is answered — meeting comments, NWT scriptures, insights. No digging, no pasting.',
  },
  {
    ico: Mic2,
    color: 'var(--peach)',
    title: 'Complete talks from an outline',
    body: 'Paste a talk outline, pick the tone and length, and get a full, ready-to-deliver manuscript in clean, relatable language.',
  },
  {
    ico: Sparkles,
    color: 'var(--blue)',
    title: 'Everything in the app, nothing to set up',
    body: 'Scriptures always from the New World Translation. Daily text, research, library, all on your phone. Tap a card to begin — that’s the whole manual.',
  },
]

export default function Onboarding({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0)
  const [name, setName] = useState(() => localStorage.getItem('jwtalk_user') ?? '')
  const saveName = () => { const n = name.trim(); if (n) localStorage.setItem('jwtalk_user', n) }
  const s = SLIDES[i]
  const last = i === SLIDES.length - 1
  return (
    <div className="onboard">
      <div className="slide" key={i}>
        <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'absolute', top: 'calc(18px + env(safe-area-inset-top))', left: 26 }}>
          <div className="brand-logo"><BookOpenCheck size={17} /></div>
          <div>
            <div className="brand-name">JW Study Assistant</div>
            <div className="brand-sub">Meeting & talk preparation</div>
          </div>
        </div>
        <div className="illus" style={{ background: s.color }}><s.ico size={84} strokeWidth={1.4} /></div>
        <h2>{s.title}</h2>
        <p>{s.body}</p>
        {last && (
          <input
            className="onb-name"
            placeholder="What should I call you?"
            value={name}
            maxLength={24}
            onChange={(e) => setName(e.target.value)}
            style={{ marginTop: 16, width: '100%', padding: '12px 16px', borderRadius: 14, border: '2px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)', fontSize: 15, fontFamily: 'inherit', outline: 'none' }}
          />
        )}
        <div className="dots">
          {SLIDES.map((_, j) => <span key={j} className={j === i ? 'on' : ''} />)}
        </div>
      </div>
      <div className="foot">
        {!last && (
          <button className="btn ghost" onClick={onDone}>Skip</button>
        )}
        <button className="btn primary" style={{ marginLeft: 'auto', padding: '14px 26px', fontSize: 15, animation: last ? 'pulseGlow 2.2s ease-in-out infinite' : undefined }} onClick={() => (last ? (saveName(), onDone()) : setI(i + 1))}>
          {last ? 'Get started' : 'Next'} {last ? <Sparkles size={16} /> : <ArrowRight size={16} />}
        </button>
      </div>
    </div>
  )
}
