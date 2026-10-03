// Run: node scripts/check_site.cjs (Node 18+ and Python 3).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const app = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
function section(start, end) { return app.slice(app.indexOf(start), app.indexOf(end, app.indexOf(start))); }

(async () => {
  const requests = [];
  const readme = { selectedDates: { github: '2026-09-14' }, readmeCache: {}, readmeInflight: {}, fetch: async url => { requests.push(url); return new Response(url.includes('versions') ? 'historical body' : 'latest body'); }, githubRawReadmeUrl: () => 'https://raw.githubusercontent.com/example/repo/HEAD/README.md' };
  vm.createContext(readme);
  vm.runInContext(section('async function fetchItemReadme(', 'async function hydrateActiveReadme('), readme);
  assert.equal(await readme.fetchItemReadme('github', { url: 'https://github.com/old/repo' }, 0), '');
  assert.equal(requests.length, 0, 'Old snapshots must not fetch current index-based README');
  readme.selectedDates.github = 'latest';
  assert.equal(await readme.fetchItemReadme('github', { url: 'https://github.com/new/repo' }, 0), 'latest body');
  readme.selectedDates.github = '2026-09-14';
  assert.equal(await readme.fetchItemReadme('github', { url: 'https://github.com/new/repo', readmePath: `data/readmes/github/versions/${'a'.repeat(64)}.md` }, 0), 'historical body');
  assert.equal(await readme.fetchItemReadme('github', { url: 'https://github.com/unsafe/repo', readmePath: '../private.md' }, 0), '');

  let handler, opened = 0;
  const keys = { window: {}, document: { addEventListener: (_name, fn) => handler = fn, getElementById: () => null, querySelector: () => null }, isTypingTarget: () => false, openActiveItem: () => opened++ };
  vm.runInNewContext(section('function bindKeyboard(', 'async function loadContent(') + '\nbindKeyboard({});', keys);
  handler({ key: 'Enter', target: { closest: () => ({}) }, preventDefault: () => assert.fail('Native button must keep Enter') });
  assert.equal(opened, 0);
  handler({ key: 'Enter', target: { closest: () => null }, preventDefault() {} });
  assert.equal(opened, 1);

  const filters = { searchQuery: 'MRI', facetFilter: 'Python', accessFilter: '', savedFilter: '', yearFilter: '', sortOrder: 'stars', savedItems: {}, itemFingerprint: i => i.url, itemSearchHay: i => `${i.title} ${i.authors || ''}`.toLowerCase() };
  vm.createContext(filters);
  vm.runInContext(section('function filterItems(', 'function fillContentFilters('), filters);
  const items = [{title: 'MRI B', language: 'Python', stars: 3, url: 'b'}, {title: 'MRI A', language: 'Python', stars: 7, url: 'a'}, {title: 'MRI C', language: 'Go', stars: 20, url: 'c'}];
  assert.equal(JSON.stringify(filters.filterItems(items).map(row => row.index)), '[1,0]');
  assert.equal(items[0].url, 'b', 'Sort must preserve original item indices');
  filters.savedFilter = 'saved'; filters.savedItems.b = { saved: true };
  assert.equal(JSON.stringify(filters.filterItems(items).map(row => row.index)), '[0]');
  vm.runInContext(section('function diffSnapshots(', 'function renderHistoryCompare('), filters);
  const diff = filters.diffSnapshots([{url:'same',stars:5},{url:'new'}], [{url:'same',stars:2},{url:'old'}]);
  assert.equal(diff.added.length,1); assert.equal(diff.removed.length,1); assert.equal(diff.changed.length,1);

  const store = new Map();
  const cache = { match: async key => store.get(key)?.clone(), put: async (key, value) => store.set(key, value), keys: async () => [...store.keys()], delete: async key => store.delete(key) };
  const sw = { self: { location: { origin: 'https://example.test' }, addEventListener() {} }, URL, AbortSignal, Promise, caches: { open: async () => cache, match: async key => store.get(key)?.clone() }, fetch: async () => new Response('fresh data') };
  vm.createContext(sw);
  vm.runInContext(fs.readFileSync(path.join(root, 'sw.js'), 'utf8'), sw);
  assert.equal(sw.cacheKey({url:'https://example.test/data/meta.json?t=1'}), sw.cacheKey({url:'https://example.test/data/meta.json?t=2'}));
  assert.notEqual(sw.cacheKey({url:'https://example.test/js/app.js?v=25'}), sw.cacheKey({url:'https://example.test/js/app.js?v=26'}));
  await sw.networkFirst({url:'https://example.test/data/meta.json?t=1'}, 'clatch-data-v26');
  sw.fetch = async () => { throw Error('offline'); };
  assert.equal(await (await sw.networkFirst({url:'https://example.test/data/meta.json?t=2'}, 'clatch-data-v26')).text(), 'fresh data');
  for (let i=0;i<125;i++) await sw.cacheResponse({url:`https://example.test/data/history/${i}.json`}, new Response('snapshot'), 'clatch-data-v26');
  assert.equal(store.size, 120);

  const python = spawnSync('python', ['-c', `
import sys, tempfile, json
from pathlib import Path
sys.path.insert(0, 'scripts')
import history
with tempfile.TemporaryDirectory() as tmp:
    history.DATA_DIR=Path(tmp)/'data'
    history.READMES_DIR=history.DATA_DIR/'readmes'
    history.SOURCES_DIR=history.DATA_DIR/'sources'
    history.HISTORY_DIR=history.DATA_DIR/'history'
    history.MANIFEST_PATH=history.DATA_DIR/'manifest.json'
    first={'items':[{'title':'old/repo','readme':'old body'}]}
    history.write_latest_source('github',first)
    history.save_source_snapshot('github',first,'2026-10-01')
    second={'items':[{'title':'new/repo','readme':'new body'}]}
    history.write_latest_source('github',second)
    history.save_source_snapshot('github',second,'2026-10-02')
    old=json.loads((history.HISTORY_DIR/'github/2026-10-01.json').read_text())['items'][0]
    new=json.loads((history.HISTORY_DIR/'github/2026-10-02.json').read_text())['items'][0]
    assert old['readmePath'] != new['readmePath']
    assert (Path(tmp)/old['readmePath']).read_text() == 'old body'
    assert (Path(tmp)/new['readmePath']).read_text() == 'new body'
    assert 'readme' not in old
`], {cwd:root,encoding:'utf8'});
  assert.equal(python.status, 0, python.stderr || python.stdout);
  console.log('PASS: README versions, historical isolation, keyboard, filtering, saved items and bounded offline cache.');
})().catch(error => { console.error(error); process.exitCode=1; });
