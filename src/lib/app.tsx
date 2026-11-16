import { useEffect, useState, createContext, useContext, ReactNode } from 'react'
import registryData from '../data/weekly-registry.json'

export interface WeekEntry {
  weekStart: string
  weekEnd: string
  language: string
  lifeAndMinistry: { publication: string; sourceUrl: string; sections: string[] }
  watchtower: { publication: string; articleTitle: string; studyDate: string; sourceUrl: string }
  meetingsHub: string
  dailyText: string
}

const registry = registryData as { version: number; note: string; weeks: WeekEntry[] }

/** Monday of the week containing the given date. */
export function weekStartOf(d: Date): string {
  const day = (d.getDay() + 6) % 7 // Monday = 0
  const monday = new Date(d)
  monday.setDate(d.getDate() - day)
  return monday.toISOString().slice(0, 10)
}

export function currentWeek(): WeekEntry | undefined {
  const ws = weekStartOf(new Date())
  return registry.weeks.find((w) => w.weekStart === ws)
    ?? registry.weeks[registry.weeks.length - 1]
}

export function isCurrent(entry: WeekEntry): boolean {
  return entry.weekStart === weekStartOf(new Date())
}

export function allWeeks(): WeekEntry[] {
  return registry.weeks
}

export const JW_LINKS = {
  dailyText: 'https://wol.jw.org/en/wol/dt/r1/lp-e',
  nwtBible: 'https://www.jw.org/en/library/bible/nwt/books/',
  studyBible: 'https://www.jw.org/en/library/bible/study-bible/books/',
  meetingWorkbook: 'https://www.jw.org/en/library/jw-meeting-workbook/',
  magazines: 'https://www.jw.org/en/library/magazines/',
  library: 'https://www.jw.org/en/library/',
  jwOrg: 'https://www.jw.org/',
}

/* ---------- theme ---------- */
const ThemeCtx = createContext<{ theme: string; toggle: () => void }>({ theme: 'light', toggle: () => {} })
export const useTheme = () => useContext(ThemeCtx)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('jwtalk_theme') ?? 'light')
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('jwtalk_theme', theme)
  }, [theme])
  const toggle = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'))
  return <ThemeCtx.Provider value={{ theme, toggle }}>{children}</ThemeCtx.Provider>
}

/* ---------- generic localStorage-backed collection ---------- */
export interface LibraryItem {
  id: string
  title: string
  category: string
  created: string
  body?: string
  outline?: string
}

export function useLibrary<T extends LibraryItem = LibraryItem>() {
  const [items, setItems] = useState<T[]>(() => {
    try { return JSON.parse(localStorage.getItem('jwtalk_library') ?? '[]') } catch { return [] }
  })
  const save = (items: T[]) => {
    setItems(items)
    localStorage.setItem('jwtalk_library', JSON.stringify(items))
  }
  const add = (item: Omit<T, 'id' | 'created'> & { id?: string }) => {
    const full = { ...item, id: item.id ?? crypto.randomUUID(), created: new Date().toISOString() } as T
    save([full, ...items])
    return full
  }
  const remove = (id: string) => save(items.filter((x) => x.id !== id))
  return { items, add, remove, save }
}
