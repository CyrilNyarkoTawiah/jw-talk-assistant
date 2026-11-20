/**
 * JW Study Assistant — Cloudflare Worker: AI bridge + visitor tracking.
 *
 * Deploy ONLY when you have a Cloudflare account (free plan is enough).
 * Nothing in this repo auto-deploys the worker and no credentials are stored here.
 *
 * SECRETS (npx wrangler secret put):
 *   AI_API_KEY      — provider API key (endpoint AI mode only)
 *   AI_BASE_URL     — provider base URL (default https://api.openai.com/v1)
 *   AI_MODEL        — model name (default gpt-4o-mini)
 *   ACCESS_TOKEN    — optional shared token for the AI endpoint
 *   TRACK_TOKEN     — REQUIRED for /stats: a random string only you know
 *
 * D1 (npx wrangler d1 create jwtalk-stats, then put the id in wrangler.toml):
 *   tables are created lazily on first request:
 *     visitors(id TEXT PRIMARY KEY, name TEXT, first_seen TEXT, last_seen TEXT, visits INTEGER)
 *     visits(id TEXT, ts TEXT, page TEXT)
 *
 * ROUTES:
 *   POST /ai            — AI bridge (endpoint mode; body {system, user})
 *   POST /track         — visitor beacon from the app: {id, name?, page}
 *                         (anonymous random id generated in the app; no IP is stored)
 *   GET  /stats?token=… — your private summary: totals, visits/day, top pages, per-visitor rows
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return cors(new Response(null, { status: 204 }));

    if (request.method === 'POST' && url.pathname.replace(/\/$/, '') === '/track') {
      return track(request, env);
    }
    if (request.method === 'GET' && url.pathname.replace(/\/$/, '') === '/stats') {
      return stats(url, request, env);
    }

    // everything else: the AI bridge (original behaviour, POST at root or /ai)
    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
    return aiBridge(request, env);
  },
};

/* ---------- visitor tracking ---------- */

async function ensureSchema(db) {
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS visitors (
      id TEXT PRIMARY KEY, name TEXT, first_seen TEXT, last_seen TEXT, visits INTEGER DEFAULT 1)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS visits (
      id TEXT, ts TEXT, page TEXT)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_visits_ts ON visits(ts)`),
    db.prepare(`CREATE INDEX IF NOT EXISTS idx_visits_id ON visits(id)`),
  ]);
}

async function track(request, env) {
  if (!env.DB) return new Response('Worker not configured: bind D1 as DB', { status: 500 });
  let body;
  try { body = await request.json(); } catch { return new Response('Bad JSON', { status: 400 }); }
  const id = String(body.id || '').slice(0, 64);
  const name = String(body.name || '').slice(0, 40);
  const page = String(body.page || '').slice(0, 120);
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(id)) return new Response('Bad id', { status: 400 });
  const now = new Date().toISOString();

  await ensureSchema(env.DB);
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO visitors (id, name, first_seen, last_seen, visits) VALUES (?1, ?2, ?3, ?3, 1)
       ON CONFLICT(id) DO UPDATE SET last_seen=?3, visits=visits+1,
         name=CASE WHEN ?2<>'' THEN ?2 ELSE visitors.name END`
    ).bind(id, name, now),
    env.DB.prepare(`INSERT INTO visits (id, ts, page) VALUES (?1, ?2, ?3)`).bind(id, now, page),
  ]);
  return new Response(null, { status: 204 });
}

async function stats(url, request, env) {
  if (!env.DB) return new Response('Worker not configured: bind D1 as DB', { status: 500 });
  const token = env.TRACK_TOKEN ?? null;
  if (!token) return new Response('Worker not configured: set TRACK_TOKEN secret', { status: 500 });
  if (url.searchParams.get('token') !== token) return new Response('Unauthorized', { status: 401 });

  await ensureSchema(env.DB);
  const safe = async (q) => {
    try { const r = await env.DB.prepare(q).all(); return r.results ?? []; } catch { return []; }
  };
  const totalsRow = await env.DB
    .prepare(`SELECT COUNT(*) AS n, COALESCE(SUM(visits), 0) AS v FROM visitors`)
    .first().catch(() => null);
  const data = {
    generatedAt: new Date().toISOString(),
    totalVisitors: totalsRow?.n ?? 0,
    totalVisits: totalsRow?.v ?? 0,
    last30Days: await safe(`SELECT substr(ts, 1, 10) AS day, COUNT(*) AS n FROM visits
                    GROUP BY day ORDER BY day DESC LIMIT 30`),
    topPages: await safe(`SELECT page, COUNT(*) AS n FROM visits GROUP BY page ORDER BY n DESC LIMIT 10`),
    visitors: await safe(`SELECT id, name, first_seen, last_seen, visits FROM visitors
                    ORDER BY last_seen DESC LIMIT 100`),
  };

  // browsers get the dashboard; API consumers (curl) and ?fmt=json get JSON
  const accept = request?.headers?.get('accept') ?? '';
  if (url.searchParams.get('fmt') === 'json' || !accept.includes('text/html')) {
    return cors(new Response(JSON.stringify(data, null, 2), {
      headers: { 'Content-Type': 'application/json' },
    }));
  }
  return cors(new Response(dashboardHtml(data), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  }));
}

/* ---------- dashboard (private HTML view of the same data) ---------- */

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

const PAGE_NAMES = {
  '/': 'Home', '/life-and-ministry': 'Life & Ministry', '/watchtower': 'Watchtower Study',
  '/bible-study': 'Bible Study', '/talk': 'Talk Assistant', '/more': 'More',
  '/settings': 'Settings', '/meeting-notes': 'Meeting Notes', '/discover': 'What\'s New',
};

function pageLabel(p) {
  const path = String(p ?? '').replace(/\/$/, '');
  return PAGE_NAMES[path] || (path.startsWith('/') ? path.slice(1) : path) || 'Home';
}

function humanTime(iso, now) {
  const d = new Date(iso);
  if (isNaN(d)) return '—';
  const days = Math.floor((now - d) / 86400000);
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  if (days <= 0) return `Today ${time}`;
  if (days === 1) return `Yesterday ${time}`;
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function dashboardHtml(data) {
  const now = Date.now();
  const byDayAsc = [...data.last30Days].reverse();
  const maxDay = Math.max(1, ...byDayAsc.map((d) => d.n));
  const maxPage = Math.max(1, ...data.topPages.map((p) => p.n));
  const today = new Date().toISOString().slice(0, 10);
  const visitsToday = (data.last30Days.find((d) => d.day === today) ?? { n: 0 }).n;
  const returning = data.visitors.filter((v) => v.visits > 1).length;

  const dayBars = byDayAsc.length
    ? byDayAsc.map((d) => `
        <div class="col" title="${esc(d.day)}: ${d.n} visit${d.n === 1 ? '' : 's'}">
          <div class="bar" style="height:${Math.max(6, Math.round((d.n / maxDay) * 100))}%"></div>
          <span class="lbl">${esc(d.day.slice(8, 10))}/${esc(d.day.slice(5, 7))}</span>
        </div>`).join('')
    : '<p class="empty">No visits yet — counts appear as soon as someone opens the app.</p>';

  const pageRows = data.topPages.length
    ? data.topPages.map((p) => `
        <div class="prow">
          <span class="pname">${esc(pageLabel(p.page))}</span>
          <div class="pbar"><div style="width:${Math.round((p.n / maxPage) * 100)}%"></div></div>
          <span class="pn">${p.n}</span>
        </div>`).join('')
    : '<p class="empty">Nothing yet.</p>';

  const vRows = data.visitors.length
    ? data.visitors.map((v) => `
        <tr>
          <td class="vname">${v.name ? esc(v.name) : `<span class="anon">Anonymous</span>`}</td>
          <td>${esc(humanTime(v.first_seen, now))}</td>
          <td>${esc(humanTime(v.last_seen, now))}</td>
          <td class="vnum">${v.visits}</td>
        </tr>`).join('')
    : '<tr><td colspan="4" class="empty">No visitors yet.</td></tr>';

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Visiting Records — JW Study Assistant</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; margin: 0; }
  body { background: #0d1017; color: #e8e6e1; font: 15px/1.5 -apple-system, 'Segoe UI', Roboto, sans-serif;
         padding: 20px 14px 48px; max-width: 620px; margin: 0 auto; }
  h1 { font-size: 20px; letter-spacing: .3px; }
  .sub { color: #8a90a0; font-size: 12.5px; margin: 2px 0 18px; }
  .tiles { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 20px; }
  .tile { background: #161b26; border: 1px solid #232a38; border-radius: 14px; padding: 12px 10px; text-align: center; }
  .tile b { display: block; font-size: 24px; font-weight: 700; color: #e8c766; }
  .tile span { font-size: 11px; color: #8a90a0; text-transform: uppercase; letter-spacing: .5px; }
  h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #8a90a0; margin: 22px 0 10px; }
  .card { background: #161b26; border: 1px solid #232a38; border-radius: 14px; padding: 14px; }
  .chart { display: flex; align-items: flex-end; gap: 4px; height: 110px; }
  .col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; height: 100%; justify-content: flex-end; }
  .bar { width: 100%; background: linear-gradient(180deg, #e8c766, #b28e2e); border-radius: 4px 4px 2px 2px; }
  .lbl { font-size: 8.5px; color: #666d80; white-space: nowrap; }
  .prow { display: grid; grid-template-columns: 130px 1fr 34px; align-items: center; gap: 10px; padding: 7px 0; }
  .prow + .prow { border-top: 1px solid #202634; }
  .pname { font-size: 13.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .pbar { height: 8px; background: #202634; border-radius: 99px; overflow: hidden; }
  .pbar > div { height: 100%; background: #e8c766; border-radius: 99px; }
  .pn { text-align: right; color: #b9bfcf; font-size: 13px; font-variant-numeric: tabular-nums; }
  table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
  th { text-align: left; color: #8a90a0; font-size: 10.5px; text-transform: uppercase; letter-spacing: .6px;
       padding: 4px 6px; border-bottom: 1px solid #232a38; }
  td { padding: 8px 6px; border-bottom: 1px solid #1c222e; }
  .vname { font-weight: 600; }
  .anon { color: #6d7484; font-weight: 400; font-style: italic; }
  .vnum, th:last-child { text-align: right; }
  .empty { color: #6d7484; font-style: italic; padding: 8px 2px; }
  .foot { margin-top: 26px; color: #565d6d; font-size: 11.5px; text-align: center; }
</style></head><body>
<h1>Visiting Records</h1>
<p class="sub">JW Study Assistant · updated ${esc(humanTime(data.generatedAt, now))}</p>

<div class="tiles">
  <div class="tile"><b>${data.totalVisitors}</b><span>Visitors</span></div>
  <div class="tile"><b>${data.totalVisits}</b><span>Page views</span></div>
  <div class="tile"><b>${visitsToday}</b><span>Today</span></div>
  <div class="tile"><b>${returning}</b><span>Returning</span></div>
</div>

<h2>Visits — last 30 days</h2>
<div class="card"><div class="chart">${dayBars}</div></div>

<h2>Most-visited pages</h2>
<div class="card">${pageRows}</div>

<h2>Visitors</h2>
<div class="card"><table>
  <tr><th>Person</th><th>First seen</th><th>Last seen</th><th>Visits</th></tr>
  ${vRows}
</table></div>

<p class="foot">Private page — token-protected. Anonymous per-install counts; a name appears only if the visitor typed one.</p>
</body></html>`;
}

/* ---------- AI bridge (unchanged) ---------- */

async function aiBridge(request, env) {
  let body;
  try { body = await request.json(); } catch { return new Response('Bad JSON', { status: 400 }); }
  const system = String(body.system ?? '').slice(0, 8000);
  const user = String(body.user ?? '').slice(0, 60000);
  if (!user) return new Response('Missing user prompt', { status: 400 });

  const token = env.ACCESS_TOKEN ?? null;
  if (token) {
    const auth = request.headers.get('Authorization') || '';
    if (auth !== `Bearer ${token}`) return new Response('Unauthorized', { status: 401 });
  }

  const base = (env.AI_BASE_URL ?? null) || 'https://api.openai.com/v1';
  const key = env.AI_API_KEY ?? null;
  const model = (env.AI_MODEL ?? null) || 'gpt-4o-mini';
  if (!key) return new Response('Worker not configured: set AI_API_KEY secret', { status: 500 });

  const upstream = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.7,
    }),
  });

  if (!upstream.ok) return cors(new Response(`Upstream error ${upstream.status}`, { status: 502 }));
  const data = await upstream.json();
  const text = data.choices?.[0]?.message?.content ?? '';
  return cors(new Response(JSON.stringify({ text }), {
    headers: { 'Content-Type': 'application/json' },
  }));
}

function cors(res) {
  res.headers.set('Access-Control-Allow-Origin', '*'); // tighten to your Pages origin before production
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.headers.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  return res;
}
