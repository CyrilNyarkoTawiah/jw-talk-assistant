import { useState } from 'react'
import { JW_LINKS } from '../lib/app'
import { ExternalLink } from 'lucide-react'

const DIRECTORY = [
  ['Daily Text', 'https://wol.jw.org/en/wol/dt/r1/lp-e'],
  ['NWT Bible', JW_LINKS.nwtBible],
  ['NWT Study Bible', JW_LINKS.studyBible],
  ['Life and Ministry Meeting Workbook', JW_LINKS.meetingWorkbook],
  ['Watchtower and Awake!', JW_LINKS.magazines],
  ['Publication Library', JW_LINKS.library],
  ['Watchtower ONLINE LIBRARY', 'https://wol.jw.org/'],
  ['Official website', JW_LINKS.jwOrg],
]

export default function Research() {
  const [q, setQ] = useState('')
  const [saved, setSaved] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem('jwtalk_saved_links') ?? '[]') } catch { return [] } })
  const filtered = DIRECTORY.filter(([n]) => n.toLowerCase().includes(q.toLowerCase()))
  const toggleSave = (url: string) => {
    const next = saved.includes(url) ? saved.filter((u) => u !== url) : [url, ...saved]
    setSaved(next); localStorage.setItem('jwtalk_saved_links', JSON.stringify(next))
  }
  return (
    <div>
      <h1 style={{ fontSize: 24 }}>Research</h1>
      <p className="muted" style={{ marginTop: 4 }}>
        The official JW.ORG source directory. Links open the authoritative material — the app stores
        references, never publication content.
      </p>
      <input type="text" style={{ marginTop: 16 }} placeholder="Filter resources…" value={q} onChange={(e) => setQ(e.target.value)} />

      <div className="card" style={{ marginTop: 14 }}>
        <span className="tag">Directory</span>
        <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
          {filtered.map(([name, url]) => (
            <div key={url} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <a href={url} target="_blank" rel="noreferrer" style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>
                {name} <ExternalLink size={12} />
              </a>
              <button className="btn ghost" style={{ padding: '4px 10px', fontSize: 11.5 }} onClick={() => toggleSave(url)}>
                {saved.includes(url) ? '★ Saved' : '☆ Save'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {saved.length > 0 && (
        <div className="card grey" style={{ marginTop: 14 }}>
          <span className="tag">Saved links</span>
          <div style={{ display: 'grid', gap: 6, marginTop: 10, fontSize: 13.5 }}>
            {saved.map((u) => <a key={u} href={u} target="_blank" rel="noreferrer">{u}</a>)}
          </div>
        </div>
      )}
    </div>
  )
}
