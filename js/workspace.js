// Personal reading tools; no account is required for local use.
const WORKSPACE_KEYS = {
  'hjl-saved-items-v1': 'saved', 'hjl-seen-v1': 'seen', 'hjl-source-dates': 'dates',
  'hjl-pins-v1': 'pins', 'hjl-theme': 'theme', 'hjl-density': 'density',
  'hjl-workstation': 'toggle', 'hjl-focus': 'toggle', 'hjl-split-width': 'width',
  'hjl-reader-size': 'size', 'hjl-background-v1': 'background',
  'hjl-visits-v1': 'visits', 'hjl-follow-v1': 'follow', 'hjl-notifications-v1': 'notifications',
};
function workspaceRead(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch (_) { return fallback; }
}
function workspaceHealth(iso, parent, now = new Date()) {
  const row = UpdateSchedule.schedules.find(s => s.sources.includes(parent) || (parent === 'journals' && s.sources.includes('mrm')));
  if (!row) return { level: 'bad', label: '计划未配置' };
  const due = UpdateSchedule.expectedDue(row, now, 0);
  let next;
  for (let day = 0; day < 32 && !next; day++) {
    for (const hour of row.hours) {
      const slot = new Date(now); slot.setUTCDate(slot.getUTCDate() + day); slot.setUTCHours(hour, row.minute, 0, 0);
      if (slot > now && (!row.weekdays || row.weekdays.includes(slot.getUTCDay())) && (!row.monthdays || row.monthdays.includes(slot.getUTCDate()))) { next = slot; break; }
    }
  }
  const saved = Date.parse(iso);
  const info = { due: due.toISOString(), next: next.toISOString() };
  if (!Number.isFinite(saved) || saved > now.getTime() + 300000) return { ...info, level: 'bad', label: iso ? '时间异常' : '无数据' };
  if (saved >= due.getTime()) return { ...info, level: 'ok', label: '已按计划更新' };
  if (now - due <= 90 * 60000) return { ...info, level: 'warn', label: '待更新 · 宽限期内' };
  return { ...info, level: 'bad', label: '已过期 · 检查补跑' };
}
function workspaceItemVersion(item) {
  return JSON.stringify([item.title, item.description, item.readmePath, item.sha, item.published]);
}
function workspaceChanges(items, previous, fingerprint) {
  if (!previous) return { added: [], changed: [] };
  return {
    added: items.map((item, index) => ({ item, index })).filter(({ item }) => !Object.hasOwn(previous, fingerprint(item))),
    changed: items.map((item, index) => ({ item, index })).filter(({ item }) => Object.hasOwn(previous, fingerprint(item)) && previous[fingerprint(item)] !== workspaceItemVersion(item)),
  };
}
function validateWorkspaceBackup(input) {
  if (input?.format !== 'hjl-reading-backup' || input.version !== 1 || !input.values || Array.isArray(input.values)) throw new Error('不是有效的 HJL 阅读备份。');
  const values = {};
  for (const [key, raw] of Object.entries(input.values)) {
    if (!Object.hasOwn(WORKSPACE_KEYS, key) || typeof raw !== 'string' || raw.length > 2000000) throw new Error('备份包含不支持的设置。');
    const kind = WORKSPACE_KEYS[key];
    let valid = true, value;
    if (['saved', 'seen', 'dates', 'pins', 'background', 'visits', 'follow', 'notifications'].includes(kind)) value = JSON.parse(raw);
    const object = value && typeof value === 'object' && !Array.isArray(value);
    if (['saved', 'seen', 'dates', 'visits'].includes(kind)) {
      valid = object && Object.keys(value).length <= 5000 && Object.entries(value).every(([k, v]) => !['__proto__', 'constructor', 'prototype'].includes(k) && k.length < 4096 && (
        kind === 'saved' ? v && typeof v === 'object' && !Array.isArray(v) && ['saved', 'later'].every(flag => v[flag] === undefined || typeof v[flag] === 'boolean') :
        kind === 'seen' ? Array.isArray(v) && v.length <= 400 && v.every(x => typeof x === 'string') :
        kind === 'dates' ? typeof v === 'string' && /^(latest|\d{4}-\d{2}-\d{2}(T\d{6}Z)?)$/.test(v) :
        v && typeof v === 'object' && !Array.isArray(v) && Object.values(v).every(x => typeof x === 'string')
      ));
    }
    if (kind === 'pins') valid = Array.isArray(value) && value.length <= 30 && value.every(x => typeof x === 'string' && /^[a-zA-Z]+$/.test(x));
    if (kind === 'follow') valid = Array.isArray(value) && value.length <= 50 && value.every(x => typeof x === 'string' && x.length <= 100);
    if (kind === 'notifications') valid = object && Object.keys(value).every(k => ['updates', 'digest', 'errors'].includes(k) && typeof value[k] === 'boolean');
    if (kind === 'background') valid = object && ['default', 'aurora', 'cobalt', 'plain', 'custom'].includes(value.preset) && Number.isFinite(value.shade) && value.shade >= 5 && value.shade <= 85 && Number.isFinite(value.panelStrength) && value.panelStrength >= 20 && value.panelStrength <= 100 && ['center', 'top', 'bottom'].includes(value.position);
    if (kind === 'theme') valid = ['light', 'dark'].includes(raw);
    if (kind === 'density') valid = ['compact', 'comfortable'].includes(raw);
    if (kind === 'toggle') valid = ['0', '1'].includes(raw);
    if (kind === 'width') valid = Number(raw) >= 30 && Number(raw) <= 65;
    if (kind === 'size') valid = ['15', '17', '19'].includes(raw);
    if (!valid) throw new Error(`备份字段不合法：${key}`);
    values[key] = raw;
  }
  return values;
}
function applyWorkspaceBackup(input, storage = localStorage) {
  const values = validateWorkspaceBackup(input);
  const old = Object.fromEntries(Object.keys(values).map(key => [key, storage.getItem(key)]));
  try { for (const [key, value] of Object.entries(values)) storage.setItem(key, value); }
  catch (error) {
    for (const [key, value] of Object.entries(old)) { if (value === null) storage.removeItem(key); else storage.setItem(key, value); }
    throw error;
  }
}
function collectWorkspaceBackup() {
  return { format: 'hjl-reading-backup', version: 1, exportedAt: new Date().toISOString(), values: Object.fromEntries(Object.keys(WORKSPACE_KEYS).map(key => [key, localStorage.getItem(key)]).filter(([, value]) => value !== null)) };
}
function workspaceMatches(item) {
  const rules = workspaceRead('hjl-follow-v1', []);
  return rules.some(rule => itemSearchHay(item).includes(rule.toLowerCase()));
}
let workspaceVisitsBefore = null;
function workspaceRecordVisit(key, source) {
  if ((selectedDates[key] || 'latest') !== 'latest') return;
  if (!workspaceVisitsBefore) workspaceVisitsBefore = workspaceRead('hjl-visits-v1', {});
  const visits = workspaceRead('hjl-visits-v1', {});
  visits[key] = Object.fromEntries((source.items || []).slice(0, 500).map(item => [itemFingerprint(item), workspaceItemVersion(item)]));
  try { localStorage.setItem('hjl-visits-v1', JSON.stringify(visits)); } catch (_) {}
}
async function workspaceDigestRows() {
  const rows = await Promise.all(flattenCatalogSources(appData).map(async key => {
    try {
      const source = await resolveSource(appData, key, { lite: true });
      const changes = workspaceChanges(source.items || [], workspaceVisitsBefore?.[key], itemFingerprint);
      return { key, source, ...changes, first: !workspaceVisitsBefore?.[key] };
    } catch (error) { return { key, error: error.message }; }
  }));
  return rows;
}
function workspaceRenderRows(rows, target, kind) {
  target.replaceChildren();
  for (const row of rows) {
    const section = document.createElement('section'); section.className = 'workspace-section';
    const h = document.createElement('h3'); h.textContent = row.source?.label || getPlatformMeta(row.key).name; section.append(h);
    if (row.error) { const p = document.createElement('p'); p.textContent = `加载失败：${row.error}`; section.append(p); }
    else {
      const entries = kind === 'follow' ? row.source.items.map((item, index) => ({ item, index })).filter(({ item }) => workspaceMatches(item)) : [...row.added.map(x => ({ ...x, badge: '新增' })), ...row.changed.map(x => ({ ...x, badge: '内容变更' }))];
      const p = document.createElement('p'); p.className = 'muted'; p.textContent = kind === 'follow' ? `${entries.length} 条匹配关注规则` : row.first ? '首次建立基线，下次访问即可比较。' : `新增 ${row.added.length} · 内容变更 ${row.changed.length}`; section.append(p);
      for (const { item, index, badge } of entries) {
        const button = document.createElement('button'); button.type = 'button'; button.className = 'workspace-result'; button.textContent = `${badge ? `${badge} · ` : ''}${item.title}`;
        button.onclick = () => { target.closest('dialog').close(); selectedDates[row.key] = 'latest'; persistDates(); jumpToSource(appData, row.key, index); }; section.append(button);
      }
    }
    target.append(section);
  }
}
async function openWorkspaceOverview(kind = 'updates') {
  const dialog = document.getElementById('workspace-overview');
  document.getElementById('workspace-overview-title').textContent = kind === 'follow' ? '我的关注' : '自上次访问以来';
  const body = document.getElementById('workspace-overview-body'); body.textContent = '正在汇总各栏目…';
  dialog.showModal();
  const rows = await workspaceDigestRows();
  workspaceRenderRows(rows, body, kind);
  for (const row of rows) if (row.source) workspaceRecordVisit(row.key, row.source);
}
function workspaceNotice(text) {
  document.getElementById('workspace-notice').textContent = text;
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') new Notification('HJL Clatch', { body: text, tag: 'hjl-summary' });
}
async function checkWorkspaceNotifications() {
  const prefs = workspaceRead('hjl-notifications-v1', {});
  if (!prefs.updates && !prefs.digest && !prefs.errors) return;
  const messages = [];
  if (prefs.errors) {
    const bad = META_SYNC_PLATFORMS.filter(p => workspaceHealth(resolveMetaTimestamp(appData, p.field), p.id).level === 'bad');
    if (bad.length) messages.push(`${bad.map(p => p.label).join('、')} 数据过期或缺失`);
  }
  if (prefs.updates || prefs.digest) {
    const rows = await workspaceDigestRows();
    const added = rows.reduce((n, r) => n + (r.added?.length || 0), 0);
    const followed = rows.reduce((n, r) => n + (r.added || []).filter(x => workspaceMatches(x.item)).length, 0);
    if (prefs.updates && followed) messages.push(`新增 ${followed} 条关注内容`);
    const day = new Date().toLocaleDateString('sv-SE');
    if (prefs.digest && localStorage.getItem('hjl-digest-day') !== day) {
      messages.push(`今日摘要：${added} 条新内容，可打开「新增」查看`);
      localStorage.setItem('hjl-digest-day', day);
    }
  }
  const text = messages.join('；');
  if (text && text !== sessionStorage.getItem('hjl-last-notice')) { workspaceNotice(text); sessionStorage.setItem('hjl-last-notice', text); }
}
async function workspaceHistorySearch(signal) {
  const q = document.getElementById('history-query').value.trim().toLowerCase();
  const from = document.getElementById('history-from').value, to = document.getElementById('history-to').value;
  const body = document.getElementById('history-results');
  if (!q) throw new Error('请输入搜索关键词。');
  if (from && to && from > to) throw new Error('开始日期不能晚于结束日期。');
  const scope = document.getElementById('history-scope').value;
  const entries = Object.entries(manifest.sources || {}).filter(([key]) => !scope || scope === key).flatMap(([key, list]) => list.filter(row => (!from || row.day >= from) && (!to || row.day <= to)).map(row => ({ ...row, key }))).sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  if (entries.length > 120) throw new Error(`范围内有 ${entries.length} 份快照，请缩小日期范围或选择栏目（每次最多 120 份）。`);
  body.replaceChildren();
  let count = 0, failed = 0;
  // ponytail: scan at most 120 snapshots, four at a time; add a published search index if history grows.
  for (let offset = 0; offset < entries.length; offset += 4) {
    signal.throwIfAborted();
    await Promise.all(entries.slice(offset, offset + 4).map(async row => {
      try {
        if (!/^[a-zA-Z]+$/.test(row.key) || !/^\d{4}-\d{2}-\d{2}(T\d{6}Z)?$/.test(row.date)) throw new Error('快照索引异常');
        const response = await fetch(`data/history/${row.key}/${row.date}.json`, { signal });
        if (!response.ok) throw new Error('快照不可用');
        const source = await response.json();
        (source.items || []).forEach((item, index) => {
          if (!itemSearchHay(item).includes(q)) return;
          count++;
          const button = document.createElement('button'); button.type = 'button'; button.className = 'workspace-result'; button.textContent = `${getPlatformMeta(row.key).name} · ${formatSnapshotLabel(row.date)} · ${item.title}`;
          button.onclick = () => { document.getElementById('workspace-history').close(); selectedDates[row.key] = row.date; persistDates(); jumpToSource(appData, row.key, index); }; body.append(button);
        });
      } catch (error) { if (signal.aborted) throw error; failed++; }
    }));
    document.getElementById('history-search-status').textContent = `已检索 ${Math.min(offset + 4, entries.length)}/${entries.length} 份，匹配 ${count} 条${failed ? `，${failed} 份加载失败` : ''}`;
  }
  if (!count) body.textContent = '没有匹配内容，请调整关键词或日期。';
}
async function workspaceSyncCrypto(code) {
  if (!/^[a-f0-9]{64}$/.test(code)) throw new Error('同步密钥须为生成的 64 位密钥。');
  const bytes = Uint8Array.from(code.match(/../g), x => parseInt(x, 16));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const auth = Array.from(new Uint8Array(digest), x => x.toString(16).padStart(2, '0')).join('');
  return { auth, key: await crypto.subtle.importKey('raw', bytes, 'AES-GCM', false, ['encrypt', 'decrypt']) };
}
async function syncWorkspace(direction) {
  const status = document.getElementById('workspace-settings-status');
  const code = document.getElementById('sync-code').value.trim();
  const { key, auth } = await workspaceSyncCrypto(code);
  const endpoint = 'https://hjl-clatch-reading-sync.jasper499-clatch.workers.dev/vault';
  const headers = { Authorization: `Bearer ${auth}` };
  const response = await fetch(endpoint, { headers, cache: 'no-store', signal: AbortSignal.timeout(15000) });
  if (!response.ok && response.status !== 404) throw new Error(`读取云端失败（${response.status}）`);
  if (direction === 'delete') {
    if (response.status === 404) throw new Error('云端没有备份。');
    if (!confirm('删除当前密钥对应的云端备份？本机阅读数据保留。')) return;
    const result = await fetch(endpoint, { method: 'DELETE', headers: { ...headers, 'If-Match': response.headers.get('ETag') }, signal: AbortSignal.timeout(15000) });
    if (!result.ok) throw new Error(`删除失败（${result.status}）`);
    status.textContent = '云端备份已删除，本机数据保留。';
  } else if (direction === 'pull') {
    if (response.status === 404) throw new Error('云端尚无备份，请先在原设备上传。');
    const payload = await response.json();
    const iv = Uint8Array.from(atob(payload.iv), c => c.charCodeAt(0));
    const cipher = Uint8Array.from(atob(payload.cipher), c => c.charCodeAt(0));
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipher);
    const backup = JSON.parse(new TextDecoder().decode(plain));
    validateWorkspaceBackup(backup);
    if (!confirm('用云端备份中的阅读数据和设置替换本机对应数据？建议先导出本机备份。')) return;
    applyWorkspaceBackup(backup); location.reload();
  } else {
    if (response.ok && !confirm('云端已有备份，用本机数据覆盖它？')) return;
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(collectWorkspaceBackup()))));
    const encode = bytes => btoa(Array.from(bytes, b => String.fromCharCode(b)).join(''));
    const result = await fetch(endpoint, { method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json', 'If-Match': response.headers.get('ETag') || '"0"' }, body: JSON.stringify({ iv: encode(iv), cipher: encode(cipher) }), signal: AbortSignal.timeout(15000) });
    if (result.status === 409) throw new Error('其他设备已更新云端，请重新读取后再上传。');
    if (!result.ok) throw new Error(`上传失败（${result.status}）`);
    status.textContent = '已加密上传。另一设备输入同一密钥后点击下载；密钥不会上传。';
  }
}
function initWorkspaceTools() {
  const settings = document.getElementById('workspace-settings');
  if (settings.dataset.bound) return;
  settings.dataset.bound = '1';
  const status = document.getElementById('workspace-settings-status');
  const task = fn => async event => { const button = event.currentTarget; button.disabled = true; try { await fn(); } catch (error) { status.textContent = error.message; } finally { button.disabled = false; } };
  document.getElementById('workspace-settings-open').onclick = () => settings.showModal();
  document.getElementById('workspace-updates-open').onclick = () => void openWorkspaceOverview().catch(error => workspaceNotice(error.message));
  document.getElementById('workspace-follow-open').onclick = () => void openWorkspaceOverview('follow').catch(error => workspaceNotice(error.message));
  document.querySelectorAll('[data-close-dialog]').forEach(button => { button.onclick = () => button.closest('dialog').close(); });
  document.getElementById('backup-export').onclick = task(() => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(collectWorkspaceBackup(), null, 2)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = `hjl-reading-${new Date().toISOString().slice(0, 10)}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = '已导出阅读数据和设置。背景图片文件不包含在备份内。';
  });
  document.getElementById('backup-import').onchange = async event => {
    try {
      const file = event.target.files[0]; if (!file) return;
      if (file.size > 4 * 1024 * 1024) throw new Error('备份文件超过 4 MB。');
      const input = JSON.parse(await file.text()); validateWorkspaceBackup(input);
      if (!confirm('替换备份中包含的本机阅读数据和设置？建议先导出备份。')) return;
      applyWorkspaceBackup(input); location.reload();
    } catch (error) { status.textContent = `导入失败，未应用备份：${error.message}`; }
    finally { event.target.value = ''; }
  };
  const rules = document.getElementById('follow-rules'); rules.value = workspaceRead('hjl-follow-v1', []).join('\n');
  document.getElementById('follow-save').onclick = task(() => {
    const list = [...new Set(rules.value.split('\n').map(x => x.trim()).filter(Boolean))];
    if (list.length > 50 || list.some(x => x.length > 100)) throw new Error('最多 50 条规则，每条最多 100 字。');
    localStorage.setItem('hjl-follow-v1', JSON.stringify(list)); status.textContent = '关注规则已保存，可打开「我的关注」查看。';
    if (savedFilter === 'follow') void syncPanel(appData);
  });
  const prefs = workspaceRead('hjl-notifications-v1', {});
  for (const kind of ['updates', 'digest', 'errors']) {
    const input = document.getElementById(`notify-${kind}`); input.checked = Boolean(prefs[kind]);
    input.onchange = () => { prefs[kind] = input.checked; try { localStorage.setItem('hjl-notifications-v1', JSON.stringify(prefs)); } catch (error) { status.textContent = error.message; } };
  }
  document.getElementById('notify-enable').onclick = task(async () => {
    if (typeof Notification === 'undefined') throw new Error('此浏览器不支持系统通知，仍会显示站内提醒。');
    status.textContent = await Notification.requestPermission() === 'granted' ? '系统通知已启用。' : '未获得系统通知权限，仍可使用站内提醒。';
  });
  document.getElementById('sync-generate').onclick = () => { document.getElementById('sync-code').value = Array.from(crypto.getRandomValues(new Uint8Array(32)), x => x.toString(16).padStart(2, '0')).join(''); status.textContent = '请保存此密钥，并在另一设备输入。密钥丢失后无法恢复云端数据。'; };
  document.getElementById('sync-copy').onclick = task(async () => { const code = document.getElementById('sync-code').value; await workspaceSyncCrypto(code); await navigator.clipboard.writeText(code); status.textContent = '密钥已复制，请安全保存。'; });
  document.getElementById('sync-push').onclick = task(() => syncWorkspace('push'));
  document.getElementById('sync-pull').onclick = task(() => syncWorkspace('pull'));
  document.getElementById('sync-delete').onclick = task(() => syncWorkspace('delete'));
  document.getElementById('workspace-health-open').onclick = () => {
    renderHealth(appData);
    const list = document.getElementById('health-list').cloneNode(true); list.removeAttribute('id');
    document.getElementById('workspace-health-body').replaceChildren(list); document.getElementById('workspace-health').showModal();
  };
  const historyDialog = document.getElementById('workspace-history');
  const scope = document.getElementById('history-scope');
  flattenCatalogSources(appData).forEach(key => { const option = document.createElement('option'); option.value = key; option.textContent = getSource(appData, key)?.label || key; scope.append(option); });
  document.getElementById('workspace-history-open').onclick = () => historyDialog.showModal();
  let controller;
  historyDialog.addEventListener('close', () => controller?.abort());
  document.getElementById('history-search-form').onsubmit = async event => {
    event.preventDefault(); controller?.abort(); const active = controller = new AbortController();
    const button = document.getElementById('history-search-submit'); button.disabled = true;
    try { await workspaceHistorySearch(active.signal); } catch (error) { if (!active.signal.aborted) document.getElementById('history-search-status').textContent = error.message; } finally { if (controller === active) button.disabled = false; }
  };
  document.getElementById('item-detail').addEventListener('click', async event => {
    const button = event.target.closest('[data-copy-code]'); if (!button) return;
    try { await navigator.clipboard.writeText(button.closest('pre').querySelector('code').textContent); button.textContent = '已复制'; } catch (_) { button.textContent = '复制失败，请手动选择'; }
  });
  const decorate = () => {
    const detail = document.getElementById('item-detail');
    detail.querySelectorAll('img').forEach(img => { img.loading = 'lazy'; img.decoding = 'async'; });
    detail.querySelectorAll('pre').forEach(pre => { if (pre.querySelector('[data-copy-code]') || !pre.querySelector('code')) return; const button = document.createElement('button'); button.type = 'button'; button.dataset.copyCode = '1'; button.className = 'code-copy'; button.textContent = '复制代码'; pre.prepend(button); });
  };
  new MutationObserver(decorate).observe(document.getElementById('item-detail'), { childList: true, subtree: true }); decorate();
  void checkWorkspaceNotifications().catch(() => {});
  setInterval(async () => {
    if (document.hidden || !navigator.onLine) return;
    try {
      const response = await fetch(`data/meta.json?t=${Date.now()}`, { cache: 'no-store', signal: AbortSignal.timeout(15000) });
      if (!response.ok) return;
      const next = await response.json();
      if (META_SYNC_PLATFORMS.some(p => resolveMetaTimestamp(next, p.field) !== resolveMetaTimestamp(appData, p.field))) {
        appData = next; Object.keys(latestSourceCache).forEach(key => delete latestSourceCache[key]); paletteItemIndex = null;
        const index = await fetch(`data/manifest.json?t=${Date.now()}`, { cache: 'no-store', signal: AbortSignal.timeout(15000) });
        if (index.ok) manifest = await index.json();
        renderMeta(appData); renderHealth(appData); workspaceNotice('网站已发布新数据。点击「新增」查看，当前阅读内容保持不变。');
      }
      await checkWorkspaceNotifications();
    } catch (_) {}
  }, 5 * 60000);
}
if (typeof module !== 'undefined') module.exports = { workspaceHealth, workspaceChanges, workspaceItemVersion, validateWorkspaceBackup, applyWorkspaceBackup, workspaceSyncCrypto };
