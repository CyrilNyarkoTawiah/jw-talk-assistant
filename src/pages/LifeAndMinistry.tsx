import { useState } from 'react'
import { currentWeek, JW_LINKS, useLibrary, weekRange } from '../lib/app'
import { preparedCurrent, type PreparedLMItem } from '../lib/prepared'
import { buildStudyPrompt, buildGemsPrompt, askAi, SYSTEM_INSTRUCTIONS } from '../lib/ai'
import { Copy, Check, ExternalLink, Sparkles, Printer, Share2, CheckCircle2, CalendarDays } from 'lucide-react'

const STYLES = [
  'Short comment (15-25 seconds)',
  'Standard comment (25-40 seconds)',
  'Detailed comment (40-60 seconds)',
  'Deep research answer',
  'Additional comment',
  'Practical application',
]

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

function AnswerBody({ text }: { text: string }) {
  return (
    <p style={{ whiteSpace: 'pre-wrap', fontSize: 14, marginTop: 8 }}>
      {text.split('\n').map((line, i) => {
        const m = line.match(/^(.+?)\((Publisher|Householder)\):(\s?.*)$/)
        if (!m) return <span key={i}>{line + '\n'}</span>
        return (
          <span key={i} className={'dlg ' + (m[2] === 'Publisher' ? 'dlg-pub' : 'dlg-hh')}>
            <strong>{m[1]}({m[2]}):</strong>{m[3] + '\n'}
          </span>
        )
      })}
    </p>
  )
}

export default function LifeAndMinistry() {
  const week = currentWeek()
  const prepared = preparedCurrent()
  const { add } = useLibrary()

  // ---- extra (custom) prep, secondary tool ----
  const [material, setMaterial] = useState('')
  const [questions, setQuestions] = useState('')
  const [style, setStyle] = useState(STYLES[1])
  const [answers, setAnswers] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [gemVerse, setGemVerse] = useState('')
  const [gemQ, setGemQ] = useState('')
  const [gemOut, setGemOut] = useState<string | null>(null)
  const [gemBusy, setGemBusy] = useState(false)

  const runQna = async () => {
    if (!questions.trim()) return
    setBusy(true); setAnswers(null)
    const prompt = buildStudyPrompt(questions, material, style)
    try {
      const out = await askAi(SYSTEM_INSTRUCTIONS, prompt)
      if (out === null) {
        let ok = false
        try { await navigator.clipboard.writeText(prompt); ok = true } catch { /* fallback */ }
        setAnswers(ok
          ? 'BRIDGE MODE — prompt copied. Paste it into your Hermes chat, then paste the returned answers back here.'
          : 'BRIDGE MODE — clipboard blocked. Paste your questions into your Hermes chat directly:\n\n' + prompt.slice(0, 700) + '…')
      } else {
        setAnswers(out)
        add({ title: `L&M answers — ${new Date().toLocaleDateString()}`, category: 'Life and Ministry Answers', body: out } as any)
      }
    } catch (e: any) { setAnswers('Error: ' + e.message) }
    setBusy(false)
  }

  const runGems = async () => {
    if (!gemVerse.trim() && !gemQ.trim()) return
    setGemBusy(true); setGemOut(null)
    const prompt = buildGemsPrompt(gemVerse, gemQ)
    try {
      const out = await askAi(SYSTEM_INSTRUCTIONS, prompt)
      if (out === null) {
        let ok = false
        try { await navigator.clipboard.writeText(prompt); ok = true } catch { /* fallback */ }
        setGemOut(ok ? 'BRIDGE MODE — prompt copied. Paste into your Hermes chat; the returned comment is your gem answer.'
          : 'BRIDGE MODE — clipboard blocked. Paste this into your Hermes chat:\n\n' + prompt)
      } else setGemOut(out)
    } catch (e: any) { setGemOut('Error: ' + e.message) }
    setGemBusy(false)
  }

  const saveAll = () => {
    if (!prepared) return
    const body = prepared.lm.items.map((it: PreparedLMItem) =>
      `${it.num}. ${it.title}\n${it.answer}\n${it.scriptures.map((s) => `${s.ref} — “${s.quote}”`).join('\n')}\n${it.cite}`).join('\n\n———\n\n')
    add({ title: `L&M week ${prepared.weekStart} — complete`, category: 'Life and Ministry Answers', body } as any)
    alert('The complete week is saved to My Library (this device).')
  }

  const kindLabel: Record<string, string> = {
    treasures: "TREASURES FROM GOD'S WORD", gems: 'SPIRITUAL GEMS', reading: 'BIBLE READING',
    apply: 'APPLY YOURSELF TO THE FIELD MINISTRY', living: 'LIVING AS CHRISTIANS',
  }

  return (
    <div>
      <div className="page-head">
        <span className="eyebrow">Midweek meeting</span>
        <h1>Life &amp; Ministry Meeting</h1>
        <div className="head-row">
          {week && <span className="week-chip"><CalendarDays size={13} /> {weekRange(week)}</span>}
          {week && (
            <a className="src-chip" href={week.lifeAndMinistry.sourceUrl} target="_blank" rel="noreferrer">
              Workbook <ExternalLink size={11} />
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
                <span className="muted" style={{ display: 'block', fontSize: 11.5 }}>Week {week ? weekRange(week) : prepared.weekStart} · every part answered below</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn ghost" style={{ flex: 1, justifyContent: 'center', padding: '9px 10px', fontSize: 12.5 }} onClick={saveAll}>Save all</button>
              <button className="btn ghost" style={{ flex: 1, justifyContent: 'center', padding: '9px 10px', fontSize: 12.5 }} onClick={() => window.print()}><Printer size={13} /> Print</button>
            </div>
          </div>

          {prepared.lm.items.map((it) => (
            <div className="card" key={it.num} style={{ marginTop: 12 }}>
              <span className="tag">{kindLabel[it.kind] ?? it.kind}</span>
              <h3 style={{ fontSize: 15.5, margin: '8px 0 2px' }}>{it.num}. {it.title} <span className="muted">({it.mins} min.)</span></h3>
              <AnswerBody text={it.answer} />
              {it.cbs && it.cbs.length > 0 && (
                <div className="cbs-guide">
                  {it.cbs.map((c) => (
                    <div className="cbs-item" key={c.label}>
                      <span className="cbs-label">{c.label}</span>
                      <p className="cbs-q">{c.q}</p>
                      <AnswerBody text={c.answer} />
                      {c.scriptures.map((s) => (
                        <p key={s.ref} className="quote">
                          <strong style={{ color: 'var(--gold-deep)' }}>{s.ref}</strong> — “{s.quote}”
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              )}
              {it.scriptures.map((s) => (
                <p key={s.ref} className="quote">
                  <strong style={{ color: 'var(--gold-deep)' }}>{s.ref}</strong> — “{s.quote}”
                </p>
              ))}
              <p className="muted" style={{ fontSize: 11.5, marginTop: 8 }}>{it.cite}</p>
              <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                <CopyBtn text={it.answer} small />
                <button className="btn ghost" style={{ padding: '3px 9px', fontSize: 11.5 }} onClick={() => share(it.answer, it.title)}><Share2 size={12} /> Share</button>
              </div>
            </div>
          ))}
        </>
      ) : (
        <div className="card grey" style={{ marginTop: 16 }}>
          <p className="muted">The prepared study for this week is not in the app yet — it is added each week at build time. Meanwhile, use the tools below.</p>
        </div>
      )}

      <details style={{ marginTop: 20 }}>
        <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: 15 }}>Prepare extra questions (AI tool)</summary>
        <div className="card" style={{ marginTop: 10 }}>
          <textarea style={{ minHeight: 110 }} placeholder="Any additional questions to prepare…"
            value={questions} onChange={(e) => setQuestions(e.target.value)} />
          <textarea style={{ minHeight: 80, marginTop: 8 }} placeholder="Optional: paste workbook material for grounding"
            value={material} onChange={(e) => setMaterial(e.target.value)} />
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
            <select style={{ width: 'auto', flex: 1 }} value={style} onChange={(e) => setStyle(e.target.value)}>
              {STYLES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <button className="btn green" onClick={runQna} disabled={busy || !questions.trim()} style={{ whiteSpace: 'nowrap' }}>
              <Sparkles size={15} /> {busy ? 'Preparing…' : 'Prepare answers'}
            </button>
          </div>
          {answers && (
            <div className="card grey" style={{ marginTop: 12 }}>
              <span className="tag">Answers</span>
              <p style={{ whiteSpace: 'pre-wrap', marginTop: 10, fontSize: 14 }}>{answers}</p>
            </div>
          )}
        </div>
        <div className="card" style={{ marginTop: 10 }}>
          <input type="text" placeholder="Gem verse, e.g. La 2:19" value={gemVerse} onChange={(e) => setGemVerse(e.target.value)} />
          <input type="text" style={{ marginTop: 8 }} placeholder="Your question (optional)" value={gemQ} onChange={(e) => setGemQ(e.target.value)} />
          <button className="btn" style={{ marginTop: 8 }} onClick={runGems} disabled={gemBusy || (!gemVerse.trim() && !gemQ.trim())}>
            <Sparkles size={15} /> {gemBusy ? 'Digging…' : 'Prepare gem comment'}
          </button>
          {gemOut && (
            <div className="card grey" style={{ marginTop: 12 }}>
              <span className="tag">Spiritual gem</span>
              <p style={{ whiteSpace: 'pre-wrap', marginTop: 10, fontSize: 14 }}>{gemOut}</p>
            </div>
          )}
        </div>
      </details>

      <p className="muted" style={{ marginTop: 18, fontSize: 12.5 }}>
        Bible reading: <a href={JW_LINKS.nwtBible} target="_blank" rel="noreferrer">NWT on JW.ORG</a>. Prepared answers use the NWT only, with the sources cited in the workbook.
      </p>
    </div>
  )
}
