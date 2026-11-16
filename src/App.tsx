import { createContext, useContext, useEffect, useState } from 'react'
import { HashRouter, Routes, Route, NavLink, Link } from 'react-router-dom'
import {
  Home as HomeIcon, BookOpen, Landmark, Search, Mic2, CalendarDays,
  FolderOpen, Settings as SettingsIcon, Moon, Sun, ExternalLink, Menu, X, Flame,
  Sparkles, Compass, Library as LibraryIcon, ChevronRight,
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

/* ---------- theme ---------- */
const ThemeContext = createContext<{ theme: string; toggle: () => void }>({ theme: 'light', toggle: () => {} })
export const useTheme = () => useContext(ThemeContext)

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('jwtalk_theme') ?? 'light')
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('jwtalk_theme', theme)
    const meta = document.querySelector('meta[name="theme-color"]')
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#13161e' : '#f7f3ea')
  }, [theme])
  const toggle = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'))
  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>
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

function Brand({ compact }: { compact?: boolean }) {
  return (
    <div className="brand">
      <div className="brand-logo"><Flame size={compact ? 17 : 20} /></div>
      <div>
        <div className="brand-name">JW Talk Assistant</div>
        <div className="brand-sub">Meeting & talk preparation</div>
      </div>
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
  const { theme, toggle } = useTheme()
  const [moreOpen, setMoreOpen] = useState(false)
  const bottomItems = NAV.filter((n) => n.primary)
  return (
    <div className="shell">
      {/* desktop sidebar */}
      <aside className="sidebar">
        <Brand />
        {NAV.filter((n) => n.desktop).map((n) => (
          <NavLink key={n.to} to={n.to} end={n.to === '/'} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <n.icon size={17} /> {n.label}
          </NavLink>
        ))}
        <div className="foot">Personal study tool · not affiliated with JW.ORG</div>
      </aside>

      {/* mobile top bar */}
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', minWidth: 0 }}>
        <header className="topbar">
          <Brand compact />
          <div style={{ flex: 1 }} />
          <button className="btn ghost" style={{ padding: '8px 10px' }} onClick={toggle} aria-label="Toggle theme">
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

      {/* mobile bottom tab bar */}
      <nav className="bottom-nav">
        {bottomItems.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.to === '/'} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <n.icon size={20} />
            <span>{n.short}</span>
          </NavLink>
        ))}
        <button className="nav-item" style={{ flex: 1, flexDirection: 'column', gap: 3, alignItems: 'center', padding: '8px 2px 7px', borderRadius: 17, fontSize: 9.5, fontWeight: 700, color: 'var(--muted)', background: 'transparent', border: 'none', fontFamily: 'inherit' }} onClick={() => setMoreOpen(true)}>
          <Menu size={20} />
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
