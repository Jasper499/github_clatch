// Run: node scripts/check_workspace.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
global.UpdateSchedule = require('../js/update-schedule.js');
const tools = require('../js/workspace.js');

(async () => {
  const now = new Date('2026-10-09T14:30:00Z');
  assert.equal(tools.workspaceHealth('2026-10-09T13:00:00Z', 'hackernews', now).level, 'warn');
  assert.equal(tools.workspaceHealth('2026-10-09T13:00:00Z', 'hackernews', new Date('2026-10-09T16:00:00Z')).level, 'bad');
  assert.equal(tools.workspaceHealth('2026-10-05T02:00:00Z', 'github', now).level, 'ok');
  assert.equal(tools.workspaceHealth('2026-10-01T02:01:00Z', 'journals', now).next, '2026-10-15T02:00:00.000Z');
  assert.equal(tools.workspaceHealth('2026-11-01T02:01:00Z', 'journals', now).level, 'bad');
  const old = { url: 'https://example.org/a', title: 'MRI', description: 'old' }, changed = { ...old, description: 'new' };
  const delta = tools.workspaceChanges([changed, { url: 'b', title: 'B' }], { [old.url]: tools.workspaceItemVersion(old) }, item => item.url);
  assert.equal(delta.added.length, 1); assert.equal(delta.changed.length, 1);
  assert.equal(tools.workspaceChanges([old], null, item => item.url).added.length, 0);
  const backup = { format: 'hjl-reading-backup', version: 1, values: { 'hjl-theme': 'dark', 'hjl-saved-items-v1': JSON.stringify({ 'u:https://example.org': { saved: true } }) } };
  assert.deepEqual(tools.validateWorkspaceBackup(backup), backup.values);
  for (const values of [{ 'evil-key': 'x' }, { 'hjl-theme': 'invalid' }, { 'hjl-seen-v1': '{"github":1}' }, { 'hjl-follow-v1': '{"bad":true}' }, { 'hjl-saved-items-v1': '{"__proto__":{}}' }]) assert.throws(() => tools.validateWorkspaceBackup({ ...backup, values }));
  const data = new Map([['hjl-theme', 'light']]); let failed = false;
  const storage = { getItem: key => data.get(key) ?? null, removeItem: key => data.delete(key), setItem(key, value) { if (key === 'hjl-saved-items-v1' && !failed) { failed = true; throw Error('quota'); } data.set(key, value); } };
  assert.throws(() => tools.applyWorkspaceBackup(backup, storage)); assert.equal(data.get('hjl-theme'), 'light'); assert.equal(data.has('hjl-saved-items-v1'), false);
  const code = 'a'.repeat(64), material = await tools.workspaceSyncCrypto(code);
  assert.notEqual(material.auth, code);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, material.key, new TextEncoder().encode(JSON.stringify(backup)));
  assert.deepEqual(JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, material.key, encrypted))), backup);
  const wrong = await tools.workspaceSyncCrypto('b'.repeat(64));
  await assert.rejects(crypto.subtle.decrypt({ name: 'AES-GCM', iv }, wrong.key, encrypted));
  let source = fs.readFileSync(require('node:path').join(__dirname, '../workers/reading-sync.js'), 'utf8').replace(/^import .*;\n/, '').replace('export class ReadingVault', 'class ReadingVault').replace('export default', 'const handler =');
  const ctx = { Response, Request, Headers, URL, Blob, Uint8Array, TextEncoder, crypto, DurableObject: class {}, console };
  vm.createContext(ctx); vm.runInContext(source + '\nglobalThis.handler = handler;', ctx);
  const env = { REQUEST_LIMIT: { limit: async () => ({ success: true }) }, VAULTS: { getByName: () => ({ fetch: async () => new Response('{}', { headers: { ETag: '"1"' } }) }) } };
  assert.equal((await ctx.handler.fetch(new Request('https://sync.test/vault'), env)).status, 401);
  assert.equal((await ctx.handler.fetch(new Request('https://sync.test/vault', { headers: { Origin: 'https://evil.test' } }), env)).status, 403);
  assert.equal((await ctx.handler.fetch(new Request('https://sync.test/vault', { headers: { Authorization: `Bearer ${material.auth}` } }), env)).headers.get('ETag'), '"1"');
  assert.equal((await ctx.handler.fetch(new Request('https://sync.test/vault', { method: 'PUT', headers: { Authorization: `Bearer ${material.auth}`, 'Content-Type': 'application/json', 'If-Match': '"1"' }, body: '{"iv":"invalid","cipher":"invalid"}' }), env)).status, 400);
  if (process.argv.includes('--live')) {
    const generated = Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('hex');
    const live = await tools.workspaceSyncCrypto(generated);
    const headers = { Authorization: `Bearer ${live.auth}`, Origin: 'https://jasper499.github.io' };
    const url = 'https://hjl-clatch-reading-sync.jasper499-clatch.workers.dev/vault';
    const request = (options = {}) => fetch(url, { ...options, headers: { ...headers, ...options.headers }, signal: AbortSignal.timeout(15000) });
    try {
      let response = await request(); assert.equal(response.status, 404);
      const nonce = crypto.getRandomValues(new Uint8Array(12));
      const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, live.key, new TextEncoder().encode(JSON.stringify(backup)));
      const body = JSON.stringify({ iv: Buffer.from(nonce).toString('base64'), cipher: Buffer.from(cipher).toString('base64') });
      response = await request({ method: 'PUT', headers: { 'Content-Type': 'application/json', 'If-Match': response.headers.get('ETag') }, body }); assert.equal(response.status, 204);
      response = await request(); assert.equal(response.status, 200);
      assert.equal(response.headers.get('Access-Control-Allow-Origin'), headers.Origin);
      const downloaded = await response.json();
      assert.deepEqual(JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: Buffer.from(downloaded.iv, 'base64') }, live.key, Buffer.from(downloaded.cipher, 'base64')))), backup);
      const options = { method: 'PUT', headers: { 'Content-Type': 'application/json', 'If-Match': response.headers.get('ETag') }, body };
      const concurrent = await Promise.all([request(options), request(options)]);
      assert.deepEqual(concurrent.map(r => r.status).sort(), [204, 409]);
    } finally {
      const current = await request();
      if (current.ok) { const deleted = await request({ method: 'DELETE', headers: { 'If-Match': current.headers.get('ETag') } }); assert.equal(deleted.status, 204); }
    }
    assert.equal((await request()).status, 404);
    console.log('PASS: deployed encrypted sync upload/download, concurrent conflict and cleanup.');
  }
  console.log('PASS: schedule-aware health, visit changes, strict backup validation/rollback, encryption and sync trust boundaries.');
})().catch(error => { console.error(error); process.exitCode = 1; });
