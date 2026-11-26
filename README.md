# JW Study Assistant

A mobile-first web app for preparing congregation meetings and understanding the material
before you sit down for them.


**What it does**

- **Life & Ministry** — the week's complete programme, every part answered, ready before the meeting
- **Watchtower Study** — all study questions for the week answered with meeting comments and NWT scriptures
- **Week switcher** — the current week and the next are open in both study pages; later weeks stay locked until the Friday before they begin, so you prepare one week at a time
- **Talk Assistant** — a talk coach, not a ghostwriter: it reads your outline, points you to every scripture you cited in the New World Translation, suggests research on jw.org and wol.jw.org, and coaches your structure, opening, conclusion and timing — you still build and deliver the talk in your own words
- **Bible Study** — NWT scripture lookup (all 66 books)
- **Meetings** — preparation checklist and personal notes
- **Research / Library / Settings** — official source links, saved items, appearance and AI backend
- **Daily text** — each day's text on the Home screen, for every prepared week

**How it works**

- Scriptures are always the New World Translation, verbatim from wol.jw.org — never paraphrased, never invented.
- Weekly studies are prepared ahead of time and ship inside the app; the switcher only unlocks the current and next week.
- Setup asks for your full name (no skip) — it keeps your progress under your name. Nothing else about you is collected: no IP, no location, no cookies.
- Updates arrive as one combined update with a single **Update** button; your saved data is never touched.
- Installable as a home-screen app (PWA), works offline. The welcome tour explains every feature.

Personal tool; not affiliated with JW.ORG or Watch Tower Bible and Tract Society.

**Weekly updates:** new prepared studies are generated and pushed each week — the site updates automatically.

## Development

```bash
npm install
npm run dev      # local dev server
npm run build    # typecheck + build
```

Deploys automatically to GitHub Pages on push to `main`.

## Backend (optional)

`backend/` holds a Cloudflare Worker (AI endpoint mode + private visitor-count endpoint).
It is deployed separately by the owner — nothing in the app requires it, and no credentials
live in this repo (see `backend/worker.js` header for setup).
