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
  const elements = new Map();
  const element = () => ({dataset: {}, style: {setProperty(key,value) {this[key]=value;}}, setAttribute(key,value) {this[key]=value;}, showModal() {}, close() {}});
  const choices = ['default','aurora','cobalt','plain','custom'].map(preset => Object.assign(element(), {dataset: {backgroundChoice: preset}}));
  for (const id of ['background-dialog','background-shade','background-shade-value','background-save-status','background-open','background-close','background-reset','background-file','background-position','background-remove','background-panel-strength','background-panel-value','background-image-first','background-reading','background-undo']) elements.set(id, element());
  elements.get('background-dialog').querySelectorAll = () => choices;
  const rootElement = element();
  let stored = JSON.stringify({preset: 'invalid', shade: 999});
  const background = {Blob, window: {}, backgroundImageStore: async () => undefined, document: {documentElement: rootElement, getElementById: id => elements.get(id)}, localStorage: {getItem: () => stored, setItem: (_key,value) => {stored=value;}}};
  vm.runInNewContext(section('function initBackgroundSettings()', '\ninitBackgroundSettings();') + '\ninitBackgroundSettings();', background);
  assert.equal(rootElement['data-background'], 'default', 'Invalid stored presets must use the default');
  assert.equal(elements.get('background-shade').value, 45);
  choices[1].onclick();
  assert.equal(rootElement['data-background'], 'aurora');
  assert.equal(JSON.parse(stored).preset, 'aurora');
  assert.equal(elements.get('background-shade').disabled, false);
  elements.get('background-image-first').onclick();
  assert.equal(rootElement.style['--background-shade'], '10%');
  assert.equal(rootElement.style['--background-panel-strength'], '35%');
  assert.equal(JSON.parse(stored).panelStrength,35);
  elements.get('background-reset').onclick();
  assert.equal(rootElement['data-background'], 'default');
  let closedBitmap = false;
  const canvas = {getContext: () => ({drawImage() {}}), toBlob: callback => callback(new Blob(['compressed'], {type:'image/webp'}))};
  const image = {Blob, document: {createElement: () => canvas}, createImageBitmap: async () => ({width:3840,height:2160,close:()=>{closedBitmap=true;}})};
  vm.createContext(image);
  vm.runInContext(section('async function prepareBackgroundImage(', 'function initBackgroundSettings('), image);
  await assert.rejects(image.prepareBackgroundImage({type:'image/svg+xml',size:100}));
  await assert.rejects(image.prepareBackgroundImage({type:'image/png',size:21*1024*1024}));
  assert.equal((await image.prepareBackgroundImage({type:'image/png',size:100})).type, 'image/webp');
  assert.equal(canvas.width,1920); assert.equal(canvas.height,1080); assert(closedBitmap);

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

  let homeClosed = false;
  const routeContext = { activeSourceKey: 'github', selectedDates: { github: 'latest' }, activeItemIndex: 0, closePersonalHome: () => { homeClosed = true; } };
  vm.runInNewContext(section('function applyRoute(', 'function platformIcon(') + '\napplyRoute({}, {sourceKey:"github",dateKey:"latest",itemIndex:0});', routeContext);
  assert(homeClosed, 'An unchanged content route must close the personal home');

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
  const dataCacheName = vm.runInContext('CACHE_DATA', sw);
  assert.equal(sw.cacheKey({url:'https://example.test/data/meta.json?t=1'}), sw.cacheKey({url:'https://example.test/data/meta.json?t=2'}));
  assert.notEqual(sw.cacheKey({url:'https://example.test/js/app.js?v=25'}), sw.cacheKey({url:'https://example.test/js/app.js?v=26'}));
  await sw.networkFirst({url:'https://example.test/data/meta.json?t=1'}, dataCacheName);
  sw.fetch = async () => { throw Error('offline'); };
  assert.equal(await (await sw.networkFirst({url:'https://example.test/data/meta.json?t=2'}, dataCacheName)).text(), 'fresh data');
  for (let i=0;i<125;i++) await sw.cacheResponse({url:`https://example.test/data/history/${i}.json`}, new Response('snapshot'), dataCacheName);
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
    index=json.loads((history.DATA_DIR/'search/github/2026-10.json').read_text())
    assert len(index)==2 and all('readme' not in row['item'] for row in index)
    assert {row['date'] for row in index} == {'2026-10-01','2026-10-02'}
    assert json.loads(history.MANIFEST_PATH.read_text())['search']['github'][0]['items']==2
    stale=history.DATA_DIR/'search/github/1999-01.json'
    stale.write_text('[]')
    history.write_search_index('github')
    assert not stale.exists()
`], {cwd:root,encoding:'utf8'});
  assert.equal(python.status, 0, python.stderr || python.stdout);
  console.log('PASS: README versions, historical isolation, keyboard, filtering, saved items and bounded offline cache.');
})().catch(error => { console.error(error); process.exitCode=1; });
