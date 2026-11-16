import { createContext, useContext, useEffect, useState } from 'react'
import { HashRouter, Routes, Route, NavLink } from 'react-router-dom'
import {
  Home as HomeIcon, BookOpen, Landmark, Search, Mic2, CalendarDays,
  FolderOpen, Settings as SettingsIcon, Moon, Sun, Menu, BookOpenCheck,
  Sparkles, Compass,
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

/* ---------- themes ---------- */
export const THEMES = [
  { id: 'light', name: 'Classic', sw: 'linear-gradient(135deg,#f7f3ea 60%,#e8a13d)' },
  { id: 'dark', name: 'Midnight', sw: 'linear-gradient(135deg,#13161e 60%,#e8a13d)' },
  { id: 'ocean', name: 'Ocean', sw: 'linear-gradient(135deg,#edf6fa 60%,#2a9db5)' },
  { id: 'forest', name: 'Forest', sw: 'linear-gradient(135deg,#f2f6ee 60%,#4c9d6f)' },
  { id: 'rose', name: 'Rose', sw: 'linear-gradient(135deg,#fbf2f5 60%,#d4577e)' },
  { id: 'sunset', name: 'Sunset', sw: 'linear-gradient(135deg,#211627 60%,#f2704a)' },
  { id: 'lavender', name: 'Lavender', sw: 'linear-gradient(135deg,#f4f1fd 60%,#7c5cd6)' },
  { id: 'mono', name: 'Mono', sw: 'linear-gradient(135deg,#f7f7f7 60%,#1b1b1b)' },
]

const ThemeContext = createContext<{ theme: string; setTheme: (t: string) => void }>({ theme: 'light', setTheme: () => {} })
export const useTheme = () => useContext(ThemeContext)

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState(() => localStorage.getItem('jwtalk_theme') ?? 'light')
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('jwtalk_theme', theme)
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) {
      const dark = ['dark', 'sunset'].includes(theme)
      meta.setAttribute('content', dark ? '#171a24' : '#f7f3ea')
    }
  }, [theme])
  const setTheme = (t: string) => setThemeState(t)
  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
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

function Shell() {
  const { theme, setTheme } = useTheme()
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
          <button className="btn ghost" style={{ justifyContent: 'flex-start', padding: '8px 12px' }} onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
            {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />} {theme === 'light' ? 'Dark mode' : 'Light mode'}
          </button>
          <div className="foot" style={{ padding: 0 }}>Personal study tool · not affiliated with JW.ORG</div>
        </div>
      </aside>

      {/* mobile top bar */}
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', minWidth: 0, position: 'relative', zIndex: 1 }}>
        <header className="topbar">
          <Brand />
          <div style={{ flex: 1 }} />
          <button className="btn ghost" style={{ padding: '8px 10px' }} onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} aria-label="Toggle theme">
            {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
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
    </div>
  )
}

/* page transition wrapper */
function Page({ children }: { children: React.ReactNode }) {
  return <div className="page-enter" key={location.pathname}>{children}</div>
}

function AppInner() {
  const [showOnboard, setShowOnboard] = useState(() => !localStorage.getItem('jwtalk_onboarded'))
  return (
    <>
      {showOnboard && <Onboarding onDone={() => { localStorage.setItem('jwtalk_onboarded', '1'); setShowOnboard(false) }} />}
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
