# JW Talk Assistant

A personal Bible study and congregation meeting preparation companion: the daily text,
this week's meetings, NWT scripture research, Watchtower and Life-and-Ministry question
preparation, and a full public-talk manuscript generator.

**Live:** https://cyrilnyarkotawiah.github.io/jw-talk-assistant/

> Personal tool — not affiliated with or endorsed by JW.ORG or Watch Tower Bible and Tract
> Society. Official material is **linked**, never copied or redistributed. The NWT is the
> app's only Bible translation.

## Current status — Phase 1 & 2 complete

| Working | Coming (later phases) |
|---|---|
| Home dashboard (daily text, weekly meeting cards, registry links) | Watchtower study article auto-detection |
| Weekly content registry (manual, no scraping) | Cloud sync (optional, authenticated) |
| Life & Ministry Q&A + Spiritual Gems prompts | Talk rehearsal mode |
| Watchtower study question preparation | Scripture verification mode |
| Talk Assistant: outline → settings → structured prompt | Section-by-section regeneration |
| Bridge mode (Hermes) + Endpoint mode (secure backend) | |
| NWT book/reference links (all 66 books) | |
| My Library, meetings checklist, notes | |
| Light/dark, responsive, print-friendly | |

## Architecture

```
User → React/TS app (GitHub Pages, static)
     → AI adapter (src/lib/ai.ts)
          ├─ bridge mode: structured prompt copied into the user's Hermes chat (no keys)
          └─ endpoint mode: POST to your own secure backend (backend/worker.js —
             Cloudflare Worker holding the provider key; deploy manually with wrangler)
     → local storage for talks, notes, checks (jwtalk_* keys)
```

- **No API keys in the frontend, ever.** The worker template is committed as documentation;
  it is not auto-deployed and holds no secrets until you add them with `wrangler secret put`.
- **No scraping.** `src/data/weekly-registry.json` is a manually maintained list of official
  links (one entry per week). The app displays links and metadata only.
- Routing uses hash routing for GitHub Pages compatibility.

## Development

```bash
npm install
npm run dev          # local dev server
npm run build        # typecheck + production build to dist/
```

Deploy is automatic on push to `main` (GitHub Actions → GitHub Pages).

## Updating the weekly registry

Edit `src/data/weekly-registry.json` — add an entry for the new week with the official WOL
URLs (workbook, study article, meetings hub), then commit. The dashboard always shows the
week containing today's date, falling back to the newest configured week.
