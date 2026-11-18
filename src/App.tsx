import { createContext, useContext, useEffect, useState } from 'react'
import { HashRouter, Routes, Route, NavLink } from 'react-router-dom'
import {
  Home as HomeIcon, BookOpen, Landmark, Search, Mic2, CalendarDays,
  FolderOpen, Settings as SettingsIcon, Moon, Sun, Menu, BookOpenCheck,
  Compass, RefreshCw, X,
} from 'lucide-react'
import Home from './pages/Home'
import LifeAndMinistry from './pages/LifeAndMinistry'
import WatchtowerStudy from './pages/WatchtowerStudy'
import BibleStudy from './pages/BibleStudy'
import TalkAssistant from './pages/TalkAssistant'
import Meetings from './pages/Meetings'
import Research from './pages/Research'
import Library from './pages/Library'
import SettingsPage from './pages/SettingsPage'
import Onboarding from './pages/Onboarding'
import ProfileSetup from './pages/ProfileSetup'
import { RELEASE_NOTES } from './release-notes'

/* bump this with every release — triggers the in-app update dialog */
export const APP_VERSION = '2.5.1'

/* ---------- themes: each family has a light and a dark mode ---------- */
export const THEMES = [
  { id: 'classic', name: 'Classic', sw: 'linear-gradient(135deg,#f7f3ea 50%,#13161e 50%)' },
  { id: 'ocean', name: 'Ocean', sw: 'linear-gradient(135deg,#edf6fa 50%,#0e2731 50%)' },
  { id: 'forest', name: 'Forest', sw: 'linear-gradient(135deg,#f2f6ee 50%,#12231a 50%)' },
  { id: 'rose', name: 'Rose', sw: 'linear-gradient(135deg,#fbf2f5 50%,#2a1520 50%)' },
  { id: 'sunset', name: 'Sunset', sw: 'linear-gradient(135deg,#fdf1ea 50%,#211627 50%)' },
  { id: 'lavender', name: 'Lavender', sw: 'linear-gradient(135deg,#f4f1fd 50%,#1b1530 50%)' },
  { id: 'mono', name: 'Mono', sw: 'linear-gradient(135deg,#f7f7f7 50%,#111111 50%)' },
]

const LEGACY: Record<string, { theme: string; mode: string }> = {
  light: { theme: 'classic', mode: 'light' },
  dark: { theme: 'classic', mode: 'dark' },
  sunset: { theme: 'sunset', mode: 'dark' },
}

const ThemeContext = createContext<{
  theme: string; mode: string;
  setTheme: (t: string) => void; setMode: (m: string) => void;
}>({ theme: 'classic', mode: 'light', setTheme: () => {}, setMode: () => {} })
export const useTheme = () => useContext(ThemeContext)

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState(() => {
    const raw = localStorage.getItem('jwtalk_theme') ?? 'classic'
    const mode = localStorage.getItem('jwtalk_mode')
    if (mode) return { theme: raw, mode }
    const legacy = LEGACY[raw]
    if (legacy) {
      localStorage.setItem('jwtalk_theme', legacy.theme)
      localStorage.setItem('jwtalk_mode', legacy.mode)
      return legacy
    }
    localStorage.setItem('jwtalk_theme', raw)
    localStorage.setItem('jwtalk_mode', 'light')
    return { theme: raw, mode: 'light' }
  })
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme)
    document.documentElement.setAttribute('data-mode', state.mode)
    localStorage.setItem('jwtalk_theme', state.theme)
    localStorage.setItem('jwtalk_mode', state.mode)
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', state.mode === 'dark' ? '#171a24' : '#f7f3ea')
  }, [state])
  const setTheme = (t: string) => setState((s) => ({ ...s, theme: t }))
  const setMode = (m: string) => setState((s) => ({ ...s, mode: m }))
  return <ThemeContext.Provider value={{ ...state, setTheme, setMode }}>{children}</ThemeContext.Provider>
}

/* ---------- navigation model ---------- */
const NAV = [
  { to: '/', label: 'Home', icon: HomeIcon, desktop: true },
  { to: '/life-and-ministry', label: 'Life & Ministry', short: 'L&M', icon: BookOpen, desktop: true, primary: true },
  { to: '/watchtower', label: 'Watchtower Study', short: 'Study', icon: Landmark, desktop: true, primary: true },
  { to: '/talk-assistant', label: 'Talk Assistant', short: 'Talk', icon: Mic2, desktop: true, primary: true },
  { to: '/bible-study', label: 'Bible Study', icon: Search, desktop: true },
  { to: '/meetings', label: 'Meetings', icon: CalendarDays, desktop: true },
  { to: '/research', label: 'Research', icon: Compass, desktop: true },
  { to: '/library', label: 'My Library', icon: FolderOpen, desktop: true, more: true },
  { to: '/settings', label: 'Settings', icon: SettingsIcon, desktop: true, more: true },
]

function Brand() {
  return (
    <div className="brand">
      <div className="brand-logo"><BookOpenCheck size={21} /></div>
      <div className="brand-name">JW Study Assistant</div>
    </div>
  )
}

function Sheet({ onClose }: { onClose: () => void }) {
  const tileColors = ['var(--lav)', 'var(--mint)', 'var(--blue)', 'var(--peach)']
  const more = NAV.filter((n) => n.more)
  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet">
        <div className="grabber" />
        <div className="sheet-title">More</div>
        <div className="grid">
          {more.map((n, i) => (
            <NavLink key={n.to} to={n.to} className="sheet-item" onClick={onClose}>
              <span className="sheet-ico" style={{ background: tileColors[i % 4] }}><n.icon size={18} /></span>
              {n.label}
            </NavLink>
          ))}
        </div>
        <button className="btn ghost" style={{ marginTop: 14, width: '100%' }} onClick={onClose}>Close</button>
      </div>
    </>
  )
}

/* ---------- launch splash ---------- */
function Splash({ onDone }: { onDone: () => void }) {
  const [out, setOut] = useState(false)
  useEffect(() => {
    const t1 = setTimeout(() => setOut(true), 2150)
    const t2 = setTimeout(onDone, 2750)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])
  return (
    <div className={'splash' + (out ? ' out' : '')}>
      <div className="splash-inner">
        <div className="brand-logo big splash-logo"><BookOpenCheck size={34} /></div>
        <div className="brand-name splash-name">JW Study Assistant</div>
        <div className="splash-tag">Your Personal Study Assistant</div>
      </div>
    </div>
  )
}

/* ---------- update dialog ---------- */
function UpdateDialog() {
  const [show, setShow] = useState(() => {
    const prev = localStorage.getItem('jwtalk_app_ver')
    return !!prev && prev !== APP_VERSION
  })
  const [notes, setNotes] = useState<string[]>(() => RELEASE_NOTES[APP_VERSION] ?? [])
  const [pendingVer, setPendingVer] = useState<string>(APP_VERSION)
  useEffect(() => {
    // network version check — catches updates even when the cached shell is stale
    fetch('version.json', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j && j.v && j.v !== APP_VERSION) {
          setShow(true)
          setPendingVer(j.v)
          setNotes(RELEASE_NOTES[j.v] ?? [])
        }
      })
      .catch(() => {})
    // service worker update detection while the app is open
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (!reg) return
        reg.addEventListener('updatefound', () => {
          const w = reg.installing
          if (!w) return
          w.addEventListener('statechange', () => {
            if (w.state === 'installed' && navigator.serviceWorker.controller) {
              setShow(true)
              setPendingVer(APP_VERSION)
              setNotes(RELEASE_NOTES[APP_VERSION] ?? [])
            }
          })
        })
      }).catch(() => {})
    }
  }, [])
  const apply = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations()
        regs.forEach((r) => r.unregister())
      }
      if ('caches' in window) {
        const ks = await caches.keys()
        ks.forEach((k) => caches.delete(k))
      }
    } catch { /* ignore */ }
    localStorage.setItem('jwtalk_app_ver', APP_VERSION)
    location.reload()
  }
  if (!show) return null
  return (
    <>
      <div className="sheet-backdrop" />
      <div className="update-dialog">
        <button className="upd-close" onClick={() => setShow(false)} aria-label="Later"><X size={15} /></button>
        <div className="brand-logo upd-ico"><RefreshCw size={20} /></div>
        <h3>Update available</h3>
        <p className="muted">Version {pendingVer} of JW Study Assistant is ready. Your saved data is kept — refreshing only loads the new app.</p>
        {notes.length > 0 && (
          <div className="upd-notes">
            <strong>What's new</strong>
            <ul>{notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
          </div>
        )}
        <button className="btn primary" style={{ width: '100%', marginTop: 14 }} onClick={apply}>Refresh now</button>
        <button className="btn ghost" style={{ width: '100%', marginTop: 8 }} onClick={() => setShow(false)}>Later</button>
      </div>
    </>
  )
}

function Shell() {
  const { mode, setMode } = useTheme()
  const [moreOpen, setMoreOpen] = useState(false)
  const bottomItems = NAV.filter((n) => n.primary)
  return (
    <div className="shell">
      <div className="bubbles" aria-hidden>
        {Array.from({ length: 7 }).map((_, i) => <span key={i} />)}
      </div>

      {/* desktop sidebar */}
      <aside className="sidebar">
        <Brand />
        {NAV.filter((n) => n.desktop).map((n) => (
          <NavLink key={n.to} to={n.to} end={n.to === '/'} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <n.icon size={17} /> {n.label}
          </NavLink>
        ))}
        <div style={{ marginTop: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button className="btn ghost" style={{ justifyContent: 'flex-start', padding: '8px 12px' }} onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}>
            {mode === 'light' ? <Moon size={15} /> : <Sun size={15} />} {mode === 'light' ? 'Dark mode' : 'Light mode'}
          </button>
          <div className="foot" style={{ padding: 0 }}>Personal study tool · not affiliated with JW.ORG</div>
        </div>
      </aside>

      {/* mobile top bar */}
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', minWidth: 0, position: 'relative', zIndex: 1 }}>
        <header className="topbar">
          <Brand />
          <div style={{ flex: 1 }} />
          <button className="btn ghost" style={{ padding: '8px 10px' }} onClick={() => setMode(mode === 'light' ? 'dark' : 'light')} aria-label="Toggle dark mode">
            {mode === 'light' ? <Moon size={17} /> : <Sun size={17} />}
          </button>
        </header>

        <main className="main">
          <Routes>
            <Route path="/" element={<Page><Home /></Page>} />
            <Route path="/life-and-ministry" element={<Page><LifeAndMinistry /></Page>} />
            <Route path="/watchtower" element={<Page><WatchtowerStudy /></Page>} />
            <Route path="/bible-study" element={<Page><BibleStudy /></Page>} />
            <Route path="/talk-assistant" element={<Page><TalkAssistant /></Page>} />
            <Route path="/meetings" element={<Page><Meetings /></Page>} />
            <Route path="/research" element={<Page><Research /></Page>} />
            <Route path="/library" element={<Page><Library /></Page>} />
            <Route path="/settings" element={<Page><SettingsPage /></Page>} />
          </Routes>
        </main>
      </div>

      {/* mobile bottom tab bar: Home, L&M, Study, Talk + More */}
      <nav className="bottom-nav">
        <NavLink to="/" end className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
          <HomeIcon size={19} /><span>Home</span>
        </NavLink>
        {bottomItems.map((n) => (
          <NavLink key={n.to} to={n.to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <n.icon size={19} />
            <span>{n.short}</span>
          </NavLink>
        ))}
        <button className="nav-item" onClick={() => setMoreOpen(true)} aria-label="More">
          <Menu size={19} />
          <span>More</span>
        </button>
      </nav>
      {moreOpen && <Sheet onClose={() => setMoreOpen(false)} />}
      <UpdateDialog />
    </div>
  )
}

/* page transition wrapper */
function Page({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-enter" key={location.pathname}>
      {children}
      <footer className="credit">Built by C.N.T</footer>
    </div>
  )
}

function AppInner() {
  const [splash, setSplash] = useState(true)
  const [profileDone, setProfileDone] = useState(() => !!localStorage.getItem('jwtalk_profile_done'))
  const [showOnboard, setShowOnboard] = useState(() => !!localStorage.getItem('jwtalk_profile_done') && !localStorage.getItem('jwtalk_onboarded'))
  return (
    <>
      {splash && <Splash onDone={() => setSplash(false)} />}
      {!profileDone && (
        <ProfileSetup onDone={() => {
          setProfileDone(true)
          setShowOnboard(!localStorage.getItem('jwtalk_onboarded'))
        }} />
      )}
      {profileDone && showOnboard && <Onboarding onDone={() => { localStorage.setItem('jwtalk_onboarded', '1'); setShowOnboard(false) }} />}
      <Shell />
    </>
  )
}

export default function App() {
  return (
    <HashRouter>
      <ThemeProvider>
        <AppInner />
      </ThemeProvider>
    </HashRouter>
  )
}
