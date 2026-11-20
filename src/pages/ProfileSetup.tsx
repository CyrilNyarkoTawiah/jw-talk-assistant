import { useState } from 'react'
import { BookOpenCheck, ArrowRight } from 'lucide-react'

/** First-install profile — full name REQUIRED, no skip (progress and counting stay under the visitor's own name). */
export default function ProfileSetup({ onDone }: { onDone: (name: string) => void }) {
  const [first, setFirst] = useState('')
  const [last, setLast] = useState('')
  const ok = first.trim().length > 0 && last.trim().length > 0
  const go = () => {
    if (!ok) return
    const n = `${first.trim()} ${last.trim()}`.slice(0, 40)
    localStorage.setItem('jwtalk_user', n)
    localStorage.setItem('jwtalk_profile_done', '1')
    onDone(n)
  }
  return (
    <div className="profile-setup">
      <div className="profile-card">
        <div className="brand-logo big"><BookOpenCheck size={30} /></div>
        <h2>Welcome! 👋</h2>
        <p className="muted">Tell us who you are so the app can greet you personally and keep everything under your name. Both names are required to continue.</p>
        <input
          className="profile-input"
          placeholder="First name…"
          value={first}
          maxLength={20}
          autoFocus
          onChange={(e) => setFirst(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && last.trim()) go() }}
        />
        <input
          className="profile-input"
          placeholder="Last name…"
          value={last}
          maxLength={20}
          style={{ marginTop: 10 }}
          onChange={(e) => setLast(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && first.trim()) go() }}
        />
        <button className="btn primary" style={{ width: '100%', marginTop: 14, padding: '13px 20px', fontSize: 15 }} onClick={go} disabled={!ok}>
          Continue <ArrowRight size={16} />
        </button>
        {!ok && <p className="muted" style={{ fontSize: 12, marginTop: 10, textAlign: 'center' }}>Enter both names to continue.</p>}
      </div>
    </div>
  )
}
