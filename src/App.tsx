import { HashRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { ThemeProvider, useTheme } from './lib/app'
import {
  Home as HomeIcon, BookOpen, Landmark, Search, Mic2, CalendarDays, FolderOpen,
  Settings as SettingsIcon, Menu, X, Moon, Sun, ExternalLink,
} from 'lucide-react'
import { useState, ReactNode } from 'react'
import Home from './pages/Home'
import LifeAndMinistry from './pages/LifeAndMinistry'
import WatchtowerStudy from './pages/WatchtowerStudy'
import BibleStudy from './pages/BibleStudy'
import TalkAssistant from './pages/TalkAssistant'
import Meetings from './pages/Meetings'
import Research from './pages/Research'
import Library from './pages/Library'
import SettingsPage from './pages/SettingsPage'
import './styles/base.css'

const NAV = [
  { to: '/', label: 'Home', icon: HomeIcon },
  { to: '/life-and-ministry', label: 'Life and Ministry', icon: BookOpen },
  { to: '/watchtower', label: 'Watchtower Study', icon: Landmark },
  { to: '/bible-study', label: 'Bible Study', icon: Search },
  { to: '/talk-assistant', label: 'Talk Assistant', icon: Mic2 },
  { to: '/meetings', label: 'Meetings', icon: CalendarDays },
  { to: '/research', label: 'Research', icon: FolderOpen },
  { to: '/library', label: 'My Library', icon: BookOpen },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
]

function Shell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const { theme, toggle } = useTheme()
  const loc = useLocation()
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* desktop sidebar */}
      <aside className="sidebar no-print" style={{
        width: 236, flexShrink: 0, background: 'var(--navy)', color: '#e7e9f0',
        position: 'sticky', top: 0, height: '100vh', overflowY: 'auto', padding: '20px 12px',
      }}>
        <div style={{ padding: '6px 10px 18px' }}>
          <div style={{ fontWeight: 800, fontSize: 17, color: '#fff' }}>JW Talk Assistant</div>
          <div style={{ fontSize: 10.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--gold)' }}>Personal study companion</div>
        </div>
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.to === '/'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', margin: '2px 0',
              borderRadius: 10, fontSize: 13.5, fontWeight: 600,
              background: isActive ? 'var(--navy-soft)' : 'transparent', color: isActive ? '#fff' : '#c9cfdf',
            })}>
            <n.icon size={17} /> {n.label}
          </NavLink>
        ))}
        <div style={{ margin: '18px 10px 0', paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.12)' }}>
          <a href="https://www.jw.org/en/library/" target="_blank" rel="noreferrer"
             style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--gold)' }}>
            JW.ORG Library <ExternalLink size={13} />
          </a>
          <div style={{ fontSize: 10.5, color: '#8b95ad', marginTop: 10 }}>
            Personal tool. Not affiliated with or endorsed by JW.ORG or Watch Tower.
          </div>
        </div>
      </aside>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* topbar */}
        <div className="topbar no-print" style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px',
          borderBottom: '1px solid var(--line)', background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 5,
        }}>
          <button className="menu-btn" onClick={() => setOpen(true)} aria-label="Open menu" style={{
            display: 'none', background: 'none', border: 0, color: 'var(--ink)', padding: 6,
          }}><Menu size={20} /></button>
          <strong style={{ fontSize: 14, color: 'var(--navy)', flex: 1 }}>
            {NAV.find((n) => n.to === loc.pathname)?.label ?? 'Home'}
          </strong>
          <button className="btn ghost" style={{ padding: '7px 10px' }} onClick={toggle} aria-label="Toggle theme">
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </div>

        <main className="content" style={{ padding: '22px 26px 60px', maxWidth: 1060 }}>
          {children}
        </main>

        {/* mobile drawer */}
        {open && (
          <div onClick={() => setOpen(false)} style={{
            position: 'fixed', inset: 0, background: 'rgba(10,14,26,0.45)', zIndex: 40,
          }}>
            <div onClick={(e) => e.stopPropagation()} style={{
              width: 250, height: '100%', background: 'var(--navy)', padding: '18px 12px', overflowY: 'auto',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 10px 16px' }}>
                <strong style={{ color: '#fff' }}>JW Talk Assistant</strong>
                <button onClick={() => setOpen(false)} style={{ background: 'none', border: 0, color: '#fff' }}><X size={20} /></button>
              </div>
              {NAV.map((n) => (
                <NavLink key={n.to} to={n.to} end={n.to === '/'} onClick={() => setOpen(false)}
                  style={({ isActive }) => ({
                    display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', margin: '2px 0',
                    borderRadius: 10, fontSize: 14, fontWeight: 600,
                    background: isActive ? 'var(--navy-soft)' : 'transparent', color: isActive ? '#fff' : '#c9cfdf',
                  })}>
                  <n.icon size={17} /> {n.label}
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </div>
      <style>{`
        @media (max-width: 860px) {
          .sidebar { display: none; }
          .menu-btn { display: block !important; }
          main.content { padding: 16px 16px 80px !important; }
        }
      `}</style>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <HashRouter>
        <Shell>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/life-and-ministry" element={<LifeAndMinistry />} />
            <Route path="/watchtower" element={<WatchtowerStudy />} />
            <Route path="/bible-study" element={<BibleStudy />} />
            <Route path="/talk-assistant" element={<TalkAssistant />} />
            <Route path="/meetings" element={<Meetings />} />
            <Route path="/research" element={<Research />} />
            <Route path="/library" element={<Library />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </Shell>
      </HashRouter>
    </ThemeProvider>
  )
}
