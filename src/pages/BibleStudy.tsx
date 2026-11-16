import { useState } from 'react'
import { JW_LINKS } from '../lib/app'
import { BookOpen, ExternalLink } from 'lucide-react'

const BOOKS = [
  ['Genesis', 1], ['Exodus', 2], ['Leviticus', 3], ['Numbers', 4], ['Deuteronomy', 5],
  ['Joshua', 6], ['Judges', 7], ['Ruth', 8], ['1 Samuel', 9], ['2 Samuel', 10],
  ['1 Kings', 11], ['2 Kings', 12], ['1 Chronicles', 13], ['2 Chronicles', 14],
  ['Ezra', 15], ['Nehemiah', 16], ['Esther', 17], ['Job', 18], ['Psalms', 19],
  ['Proverbs', 20], ['Ecclesiastes', 21], ['Song of Solomon', 22], ['Isaiah', 23],
  ['Jeremiah', 24], ['Lamentations', 25], ['Ezekiel', 26], ['Daniel', 27], ['Hosea', 28],
  ['Joel', 29], ['Amos', 30], ['Obadiah', 31], ['Jonah', 32], ['Micah', 33], ['Nahum', 34],
  ['Habakkuk', 35], ['Zephaniah', 36], ['Haggai', 37], ['Zechariah', 38], ['Malachi', 39],
  ['Matthew', 40], ['Mark', 41], ['Luke', 42], ['John', 43], ['Acts', 44], ['Romans', 45],
  ['1 Corinthians', 46], ['2 Corinthians', 47], ['Galatians', 48], ['Ephesians', 49],
  ['Philippians', 50], ['Colossians', 51], ['1 Thessalonians', 52], ['2 Thessalonians', 53],
  ['1 Timothy', 54], ['2 Timothy', 55], ['Titus', 56], ['Philemon', 57], ['Hebrews', 58],
  ['James', 59], ['1 Peter', 60], ['2 Peter', 61], ['1 John', 62], ['2 John', 63],
  ['3 John', 64], ['Jude', 65], ['Revelation', 66],
] as const

/** Parse a reference like "John 6:44" or "Ps 139:13-16" into a WOL chapter URL. */
export function refToWolUrl(ref: string): string | null {
  const m = ref.trim().match(/^([1-3]?\s?[A-Za-z][A-Za-z .]*?)\s*(\d{1,3})(?:\s*[:.,]\s*(\d{1,3}))?$/)
  if (!m) return null
  const norm = m[1].replace(/[\s.]/g, '').toLowerCase()
  const ABBREV: Record<string, string> = {
    ge: 'Genesis', ex: 'Exodus', le: 'Leviticus', nu: 'Numbers', de: 'Deuteronomy',
    ps: 'Psalms', psa: 'Psalms', pr: 'Proverbs', isa: 'Isaiah', jer: 'Jeremiah',
    eze: 'Ezekiel', mt: 'Matthew', mr: 'Mark', lu: 'Luke', joh: 'John', jn: 'John',
    ac: 'Acts', ro: 'Romans', '1co': '1 Corinthians', '2co': '2 Corinthians', ga: 'Galatians',
    eph: 'Ephesians', php: 'Philippians', col: 'Colossians', '1th': '1 Thessalonians',
    '2th': '2 Thessalonians', '1ti': '1 Timothy', '2ti': '2 Timothy', tit: 'Titus',
    heb: 'Hebrews', jas: 'James', '1pe': '1 Peter', '2pe': '2 Peter', '1jo': '1 John',
    '2jo': '2 John', '3jo': '3 John', re: 'Revelation', rev: 'Revelation',
  }
  const name = ABBREV[norm] ?? BOOKS.find(([b]) => b.toLowerCase().replace(/[\s.]/g, '') === norm)?.[0]
  if (!name) return null
  const [book, bookNum] = BOOKS.find(([b]) => b === name)!
  const verse = m[3] ? `#study=${m[3]}` : ''
  return `https://wol.jw.org/en/wol/b/r1/lp-e/nwt/${bookNum}/${m[2]}${verse}`
}

export default function BibleStudy() {
  const [ref, setRef] = useState('')
  const [theme, setTheme] = useState('')
  const url = refToWolUrl(ref)

  return (
    <div>
      <h1 style={{ fontSize: 24 }}>Bible Study — NWT</h1>
      <p className="muted" style={{ marginTop: 4 }}>
        The New World Translation is the app's only Bible translation. Open any chapter on the
        official page, or send a reference question to the research assistant.
      </p>

      <div className="card" style={{ marginTop: 16 }}>
        <span className="tag">Open a scripture</span>
        <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
          <input type="text" style={{ flex: 1, minWidth: 220 }} placeholder="e.g. John 6:44 or Deuteronomy 30:19"
            value={ref} onChange={(e) => setRef(e.target.value)} />
          <a className="btn" href={url ?? JW_LINKS.nwtBible} target="_blank" rel="noreferrer" style={{ pointerEvents: url ? 'auto' : 'none', opacity: url ? 1 : 0.55 }}>
            <BookOpen size={15} /> Open in NWT
          </a>
        </div>
        {ref && !url && <p className="muted" style={{ marginTop: 8 }}>Type a reference like “James 2:17”.</p>}
      </div>

      <div className="card grey" style={{ marginTop: 16 }}>
        <span className="tag">Thematic research</span>
        <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>
          Questions like “What does the Bible teach about forgiveness?” or “How does Jehovah show mercy?”
          are handled by the Talk Assistant's research prompt — send your question with the word
          RESEARCH and Hermes returns NWT scriptures with explanations and official links.
        </p>
        <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
          <input type="text" style={{ flex: 1, minWidth: 220 }} placeholder="Your Bible question…"
            value={theme} onChange={(e) => setTheme(e.target.value)} />
          <a className="btn gold" href={JW_LINKS.studyBible} target="_blank" rel="noreferrer">
            <ExternalLink size={15} /> Study Bible
          </a>
        </div>
        {theme.trim() && (
          <button className="btn" style={{ marginTop: 10 }} onClick={async () => {
            await navigator.clipboard.writeText(
              `RESEARCH QUESTION: ${theme}\n\nUse the New World Translation only. Identify the relevant NWT scriptures, quote them verbatim, explain each one's relevance, and provide official JW.ORG source links where they can be verified. Distinguish direct Bible teaching from suggested application. Do not invent references or publication titles.`,
            )
          }}>Copy research prompt</button>
        )}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <span className="tag">All 66 books — NWT on WOL</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
          {BOOKS.map(([name, num]) => (
            <a key={name} href={`https://wol.jw.org/en/wol/b/r1/lp-e/nwt/${num}/1`} target="_blank" rel="noreferrer"
              style={{ fontSize: 12, background: 'var(--card)', color: 'var(--ink)', borderRadius: 8, padding: '4px 9px' }}>
              {name}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
