import { useState } from 'react'
import { BookOpenCheck, ArrowRight } from 'lucide-react'

export default function ProfileSetup({ onDone }: { onDone: (name: string) => void }) {
  const [name, setName] = useState('')
  const go = () => {
    const n = name.trim()
    if (!n) return
    localStorage.setItem('jwtalk_user', n)
    localStorage.setItem('jwtalk_profile_done', '1')
    onDone(n)
  }
  return (
    <div className="profile-setup">
      <div className="profile-card">
        <div className="brand-logo big"><BookOpenCheck size={30} /></div>
        <h2>Welcome! 👋</h2>
        <p className="muted">Set up your profile so the app can greet you personally.</p>
        <input
          className="profile-input"
          placeholder="Your name…"
          value={name}
          maxLength={24}
          autoFocus
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') go() }}
        />
        <button className="btn primary" style={{ width: '100%', marginTop: 14, padding: '13px 20px', fontSize: 15 }} onClick={go} disabled={!name.trim()}>
          Continue <ArrowRight size={16} />
        </button>
        <button className="skip" onClick={() => { localStorage.setItem('jwtalk_profile_done', '1'); onDone('') }}>Skip for now</button>
      </div>
    </div>
  )
}
