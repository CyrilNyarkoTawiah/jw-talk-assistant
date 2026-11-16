import { useState } from 'react'
import { useLibrary } from '../lib/app'
import { buildTalkPrompt, askAi, SYSTEM_INSTRUCTIONS, loadAiConfig } from '../lib/ai'
import { Copy, Check, Mic2, Save, Printer } from 'lucide-react'

const TONES = ['Warm and emotional', 'Encouraging', 'Serious and strict', 'Conversational', 'Playful', 'Persuasive', 'Reflective', 'Teaching style', 'Deeply spiritual', 'Balanced']
const ILLUS = ['Include several illustrations', 'Include only one or two strong illustrations', 'Include illustrations where they are necessary', 'Do not include illustrations', 'Let AI decide where illustrations are most effective']
const ILLUS_TYPES = ['Everyday life experiences', 'Family and relationships', 'Nature and creation', 'Historical Bible accounts', 'Modern-day situations', 'Hypothetical scenarios', 'Comparisons and analogies', 'Simple storytelling']

export default function TalkAssistant() {
  const seed = (() => { try { return JSON.parse(localStorage.getItem('jwtalk_talk_seed') ?? '{}') } catch { return {} } })()
  const [outline, setOutline] = useState<string>(seed.outline ?? localStorage.getItem('jwtalk_home_outline') ?? '')
  const [duration, setDuration] = useState(seed.duration ?? 30)
  const [tone, setTone] = useState(seed.tone ?? 'Balanced')
  const [customTone, setCustomTone] = useState('')
  const [illus, setIllus] = useState(seed.illus ?? ILLUS[4])
  const [types, setTypes] = useState<string[]>(seed.types ?? [])
  const [audience, setAudience] = useState('')
  const [extra, setExtra] = useState('')
  const [manuscript, setManuscript] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [err, setErr] = useState('')
  const { add } = useLibrary()

  const words = (manuscript.match(/\S+/g) ?? []).length
  const mins = Math.round(words / 110)

  const [promptShown, setPromptShown] = useState<string | null>(null)

  const generate = async () => {
    if (!outline.trim()) return
    setBusy(true)
    const prompt = buildTalkPrompt(outline, { durationMin: duration, tone, customTone, illustrations: illus, illustrationTypes: types, audience, extra })
    try {
      const out = await askAi(SYSTEM_INSTRUCTIONS, prompt)
      if (out === null) {
        let copied = false
        try { await navigator.clipboard.writeText(prompt); copied = true } catch { /* fall back to manual copy */ }
        if (copied) setCopied(true)
        else setPromptShown(prompt)
        setTimeout(() => setCopied(false), 4000)
      } else {
        setManuscript(out)
      }
    } catch (e: any) {
      setErr(e.message)
    }
    setBusy(false)
  }

  const save = () => {
    add({ title: manuscript.split('\n')[0]?.replace(/^#+\s*/, '').slice(0, 60) || 'Talk draft', category: 'My Public Talks', body: manuscript, outline } as any)
    alert('Saved to My Library (on this device).')
  }

  return (
    <div>
      <h1 style={{ fontSize: 24 }}>Talk Assistant</h1>
      <p className="muted" style={{ marginTop: 4 }}>
        Outline in, complete manuscript out — your theme, your points, your scriptures, in your order.
      </p>

      <div className="card" style={{ marginTop: 16 }}>
        <span className="tag">Step 1 — the outline</span>
        <textarea style={{ minHeight: 200, marginTop: 10 }}
          placeholder="Paste your complete talk outline here, including the theme, main points, subpoints, scriptures, instructions and allocated time…"
          value={outline} onChange={(e) => setOutline(e.target.value)} />
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <span className="tag">Step 2 — delivery settings</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10, marginTop: 12 }}>
          <label style={{ fontSize: 12.5, fontWeight: 600 }}>Duration
            <select value={duration} onChange={(e) => setDuration(+e.target.value)}>
              {[5, 10, 15, 30, 45, 60].map((m) => <option key={m} value={m}>{m} minutes</option>)}
            </select>
          </label>
          <label style={{ fontSize: 12.5, fontWeight: 600 }}>Tone
            <select value={tone} onChange={(e) => setTone(e.target.value)}>
              {TONES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </label>
          <label style={{ fontSize: 12.5, fontWeight: 600 }}>Illustrations
            <select value={illus} onChange={(e) => setIllus(e.target.value)}>
              {ILLUS.map((t) => <option key={t}>{t}</option>)}
            </select>
          </label>
        </div>
        <input type="text" style={{ marginTop: 10 }} placeholder="Custom tone — e.g. “like an experienced brother, sincere, emotional in the right places”"
          value={customTone} onChange={(e) => setCustomTone(e.target.value)} />
        <input type="text" style={{ marginTop: 10 }} placeholder="Audience (optional) — e.g. weekend public meeting, mixed ages"
          value={audience} onChange={(e) => setAudience(e.target.value)} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
          {ILLUS_TYPES.map((t) => (
            <button key={t} onClick={() => setTypes((ts) => ts.includes(t) ? ts.filter((x) => x !== t) : [...ts, t])}
              style={{
                border: '1px solid var(--line)', background: types.includes(t) ? 'var(--navy)' : 'var(--surface)',
                color: types.includes(t) ? '#fff' : 'var(--ink)', borderRadius: 20, padding: '5px 12px', fontSize: 11.5, fontWeight: 600,
              }}>{t}</button>
          ))}
        </div>
        <textarea style={{ minHeight: 60, marginTop: 10 }} placeholder="Additional instructions (optional)…"
          value={extra} onChange={(e) => setExtra(e.target.value)} />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
          <button className="btn green" style={{ padding: '12px 22px', fontSize: 15 }} onClick={generate} disabled={busy || !outline.trim()}>
            <Mic2 size={16} /> {busy ? 'Generating…' : 'Generate full talk'}
          </button>
        </div>
        {copied && (
          <p style={{ marginTop: 10, fontSize: 13.5, color: 'var(--green)' }}>
            ✓ Your structured prompt is on the clipboard (bridge mode — see Settings). Paste it into your
            Hermes chat. When the manuscript comes back, paste it below.
          </p>
        )}
        {promptShown && (
          <div className="card grey" style={{ marginTop: 12 }}>
            <span className="tag">Your Hermes prompt (copy manually)</span>
            <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>Clipboard access was blocked — select all text below and copy it.</p>
            <textarea style={{ minHeight: 160, marginTop: 8, fontSize: 12 }} readOnly value={promptShown} onFocus={(e) => e.currentTarget.select()} />
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <span className="tag">Step 3 — the manuscript</span>
        <textarea style={{ minHeight: 420, marginTop: 10, lineHeight: 1.7 }}
          placeholder="The complete talk appears here — or paste the one Hermes returned."
          value={manuscript} onChange={(e) => setManuscript(e.target.value)} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
          <span className="muted">{words} words · ~{mins} min spoken (target {duration})</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button className="btn ghost" onClick={() => navigator.clipboard.writeText(manuscript)}><Copy size={14} /> Copy</button>
            <button className="btn ghost" onClick={save} disabled={!manuscript.trim()}><Save size={14} /> Save</button>
            <button className="btn ghost" onClick={() => window.print()} disabled={!manuscript.trim()}><Printer size={14} /> Print</button>
          </div>
        </div>
      </div>

      <p className="muted" style={{ marginTop: 14, fontSize: 12.5 }}>
        Bridge mode active ({loadAiConfig().mode}). The original outline is kept in this tab so you can compare
        it with the manuscript at any time. Speak it as your own — a talk is delivered from the heart, not read.
      </p>
    </div>
  )
}
