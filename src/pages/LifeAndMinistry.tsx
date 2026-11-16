import { useState } from 'react'
import { currentWeek, JW_LINKS, useLibrary } from '../lib/app'
import { buildStudyPrompt, buildGemsPrompt, askAi, loadAiConfig, SYSTEM_INSTRUCTIONS } from '../lib/ai'
import { Copy, Check, ExternalLink, Sparkles } from 'lucide-react'

const STYLES = [
  'Short comment (15-25 seconds)',
  'Standard comment (25-40 seconds)',
  'Detailed comment (40-60 seconds)',
  'Deep research answer',
  'Additional comment',
  'Practical application',
]

function AnswerBlock({ title, body }: { title: string; body: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="card" style={{ marginTop: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="tag">{title}</span>
        <button className="btn ghost" style={{ padding: '5px 10px', fontSize: 12 }} onClick={async () => {
          await navigator.clipboard.writeText(body)
          setCopied(true); setTimeout(() => setCopied(false), 2000)
        }}>{copied ? <Check size={13} /> : <Copy size={13} />}</button>
      </div>
      <p style={{ whiteSpace: 'pre-wrap', marginTop: 10, fontSize: 14 }}>{body}</p>
    </div>
  )
}

export default function LifeAndMinistry() {
  const week = currentWeek()
  const [material, setMaterial] = useState('')
  const [questions, setQuestions] = useState('')
  const [style, setStyle] = useState(STYLES[1])
  const [answers, setAnswers] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const { add } = useLibrary()

  // Gems tool
  const [gemVerse, setGemVerse] = useState('')
  const [gemQ, setGemQ] = useState('')
  const [gemOut, setGemOut] = useState<string | null>(null)
  const [gemBusy, setGemBusy] = useState(false)

  const runQna = async () => {
    if (!questions.trim()) return
    setBusy(true); setErr(''); setAnswers(null)
    const prompt = buildStudyPrompt(questions, material, style)
    try {
      const out = await askAi(SYSTEM_INSTRUCTIONS, prompt)
      if (out === null) {
        let ok = false
        try { await navigator.clipboard.writeText(prompt); ok = true } catch { /* fallback */ }
        if (ok) setAnswers('BRIDGE MODE — your prompt has been copied. Paste it into your Hermes chat, then paste the returned answers back here (or straight into My Library).')
        else setAnswers('BRIDGE MODE — clipboard was blocked. Use the Talk Assistant page, which shows the prompt for manual copying, or run the generation from your Hermes chat directly with this outline:\n\n' + prompt.slice(0, 600) + '…')
      } else {
        setAnswers(out)
        add({ title: `L&M answers — ${new Date().toLocaleDateString()}`, category: 'Life and Ministry Answers', body: out } as any)
      }
    } catch (e: any) { setErr(e.message) }
    setBusy(false)
  }

  const runGems = async () => {
    if (!gemVerse.trim() && !gemQ.trim()) return
    setGemBusy(true); setGemOut(null)
    const prompt = buildGemsPrompt(gemVerse, gemQ)
    try {
      const out = await askAi(SYSTEM_INSTRUCTIONS, prompt)
      if (out === null) {
        await navigator.clipboard.writeText(prompt)
        setGemOut('BRIDGE MODE — prompt copied. Paste into your Hermes chat; the returned comment is your spiritual-gem answer.')
      } else setGemOut(out)
    } catch (e: any) { setGemOut('Error: ' + e.message) }
    setGemBusy(false)
  }

  return (
    <div>
      <h1 style={{ fontSize: 24 }}>Life and Ministry Meeting</h1>
      <p className="muted" style={{ marginTop: 4 }}>
        {week ? <>Week of {week.weekStart} · <a href={week.lifeAndMinistry.sourceUrl} target="_blank" rel="noreferrer">{week.lifeAndMinistry.publication} <ExternalLink size={11} /></a></> : 'No week configured yet — add it in Settings.'}
      </p>

      <div className="card grey" style={{ marginTop: 16, fontSize: 13.5 }}>
        <strong>This week's programme sections</strong>
        <div style={{ display: 'grid', gap: 4, marginTop: 6, color: 'var(--muted)' }}>
          {(week?.lifeAndMinistry.sections ?? []).map((s) => <div key={s}>• {s}</div>)}
        </div>
        <a className="btn ghost" style={{ marginTop: 10 }} href={week?.meetingsHub ?? 'https://wol.jw.org/en/wol/meetings/r1/lp-e'} target="_blank" rel="noreferrer">
          <ExternalLink size={14} /> Open this week's material
        </a>
      </div>

      {/* Q&A */}
      <h2 style={{ fontSize: 18, margin: '26px 0 10px' }}>Prepare questions &amp; answers</h2>
      <div className="card">
        <p className="muted" style={{ fontSize: 12.5 }}>
          Paste the questions from this week's programme (Treasures, Gems questions, Living as Christians —
          everything you want to prepare). Add the workbook material below it if you want answers grounded
          in the exact paragraphs. The AI answers every question in order, using the NWT.
        </p>
        <textarea style={{ minHeight: 130, marginTop: 10 }}
          placeholder={'Questions, e.g.\n1. What can we learn from the example of a faithful servant of Jehovah?\n2. How does …'}
          value={questions} onChange={(e) => setQuestions(e.target.value)} />
        <textarea style={{ minHeight: 90, marginTop: 10 }}
          placeholder="Optional: paste the corresponding workbook paragraphs / cited references here for source-grounded answers"
          value={material} onChange={(e) => setMaterial(e.target.value)} />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginTop: 10 }}>
          <select style={{ width: 'auto', flex: 1 }} value={style} onChange={(e) => setStyle(e.target.value)}>
            {STYLES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <button className="btn green" onClick={runQna} disabled={busy || !questions.trim()} style={{ whiteSpace: 'nowrap' }}>
            <Sparkles size={15} /> {busy ? 'Preparing…' : 'Prepare answers'}
          </button>
        </div>
        {err && <p style={{ color: 'var(--danger)', marginTop: 8 }}>{err}</p>}
        {answers && <AnswerBlock title="Answers" body={answers} />}
      </div>

      {/* Gems */}
      <h2 style={{ fontSize: 18, margin: '26px 0 10px' }}>Digging for Spiritual Gems</h2>
      <div className="card">
        <div style={{ display: 'grid', gap: 10 }}>
          <input type="text" placeholder="Bible reading passage or verse, e.g. Jeremiah 51:7"
            value={gemVerse} onChange={(e) => setGemVerse(e.target.value)} />
          <input type="text" placeholder="Your question about the verse (optional)"
            value={gemQ} onChange={(e) => setGemQ(e.target.value)} />
          <button className="btn" onClick={runGems} disabled={gemBusy}>
            <Sparkles size={15} /> {gemBusy ? 'Digging…' : 'Prepare gem comment'}
          </button>
        </div>
        {gemOut && <AnswerBlock title="Spiritual gem" body={gemOut} />}
      </div>

      <p className="muted" style={{ marginTop: 18, fontSize: 12.5 }}>
        Bible reading: open the <a href={JW_LINKS.nwtBible} target="_blank" rel="noreferrer">NWT on JW.ORG</a> for the
        weekly chapters. Source policy: the app links to official material and works on what you supply — it never
        redistributes publications.
      </p>
    </div>
  )
}
