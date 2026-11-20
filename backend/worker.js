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
      return stats(url, env);
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

async function stats(url, env) {
  if (!env.DB) return new Response('Worker not configured: bind D1 as DB', { status: 500 });
  const token = env.TRACK_TOKEN ?? null;
  if (!token) return new Response('Worker not configured: set TRACK_TOKEN secret', { status: 500 });
  if (url.searchParams.get('token') !== token) return new Response('Unauthorized', { status: 401 });

  await ensureSchema(env.DB);
  const [totals, byDay, topPages, visitors] = await env.DB.batch([
    env.DB.prepare(`SELECT COUNT(*) AS n, COALESCE(SUM(visits), 0) AS v FROM visitors`),
    env.DB.prepare(`SELECT substr(ts, 1, 10) AS day, COUNT(*) AS n FROM visits
                    GROUP BY day ORDER BY day DESC LIMIT 30`),
    env.DB.prepare(`SELECT page, COUNT(*) AS n FROM visits GROUP BY page ORDER BY n DESC LIMIT 10`),
    env.DB.prepare(`SELECT id, name, first_seen, last_seen, visits FROM visitors
                    ORDER BY last_seen DESC LIMIT 100`),
  ]);
  return cors(new Response(JSON.stringify({
    generatedAt: new Date().toISOString(),
    totalVisitors: totals[0].results[0]?.n ?? 0,
    totalVisits: totals[0].results[0]?.v ?? 0,
    last30Days: byDay[0].results,
    topPages: topPages[0].results,
    visitors: visitors[0].results,
  }, null, 2), { headers: { 'Content-Type': 'application/json' } }));
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
