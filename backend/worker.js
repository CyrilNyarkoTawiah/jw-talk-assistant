/**
 * JW Talk Assistant — secure AI backend template (Cloudflare Worker).
 *
 * This is the Phase-3+ backend. Deploy ONLY when you have an AI provider account and key.
 * The key NEVER reaches the frontend: the browser talks to this worker; the worker talks
 * to the AI provider. Set these with `npx wrangler secret put`:
 *
 *   AI_API_KEY      — your provider API key (e.g. OpenAI-compatible endpoint)
 *   AI_BASE_URL     — provider base URL (default https://api.openai.com/v1)
 *   AI_MODEL        — model name (default gpt-4o-mini)
 *   ACCESS_TOKEN    — optional shared token; when set, requests must send `Authorization: Bearer <token>`
 *
 * After deploying, put the worker URL in the app: Settings → AI backend → Endpoint mode.
 *
 * NOTE: deployment is intentionally manual. Nothing in this repo auto-deploys the worker,
 * and no provider credentials are stored anywhere in this repository.
 */

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') return cors(new Response(null, { status: 204 }));
    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });

    const token = await getSecret('ACCESS_TOKEN');
    if (token) {
      const auth = request.headers.get('Authorization') || '';
      if (auth !== `Bearer ${token}`) return new Response('Unauthorized', { status: 401 });
    }

    let body;
    try { body = await request.json(); } catch { return new Response('Bad JSON', { status: 400 }); }
    const system = String(body.system ?? '').slice(0, 8000);
    const user = String(body.user ?? '').slice(0, 60000);
    if (!user) return new Response('Missing user prompt', { status: 400 });

    const base = await getSecret('AI_BASE_URL') || 'https://api.openai.com/v1';
    const key = await getSecret('AI_API_KEY');
    const model = await getSecret('AI_MODEL') || 'gpt-4o-mini';
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
  },
};

async function getSecret(name) {
  // Cloudflare Workers expose secrets as environment bindings; adjust per environment.
  try { return globalThis[name] ?? null; } catch { return null; }
}

function cors(res) {
  res.headers.set('Access-Control-Allow-Origin', '*'); // tighten to your Pages origin before production
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  return res;
}
