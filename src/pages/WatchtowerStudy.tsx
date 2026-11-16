import { useState } from 'react'
import { currentWeek, useLibrary } from '../lib/app'
import { buildStudyPrompt, askAi, SYSTEM_INSTRUCTIONS } from '../lib/ai'
import { ExternalLink, Sparkles } from 'lucide-react'

const STYLES = ['Short comment (15-25 seconds)', 'Standard comment (25-40 seconds)', 'Detailed comment (40-60 seconds)', 'Deep research answer', 'Additional comment', 'Practical application']

export default function WatchtowerStudy() {
  const week = currentWeek()
  const [material, setMaterial] = useState('')
  const [questions, setQuestions] = useState('')
  const [style, setStyle] = useState(STYLES[1])
  const [answers, setAnswers] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const { add } = useLibrary()

  const run = async () => {
    if (!questions.trim()) return
    setBusy(true); setErr(''); setAnswers(null)
    const prefix = `This is WATCHTOWER STUDY preparation. For every paragraph question, answer in this order: 1) direct meeting answer, 2) supporting scriptures (NWT), 3) explanation from the paragraph and its cited references, 4) deeper insight, 5) an additional comment where useful. Never skip a question or a part of a question.\n\n`
    const prompt = prefix + buildStudyPrompt(questions, material, style)
    try {
      const out = await askAi(SYSTEM_INSTRUCTIONS, prompt)
      if (out === null) {
        let ok = false
        try { await navigator.clipboard.writeText(prompt); ok = true } catch { /* fallback */ }
        if (ok) setAnswers('BRIDGE MODE — prompt copied. Paste into your Hermes chat, then keep the returned comments here.')
        else setAnswers('BRIDGE MODE — clipboard was blocked. Copy the prompt manually: switch to the Talk Assistant page (it displays the full prompt when clipboard is unavailable), or paste your questions directly into your Hermes chat.')
      } else {
        setAnswers(out)
        add({ title: `Watchtower comments — ${new Date().toLocaleDateString()}`, category: 'Watchtower Comments', body: out } as any)
      }
    } catch (e: any) { setErr(e.message) }
    setBusy(false)
  }

  return (
    <div>
      <h1 style={{ fontSize: 24 }}>Watchtower Study</h1>
      <p className="muted" style={{ marginTop: 4 }}>
        {week ? <>Week of {week.weekStart} · <a href={week.watchtower.sourceUrl} target="_blank" rel="noreferrer">{week.watchtower.articleTitle} — study article on WOL <ExternalLink size={11} /></a></> : 'No week configured yet.'}
      </p>

      <div className="card grey" style={{ marginTop: 16, fontSize: 13.5 }}>
        <strong>How to use this module</strong>
        <p className="muted" style={{ marginTop: 6 }}>
          Open the study article on WOL, then paste the study questions (and optionally the paragraphs
          you want the answers grounded in). The AI answers every question individually with NWT
          scriptures — using the paragraph's own cited references, never invented ones.
        </p>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <textarea style={{ minHeight: 150 }}
          placeholder={'Paste the study questions, e.g.\n1. According to paragraph 4, why can we trust Jehovah?\n2. How does …'}
          value={questions} onChange={(e) => setQuestions(e.target.value)} />
        <textarea style={{ minHeight: 110, marginTop: 10 }}
          placeholder="Optional: paste the study paragraphs / cited scriptures here for source-grounded comments"
          value={material} onChange={(e) => setMaterial(e.target.value)} />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginTop: 10 }}>
          <select style={{ width: 'auto', flex: 1 }} value={style} onChange={(e) => setStyle(e.target.value)}>
            {STYLES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <button className="btn green" onClick={run} disabled={busy || !questions.trim()} style={{ whiteSpace: 'nowrap' }}>
            <Sparkles size={15} /> {busy ? 'Preparing…' : 'Prepare comments'}
          </button>
        </div>
        {err && <p style={{ color: 'var(--danger)', marginTop: 8 }}>{err}</p>}
        {answers && (
          <div className="card grey" style={{ marginTop: 14 }}>
            <span className="tag">Prepared comments</span>
            <p style={{ whiteSpace: 'pre-wrap', marginTop: 10, fontSize: 14 }}>{answers}</p>
          </div>
        )}
      </div>
    </div>
  )
}
