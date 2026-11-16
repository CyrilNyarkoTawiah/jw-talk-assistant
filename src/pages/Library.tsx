import { useLibrary } from '../lib/app'
import { useState } from 'react'
import { Trash2, Printer } from 'lucide-react'

const CATS = ['All', 'My Public Talks', 'Life and Ministry Answers', 'Watchtower Comments']

export default function Library() {
  const { items, remove } = useLibrary()
  const [cat, setCat] = useState('All')
  const [q, setQ] = useState('')
  const filtered = items
    .filter((x) => cat === 'All' || x.category === cat)
    .filter((x) => !q || (x.title + x.category).toLowerCase().includes(q.toLowerCase()))

  return (
    <div>
      <h1 style={{ fontSize: 24 }}>My Library</h1>
      <p className="muted" style={{ marginTop: 4 }}>
        Everything you generate and save lives on this device. Cloud sync is a later phase.
      </p>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16, alignItems: 'center' }}>
        <select style={{ width: 'auto' }} value={cat} onChange={(e) => setCat(e.target.value)}>
          {CATS.map((c) => <option key={c}>{c}</option>)}
        </select>
        <input type="text" style={{ flex: 1, minWidth: 180 }} placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {filtered.length === 0 && <div className="card grey" style={{ marginTop: 16 }}>
        <p className="muted">Nothing saved yet — generate a talk or meeting answers and save them here.</p>
      </div>}

      {filtered.map((it) => (
        <div className="card" key={it.id} style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <strong style={{ fontSize: 14.5 }}>{it.title}</strong>
              <div className="muted" style={{ fontSize: 12 }}>{it.category} · {new Date(it.created).toLocaleString()}</div>
            </div>
            <button className="btn ghost" style={{ padding: '5px 10px' }} onClick={() => window.print()}><Printer size={13} /></button>
            <button className="btn ghost" style={{ padding: '5px 10px' }} onClick={() => { if (confirm('Delete this item?')) remove(it.id) }}><Trash2 size={13} /></button>
          </div>
          <p style={{ whiteSpace: 'pre-wrap', fontSize: 13.5, marginTop: 10, maxHeight: 260, overflowY: 'auto' }}>{it.body}</p>
        </div>
      ))}
    </div>
  )
}
