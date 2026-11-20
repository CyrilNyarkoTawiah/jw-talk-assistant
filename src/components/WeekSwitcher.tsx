import { useEffect, useRef, useState } from 'react'
import { CalendarDays, Check, ChevronDown, Lock } from 'lucide-react'
import { allWeeks, isWeekUnlocked, weekRange } from '../lib/app'
import { preparedFor } from '../lib/prepared'

/**
 * Selectable week pill used in the L&M and Study page headers.
 * Weeks beyond the next one stay LOCKED until the Friday before they begin.
 */
export default function WeekSwitcher({ selected, onSelect }: { selected: string; onSelect: (weekStart: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [open])
  const weeks = allWeeks()
  const cur = weeks.find((w) => w.weekStart === selected)
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="week-chip week-chip-btn" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="listbox">
        <CalendarDays size={13} /> {cur ? weekRange(cur) : selected}
        <ChevronDown size={12} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .18s' }} />
      </button>
      {open && (
        <div className="week-menu" role="listbox">
          {weeks.map((w) => {
            const unlocked = isWeekUnlocked(w.weekStart)
            const p = preparedFor(w.weekStart)
            return (
              <button
                key={w.weekStart}
                className={'week-menu-row' + (w.weekStart === selected ? ' on' : '') + (unlocked ? '' : ' locked')}
                onClick={() => { if (!unlocked) return; onSelect(w.weekStart); setOpen(false) }}
                role="option"
                aria-selected={w.weekStart === selected}
                aria-disabled={!unlocked}
                title={unlocked ? undefined : 'Unlocks on the Friday before this week begins'}
              >
                <span className="week-menu-range">{weekRange(w)}</span>
                {!unlocked ? (
                  <span className="week-menu-no"><Lock size={11} /> unlocks Friday</span>
                ) : p ? (
                  <span className="week-menu-ok"><Check size={11} /> prepared</span>
                ) : (
                  <span className="week-menu-no">not prepared</span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
