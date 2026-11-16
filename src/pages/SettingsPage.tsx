import { useState } from 'react'
import { allWeeks, isCurrent, type WeekEntry } from '../lib/app'
import { useTheme, THEMES } from '../App'
import { loadAiConfig, saveAiConfig } from '../lib/ai'

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const cfg = loadAiConfig()
  const [mode, setMode] = useState(cfg.mode)
  const [endpointUrl, setEndpointUrl] = useState(cfg.endpointUrl)
  const [apiKey, setApiKey] = useState(cfg.apiKey)
  const [saved, setSaved] = useState(false)
  const weeks = allWeeks()

  const commit = () => {
    saveAiConfig({ mode, endpointUrl, apiKey })
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <h1 style={{ fontSize: 24 }}>Settings</h1>

      <div className="card" style={{ marginTop: 16 }}>
        <span className="tag">Your profile</span>
        <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
          <input
            defaultValue={localStorage.getItem('jwtalk_user') ?? ''}
            maxLength={24}
            placeholder="Your name…"
            style={{ flex: 1 }}
            onChange={(e) => { const n = e.target.value.trim(); if (n) localStorage.setItem('jwtalk_user', n) }}
          />
        </div>
        <p className="muted" style={{ fontSize: 11.5, marginTop: 8 }}>Used to greet you on the home screen.</p>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <span className="tag">Appearance</span>
        <div className="themes-grid">
          {THEMES.map((t) => (
            <button key={t.id} className={'theme-card' + (theme === t.id ? ' on' : '')} onClick={() => setTheme(t.id)}>
              <span className="sw" style={{ background: t.sw }} />
              {t.name}
            </button>
          ))}
        </div>
        <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>8 themes — tap one to switch instantly.</p>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <span className="tag">AI backend</span>
        <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>
          <strong>Bridge mode</strong> needs no credentials: the app builds a structured prompt you paste
          into your Hermes assistant. <strong>Endpoint mode</strong> sends requests to your own secure
          backend (see <code>backend/worker.js</code> in the repository — a Cloudflare Worker that holds the
          AI key). Keys are stored only in this browser's local storage and only ever sent to your endpoint.
        </p>
        <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
          <select value={mode} onChange={(e) => setMode(e.target.value as any)}>
            <option value="bridge">Bridge mode — copy prompt for Hermes</option>
            <option value="endpoint">Endpoint mode — secure backend</option>
          </select>
          {mode === 'endpoint' && (
            <>
              <input type="text" placeholder="Backend URL, e.g. https://jw-assist.yourname.workers.dev"
                value={endpointUrl} onChange={(e) => setEndpointUrl(e.target.value)} />
              <input type="text" placeholder="Access token (optional — set ACCESS_TOKEN in the worker)"
                value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
            </>
          )}
          <button className="btn green" onClick={commit} style={{ justifySelf: 'start' }}>
            {saved ? 'Saved ✓' : 'Save AI settings'}
          </button>
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <span className="tag">Weekly content registry (administrator)</span>
        <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>
          The registry lives in <code>src/data/weekly-registry.json</code> in the repository. Update the
          week's official links there and redeploy — the interface never stores publication text.
        </p>
        <div style={{ display: 'grid', gap: 8, marginTop: 10, fontSize: 13.5 }}>
          {weeks.map((w: WeekEntry) => (
            <div key={w.weekStart} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <strong>{w.weekStart} → {w.weekEnd}</strong>
              {isCurrent(w) && <span className="tag">current</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: 14, borderLeft: '4px solid var(--danger)' }}>
        <span className="tag">Data</span>
        <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>
          Saved talks, notes and settings live in this browser. Clearing them cannot be undone.
        </p>
        <button className="btn" style={{ background: 'var(--danger)', marginTop: 10 }} onClick={() => {
          if (!confirm('Delete ALL saved library items, notes and settings on this device?')) return
          Object.keys(localStorage).filter((k) => k.startsWith('jwtalk_')).forEach((k) => localStorage.removeItem(k))
          alert('Cleared. Reload the page.')
        }}>Clear my data</button>
      </div>

      <p className="muted" style={{ marginTop: 18, fontSize: 12 }}>
        JW Talk Assistant is a personal study and preparation tool. It is not affiliated with or endorsed
        by JW.ORG or Watch Tower Bible and Tract Society. Official material is linked, not copied.
      </p>
    </div>
  )
}
