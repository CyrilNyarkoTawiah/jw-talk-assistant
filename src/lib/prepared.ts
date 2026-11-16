import { currentWeek } from './app'

// Prepared weekly studies are generated at build time and stored one file per week.
// Each file matches a weekStart from weekly-registry.json.
const files = import.meta.glob('../data/prepared/*.json', { eager: true }) as Record<string, { default: Prepared }>

export interface PreparedScripture { ref: string; quote: string; use?: string }
export interface PreparedWTItem {
  num: string; q: string; paras: string; comment: string
  scriptures: PreparedScripture[]; insight?: string; apply?: string
}
export interface PreparedLMItem {
  num: string; title: string; mins: string; kind: string
  answer: string; scriptures: PreparedScripture[]; cite: string
}
export interface Prepared {
  weekStart: string
  lm: { cite: string; sourceUrl: string; items: PreparedLMItem[] }
  wt: { cite: string; sourceUrl: string; article: string; items: PreparedWTItem[]; recap: { q: string; comment: string }[] }
  daily?: { date: string; weekday: string; scripture?: string; ref?: string; comment?: string }[]
}

export function preparedFor(weekStart: string): Prepared | null {
  for (const path of Object.keys(files)) {
    const data = files[path].default
    if (data.weekStart === weekStart) return data
  }
  return null
}

export function preparedCurrent(): Prepared | null {
  const w = currentWeek()
  return w ? preparedFor(w.weekStart) : null
}
