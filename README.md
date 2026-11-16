# JW Study Assistant

A mobile-first web app for preparing congregation meetings and public talks.

**Live:** https://cyrilnyarkotawiah.github.io/jw-talk-assistant/

**What it does**

- **Life & Ministry** — the week's complete programme, every part answered, ready before the meeting
- **Watchtower Study** — all study questions for the week answered with meeting comments and NWT scriptures
- **Talk Assistant** — paste a talk outline, get a complete ready-to-deliver manuscript
- **Bible Study** — NWT scripture lookup (all 66 books)
- **Meetings** — preparation checklist and personal notes
- **Research / Library / Settings** — official source links, saved items, appearance and AI backend

Scriptures are always the New World Translation from wol.jw.org. Weekly studies are prepared at
build time and ship inside the app — no scraping, no publication text stored, only official links.
Installable as a home-screen app (PWA), works offline. Personal tool; not affiliated with JW.ORG
or Watch Tower Bible and Tract Society.

**Weekly updates:** new prepared studies are generated and pushed each week — the site updates automatically.

## Development

```bash
npm install
npm run dev      # local dev server
npm run build    # typecheck + build
```

Deploys automatically to GitHub Pages on push to `main`.
