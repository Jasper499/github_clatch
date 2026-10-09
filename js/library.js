const libraryStartedWithoutRoute = typeof location !== 'undefined' && !location.hash;
try { if (libraryStartedWithoutRoute && localStorage.getItem('hjl-start-page') === 'resume') {
  const route = localStorage.getItem('hjl-resume-route');
  if (/^#\/[a-zA-Z]+\/(latest|\d{4}-\d{2}-\d{2}(T\d{6}Z(-\d+)?)?)\/\d+$/.test(route || '')) history.replaceState(null, '', route);
} } catch (_) { /* Storage may be disabled. */ }
let libraryRows = [], libraryPage = 0, libraryPicked = new Set();
const libraryIndexCache = new Map();
function librarySlimItem(item) {
  const fields = ['title', 'description', 'url', 'authors', 'doi', 'journal', 'published', 'language', 'repo', 'label', 'readmePath', 'pdfUrl', 'image'];
  return Object.fromEntries(fields.filter(key => item[key] != null).map(key => [key, item[key]]));
}
function libraryLink(value) {
  try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.href : ''; } catch (_) { return ''; }
}
function librarySnapshotDate(key, source) {
  const time = Date.parse(source?.savedAt);
  return (manifest.sources?.[key] || []).find(row => Math.abs(Date.parse(row.savedAt) - time) <= 5000)?.date || 'latest';
}
function libraryBackupDiff(local, cloud) {
  const left = JSON.parse(local.values['hjl-saved-items-v1'] || '{}'), right = JSON.parse(cloud.values['hjl-saved-items-v1'] || '{}');
  const changed = Object.keys(left).filter(key => Object.hasOwn(right, key) && JSON.stringify(left[key]) !== JSON.stringify(right[key]));
  return { localOnly: Object.keys(left).filter(key => !right[key]), cloudOnly: Object.keys(right).filter(key => !left[key]), changed,
    settings: [...new Set([...Object.keys(local.values), ...Object.keys(cloud.values)])].filter(key => key !== 'hjl-saved-items-v1' && local.values[key] !== cloud.values[key]) };
}
function libraryCitation(entry, format) {
  const item = entry.item || {}, authors = Array.isArray(item.authors) ? item.authors : item.authors ? [String(item.authors)] : [];
  const clean = value => (typeof plainText === 'function' ? plainText(value) : String(value || '').replace(/<[^>]*>/g, '')).replace(/[\r\n]+/g, ' ').trim();
  if (format === 'ris') return ['TY  - JOUR', `TI  - ${clean(item.title)}`, ...authors.map(author => `AU  - ${clean(author)}`), item.journal && `JO  - ${clean(item.journal)}`, item.published && `PY  - ${clean(item.published).slice(0, 4)}`, item.doi && `DO  - ${clean(item.doi)}`, libraryLink(item.url) && `UR  - ${libraryLink(item.url)}`, 'ER  -'].filter(Boolean).join('\n');
  const tex = value => clean(value).replace(/[\\{}%&#_$]/g, x => `\\${x}`);
  const fields = { title: item.title, author: authors.join(' and '), journal: item.journal, year: String(item.published || '').slice(0, 4), doi: item.doi, url: libraryLink(item.url) };
  const id = `hjl_${String(item.doi || item.title || 'paper').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 60)}`;
  return `@article{${id},\n${Object.entries(fields).filter(([, value]) => value).map(([key, value]) => `  ${key} = {${tex(value)}}`).join(',\n')}\n}`;
}
function libraryDownload(text, name, type = 'text/plain;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([text], { type })); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function libraryWriteSaved(next) {
  localStorage.setItem(SAVED_ITEMS_KEY, JSON.stringify(next)); savedItems = next;
}
function libraryMarkdown(text, item) {
  let html = marked.parse(text || '暂无正文');
  const url = libraryLink(item?.url);
  if (url && new URL(url).hostname === 'github.com') html = fixGithubRelativeUrls(html, new URL(url).pathname.split('/').filter(Boolean).slice(0, 2).join('/'));
  return DOMPurify.sanitize(html);
}
function libraryNotice(message) { document.getElementById('library-status').textContent = message; }
async function libraryLoadIndex(key, month, signal) {
  if (!/^[a-zA-Z]+$/.test(key) || !/^\d{4}-\d{2}$/.test(month)) throw new Error('搜索索引路径异常');
  const cacheKey = `${key}:${month}:${manifest.updatedAt || ''}`;
  if (libraryIndexCache.has(cacheKey)) return libraryIndexCache.get(cacheKey);
  const response = await fetch(`data/search/${key}/${month}.json?t=${encodeURIComponent(manifest.updatedAt || '')}`, { signal });
  if (!response.ok) throw new Error(`搜索索引加载失败（${response.status}）`);
  const rows = await response.json(); if (!Array.isArray(rows)) throw new Error('搜索索引格式异常');
  libraryIndexCache.set(cacheKey, rows); return rows;
}
async function libraryIndexedSearch(q, from, to, scope, signal) {
  const keys = Object.keys(manifest.sources || {}).filter(key => !scope || key === scope);
  if (keys.some(key => !manifest.search?.[key])) return false;
  const chunks = keys.flatMap(key => manifest.search[key].filter(part => (!from || part.month >= from.slice(0, 7)) && (!to || part.month <= to.slice(0, 7))).map(part => ({ key, ...part })));
  const body = document.getElementById('history-results'); body.replaceChildren();
  let count = 0, failed = 0, hits = [];
  // ponytail: monthly metadata only, with four requests in flight and 500 visible matches; paginate a dedicated index if retention grows.
  for (let offset = 0; offset < chunks.length; offset += 4) {
    signal.throwIfAborted();
    await Promise.all(chunks.slice(offset, offset + 4).map(async part => {
      try {
        const rows = await libraryLoadIndex(part.key, part.month, signal);
        for (const row of rows) {
          const day = row.date.slice(0, 10);
          if ((from && day < from) || (to && day > to) || !itemSearchHay(row.item).includes(q)) continue;
          count++; hits.push({ ...row, key: part.key });
        }
      } catch (error) { if (signal.aborted) throw error; failed++; }
    }));
    document.getElementById('history-search-status').textContent = `已读取 ${Math.min(offset + 4, chunks.length)}/${chunks.length} 份月份索引，匹配 ${count} 条${failed ? `，${failed} 份失败` : ''}`;
  }
  hits.sort((a, b) => b.date.localeCompare(a.date));
  for (const row of hits.slice(0, 500)) {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'workspace-result'; button.textContent = `${getPlatformMeta(row.key).name} · ${formatSnapshotLabel(row.date)} · ${row.item.title}`;
    button.onclick = () => { document.getElementById('workspace-history').close(); selectedDates[row.key] = row.date; persistDates(); jumpToSource(appData, row.key, row.index); }; body.append(button);
  }
  if (!count) body.textContent = failed ? '部分索引加载失败，可重新搜索。' : '没有匹配内容。';
  if (count > 500) document.getElementById('history-search-status').textContent += ' · 显示最新 500 条，请缩小范围查看其他结果';
  return true;
}
async function resolveLibraryLegacy() {
  const missing = Object.entries(savedItems).filter(([, value]) => !value.item);
  if (!missing.length) return;
  const known = new Map();
  for (const key of flattenCatalogSources(appData)) {
    try {
      const source = await resolveSource(appData, key, { lite: true });
      source.items?.forEach((item, index) => known.set(itemFingerprint(item), { item: librarySlimItem(item), sourceKey: key, date: librarySnapshotDate(key, source), index }));
      if (missing.some(([id]) => !known.has(id))) {
        for (const part of manifest.search?.[key] || []) {
          const rows = await libraryLoadIndex(key, part.month);
          for (const row of rows) { const id = itemFingerprint(row.item); if (!known.has(id)) known.set(id, { item: row.item, sourceKey: key, date: row.date, index: row.index }); }
        }
      }
    } catch (_) { /* Keep unresolved legacy records rather than discarding them. */ }
  }
  const next = { ...savedItems }; for (const [id, value] of missing) if (known.has(id)) next[id] = { ...value, ...known.get(id) }; libraryWriteSaved(next);
}
function libraryFilteredRows() {
  const q = document.getElementById('library-query').value.trim().toLowerCase(), kind = document.getElementById('library-kind').value, tag = document.getElementById('library-tag').value;
  return Object.entries(savedItems).filter(([, value]) => (!kind || value[kind]) && (!tag || value.tags?.includes(tag)) && (!q || `${value.item?.title || ''} ${value.item?.description || ''} ${value.note || ''} ${(value.tags || []).join(' ')}`.toLowerCase().includes(q))).map(([id, value]) => ({ id, ...value })).sort((a, b) => (b.savedAt || '').localeCompare(a.savedAt || ''));
}
function libraryPaint() {
  libraryRows = libraryFilteredRows(); const body = document.getElementById('library-body'); body.replaceChildren();
  libraryPage = Math.max(0, Math.min(libraryPage, Math.ceil(libraryRows.length / 40) - 1));
  for (const entry of libraryRows.slice(libraryPage * 40, (libraryPage + 1) * 40)) {
    const article = document.createElement('article'); article.className = 'library-entry';
    const check = document.createElement('input'); check.type = 'checkbox'; check.checked = libraryPicked.has(entry.id); check.setAttribute('aria-label', `选择 ${entry.item?.title || entry.id}`); check.onchange = () => { if (check.checked) libraryPicked.add(entry.id); else libraryPicked.delete(entry.id); };
    const h = document.createElement('h3'); h.textContent = entry.item?.title || entry.id.replace(/^u:/, '');
    const meta = document.createElement('p'); meta.className = 'muted'; meta.textContent = `${entry.sourceKey ? getPlatformMeta(entry.sourceKey).name : '旧收藏'} · ${entry.date === 'latest' ? '收藏时的最新内容' : entry.date || '未保存日期'} · ${entry.saved ? '收藏' : ''}${entry.later ? ' / 稍后阅读' : ''}`;
    const description = document.createElement('p'); description.textContent = plainText(entry.item?.description || '').slice(0, 240);
    const tags = document.createElement('input'); tags.className = 'select'; tags.placeholder = '标签，用逗号分隔'; tags.value = (entry.tags || []).join(', '); tags.setAttribute('aria-label', '标签'); tags.maxLength = 820;
    const note = document.createElement('textarea'); note.rows = 2; note.maxLength = 4000; note.value = entry.note || ''; note.placeholder = '阅读笔记'; note.setAttribute('aria-label', '阅读笔记');
    const actions = document.createElement('div'); actions.className = 'library-actions';
    const button = (label, action) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.onclick = async () => { b.disabled = true; try { await action(); } catch (error) { libraryNotice(error.message); } finally { b.disabled = false; } }; actions.append(b); };
    button('保存笔记', () => { const list = [...new Set(tags.value.split(/[,，]/).map(x => x.trim()).filter(Boolean))]; if (list.length > 20 || list.some(t => t.length > 40)) throw new Error('最多 20 个标签，每个最多 40 字。'); libraryWriteSaved({ ...savedItems, [entry.id]: { ...savedItems[entry.id], tags: list, note: note.value } }); libraryNotice('笔记已保存，可随备份或同步迁移。'); });
    const url = libraryLink(entry.item?.url || (entry.id.startsWith('u:') ? entry.id.slice(2) : ''));
    if (url) { const a = document.createElement('a'); a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = '查看原文 ↗'; actions.append(a); }
    if (entry.sourceKey) {
      button('查看保存内容', () => libraryShowSaved(entry));
      button('变化时间线', () => libraryTimeline(entry));
      button('保存离线正文', () => librarySaveOffline(entry));
    }
    button('阅读离线内容', () => libraryReadOffline(entry));
    article.append(check, h, meta, description, tags, note, actions); body.append(article);
  }
  libraryNotice(`${libraryRows.length} 条 · 第 ${libraryPage + 1}/${Math.max(1, Math.ceil(libraryRows.length / 40))} 页`);
  if (!libraryRows.length) body.textContent = '暂无匹配记录。可在任意栏目收藏或加入稍后阅读。';
}
async function openReadingLibrary() {
  document.getElementById('library-dialog').showModal(); libraryPaint(); void libraryOfflineUsage().catch(e => libraryNotice(e.message));
  try { await resolveLibraryLegacy(); const select = document.getElementById('library-tag'); const value = select.value; select.replaceChildren(new Option('全部标签', '')); [...new Set(Object.values(savedItems).flatMap(v => v.tags || []))].sort().forEach(tag => select.append(new Option(tag, tag))); select.value = value; libraryPaint(); } catch (error) { libraryNotice(`旧记录补全失败，原记录保留：${error.message}`); }
}
async function libraryTimeline(entry) {
  const dialog = document.getElementById('library-reader'); const body = document.getElementById('library-reader-body'); body.textContent = '正在读取变化时间线…'; dialog.showModal();
  const versions = [];
  for (const part of manifest.search?.[entry.sourceKey] || []) {
    for (const row of await libraryLoadIndex(entry.sourceKey, part.month)) if (itemFingerprint(row.item) === entry.id) versions.push(row);
  }
  versions.sort((a, b) => b.date.localeCompare(a.date)); body.replaceChildren();
  let last;
  for (const row of versions) { const version = workspaceItemVersion(row.item); if (version === last) continue; last = version;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'workspace-result'; b.textContent = `${formatSnapshotLabel(row.date)} · ${row.item.title}`; b.onclick = () => { dialog.close(); document.getElementById('library-dialog').close(); selectedDates[entry.sourceKey] = row.date; persistDates(); jumpToSource(appData, entry.sourceKey, row.index); }; body.append(b);
  }
  if (!versions.length) body.textContent = '保留的历史中没有该条目。收藏内容仍保留在本机。';
}
async function libraryOfflineUsage() {
  const cache = await caches.open('hjl-reading-library-v1'); const keys = await cache.keys(); let bytes = 0;
  for (const key of keys) bytes += (await (await cache.match(key)).blob()).size;
  const label = document.getElementById('library-offline-usage');
  if (label) label.textContent = `离线资料：${keys.length} 条 · ${(bytes / 1024 / 1024).toFixed(2)} / 20 MB`;
  return bytes;
}
async function librarySaveOffline(entry) {
  const cache = await caches.open('hjl-reading-library-v1'); const total = await libraryOfflineUsage();
  let readme = '';
  if (/^data\/readmes\/[a-zA-Z0-9_-]+\/versions\/[a-f0-9]{64}\.md$/.test(entry.item?.readmePath || '')) { const response = await fetch(entry.item.readmePath); if (!response.ok) throw new Error('正文下载失败，未保存。'); readme = await response.text(); }
  const text = JSON.stringify({ ...entry, readme, offlineAt: new Date().toISOString() });
  const existing = await cache.match(new URL(`offline-library/${encodeURIComponent(entry.id)}`, location.href));
  if (total - (existing ? (await existing.blob()).size : 0) + new Blob([text]).size > 20 * 1024 * 1024) throw new Error('离线资料达到 20 MB，请先清理。');
  await cache.put(new Request(new URL(`offline-library/${encodeURIComponent(entry.id)}`, location.href)), new Response(text)); await libraryOfflineUsage(); libraryNotice(readme ? '已保存该版本 README，可离线阅读。' : '已保存标题与摘要；未提供可存档正文。');
}
async function libraryShowSaved(entry) {
  const body = document.getElementById('library-reader-body'); body.replaceChildren();
  const h = document.createElement('h2'); h.textContent = entry.item?.title || entry.id; body.append(h);
  const p = document.createElement('p'); p.textContent = plainText(entry.item?.description || ''); body.append(p);
  document.getElementById('library-reader').showModal();
  if (/^data\/readmes\/[a-zA-Z0-9_-]+\/versions\/[a-f0-9]{64}\.md$/.test(entry.item?.readmePath || '')) {
    const response = await fetch(entry.item.readmePath); if (!response.ok) throw new Error('保存版本正文不可用，可查看原文或离线资料。');
    const content = document.createElement('div'); content.className = 'markdown-body'; content.innerHTML = libraryMarkdown(await response.text(), entry.item); body.append(content);
  }
}
async function libraryReadOffline(entry) {
  const cache = await caches.open('hjl-reading-library-v1'); const response = await cache.match(new URL(`offline-library/${encodeURIComponent(entry.id)}`, location.href));
  if (!response) throw new Error('此条目尚未保存离线内容。');
  const saved = await response.json(); const body = document.getElementById('library-reader-body'); body.replaceChildren();
  const h = document.createElement('h2'); h.textContent = saved.item?.title || saved.id; body.append(h);
  const content = document.createElement('div'); content.className = 'markdown-body'; content.innerHTML = libraryMarkdown(saved.readme || saved.item?.description, saved.item); body.append(content);
  document.getElementById('library-reader').showModal();
}
function closePersonalHome() { const home = document.getElementById('personal-home'); if (home && !home.hidden) { home.hidden = true; document.getElementById('content-panel').hidden = false; } }
async function openPersonalHome() {
  document.getElementById('personal-home').hidden = false; document.getElementById('content-panel').hidden = true;
  history.replaceState(null, '', location.pathname + location.search);
  const rows = await workspaceDigestRows(); const body = document.getElementById('home-updates'); body.replaceChildren();
  const add = (text, key, index = 0) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'workspace-result'; b.textContent = text; b.onclick = () => { selectedDates[key] = 'latest'; persistDates(); jumpToSource(appData, key, index); }; body.append(b); };
  for (const row of rows) if (row.source) { add(`${row.source.label || row.key} · 新增 ${row.added.length} · 变更 ${row.changed.length}`, row.key); workspaceRecordVisit(row.key, row.source); }
  document.getElementById('home-saved-count').textContent = Object.values(savedItems).filter(v => v.saved).length;
  document.getElementById('home-later-count').textContent = Object.values(savedItems).filter(v => v.later).length;
  const follow = document.getElementById('home-follow'); follow.replaceChildren();
  for (const row of rows) for (const item of (row.source?.items || []).filter(workspaceMatches).slice(0, 3)) { const b = document.createElement('button'); b.type = 'button'; b.className = 'workspace-result'; b.textContent = item.title; b.onclick = () => { selectedDates[row.key] = 'latest'; persistDates(); jumpToSource(appData, row.key, row.source.items.indexOf(item)); }; follow.append(b); }
  if (!follow.childElementCount) follow.textContent = '尚无关注匹配，可在「更多 → 阅读数据与通知」设置关键词。';
  renderHealth(appData); const health = document.getElementById('health-list').cloneNode(true); health.removeAttribute('id'); document.getElementById('home-health').replaceChildren(health);
}
function librarySyncStamp(auth, backup) {
  localStorage.setItem('hjl-sync-state', JSON.stringify({ auth, at: new Date().toISOString(), values: backup.values }));
  updateLibrarySyncStatus();
}
function updateLibrarySyncStatus() {
  const state = workspaceRead('hjl-sync-state', null); const current = collectWorkspaceBackup().values;
  document.getElementById('sync-local-state').textContent = !state ? '本机尚无成功同步记录。' : `上次同步：${formatDate(state.at)} · ${JSON.stringify(current) === JSON.stringify(state.values) ? '本机与该次同步一致' : '本机存在同步后修改'}`;
}
function reviewLibrarySync(local, cloud, direction) {
  const diff = libraryBackupDiff(local, cloud); const dialog = document.getElementById('sync-review');
  const body = document.getElementById('sync-review-body'); body.replaceChildren();
  for (const line of [`云端备份时间：${cloud.exportedAt ? formatDate(cloud.exportedAt) : '未知'}`, `本机独有 ${diff.localOnly.length} 条，云端独有 ${diff.cloudOnly.length} 条，共同记录变化 ${diff.changed.length} 条`, `显示偏好、已读和关注等设置有 ${diff.settings.length} 项不同`, direction === 'push' ? '确认后以本机数据替换云端备份。' : '确认后替换备份中包含的本机数据和设置。']) { const p = document.createElement('p'); p.textContent = line; body.append(p); }
  for (const key of [...diff.localOnly, ...diff.cloudOnly, ...diff.changed].slice(0, 30)) { const p = document.createElement('p'); const values = JSON.parse(local.values[SAVED_ITEMS_KEY] || '{}'), remote = JSON.parse(cloud.values[SAVED_ITEMS_KEY] || '{}'); p.textContent = values[key]?.item?.title || remote[key]?.item?.title || key; body.append(p); }
  document.getElementById('sync-review-confirm').textContent = direction === 'push' ? '确认上传覆盖云端' : '确认下载替换本机';
  dialog.showModal(); return new Promise(resolve => { let accepted = false; document.getElementById('sync-review-confirm').onclick = () => { accepted = true; dialog.close(); }; dialog.addEventListener('close', () => resolve(accepted), { once: true }); });
}
function applyLibraryReader() {
  const settings = workspaceRead('hjl-reader-layout', { width: 800, line: 1.8, paragraph: 1.2 });
  const root = document.documentElement; root.style.setProperty('--reader-width', `${settings.width}px`); root.style.setProperty('--reader-line', settings.line); root.style.setProperty('--reader-paragraph', `${settings.paragraph}em`);
  for (const key of ['width', 'line', 'paragraph']) document.getElementById(`reader-${key}`).value = settings[key];
  root.setAttribute('data-list-view', localStorage.getItem('hjl-list-view') || 'list');
}
function initReadingLibrary() {
  const dialog = document.getElementById('library-dialog'); if (dialog.dataset.bound) return; dialog.dataset.bound = '1';
  document.querySelectorAll('[data-library-open]').forEach(b => { b.onclick = () => void openReadingLibrary().catch(e => libraryNotice(e.message)); });
  document.querySelectorAll('[data-home-open]').forEach(b => { b.onclick = () => void openPersonalHome().catch(e => workspaceNotice(e.message)); });
  document.querySelectorAll('[data-close-dialog]').forEach(b => { b.onclick = () => b.closest('dialog').close(); });
  for (const id of ['library-query', 'library-kind', 'library-tag']) document.getElementById(id).oninput = () => { libraryPage = 0; libraryPaint(); };
  document.getElementById('library-prev').onclick = () => { libraryPage--; libraryPaint(); }; document.getElementById('library-next').onclick = () => { libraryPage++; libraryPaint(); };
  document.getElementById('library-select-page').onclick = () => { libraryRows.slice(libraryPage * 40, (libraryPage + 1) * 40).forEach(row => libraryPicked.add(row.id)); libraryPaint(); };
  document.getElementById('library-remove').onclick = () => { if (!libraryPicked.size || !confirm(`将 ${libraryPicked.size} 条移出收藏和稍后阅读？笔记和标签保留。`)) return; const next = { ...savedItems }; for (const id of libraryPicked) if (next[id]) { next[id] = { ...next[id], saved: false, later: false }; if (!next[id].note && !next[id].tags?.length) delete next[id]; } try { libraryWriteSaved(next); libraryPicked.clear(); libraryPaint(); } catch (error) { libraryNotice(error.message); } };
  document.getElementById('library-export').onclick = () => {
    const rows = libraryPicked.size ? libraryRows.filter(row => libraryPicked.has(row.id)) : libraryRows; const type = document.getElementById('library-export-type').value;
    const selected = type === 'md' ? rows : rows.filter(row => row.item?.doi || row.item?.journal);
    if (!selected.length) { libraryNotice('没有可导出的记录；引用格式仅用于论文条目。'); return; }
    const text = type === 'md' ? selected.map(row => `## ${String(row.item?.title || row.id).replace(/[\r\n]/g, ' ')}\n\n${libraryLink(row.item?.url)}\n\n标签：${(row.tags || []).join(', ')}\n\n${row.note || ''}`).join('\n\n---\n\n') : selected.map(row => libraryCitation(row, type)).join('\n\n');
    libraryDownload(text, `hjl-library.${type === 'bib' ? 'bib' : type === 'ris' ? 'ris' : 'md'}`); libraryNotice(`已导出 ${selected.length} 条。`);
  };
  document.getElementById('library-clear-offline').onclick = async () => { if (confirm('删除主动保存的离线正文？收藏和笔记保留。')) { await caches.delete('hjl-reading-library-v1'); await libraryOfflineUsage(); libraryNotice('离线正文已清理。'); } };
  const start = document.getElementById('start-page'); start.value = localStorage.getItem('hjl-start-page') || 'home'; start.onchange = () => localStorage.setItem('hjl-start-page', start.value);
  document.getElementById('workspace-settings').addEventListener('close', updateLibrarySyncStatus); updateLibrarySyncStatus();
  document.addEventListener('click', e => { if (e.target.closest('#workspace-settings-open')) updateLibrarySyncStatus(); });
  for (const key of ['width', 'line', 'paragraph']) document.getElementById(`reader-${key}`).onchange = () => { localStorage.setItem('hjl-reader-layout', JSON.stringify(Object.fromEntries(['width', 'line', 'paragraph'].map(k => [k, Number(document.getElementById(`reader-${k}`).value)])))); applyLibraryReader(); };
  document.getElementById('list-view').value = localStorage.getItem('hjl-list-view') || 'list'; document.getElementById('list-view').onchange = e => { localStorage.setItem('hjl-list-view', e.target.value); applyLibraryReader(); };
  applyLibraryReader();
  const themes = document.getElementById('personal-theme');
  const fillThemes = () => { themes.replaceChildren(new Option('选择个人主题', '')); workspaceRead('hjl-personal-themes', []).forEach((theme, index) => themes.append(new Option(theme.name, index))); };
  fillThemes(); document.getElementById('theme-save').onclick = () => { const name = document.getElementById('theme-name').value.trim(); if (!name || name.length > 40) return; const list = workspaceRead('hjl-personal-themes', []).filter(t => t.name !== name); if (list.length >= 10) { workspaceNotice('最多保存 10 个主题。'); return; } list.push({ name, theme: document.documentElement.getAttribute('data-theme') || 'dark', density: getDensity(), background: localStorage.getItem('hjl-background-v1') || JSON.stringify({ preset: 'default', shade: 45, panelStrength: 55, position: 'center' }), reader: localStorage.getItem('hjl-reader-layout') || JSON.stringify({ width: 800, line: 1.8, paragraph: 1.2 }) }); localStorage.setItem('hjl-personal-themes', JSON.stringify(list)); fillThemes(); workspaceNotice('个人主题已保存，图片文件仍使用本机背景。'); };
  themes.onchange = () => { const theme = workspaceRead('hjl-personal-themes', [])[Number(themes.value)]; if (!theme || themes.value === '') return; for (const [key, value] of Object.entries({ 'hjl-theme': theme.theme, 'hjl-density': theme.density, 'hjl-background-v1': theme.background, 'hjl-reader-layout': theme.reader })) localStorage.setItem(key, value); location.reload(); };
  document.getElementById('theme-delete').onclick = () => { if (themes.value === '') return; const list = workspaceRead('hjl-personal-themes', []); list.splice(Number(themes.value), 1); localStorage.setItem('hjl-personal-themes', JSON.stringify(list)); fillThemes(); };
  if (libraryStartedWithoutRoute && start.value === 'home') void openPersonalHome().catch(e => workspaceNotice(e.message));
}
if (typeof module !== 'undefined') module.exports = { librarySlimItem, libraryLink, libraryBackupDiff, libraryCitation };
