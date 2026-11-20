import { useMemo, useState } from 'react'
import { useLibrary } from '../lib/app'
import { buildTalkGuidePrompt, askAi, SYSTEM_INSTRUCTIONS, loadAiConfig } from '../lib/ai'
import { Copy, Check, Mic2, Save, Printer, BookOpen, Search, ExternalLink } from 'lucide-react'

/* ---- scripture detection: surface every cited passage as research chips ---- */
const BOOKS: Array<[RegExp, string]> = [
  [/^Gen(?:esis)?\.?$/i, 'Genesis'], [/^Ex(?:odus)?\.?$/i, 'Exodus'], [/^Lev(?:iticus)?\.?$/i, 'Leviticus'],
  [/^Num(?:bers)?\.?$/i, 'Numbers'], [/^Deut(?:eronomy)?\.?$/i, 'Deuteronomy'], [/^Josh(ua)?\.?$/i, 'Joshua'],
  [/^Judg(?:es)?\.?$/i, 'Judges'], [/^Ruth\.?$/i, 'Ruth'], [/^1?Sam(?:uel)?\.?$/i, 'Samuel'],
  [/^1?Kings?\.?$/i, 'Kings'], [/^1?Chron(?:icles)?\.?$/i, 'Chronicles'], [/^Ezra\.?$/i, 'Ezra'],
  [/^Neh(?:emiah)?\.?$/i, 'Nehemiah'], [/^Esth(?:er)?\.?$/i, 'Esther'], [/^Job\.?$/i, 'Job'],
  [/^Ps(?:alms?)?\.?$/i, 'Psalms'], [/^Prov(?:erbs)?\.?$/i, 'Proverbs'], [/^Ecc(?:lesiastes)?\.?$/i, 'Ecclesiastes'],
  [/^Isa(?:iah)?\.?$/i, 'Isaiah'], [/^Jer(?:emiah)?\.?$/i, 'Jeremiah'], [/^Lam(?:entations)?\.?$/i, 'Lamentations'],
  [/^Ezek(?:iel)?\.?$/i, 'Ezekiel'], [/^Dan(?:iel)?\.?$/i, 'Daniel'], [/^Hos(?:ea)?\.?$/i, 'Hosea'],
  [/^Joel\.?$/i, 'Joel'], [/^Amos\.?$/i, 'Amos'], [/^Jon(?:ah)?\.?$/i, 'Jonah'], [/^Mic(?:ah)?\.?$/i, 'Micah'],
  [/^Matt(?:hew)?\.?$/i, 'Matthew'], [/^Mark\.?$/i, 'Mark'], [/^Luke\.?$/i, 'Luke'], [/^John\.?$/i, 'John'],
  [/^Acts\.?$/i, 'Acts'], [/^Rom(?:ans)?\.?$/i, 'Romans'], [/^Gal(?:atians)?\.?$/i, 'Galatians'],
  [/^Eph(?:esians)?\.?$/i, 'Ephesians'], [/^Phil(?:ippians)?\.?$/i, 'Philippians'], [/^Col(?:ossians)?\.?$/i, 'Colossians'],
  [/^Heb(?:rews)?\.?$/i, 'Hebrews'], [/^Rev(?:elation)?\.?$/i, 'Revelation'],
]
const SCR_RE = /\b(?:[1-3]\s?)?(?:Gen(?:esis)?|Ex(?:odus)?|Lev(?:iticus)?|Num(?:bers)?|Deut(?:eronomy)?|Josh(?:ua)?|Judg(?:es)?|Ruth|1?Sam(?:uel)?|1?Kings?|1?Chron(?:icles)?|Ezra|Neh(?:emiah)?|Esth(?:er)?|Job|Psalms?|Ps\.?|Prov(?:erbs)?|Ecc(?:lesiastes)?|Song(?:ofSongs)?|Isa(?:iah)?|Jer(?:emiah)?|Lam(?:entations)?|Ezek(?:iel)?|Dan(?:iel)?|Hos(?:ea)?|Joel|Amos|Jon(?:ah)?|Mic(?:ah)?|Matt(?:hew)?|Mark|Luke|John|Acts|Rom(?:ans)?|Gal(?:atians)?|Eph(?:esians)?|Phil(?:ippians)?|Col(?:ossians)?|Thess(?:alonians)?|Tim(?:othy)?|Tit(?:us)?|Philem(?:on)?|Heb(?:rews)?|James|Jas\.?|1?Pet(?:er)?|Jude|1?2?3?John(?:1)?)\.?\s+\d{1,3}(?::\d{1,3}(?:[,-]\s*\d{1,3})?)?/gi

function detectScriptures(outline: string): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const m of outline.matchAll(SCR_RE)) {
    const raw = m[0].replace(/\s+/g, ' ').trim()
    const key = raw.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    const parts = raw.split(/\s+/)
    const bookTok = parts.find((p) => BOOKS.some(([re]) => re.test(p)))
    const canon = bookTok ? (BOOKS.find(([re]) => re.test(bookTok)) as [RegExp, string])[1] : ''
    out.push(canon ? `${canon} ${parts.slice(parts.indexOf(bookTok as string) + 1).join(' ')}` : raw)
    if (out.length >= 12) break
  }
  return out
}

const BUILD_STEPS = [
  { t: 'Know your theme cold', d: 'Write the theme as ONE question your talk must answer. Every point should push the audience closer to answering it.' },
  { t: 'Give each point a job', d: 'For every main point ask: what single thought must land here? Which scripture proves it? What should my audience be able to answer after this point?' },
  { t: 'Work the scriptures — do not decorate with them', d: 'Decide what to read aloud and what to summarise. Read the verses in context before you decide; the application must come from the passage, not around it.' },
  { t: 'Open with a bridge, not a title', d: 'Choose an opening that makes the theme feel urgent today — a situation, a question, or a short account — and walk straight onto it. Never announce what you are about to talk about.' },
  { t: 'Land it once', d: 'The conclusion gathers the points, answers your theme question, and leaves ONE takeaway. Resist adding anything new.' },
  { t: 'Speak it, then time it', d: 'Practise out loud from your notes, not a manuscript. Mark where you will slow down, pause, or look up. Keep the assigned time — finishing well is part of the talk.' },
]

export default function TalkAssistant() {
  const seed = (() => { try { return JSON.parse(localStorage.getItem('jwtalk_talk_seed') ?? '{}') } catch { return {} } })()
  const [outline, setOutline] = useState<string>(seed.outline ?? localStorage.getItem('jwtalk_home_outline') ?? '')
  const [duration, setDuration] = useState(seed.duration ?? 30)
  const [audience, setAudience] = useState('')
  const [extra, setExtra] = useState('')
  const [guide, setGuide] = useState('')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const [err, setErr] = useState('')
  const { add } = useLibrary()
  const [promptShown, setPromptShown] = useState<string | null>(null)

  const scriptures = useMemo(() => detectScriptures(outline), [outline])

  const buildGuide = async () => {
    if (!outline.trim()) return
    setBusy(true)
    const prompt = buildTalkGuidePrompt(outline, { durationMin: duration, audience, extra })
    try {
      const out = await askAi(SYSTEM_INSTRUCTIONS, prompt)
      if (out === null) {
        let ok = false
        try { await navigator.clipboard.writeText(prompt); ok = true } catch { /* fall back to manual copy */ }
        if (ok) setCopied(true)
        else setPromptShown(prompt)
        setTimeout(() => setCopied(false), 5000)
      } else {
        setGuide(out)
      }
    } catch (e: any) {
      setErr(e.message)
    }
    setBusy(false)
  }

  const save = () => {
    const body = notes.trim() || guide
    add({ title: (outline.split('\n')[0] || 'Talk prep').replace(/^#+\s*/, '').slice(0, 60) || 'Talk prep', category: 'My Public Talks', body, outline } as any)
    alert('Saved to My Library (on this device).')
  }

  return (
    <div>
      <h1 style={{ fontSize: 24 }}>Talk Assistant</h1>
      <p className="muted" style={{ marginTop: 4 }}>
        A coach for your own talk — research pointers, scripture work and structure. It will not write it for you, because the best talks come from the speaker's heart.
      </p>

      <div className="card" style={{ marginTop: 16 }}>
        <span className="tag">Step 1 — your outline</span>
        <textarea style={{ minHeight: 200, marginTop: 10 }}
          placeholder="Paste your talk outline here — the theme, main points, subpoints, scriptures, instructions and the time allotted…"
          value={outline} onChange={(e) => setOutline(e.target.value)} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10, marginTop: 12 }}>
          <label style={{ fontSize: 12.5, fontWeight: 600 }}>Time allotted
            <select value={duration} onChange={(e) => setDuration(+e.target.value)}>
              {[5, 10, 15, 30, 45, 60].map((m) => <option key={m} value={m}>{m} minutes</option>)}
            </select>
          </label>
          <label style={{ fontSize: 12.5, fontWeight: 600 }}>Audience (optional)
            <input type="text" value={audience} placeholder="e.g. weekend public talk, mixed ages"
              onChange={(e) => setAudience(e.target.value)} />
          </label>
        </div>
        <input type="text" style={{ marginTop: 10 }} placeholder="Anything else the coach should know (optional)…"
          value={extra} onChange={(e) => setExtra(e.target.value)} />
        <div style={{ marginTop: 12 }}>
          <button className="btn green" style={{ padding: '12px 22px', fontSize: 15 }} onClick={buildGuide} disabled={busy || !outline.trim()}>
            <Mic2 size={16} /> {busy ? 'Preparing your guide…' : 'Build my talk guide'}
          </button>
        </div>
        {copied && (
          <p style={{ marginTop: 10, fontSize: 13.5, color: 'var(--green)' }}>
            ✓ Your coaching prompt is on the clipboard (bridge mode — see Settings). Paste it into your Hermes chat,
            then paste the coach's guide into the box below.
          </p>
        )}
        {promptShown && (
          <div className="card grey" style={{ marginTop: 12 }}>
            <span className="tag">Your coaching prompt (copy manually)</span>
            <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>Clipboard access was blocked — select all text below and copy it.</p>
            <textarea style={{ minHeight: 160, marginTop: 8, fontSize: 12 }} readOnly value={promptShown} onFocus={(e) => e.currentTarget.select()} />
          </div>
        )}
        {err && <p style={{ marginTop: 10, fontSize: 13, color: 'var(--peach)' }}>{err}</p>}
      </div>

      {scriptures.length > 0 && (
        <div className="card" style={{ marginTop: 14 }}>
          <span className="tag">Your scriptures — read them in the NWT first</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
            {scriptures.map((s) => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, fontSize: 13.5, minWidth: 130 }}>{s}</span>
                <a className="src-chip" href={`https://wol.jw.org/en/wol/s/r1/lp-e?q=${encodeURIComponent(s)}`} target="_blank" rel="noreferrer">
                  <BookOpen size={12} /> NWT on WOL <ExternalLink size={10} />
                </a>
                <a className="src-chip" href={`https://www.jw.org/en/search?q=${encodeURIComponent(s)}`} target="_blank" rel="noreferrer">
                  <Search size={12} /> jw.org articles <ExternalLink size={10} />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: 14 }}>
        <span className="tag">How seasoned speakers build a talk</span>
        <ol style={{ margin: '10px 0 0', paddingLeft: 18, display: 'grid', gap: 9 }}>
          {BUILD_STEPS.map((b) => (
            <li key={b.t} style={{ fontSize: 13.5, lineHeight: 1.55 }}>
              <strong>{b.t}.</strong> {b.d}
            </li>
          ))}
        </ol>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <span className="tag">Step 2 — your coach's guide</span>
        <textarea style={{ minHeight: 420, marginTop: 10, lineHeight: 1.65 }}
          placeholder="The guide appears here — point-by-point coaching, scripture work, research leads from jw.org, an opening to choose, and a timing plan. Or paste the guide your Hermes chat returned."
          value={guide} onChange={(e) => setGuide(e.target.value)} />
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <span className="tag">Step 3 — your own notes</span>
        <textarea style={{ minHeight: 260, marginTop: 10, lineHeight: 1.7 }}
          placeholder="Write the talk your way — key sentences, transitions, the experiences you will use. These notes are yours; the words you speak should come from here, from your heart."
          value={notes} onChange={(e) => setNotes(e.target.value)} />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
          <button className="btn ghost" onClick={() => navigator.clipboard.writeText(notes)} disabled={!notes.trim()}><Copy size={14} /> Copy notes</button>
          <button className="btn ghost" onClick={() => navigator.clipboard.writeText(guide)} disabled={!guide.trim()}><Copy size={14} /> Copy guide</button>
          <button className="btn ghost" onClick={save} disabled={!(notes.trim() || guide.trim())}><Save size={14} /> Save</button>
          <button className="btn ghost" onClick={() => window.print()} disabled={!(notes.trim() || guide.trim())}><Printer size={14} /> Print</button>
        </div>
      </div>

      <p className="muted" style={{ marginTop: 14, fontSize: 12.5 }}>
        Bridge mode active ({loadAiConfig().mode}). Scriptures open in the New World Translation on wol.jw.org —
        always check the context before you preach it. Deliver from your notes with your own words; that is what
        makes a talk seasoned.
      </p>
    </div>
  )
}
