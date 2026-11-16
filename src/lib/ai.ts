/**
 * AI adapter — two modes, designed so later phases plug in without changes.
 *
 * 1. "bridge" (default, no credentials needed): builds a fully-structured prompt for the
 *    user's Hermes assistant. The user copies it into their chat; the returned draft is
 *    pasted back. Nothing leaves the app except user-copied text.
 *
 * 2. "endpoint": when the user supplies a secure backend URL (see backend/worker.js — a
 *    Cloudflare Worker template that holds the AI key), the app POSTs {system, user, options}
 *    and receives {text}. Keys live ONLY on the backend.
 */
export type AiMode = 'bridge' | 'endpoint'

export interface TalkOptions {
  durationMin: number
  tone: string
  customTone?: string
  illustrations: string
  illustrationTypes: string[]
  audience?: string
  extra?: string
}

export interface AiConfig {
  mode: AiMode
  endpointUrl: string
  apiKey: string
}

export function loadAiConfig(): AiConfig {
  try {
    return { mode: 'bridge', endpointUrl: '', apiKey: '', ...JSON.parse(localStorage.getItem('jwtalk_ai') ?? '{}') }
  } catch {
    return { mode: 'bridge', endpointUrl: '', apiKey: '' }
  }
}

export function saveAiConfig(cfg: AiConfig) {
  localStorage.setItem('jwtalk_ai', JSON.stringify(cfg))
}

export const SYSTEM_INSTRUCTIONS = `You are JW Talk Assistant, a specialised Bible study and congregation meeting preparation assistant.

Follow these instructions at all times:
1. The New World Translation of the Holy Scriptures is the required Bible translation for all Bible-based responses.
2. Base Bible explanations primarily on the NWT and the relevant official JW.ORG study material provided or verifiably available.
3. When users supply scriptures and references, give priority to those references. Explain their relevance instead of introducing unrelated scriptures.
4. Never invent a Bible verse, publication title, article, paragraph, quotation or source link.
5. Always distinguish between a direct Bible teaching, the explanation of a scripture and a suggested practical application.
6. When preparing Life and Ministry or Watchtower Study answers, respond directly to every question and every part of a question.
7. Produce natural congregation meeting comments that are clear, concise and easy to deliver orally.
8. For detailed study answers, provide scripture explanations and relevant publication references.
9. When generating public talks, strictly preserve the supplied outline's theme, main points, subpoints, scriptures and instructions.
10. Develop complete spoken explanations rather than simply expanding bullet points with repetitive sentences.
11. Use appropriate introductions, illustrations, scripture explanations, transitions, practical applications and meaningful conclusions.
12. Respect the user's requested speech duration and delivery style.
13. Never invent an actual person's experience, historical fact or published illustration. Use clearly labelled hypothetical illustrations when necessary.
14. Never use another Bible translation as a substitute for the NWT.
15. If a relevant reference cannot be verified, explicitly disclose that limitation.
16. Avoid presenting personal speculation as established Bible teaching.
17. Do not claim that the application or its AI-generated content represents official JW.ORG guidance or an official publication.
18. Include links to official source material whenever an appropriate verified link is available.

Most important: your answers must be spiritually meaningful, accurate, well-reasoned, scripture-based and useful in real congregation meeting preparation. Never prioritise a long answer over a correct and well-supported one.`

export function buildTalkPrompt(outline: string, opts: TalkOptions): string {
  const words = Math.round(opts.durationMin * 110) // speaking pace incl. readings & pauses
  let p = `Generate a complete ${opts.durationMin}-minute public talk manuscript from the outline below.\n\n`
  p += `WRITING REQUIREMENTS:\n`
  p += `- Strictly preserve the outline's theme, main points, subpoints, scriptures, instructions and their order. Cover every major point; leave nothing out.\n`
  p += `- Produce a complete manuscript (opening sentence to final sentence), not bullet points.\n`
  p += `- Target about ${words} spoken words total (~${opts.durationMin} minutes including scripture readings and pauses). Include an estimated time allocation beside each section heading.\n`
  p += `- Introduction: engaging, connects to the theme, no "Today we are going to talk about".\n`
  p += `- Body: for each point — central thought, explanation, the NWT scripture marked [READ BOOK C:V], its context, how it supports the point, practical significance, and a natural transition.\n`
  p += `- Conclusion: gathers the lessons, restates the theme, ends memorably. No new major teachings.\n`
  p += `- Tone: ${opts.tone}${opts.customTone ? ` — ${opts.customTone}` : ''}.\n`
  p += `- Illustrations: ${opts.illustrations}${opts.illustrationTypes.length ? ` (types: ${opts.illustrationTypes.join(', ')})` : ''}. Mark clearly hypothetical illustrations as such. Never present an invented story as a verified event.\n`
  p += `- Speaker directions in brackets, e.g. [PAUSE], [EMPHASISE THIS THOUGHT], [ALLOW THE AUDIENCE TO REFLECT] — visually distinct from spoken text.\n`
  if (opts.audience) p += `- Audience: ${opts.audience}.\n`
  if (opts.extra) p += `- Additional instructions: ${opts.extra}\n`
  p += `\nOUTLINE:\n${outline}\n\nOutput the full manuscript with section headings, estimated times, bracketed speaker directions, and NWT scriptures marked for reading.`
  return p
}

export function buildStudyPrompt(questions: string, material: string, style: string): string {
  let p = `Prepare congregation meeting answers for the questions below.\n\n`
  p += `RULES: Answer EVERY question and every part of each question, in order. Use the NWT only. Quote scripture verbatim when it is the direct evidence; if the supplied material cites a supporting scripture, use it and explain its relevance. Never invent publication titles, paragraph numbers or quotations. Distinguish: direct answer / scripture evidence / explanation from the material / practical application.\n`
  p += `Answer style requested: ${style}.\n`
  if (material.trim()) p += `\nSUPPLIED STUDY MATERIAL (treat as the authoritative basis):\n${material}\n`
  p += `\nQUESTIONS:\n${questions}\n`
  p += `\nFor each question output: Question → Direct answer → Supporting Scriptures (NWT) → Explanation → Practical application → A natural 20-40 second meeting comment.`
  return p
}

export function buildGemsPrompt(verse: string, question: string): string {
  let p = `Help me prepare a "Digging for Spiritual Gems" comment.\n\n`
  p += `RULES: Use the NWT only. Explain the verse in its context; identify what it teaches about Jehovah, about Christian conduct, and a practical application. Prepare a short comment (20-40 seconds) suitable for the midweek meeting. Never invent publication references; if none are supplied, say what is unverified.\n\n`
  if (verse.trim()) p += `BIBLE PASSAGE: ${verse}\n`
  if (question.trim()) p += `MY QUESTION: ${question}\n`
  return p
}

/** Send to the AI. Returns the assistant text, or null when in bridge mode. */
export async function askAi(system: string, user: string): Promise<string | null> {
  const cfg = loadAiConfig()
  if (cfg.mode === 'endpoint' && cfg.endpointUrl) {
    const res = await fetch(cfg.endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {}),
      },
      body: JSON.stringify({ system, user }),
    })
    if (!res.ok) throw new Error(`AI backend error ${res.status}`)
    const j = await res.json()
    return j.text ?? ''
  }
  return null // bridge mode: caller shows the copy-prompt flow
}
