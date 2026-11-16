import { useState } from 'react'
import { currentWeek, useLibrary, weekRange } from '../lib/app'
import { preparedCurrent, type PreparedWTItem } from '../lib/prepared'
import { buildStudyPrompt, askAi, SYSTEM_INSTRUCTIONS } from '../lib/ai'
import { Copy, Check, ExternalLink, Sparkles, Printer, Share2, CheckCircle2, CalendarDays } from 'lucide-react'

const STYLES = ['Short comment (15-25 seconds)', 'Standard comment (25-40 seconds)', 'Detailed comment (40-60 seconds)', 'Deep research answer', 'Additional comment', 'Practical application']

async function share(text: string, title: string) {
  const nav: any = navigator
  if (nav.share) { try { await nav.share({ title, text }) } catch { /* user cancelled */ } }
  else { try { await navigator.clipboard.writeText(text) } catch { /* noop */ } }
}

function CopyBtn({ text, small }: { text: string; small?: boolean }) {
  const [copied, setCopied] = useState(false)
  return (
    <button className="btn ghost" style={{ padding: small ? '3px 9px' : '6px 12px', fontSize: small ? 11.5 : 12.5 }}
      onClick={async () => {
        try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800) } catch { /* noop */ }
      }}>
      {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

function WTItem({ it }: { it: PreparedWTItem }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="card" style={{ marginTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span className="tag">¶ {it.paras}</span>
        <h3 style={{ fontSize: 15, flex: 1 }}>{it.q}</h3>
      </div>
      <p style={{ whiteSpace: 'pre-wrap', fontSize: 14, marginTop: 10, background: 'var(--card)', borderRadius: 10, padding: '10px 14px' }}>{it.comment}</p>
      <p className="muted" style={{ fontSize: 11, marginTop: 4 }}>Meeting comment — read it aloud as your own words.</p>
      {it.scriptures.map((s) => (
        <p key={s.ref} className="quote">
          <strong style={{ color: 'var(--gold-deep)' }}>{s.ref}</strong> — “{s.quote}”
          {s.use && <span className="muted" style={{ display: 'block', fontSize: 12, marginTop: 2 }}>{s.use}</span>}
        </p>
      ))}
      {(it.insight || it.apply) && (
        <>
          <button className="btn ghost" style={{ marginTop: 8, fontSize: 12, padding: '5px 10px' }} onClick={() => setExpanded(!expanded)}>
            {expanded ? 'Hide insight' : 'Deeper insight & application'}
          </button>
          {expanded && (
            <div style={{ marginTop: 8 }}>
              {it.insight && <p style={{ fontSize: 13.5, marginTop: 6 }}><strong>Insight:</strong> {it.insight}</p>}
              {it.apply && <p style={{ fontSize: 13.5, marginTop: 4 }}><strong>Apply:</strong> {it.apply}</p>}
            </div>
          )}
        </>
      )}
      <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
        <CopyBtn text={it.comment} small />
        <button className="btn ghost" style={{ padding: '3px 9px', fontSize: 11.5 }} onClick={() => share(it.comment, it.q)}><Share2 size={12} /> Share</button>
      </div>
    </div>
  )
}

export default function WatchtowerStudy() {
  const week = currentWeek()
  const prepared = preparedCurrent()
  const { add } = useLibrary()

  // custom prep (secondary)
  const [material, setMaterial] = useState('')
  const [questions, setQuestions] = useState('')
  const [style, setStyle] = useState(STYLES[1])
  const [answers, setAnswers] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const run = async () => {
    if (!questions.trim()) return
    setBusy(true); setAnswers(null)
    const prefix = `This is WATCHTOWER STUDY preparation. For every paragraph question, answer in this order: 1) direct meeting answer, 2) supporting scriptures (NWT), 3) explanation from the paragraph and its cited references, 4) deeper insight, 5) an additional comment where useful. Never skip a question or a part of a question.\n\n`
    const prompt = prefix + buildStudyPrompt(questions, material, style)
    try {
      const out = await askAi(SYSTEM_INSTRUCTIONS, prompt)
      if (out === null) {
        let ok = false
        try { await navigator.clipboard.writeText(prompt); ok = true } catch { /* fallback */ }
        setAnswers(ok ? 'BRIDGE MODE — prompt copied. Paste into your Hermes chat, then keep the returned comments here.'
          : 'BRIDGE MODE — clipboard blocked. Paste your questions into your Hermes chat directly:\n\n' + prompt.slice(0, 700) + '…')
      } else {
        setAnswers(out)
        add({ title: `Watchtower comments — ${new Date().toLocaleDateString()}`, category: 'Watchtower Comments', body: out } as any)
      }
    } catch (e: any) { setAnswers('Error: ' + e.message) }
    setBusy(false)
  }

  const saveAll = () => {
    if (!prepared) return
    const body = prepared.wt.items.map((it: PreparedWTItem) =>
      `${it.num}. ${it.q}\n${it.comment}\n${it.scriptures.map((s) => `${s.ref} — "${s.quote}"`).join('\n')}`).join('\n\n———\n\n')
    add({ title: `Watchtower week ${prepared.weekStart} — complete`, category: 'Watchtower Comments', body } as any)
    alert('The complete study is saved to My Library (this device).')
  }

  const allText = prepared
    ? prepared.wt.items.map((it) => `${it.q}\n${it.comment}`).join('\n\n') + '\n\n' + prepared.wt.recap.map((r) => `${r.q}\n${r.comment}`).join('\n\n')
    : ''

  return (
    <div>
      <div className="page-head">
        <span className="eyebrow">Weekend meeting</span>
        <h1>Watchtower Study</h1>
        <div className="head-row">
          {week && <span className="week-chip"><CalendarDays size={13} /> {weekRange(week)}</span>}
          {week && (
            <a className="src-chip" href={week.watchtower.sourceUrl} target="_blank" rel="noreferrer">
              Study article <ExternalLink size={11} />
            </a>
          )}
        </div>
      </div>

      {prepared ? (
        <>
          <div className="ready-banner">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="ready-check"><CheckCircle2 size={16} /></span>
              <div>
                <strong>Everything prepared</strong>
                <span className="muted" style={{ display: 'block', fontSize: 11.5 }}>All {prepared.wt.items.length} questions answered · week {week ? weekRange(week) : prepared.weekStart}</span>
              </div>
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, margin: '10px 0 0', color: 'var(--navy)' }}>{prepared.wt.article}</p>
            <p className="muted" style={{ fontSize: 11.5, marginTop: 3 }}>{prepared.wt.cite}</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn ghost" style={{ flex: 1, justifyContent: 'center', padding: '9px 10px', fontSize: 12.5 }} onClick={saveAll}>Save all</button>
              <button className="btn ghost" style={{ flex: 1, justifyContent: 'center', padding: '9px 10px', fontSize: 12.5 }} onClick={() => { navigator.clipboard.writeText(allText).catch(() => {}) }}>Copy all</button>
              <button className="btn ghost" style={{ flex: 1, justifyContent: 'center', padding: '9px 10px', fontSize: 12.5 }} onClick={() => window.print()}><Printer size={13} /> Print</button>
            </div>
          </div>

          {prepared.wt.items.map((it) => <WTItem key={it.num} it={it} />)}

          <h2 style={{ fontSize: 17, margin: '24px 0 10px' }}>How would you answer? (recap)</h2>
          {prepared.wt.recap.map((r, i) => (
            <div className="card grey" key={i} style={{ marginTop: 10 }}>
              <p style={{ fontSize: 14 }}><strong>{r.q}</strong></p>
              <p style={{ fontSize: 13.5, marginTop: 6 }}>{r.comment}</p>
            </div>
          ))}
        </>
      ) : (
        <div className="card grey" style={{ marginTop: 16 }}>
          <p className="muted">The prepared study for this week is not in the app yet — it is added each week at build time. Meanwhile, use the tool below.</p>
        </div>
      )}

      <details style={{ marginTop: 20 }}>
        <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: 15 }}>Prepare extra questions (AI tool)</summary>
        <div className="card" style={{ marginTop: 10 }}>
          <textarea style={{ minHeight: 120 }} placeholder="Paste study questions…"
            value={questions} onChange={(e) => setQuestions(e.target.value)} />
          <textarea style={{ minHeight: 90, marginTop: 8 }} placeholder="Optional: paste the study paragraphs / cited scriptures"
            value={material} onChange={(e) => setMaterial(e.target.value)} />
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
            <select style={{ width: 'auto', flex: 1 }} value={style} onChange={(e) => setStyle(e.target.value)}>
              {STYLES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <button className="btn green" onClick={run} disabled={busy || !questions.trim()} style={{ whiteSpace: 'nowrap' }}>
              <Sparkles size={15} /> {busy ? 'Preparing…' : 'Prepare comments'}
            </button>
          </div>
          {answers && (
            <div className="card grey" style={{ marginTop: 12 }}>
              <span className="tag">Prepared comments</span>
              <p style={{ whiteSpace: 'pre-wrap', marginTop: 10, fontSize: 14 }}>{answers}</p>
            </div>
          )}
        </div>
      </details>
    </div>
  )
}
