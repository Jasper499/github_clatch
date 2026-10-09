import { DurableObject } from 'cloudflare:workers';

export class ReadingVault extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    ctx.storage.sql.exec('CREATE TABLE IF NOT EXISTS backup (id INTEGER PRIMARY KEY CHECK (id = 1), revision INTEGER NOT NULL, body TEXT NOT NULL)');
  }
  async fetch(request) {
    const row = this.ctx.storage.sql.exec('SELECT revision, body FROM backup WHERE id = 1').toArray()[0];
    if (request.method === 'GET') return row?.body ? new Response(row.body, { headers: { 'Content-Type': 'application/json', ETag: `"${row.revision}"` } }) : new Response('No backup', { status: 404, headers: { ETag: `"${row?.revision || 0}"` } });
    const text = request.method === 'DELETE' ? '' : await request.text();
    // Read again after awaiting the body: another device may have written meanwhile.
    const current = this.ctx.storage.sql.exec('SELECT revision FROM backup WHERE id = 1').toArray()[0];
    if (request.headers.get('If-Match') !== `"${current?.revision || 0}"`) return new Response('Backup changed', { status: 409 });
    if (request.method === 'DELETE') { this.ctx.storage.sql.exec('UPDATE backup SET revision = revision + 1, body = ? WHERE id = 1', ''); return new Response(null, { status: 204 }); }
    this.ctx.storage.sql.exec('INSERT INTO backup (id, revision, body) VALUES (1, ?, ?) ON CONFLICT(id) DO UPDATE SET revision = excluded.revision, body = excluded.body', (current?.revision || 0) + 1, text);
    return new Response(null, { status: 204 });
  }
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const headers = { 'Access-Control-Allow-Origin': 'https://jasper499.github.io', 'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Authorization, Content-Type, If-Match', 'Access-Control-Expose-Headers': 'ETag', 'Cache-Control': 'no-store, no-transform', Vary: 'Origin' };
    const reply = (message, status) => new Response(message, { status, headers });
    if (origin && origin !== 'https://jasper499.github.io') return reply('Origin denied', 403);
    if (new URL(request.url).pathname !== '/vault') return reply('Not found', 404);
    if (request.method === 'OPTIONS') return reply(null, 204);
    if (!['GET', 'PUT', 'DELETE'].includes(request.method)) return reply('Method not allowed', 405);
    const auth = request.headers.get('Authorization')?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
    if (!auth) return reply('Invalid sync credential', 401);
    if (!await env.REQUEST_LIMIT.limit({ key: request.headers.get('CF-Connecting-IP') || 'unknown' }).then(r => r.success)) return reply('Too many requests', 429);
    let forwarded = request;
    if (request.method === 'DELETE' && !/^"\d+"$/.test(request.headers.get('If-Match') || '')) return reply('Invalid revision', 400);
    if (request.method === 'PUT') {
      if (request.headers.get('Content-Type') !== 'application/json' || !/^"\d+"$/.test(request.headers.get('If-Match') || '')) return reply('Invalid upload headers', 400);
      const reader = request.body?.getReader();
      if (!reader) return reply('Missing backup', 400);
      const chunks = []; let size = 0;
      while (true) { const { value, done } = await reader.read(); if (done) break; size += value.length; if (size > 1024 * 1024) { await reader.cancel(); return reply('Backup exceeds 1 MB', 413); } chunks.push(value); }
      let value;
      try { value = JSON.parse(await new Blob(chunks).text()); } catch (_) { return reply('Invalid encrypted backup', 400); }
      if (!value || typeof value.iv !== 'string' || !/^[A-Za-z0-9+/]{16}$/.test(value.iv) || typeof value.cipher !== 'string' || value.cipher.length < 24 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value.cipher)) return reply('Invalid encrypted backup', 400);
      forwarded = new Request(request.url, { method: 'PUT', headers: request.headers, body: JSON.stringify({ iv: value.iv, cipher: value.cipher }) });
    }
    const id = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(auth))), x => x.toString(16).padStart(2, '0')).join('');
    const response = await env.VAULTS.getByName(id).fetch(forwarded);
    return new Response(response.body, { status: response.status, headers: { ...headers, ...(response.headers.get('ETag') ? { ETag: response.headers.get('ETag') } : {}), 'Content-Type': 'application/json' } });
  },
};
