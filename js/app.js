const DATA_URL = "data/content.json";
const META_URL = "data/meta.json";
const MANIFEST_URL = "data/manifest.json";
const LIVE_ENDPOINTS_URL = "data/live-endpoints.json";
const SOURCES_BASE = "data/sources";
const DATES_STORAGE_KEY = "hjl-source-dates";
const SEEN_STORAGE_KEY = "hjl-seen-v1";
const SEEN_MAX_PER_SOURCE = 400;
const PINS_STORAGE_KEY = "hjl-pins-v1";
const WORKSTATION_KEY = "hjl-workstation";
const DENSITY_KEY = "hjl-density";
const FOCUS_KEY = "hjl-focus";
let facetFilter = "", accessFilter = "", savedFilter = "", yearFilter = "", sortOrder = "default";
let filterSourceKey = "";
const SAVED_ITEMS_KEY = "hjl-saved-items-v1";
let savedItems = {};
try { savedItems = JSON.parse(localStorage.getItem(SAVED_ITEMS_KEY) || "{}"); } catch (_) {}
if (!savedItems || typeof savedItems !== "object" || Array.isArray(savedItems)) savedItems = {};
const WEIBO_REALTIME_KEY = "weiboRealtime";
const BOARD_SHORTCUTS = [
  "github",
  "hackernews",
  "weibo",
  "chinaDaily",
  "journals",
  "natureSkills",
  "scientificSkills",
];

/** @type {Record<string, string>} */
let liveEndpoints = {};
/** @type {'idle'|'loading'|'live'|'fallback'|'unconfigured'} */
let weiboRealtimeLiveStatus = "idle";
let weiboRealtimeLiveFetchedAt = "";

const DEFAULT_CATALOG = [
  {
    id: "github",
    label: "GitHub",
    children: [
      { id: "github", sourceKey: "github" },
      { id: "githubActive", sourceKey: "githubActive" },
    ],
  },
  {
    id: "hackernews",
    label: "Hacker News",
    children: [{ id: "hackernews", sourceKey: "hackernews" }],
  },
  {
    id: "weibo",
    label: "微博",
    children: [
      { id: "weibo", sourceKey: "weibo" },
      { id: "weiboRealtime", sourceKey: "weiboRealtime" },
      { id: "weiboLocal", sourceKey: "weiboLocal" },
    ],
  },
  {
    id: "chinaDaily",
    label: "China Daily",
    children: [{ id: "chinaDaily", sourceKey: "chinaDaily" }],
  },
  {
    id: "journals",
    label: "MRI 顶刊",
    children: [
      { id: "mrm", sourceKey: "mrm" },
      { id: "tmi", sourceKey: "tmi" },
      { id: "media", sourceKey: "media" },
    ],
  },
  {
    id: "natureSkills",
    label: "Nature Skills",
    children: [
      { id: "natureSkills", sourceKey: "natureSkills" },
      { id: "natureSkillsCommits", sourceKey: "natureSkillsCommits" },
    ],
  },
  {
    id: "scientificSkills",
    label: "Scientific Skills",
    children: [
      { id: "scientificSkills", sourceKey: "scientificSkills" },
      { id: "scientificSkillsCommits", sourceKey: "scientificSkillsCommits" },
    ],
  },
];

let appData = null;
let manifest = null;
let activeParentId = "github";
let activeSourceKey = "github";
let activeItemIndex = 0;
let searchQuery = "";
let selectedDates = {};
const historyCache = {};
const latestSourceCache = {};
let suppressHashWrite = false;
let seenStore = {};
let pinStore = [];
let currentSourceRef = null;
let panelSyncSeq = 0;
const readmeCache = {};
const readmeInflight = {};
let paletteItemIndex = null;
let paletteItemPromise = null;

const PLATFORM_META = {
  github: { theme: "theme-github", short: "GH", name: "GitHub" },
  githubActive: { theme: "theme-github", short: "GH", name: "GitHub" },
  hackernews: { theme: "theme-hn", short: "HN", name: "Hacker News" },
  weibo: { theme: "theme-weibo", short: "WB", name: "微博" },
  weiboRealtime: { theme: "theme-weibo", short: "WB", name: "微博" },
  weiboLocal: { theme: "theme-weibo", short: "WB", name: "微博" },
  chinaDaily: { theme: "theme-chinadaily", short: "CD", name: "China Daily" },
  mrm: { theme: "theme-journals", short: "MR", name: "MRM" },
  tmi: { theme: "theme-journals", short: "TM", name: "TMI" },
  media: { theme: "theme-journals", short: "MD", name: "MedIA" },
  natureSkills: { theme: "theme-nature", short: "NS", name: "Nature Skills" },
  natureSkillsCommits: { theme: "theme-nature", short: "NS", name: "Nature Skills" },
  scientificSkills: { theme: "theme-scientific", short: "SA", name: "Scientific Skills" },
  scientificSkillsCommits: { theme: "theme-scientific", short: "SA", name: "Scientific Skills" },
};

const JOURNAL_KEYS = new Set(["mrm", "tmi", "media"]);
const NATURE_SKILLS_KEYS = new Set(["natureSkills", "natureSkillsCommits"]);
const SCIENTIFIC_SKILLS_KEYS = new Set(["scientificSkills", "scientificSkillsCommits"]);
const TRACKED_SKILLS_KEYS = new Set([...NATURE_SKILLS_KEYS, ...SCIENTIFIC_SKILLS_KEYS]);

const TRACKED_SKILLS_REPO = {
  natureSkills: "Yuan1z0825/nature-skills",
  natureSkillsCommits: "Yuan1z0825/nature-skills",
  scientificSkills: "K-Dense-AI/scientific-agent-skills",
  scientificSkillsCommits: "K-Dense-AI/scientific-agent-skills",
};

const META_SYNC_PLATFORMS = [
  { id: "github", label: "GitHub", schedule: "每周一", field: "githubUpdatedAt", maxAgeHours: 8 * 24 },
  { id: "hackernews", label: "Hacker News", schedule: "每日 10/22 点", field: "hackernewsUpdatedAt", maxAgeHours: 36 },
  { id: "weibo", label: "微博", schedule: "每 6 小时", field: "weiboUpdatedAt", maxAgeHours: 9 },
  { id: "chinaDaily", label: "China Daily", schedule: "每天", field: "chinaDailyUpdatedAt", maxAgeHours: 36 },
  { id: "journals", label: "MRI 顶刊", schedule: "每月 1/15 日", field: "journalsUpdatedAt", maxAgeHours: 20 * 24 },
  { id: "natureSkills", label: "Nature Skills", schedule: "每日 10/22 点", field: "natureSkillsUpdatedAt", maxAgeHours: 36 },
  { id: "scientificSkills", label: "Scientific Skills", schedule: "每日 10/22 点", field: "scientificSkillsUpdatedAt", maxAgeHours: 36 },
];

function getPlatformMeta(sourceKey) {
  return PLATFORM_META[sourceKey] || PLATFORM_META.github;
}

function getParentTheme(parentId) {
  const map = {
    github: "theme-github",
    hackernews: "theme-hn",
    weibo: "theme-weibo",
    chinaDaily: "theme-chinadaily",
    journals: "theme-journals",
    natureSkills: "theme-nature",
    scientificSkills: "theme-scientific",
  };
  return map[parentId] || "theme-github";
}

function clearSearchInputs() {
  searchQuery = "";
  const main = document.getElementById("search-input");
  const gh = document.getElementById("gh-chrome-search");
  if (main) main.value = "";
  if (gh) gh.value = "";
}

function metaPill(text, type = "default") {
  if (!text) return "";
  const cls = type === "default" ? "meta-pill" : `meta-pill meta-pill--${type}`;
  return `<span class="${cls}">${escapeHtml(text)}</span>`;
}

function applyPanelTheme() {
  const meta = getPlatformMeta(activeSourceKey);
  const panel = document.getElementById("content-panel");
  if (panel) {
    panel.className = `content-panel ${meta.theme}`;
  }
  document.documentElement.setAttribute("data-platform", activeParentId);
  highlightMetaPlatform(activeParentId);
  updatePlatformChrome(activeParentId);
}

function updatePlatformChrome(parentId) {
  const brand = document.getElementById("gh-chrome-brand");
  const sub = document.getElementById("gh-chrome-sub");
  if (brand && sub) {
    if (parentId === "natureSkills") {
      brand.textContent = "Nature Skills";
      sub.textContent = "Agent skills · Explore";
    } else if (parentId === "scientificSkills") {
      brand.textContent = "Scientific Skills";
      sub.textContent = "Agent skills · Explore";
    } else {
      brand.textContent = "Explore";
      sub.textContent = "Trending repositories";
    }

    document.querySelectorAll(".gh-chrome-nav a").forEach((link) => {
      const hash = link.getAttribute("href") || "";
      const active =
        (parentId === "github" && hash === "#/github") ||
        (parentId === "natureSkills" && hash === "#/natureSkills") ||
        (parentId === "scientificSkills" && hash === "#/scientificSkills");
      link.classList.toggle("is-active", active);
    });
  }

  document.querySelectorAll(".weibo-chrome-nav a").forEach((link) => {
    const board = link.getAttribute("data-weibo-board") || "";
    link.classList.toggle("is-active", board === activeSourceKey);
  });
}

function highlightMetaPlatform(platformId) {
  document.querySelectorAll(".meta-sync-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.platform === platformId);
  });
  document.querySelectorAll(".ws-chip").forEach((item) => {
    item.classList.toggle("is-active", item.dataset.parentId === platformId);
  });
}

function resolveMetaTimestamp(data, field) {
  if (data[field]) return data[field];
  if (
    field === "githubUpdatedAt" ||
    field === "hackernewsUpdatedAt" ||
    field === "weiboUpdatedAt" ||
    field === "natureSkillsUpdatedAt" ||
    field === "scientificSkillsUpdatedAt"
  ) {
    return data.updatedAt;
  }
  return null;
}

function formatDate(iso) {
  if (!iso) return "未知";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** History snapshot id → readable label (keeps plain YYYY-MM-DD as-is). */
function formatSnapshotLabel(dateKey) {
  if (!dateKey || dateKey === "latest") return dateKey;
  const stamped = /^(\d{4}-\d{2}-\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(dateKey);
  if (stamped) {
    return `${stamped[1]} ${stamped[2]}:${stamped[3]}`;
  }
  return dateKey;
}

function formatShortDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" });
}

function loadStoredDates() {
  try {
    const raw = localStorage.getItem(DATES_STORAGE_KEY);
    if (raw) selectedDates = JSON.parse(raw);
  } catch (_) {}
}

function persistDates() {
  try {
    localStorage.setItem(DATES_STORAGE_KEY, JSON.stringify(selectedDates));
  } catch (_) {}
}

function loadSeenStore() {
  try {
    const raw = JSON.parse(localStorage.getItem(SEEN_STORAGE_KEY) || "{}");
    return raw && typeof raw === "object" ? raw : {};
  } catch (_) {
    return {};
  }
}

function persistSeenStore() {
  try {
    localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(seenStore));
  } catch (_) {}
}

function itemFingerprint(item) {
  if (!item) return "";
  if (item.url) return `u:${item.url}`;
  if (item.sha) return `s:${item.sha}|${item.title || ""}`;
  if (item.doi) return `d:${item.doi}`;
  return `t:${item.title || ""}|${item.published || ""}|${item.label || ""}`;
}

function getSeenSet(sourceKey) {
  const list = seenStore[sourceKey];
  return new Set(Array.isArray(list) ? list : []);
}

function bootstrapSeenIfNeeded(sourceKey, items) {
  if (Object.prototype.hasOwnProperty.call(seenStore, sourceKey)) return false;
  seenStore[sourceKey] = (items || []).map(itemFingerprint).filter(Boolean).slice(0, SEEN_MAX_PER_SOURCE);
  persistSeenStore();
  return true;
}

function isItemNew(sourceKey, item) {
  if (!Object.prototype.hasOwnProperty.call(seenStore, sourceKey)) return false;
  return !getSeenSet(sourceKey).has(itemFingerprint(item));
}

function markItemSeen(sourceKey, item) {
  if (!item) return;
  const fp = itemFingerprint(item);
  if (!fp) return;
  const list = Array.isArray(seenStore[sourceKey]) ? seenStore[sourceKey].slice() : [];
  if (list.includes(fp)) return;
  list.unshift(fp);
  seenStore[sourceKey] = list.slice(0, SEEN_MAX_PER_SOURCE);
  persistSeenStore();
}

function markSourceSeen(sourceKey, items) {
  seenStore[sourceKey] = (items || []).map(itemFingerprint).filter(Boolean).slice(0, SEEN_MAX_PER_SOURCE);
  persistSeenStore();
}

function countNewItems(sourceKey, items) {
  if (!Object.prototype.hasOwnProperty.call(seenStore, sourceKey)) return 0;
  const seen = getSeenSet(sourceKey);
  return (items || []).reduce((n, item) => n + (seen.has(itemFingerprint(item)) ? 0 : 1), 0);
}

function loadPins() {
  try {
    const raw = JSON.parse(localStorage.getItem(PINS_STORAGE_KEY) || "[]");
    return Array.isArray(raw) ? raw.filter((x) => typeof x === "string") : [];
  } catch (_) {
    return [];
  }
}

function persistPins() {
  try {
    localStorage.setItem(PINS_STORAGE_KEY, JSON.stringify(pinStore));
  } catch (_) {}
}

function isPinned(sourceKey) {
  return pinStore.includes(sourceKey);
}

function togglePin(sourceKey) {
  if (!sourceKey) return;
  if (isPinned(sourceKey)) {
    pinStore = pinStore.filter((key) => key !== sourceKey);
  } else {
    pinStore = [sourceKey, ...pinStore.filter((key) => key !== sourceKey)].slice(0, 12);
  }
  persistPins();
}

function updatePinButton() {
  const btn = document.getElementById("pin-source-btn");
  if (!btn) return;
  const pinned = isPinned(activeSourceKey);
  btn.textContent = pinned ? "取消钉选" : "钉选栏目";
  btn.setAttribute("aria-pressed", pinned ? "true" : "false");
  btn.classList.toggle("is-active", pinned);
}

function healthStatus(iso, platform) {
  return workspaceHealth(iso, platform?.id || activeParentId);
}

function platformForSource(parentId, sourceKey) {
  return (
    META_SYNC_PLATFORMS.find((p) => {
      if (p.id === "journals") return ["mrm", "tmi", "media"].includes(sourceKey);
      if (p.id === "github") return sourceKey === "github" || sourceKey === "githubActive";
      if (p.id === "natureSkills") return sourceKey.startsWith("nature");
      if (p.id === "scientificSkills") return sourceKey.startsWith("scientific");
      return p.id === parentId || p.id === sourceKey;
    }) || null
  );
}

function isWorkstation() {
  return document.documentElement.getAttribute("data-workstation") !== "0";
}

function setWorkstation(on) {
  document.documentElement.setAttribute("data-workstation", on ? "1" : "0");
  try {
    localStorage.setItem(WORKSTATION_KEY, on ? "1" : "0");
  } catch (_) {}
  syncWorkstationButtons();
}

function getDensity() {
  return document.documentElement.getAttribute("data-density") === "comfortable"
    ? "comfortable"
    : "compact";
}

function setDensity(mode) {
  const next = mode === "comfortable" ? "comfortable" : "compact";
  document.documentElement.setAttribute("data-density", next);
  try {
    localStorage.setItem(DENSITY_KEY, next);
  } catch (_) {}
  syncWorkstationButtons();
}

function isFocusMode() {
  return document.documentElement.getAttribute("data-focus") === "1";
}

function setFocusMode(on) {
  if (on) document.documentElement.setAttribute("data-focus", "1");
  else document.documentElement.removeAttribute("data-focus");
  try {
    localStorage.setItem(FOCUS_KEY, on ? "1" : "0");
  } catch (_) {}
  syncWorkstationButtons();
}

function syncWorkstationButtons() {
  const layoutBtn = document.getElementById("ws-layout-btn");
  const focusBtn = document.getElementById("ws-focus-btn");
  const densityBtn = document.getElementById("ws-density-btn");
  const on = isWorkstation();
  if (layoutBtn) {
    layoutBtn.textContent = on ? "工作站" : "经典";
    layoutBtn.setAttribute("aria-pressed", on ? "true" : "false");
  }
  if (focusBtn) {
    const focus = isFocusMode();
    focusBtn.setAttribute("aria-pressed", focus ? "true" : "false");
    focusBtn.textContent = focus ? "退出专注" : "专注";
  }
  if (densityBtn) {
    densityBtn.textContent = getDensity() === "compact" ? "紧凑" : "舒适";
  }
}

function firstSourceForParent(data, parentId) {
  const parent = getCatalog(data).find((node) => node.id === parentId);
  return parent?.children?.[0]?.sourceKey || parentId;
}

function flattenCatalogSources(data) {
  const keys = [];
  getCatalog(data).forEach((parent) => {
    parent.children?.forEach((child) => keys.push(child.sourceKey));
  });
  return keys;
}

function jumpToSource(data, sourceKey, itemIndex = 0) {
  let targetKey = sourceKey;
  let meta = findSourceMeta(data, targetKey);
  if (!meta && targetKey) {
    targetKey = firstSourceForParent(data, targetKey);
    meta = findSourceMeta(data, targetKey);
  }
  if (!meta) return;
  activeParentId = meta.parentId;
  activeSourceKey = meta.sourceKey;
  clearSearchInputs();
  activeItemIndex = Math.max(0, Number(itemIndex) || 0);
  renderTree(data);
  renderMobileNav(data);
  renderMobileSubnav(data);
  updatePinButton();
  void syncPanel(data, { preserveItemIndex: true });
}

function cycleSource(data, delta) {
  const keys = flattenCatalogSources(data);
  if (!keys.length) return;
  const idx = keys.indexOf(activeSourceKey);
  const next = keys[(Math.max(idx, 0) + delta + keys.length) % keys.length];
  jumpToSource(data, next);
}

function renderHealth(data) {
  const list = document.getElementById("health-list");
  if (list) {
    list.innerHTML = META_SYNC_PLATFORMS.map((platform) => {
      const iso = resolveMetaTimestamp(data, platform.field);
      const status = healthStatus(iso, platform);
      const time = iso ? formatDate(iso) : "暂无记录";
      return `<li class="health-item health-${status.level}">
        <span class="health-dot" aria-hidden="true"></span>
        <span class="health-label">${escapeHtml(platform.label)}</span>
        <span class="health-status">${escapeHtml(status.label)}</span>
        <span class="health-time">上次：${escapeHtml(time)}<br>下一计划：${escapeHtml(formatDate(status.next))}</span>
      </li>`;
    }).join("");
  }

  const rail = document.getElementById("ws-status");
  if (!rail) return;
  rail.innerHTML = META_SYNC_PLATFORMS.map((platform) => {
    const iso = resolveMetaTimestamp(data, platform.field);
    const status = healthStatus(iso, platform);
    const sourceKey = firstSourceForParent(data, platform.id);
    const active = activeParentId === platform.id ? " is-active" : "";
    return `<a class="ws-chip health-${status.level}${active}" href="#/${encodeURIComponent(sourceKey)}" data-source-key="${sourceKey}" data-parent-id="${platform.id}" title="${escapeHtml(platform.label)} · ${escapeHtml(status.label)}">
      <span class="ws-chip-dot" aria-hidden="true"></span>
      <span>${escapeHtml(platform.label)}</span>
    </a>`;
  }).join("");
  if (rail.dataset.bound !== "1") {
    rail.dataset.bound = "1";
    rail.addEventListener("click", (event) => {
      const chip = event.target.closest("[data-source-key]");
      if (!chip || !rail.contains(chip)) return;
      event.preventDefault();
      jumpToSource(data, chip.getAttribute("data-source-key"));
    });
  }
}

function updateNewHints(sourceKey, items) {
  const newCount = countNewItems(sourceKey, items);
  const banner = document.getElementById("new-items-banner");
  const hint = document.getElementById("list-new-hint");
  const markBtn = document.getElementById("mark-read-btn");

  if (banner) {
    if (newCount > 0) {
      banner.hidden = false;
      banner.textContent = `自上次浏览后，本栏目有 ${newCount} 条新内容`;
    } else {
      banner.hidden = true;
      banner.textContent = "";
    }
  }
  if (hint) {
    if (newCount > 0) {
      hint.hidden = false;
      hint.textContent = `${newCount} 新`;
    } else {
      hint.hidden = true;
      hint.textContent = "";
    }
  }
  if (markBtn) {
    markBtn.hidden = newCount === 0;
  }
}

function getLatestUpdatedAt(data, sourceKey) {
  if (
    sourceKey === WEIBO_REALTIME_KEY &&
    weiboRealtimeLiveStatus === "live" &&
    weiboRealtimeLiveFetchedAt
  ) {
    return weiboRealtimeLiveFetchedAt;
  }
  if (
    (sourceKey === "weibo" || sourceKey === WEIBO_REALTIME_KEY || sourceKey === "weiboLocal") &&
    data.weiboUpdatedAt
  ) {
    return data.weiboUpdatedAt;
  }
  if (sourceKey === "hackernews" && data.hackernewsUpdatedAt) return data.hackernewsUpdatedAt;
  if (sourceKey === "chinaDaily" && data.chinaDailyUpdatedAt) return data.chinaDailyUpdatedAt;
  if ((sourceKey === "github" || sourceKey === "githubActive") && data.githubUpdatedAt) {
    return data.githubUpdatedAt;
  }
  if (NATURE_SKILLS_KEYS.has(sourceKey) && data.natureSkillsUpdatedAt) {
    return data.natureSkillsUpdatedAt;
  }
  if (SCIENTIFIC_SKILLS_KEYS.has(sourceKey) && data.scientificSkillsUpdatedAt) {
    return data.scientificSkillsUpdatedAt;
  }
  if (JOURNAL_KEYS.has(sourceKey) && data.journalsUpdatedAt) return data.journalsUpdatedAt;
  return data.updatedAt;
}

async function loadLiveEndpoints() {
  try {
    const res = await fetch(`${LIVE_ENDPOINTS_URL}?t=${Date.now()}`);
    if (!res.ok) return;
    const data = await res.json();
    if (data && typeof data === "object") liveEndpoints = data;
  } catch (_) {
    /* optional config */
  }
}

function weiboRealtimeLiveUrl() {
  const raw = (liveEndpoints[WEIBO_REALTIME_KEY] || "").trim();
  return raw || "";
}

async function fetchWeiboRealtimeLive() {
  const endpoint = weiboRealtimeLiveUrl();
  if (!endpoint) {
    weiboRealtimeLiveStatus = "unconfigured";
    weiboRealtimeLiveFetchedAt = "";
    return null;
  }
  weiboRealtimeLiveStatus = "loading";
  try {
    const res = await fetch(`${endpoint.replace(/\/+$/, "")}/realtime?t=${Date.now()}`, {
      credentials: "omit",
    });
    if (!res.ok) throw new Error(`live ${res.status}`);
    const snapshot = await res.json();
    if (!snapshot || !Array.isArray(snapshot.items)) throw new Error("live payload invalid");
    weiboRealtimeLiveStatus = "live";
    weiboRealtimeLiveFetchedAt = snapshot.fetchedAt || snapshot.savedAt || new Date().toISOString();
    snapshot.live = true;
    return snapshot;
  } catch (_) {
    weiboRealtimeLiveStatus = "fallback";
    weiboRealtimeLiveFetchedAt = "";
    return null;
  }
}

function weiboRealtimeLiveHint() {
  if (weiboRealtimeLiveStatus === "live" && weiboRealtimeLiveFetchedAt) {
    return `【即时拉取 ${formatDate(weiboRealtimeLiveFetchedAt)}】`;
  }
  if (weiboRealtimeLiveStatus === "fallback") {
    return "【即时代理不可用，已回退静态快照】";
  }
  if (weiboRealtimeLiveStatus === "unconfigured") {
    return "【未配置 live 代理，显示静态快照；见 workers/README.md】";
  }
  if (weiboRealtimeLiveStatus === "loading") {
    return "【正在即时拉取…】";
  }
  return "";
}

async function resolveSource(data, sourceKey = activeSourceKey, { lite = false } = {}) {
  const dateKey = selectedDates[sourceKey] || "latest";
  if (dateKey === "latest") {
    // Weibo「实时」：每次进入都优先走 live 代理（不吃 latestSourceCache）
    if (sourceKey === WEIBO_REALTIME_KEY && !lite) {
      const live = await fetchWeiboRealtimeLive();
      if (live) {
        if (data.sources?.[sourceKey]) {
          data.sources[sourceKey].itemCount = (live.items || []).length;
          data.sources[sourceKey].label = live.label || data.sources[sourceKey].label;
          data.sources[sourceKey].description =
            live.description || data.sources[sourceKey].description;
        }
        return live;
      }
    }

    const cacheBucket = lite ? `${sourceKey}::lite` : sourceKey;
    if (latestSourceCache[cacheBucket]) return latestSourceCache[cacheBucket];

    const url = lite
      ? `${SOURCES_BASE}/${sourceKey}.lite.json`
      : `${SOURCES_BASE}/${sourceKey}.json`;
    try {
      const res = await fetch(`${url}?t=${Date.now()}`);
      if (res.ok) {
        const snapshot = await res.json();
        latestSourceCache[cacheBucket] = snapshot;
        if (!lite && data.sources?.[sourceKey]) {
          data.sources[sourceKey].itemCount = (snapshot.items || []).length;
          data.sources[sourceKey].label = snapshot.label || data.sources[sourceKey].label;
          data.sources[sourceKey].description =
            snapshot.description || data.sources[sourceKey].description;
        }
        return snapshot;
      }
      // Older deploys may not have .lite.json yet — fall back to full payload.
      if (lite) return resolveSource(data, sourceKey, { lite: false });
    } catch (_) {
      if (lite) {
        try {
          return await resolveSource(data, sourceKey, { lite: false });
        } catch (__) {
          /* fall through */
        }
      }
      /* fall through to embedded content.json sources */
    }

    const embedded = getSource(data, sourceKey);
    if (embedded?.items) {
      latestSourceCache[cacheBucket] = embedded;
      return embedded;
    }
    throw new Error(`栏目数据加载失败 (${sourceKey})`);
  }

  const cacheKey = `${sourceKey}:${dateKey}${lite ? ":lite" : ""}`;
  if (historyCache[cacheKey]) return historyCache[cacheKey];

  const url = `data/history/${sourceKey}/${dateKey}.json`;
  const res = await fetch(`${url}?t=${Date.now()}`);
  if (!res.ok) throw new Error(`历史快照加载失败 (${res.status})`);
  const snapshot = await res.json();
  historyCache[cacheKey] = snapshot;
  return snapshot;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text ?? "";
  return div.innerHTML;
}

function plainText(text) {
  const div = document.createElement("div");
  div.innerHTML = String(text ?? "");
  return (div.textContent || "").replace(/\s+/g, " ").trim();
}

function getCatalog(data) {
  return data.catalog?.length ? data.catalog : DEFAULT_CATALOG;
}

function getSource(data, key) {
  return data.sources?.[key] ?? null;
}

function sourceItemCount(source) {
  if (!source) return 0;
  if (Array.isArray(source.items)) return source.items.length;
  if (source.itemCount != null) return Number(source.itemCount) || 0;
  return 0;
}

function filterItems(items) {
  const q = searchQuery.trim().toLowerCase();
  const rows = items.map((item, index) => ({ item, index })).filter(({ item }) => {
    const saved = savedItems[itemFingerprint(item)];
    const facet = item.category || item.language || item.journal || item.label || "";
    return (!q || itemSearchHay(item).includes(q)) &&
      (!facetFilter || facet === facetFilter) &&
      (!yearFilter || String(item.published || "").slice(0, 4) === yearFilter) &&
      (!accessFilter || (accessFilter === "oa" ? item.isOpenAccess : Boolean(item.pdfUrl || item.pdfAvailable))) &&
      (!savedFilter || (savedFilter === "saved" ? saved?.saved : savedFilter === "later" ? saved?.later : savedFilter === "new" ? isItemNew(activeSourceKey, item) : workspaceMatches(item)));
  });
  if (sortOrder !== "default") rows.sort((a, b) => {
    if (sortOrder === "date") return String(b.item.published || b.item.createdAt || b.item.date || "").localeCompare(String(a.item.published || a.item.createdAt || a.item.date || ""));
    if (sortOrder === "createdAt" || sortOrder === "pushedAt") return String(b.item[sortOrder] || "").localeCompare(String(a.item[sortOrder] || ""));
    return (Number(b.item[sortOrder]) || 0) - (Number(a.item[sortOrder]) || 0);
  });
  return rows;
}

function fillContentFilters(items) {
  if (filterSourceKey !== activeSourceKey) {
    facetFilter = accessFilter = savedFilter = yearFilter = "";
    sortOrder = "default";
    filterSourceKey = activeSourceKey;
  }
  const facets = [...new Set(items.map(item => item.category || item.language || item.journal || item.label).filter(Boolean))].sort();
  const select = document.getElementById("facet-select");
  if (!select) return;
  select.innerHTML = `<option value="">全部</option>` + facets.map(value => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("");
  if (!facets.includes(facetFilter)) facetFilter = "";
  select.value = facetFilter;
  document.getElementById("facet-label").hidden = !facets.length;
  const journal = isJournalSource(activeSourceKey);
  document.getElementById("access-label").hidden = !journal;
  document.getElementById("access-select").value = accessFilter;
  const years = [...new Set(items.map(item => String(item.published || "").slice(0, 4)).filter(year => /^\d{4}$/.test(year)))].sort().reverse();
  const year = document.getElementById("year-select");
  year.innerHTML = `<option value="">全部年份</option>` + years.map(value => `<option value="${value}">${value}</option>`).join("");
  if (!years.includes(yearFilter)) yearFilter = "";
  year.value = yearFilter;
  document.getElementById("year-label").hidden = !journal;
  document.getElementById("search-input").placeholder = journal ? "研究方向 / 作者 / DOI / 标题…" : isTrackedSkillsSource(activeSourceKey) ? "技能名称 / 用途 / 描述…" : "标题 / 描述 / 语言…";
  document.getElementById("saved-select").value = savedFilter;
  const options = [["default", "原榜单顺序"], ...[["stars", "Star 数"], ["score", "热度 / 分数"], ["comments", "评论数"]].filter(([key]) => items.some(item => item[key] != null))];
  if (items.some(item => item.published || item.createdAt || item.date)) options.push(["date", "发布时间"]);
  if (items.some(item => item.createdAt)) options.push(["createdAt", "仓库创建时间"]);
  if (items.some(item => item.pushedAt)) options.push(["pushedAt", "最近推送时间"]);
  const sort = document.getElementById("sort-select");
  sort.innerHTML = options.map(([value, label]) => `<option value="${value}">${label}</option>`).join("");
  if (!options.some(([value]) => value === sortOrder)) sortOrder = "default";
  sort.value = sortOrder;
  document.querySelector(".reading-settings").hidden = !feedHasSplitDetail();
  if (!feedHasSplitDetail()) document.getElementById("content-panel").removeAttribute("data-reader");
}

function updateContentStatus(source) {
  const date = selectedDates[activeSourceKey] || "latest";
  const history = date !== "latest";
  const status = document.getElementById("content-status-text");
  const time = source.savedAt || getLatestUpdatedAt(appData, activeSourceKey);
  let label = history ? `历史快照 · ${formatSnapshotLabel(date)}` : `网站数据截至 ${time ? formatDate(time) : "暂无记录"}`;
  if (!history && activeSourceKey === WEIBO_REALTIME_KEY) label = weiboRealtimeLiveHint() || label;
  status.textContent = label;
  status.parentElement.classList.toggle("is-history", history);
  document.getElementById("back-to-latest").hidden = !history;
  const entries = manifest?.sources?.[activeSourceKey] || [];
  const day = document.getElementById("history-day");
  day.min = entries.at(-1)?.day || entries.at(-1)?.date?.slice(0, 10) || "";
  day.max = entries[0]?.day || entries[0]?.date?.slice(0, 10) || "";
  day.value = history ? date.slice(0, 10) : "";
  document.getElementById("history-day-hint").textContent = `${entries.length} 份快照 · 最多保留 120 份`;
}

function savedItemButtons(item, index) {
  const state = savedItems[itemFingerprint(item)] || {};
  return `<button type="button" class="item-save-btn" data-save-index="${index}" data-save-kind="saved" aria-pressed="${Boolean(state.saved)}" aria-label="${state.saved ? "取消收藏" : "收藏"}：${escapeHtml(item.title)}" title="收藏">${state.saved ? "★" : "☆"}</button><button type="button" class="item-save-btn" data-save-index="${index}" data-save-kind="later" aria-pressed="${Boolean(state.later)}" aria-label="${state.later ? "移出" : "加入"}稍后阅读：${escapeHtml(item.title)}" title="稍后阅读">◷</button>`;
}

function decorateReadingDetail(item) {
  const detail = document.getElementById("item-detail");
  if (!detail || !item) {
    document.getElementById("reading-progress").hidden = true;
    return;
  }
  detail.insertAdjacentHTML("afterbegin", `<div class="reader-actions">${savedItemButtons(item, activeItemIndex)}<span>收藏 / 稍后阅读 · 保存在当前浏览器</span></div>`);
  const dates = [["创建", item.createdAt], ["最近推送", item.pushedAt], ["发表", item.published]].filter(([, value]) => value);
  if (dates.length) detail.querySelector(".reader-actions").insertAdjacentHTML("afterend", `<p class="reader-dates">${dates.map(([label, value]) => `${label}：${escapeHtml(String(value).slice(0, 10))}`).join(" · ")}</p>`);
  const headings = [...detail.querySelectorAll(".markdown-body h1, .markdown-body h2, .markdown-body h3")];
  if (headings.length > 1) {
    const toc = document.createElement("details");
    toc.className = "reader-toc";
    toc.innerHTML = `<summary>正文目录 · ${headings.length} 节</summary><nav aria-label="正文目录">${headings.map((heading, index) => `<button type="button" class="btn-text" data-heading-index="${index}">${escapeHtml(heading.textContent)}</button>`).join("")}</nav>`;
    detail.querySelector(".reader-actions").after(toc);
    toc.addEventListener("click", event => {
      const button = event.target.closest("[data-heading-index]");
      if (button) headings[Number(button.dataset.headingIndex)]?.scrollIntoView({ block: "start" });
    });
  }
  const progress = document.getElementById("reading-progress");
  progress.hidden = !feedHasSplitDetail();
  progress.value = 0;
}

function bindReadingTools() {
  const toolsPanel = document.querySelector(".content-tools-panel");
  const mobile = window.matchMedia("(max-width: 860px)");
  toolsPanel.open = !mobile.matches;
  mobile.addEventListener("change", event => { toolsPanel.open = !event.matches; });
  const repaint = () => {
    if (!currentSourceRef) return;
    const rows = filterItems(currentSourceRef.items || []);
    if (rows.length && !rows.some(row => row.index === activeItemIndex)) activeItemIndex = rows[0].index;
    renderActiveList(currentSourceRef, activeItemIndex);
    renderActiveDetail(rows.length ? currentSourceRef.items[activeItemIndex] : null, activeItemIndex);
  };
  document.getElementById("facet-select").onchange = event => { facetFilter = event.target.value; repaint(); };
  document.getElementById("access-select").onchange = event => { accessFilter = event.target.value; repaint(); };
  document.getElementById("year-select").onchange = event => { yearFilter = event.target.value; repaint(); };
  document.getElementById("saved-select").onchange = event => { savedFilter = event.target.value; repaint(); };
  document.getElementById("sort-select").onchange = event => { sortOrder = event.target.value; repaint(); };
  document.getElementById("back-to-latest").onclick = () => {
    const select = document.getElementById("date-select");
    select.value = "latest";
    select.onchange();
  };
  document.getElementById("history-day").onchange = event => {
    const entry = (manifest?.sources?.[activeSourceKey] || []).find(row => (row.day || row.date.slice(0, 10)) === event.target.value);
    if (!entry) {
      document.getElementById("history-day-hint").textContent = "这一天没有保存快照，请选择其他日期。";
      return;
    }
    const select = document.getElementById("date-select");
    select.value = entry.date;
    select.onchange();
  };
  document.getElementById("content-panel").addEventListener("click", event => {
    const button = event.target.closest("[data-save-index]");
    if (!button) return;
    const item = currentSourceRef?.items?.[Number(button.dataset.saveIndex)];
    if (!item) return;
    const key = itemFingerprint(item), kind = button.dataset.saveKind;
    if (kind !== "saved" && kind !== "later") return;
    const previous = savedItems[key];
    const next = { ...previous, [kind]: !previous?.[kind] };
    savedItems[key] = next;
    if (!next.saved && !next.later) delete savedItems[key];
    try { localStorage.setItem(SAVED_ITEMS_KEY, JSON.stringify(savedItems)); }
    catch (_) {
      if (previous) savedItems[key] = previous; else delete savedItems[key];
      document.getElementById("network-status").textContent = "浏览器存储不可用，未能保存阅读清单。";
      return;
    }
    repaint();
  });
  const split = document.getElementById("split-width"), size = document.getElementById("reader-size");
  try {
    const value = Number(localStorage.getItem("hjl-split-width"));
    if (value >= 30 && value <= 65) split.value = value;
    const font = localStorage.getItem("hjl-reader-size");
    if (["15", "17", "19"].includes(font)) size.value = font;
  } catch (_) {}
  const updateReading = () => {
    document.documentElement.style.setProperty("--list-width", `${Number(split.value)}%`);
    document.documentElement.style.setProperty("--reader-font-size", `${Number(size.value)}px`);
    try { localStorage.setItem("hjl-split-width", split.value); localStorage.setItem("hjl-reader-size", size.value); } catch (_) {}
  };
  split.oninput = size.onchange = updateReading;
  updateReading();
  document.getElementById("reader-expand").onclick = event => {
    const panel = document.getElementById("content-panel");
    const expanded = panel.getAttribute("data-reader") !== "1";
    panel.setAttribute("data-reader", expanded ? "1" : "0");
    event.target.setAttribute("aria-pressed", String(expanded));
    event.target.textContent = expanded ? "返回分栏" : "展开阅读";
  };
  const updateProgress = () => {
    const detail = document.getElementById("item-detail"), progress = document.getElementById("reading-progress");
    const remaining = detail.scrollHeight - detail.clientHeight;
    progress.value = remaining > 0 ? detail.scrollTop / remaining * 100 : Math.max(0, Math.min(100, -detail.getBoundingClientRect().top / Math.max(1, detail.scrollHeight - innerHeight) * 100));
  };
  document.getElementById("item-detail").addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("scroll", updateProgress, { passive: true });
  const network = () => { document.getElementById("network-status").textContent = navigator.onLine ? "" : "离线 · 仅显示可用的已缓存内容"; };
  window.addEventListener("online", network);
  window.addEventListener("offline", network);
  network();
}

function parseHashRoute() {
  const raw = (location.hash || "").replace(/^#\/?/, "").trim();
  if (!raw) return null;
  const parts = raw.split("/").map((p) => decodeURIComponent(p));
  const [sourceKey, dateKey = "latest", indexRaw = "0"] = parts;
  if (!sourceKey) return null;
  const itemIndex = Math.max(0, Number.parseInt(indexRaw, 10) || 0);
  return { sourceKey, dateKey: dateKey || "latest", itemIndex };
}

function writeHashRoute() {
  if (suppressHashWrite) return;
  const dateKey = selectedDates[activeSourceKey] || "latest";
  const next = `#/${encodeURIComponent(activeSourceKey)}/${encodeURIComponent(dateKey)}/${activeItemIndex}`;
  if (location.hash === next) return;
  const previous = parseHashRoute();
  const sameView = previous?.sourceKey === activeSourceKey && previous?.dateKey === dateKey;
  history[sameView || !previous ? "replaceState" : "pushState"](null, "", next);
}

function findParentIdForSource(data, sourceKey) {
  for (const parent of getCatalog(data)) {
    if (parent.children?.some((child) => child.sourceKey === sourceKey)) {
      return parent.id;
    }
  }
  return null;
}

function applyRoute(data, route, { sync = true } = {}) {
  if (!route?.sourceKey) return;
  if (sync && route.sourceKey === activeSourceKey && route.dateKey === (selectedDates[activeSourceKey] || "latest") && route.itemIndex === activeItemIndex) return;
  const parentId = findParentIdForSource(data, route.sourceKey);
  if (!parentId) return;
  activeParentId = parentId;
  activeSourceKey = route.sourceKey;
  selectedDates[activeSourceKey] = route.dateKey || "latest";
  activeItemIndex = route.itemIndex || 0;
  persistDates();
  if (sync) {
    renderTree(data);
    renderMobileNav(data);
    renderMobileSubnav(data);
    updatePinButton();
    void syncPanel(data, { preserveItemIndex: true });
  }
}

function platformIcon(parentId) {
  return parentIcon(parentId);
}

function itemCompactMeta(item) {
  const parts = [];
  if (item.stars != null) parts.push(`★ ${Number(item.stars).toLocaleString()}`);
  if (item.score != null) parts.push(`▲ ${Number(item.score).toLocaleString()}`);
  if (item.comments != null) parts.push(`💬 ${Number(item.comments).toLocaleString()}`);
  if (item.published) parts.push(item.published);
  if (item.journal) parts.push(item.journal);
  if (item.language) parts.push(item.language);
  if (item.owner && !item.journal) parts.push(`@${item.owner}`);
  if (item.label) parts.push(item.label);
  if (item.sha) parts.push(item.sha);
  if (item.version) parts.push(`v${item.version}`);
  if (item.isOpenAccess) parts.push("OA");
  if (item.pdfAvailable) parts.push("PDF");
  return parts.join(" · ");
}

function triggerPanelFade() {
  const panel = document.getElementById("panel-content");
  if (!panel) return;
  panel.classList.remove("panel-fade-in");
  void panel.offsetWidth;
  panel.classList.add("panel-fade-in");
}

function renderMobileNav(data) {
  const nav = document.getElementById("mobile-nav");
  if (!nav) return;

  const catalog = getCatalog(data);
  nav.innerHTML = catalog
    .map(
      (parent) => `
    <button
      type="button"
      class="mobile-tab${activeParentId === parent.id ? " active" : ""} ${getParentTheme(parent.id)}"
      data-parent-id="${parent.id}"
    >
      ${parentIcon(parent.id)}
      <span>${escapeHtml(parent.label)}</span>
    </button>
  `
    )
    .join("");

  nav.querySelectorAll(".mobile-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      const parentId = btn.dataset.parentId;
      const parent = catalog.find((p) => p.id === parentId);
      if (!parent?.children?.length) return;
      activeParentId = parentId;
      activeSourceKey = parent.children[0].sourceKey;
      clearSearchInputs();
      activeItemIndex = 0;
      renderTree(data);
      renderMobileNav(data);
      void syncPanel(data, { preserveItemIndex: false });
    });
  });
}

function isJournalSource(sourceKey) {
  return JOURNAL_KEYS.has(sourceKey);
}

function isGithubSource(sourceKey) {
  return sourceKey === "github" || sourceKey === "githubActive";
}

function isWeiboSource(sourceKey = activeSourceKey) {
  return sourceKey === "weibo" || sourceKey === "weiboRealtime" || sourceKey === "weiboLocal";
}

function isHackerNewsSource(sourceKey = activeSourceKey) {
  return sourceKey === "hackernews";
}

function isChinaDailySource(sourceKey = activeSourceKey) {
  return sourceKey === "chinaDaily";
}

function isSkillsCommitSource(sourceKey = activeSourceKey) {
  return sourceKey === "natureSkillsCommits" || sourceKey === "scientificSkillsCommits";
}

function isSkillsOverviewSource(sourceKey = activeSourceKey) {
  return sourceKey === "natureSkills" || sourceKey === "scientificSkills";
}

/** @returns {'weibo'|'hn'|'chinadaily'|'github'|'journals'|'skills'|'skills-commits'|null} */
function getFeedMode(sourceKey = activeSourceKey) {
  if (isWeiboSource(sourceKey)) return "weibo";
  if (isHackerNewsSource(sourceKey)) return "hn";
  if (isChinaDailySource(sourceKey)) return "chinadaily";
  if (isGithubSource(sourceKey)) return "github";
  if (isJournalSource(sourceKey)) return "journals";
  if (isSkillsCommitSource(sourceKey)) return "skills-commits";
  if (isSkillsOverviewSource(sourceKey) || isTrackedSkillsSource(sourceKey)) return "skills";
  return null;
}

function formatHotScore(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return "";
  if (n >= 10000) {
    const wan = n / 10000;
    const text = wan >= 100 ? wan.toFixed(0) : wan.toFixed(1).replace(/\.0$/, "");
    return `${text}万`;
  }
  return n.toLocaleString("zh-CN");
}

function languageColor(language) {
  const map = {
    JavaScript: "#f1e05a",
    TypeScript: "#3178c6",
    Python: "#3572a5",
    Rust: "#dea584",
    Go: "#00add8",
    Java: "#b07219",
    "C++": "#f34b7d",
    C: "#555555",
    Ruby: "#701516",
    PHP: "#4f5d95",
    Swift: "#f05138",
    Kotlin: "#a97bff",
    Shell: "#89e051",
    HTML: "#e34c26",
    CSS: "#563d7c",
    Jupyter: "#da5b0b",
    R: "#198ce7",
    Lua: "#000080",
    Dart: "#00b4ab",
    Scala: "#c22d40",
    Vue: "#41b883",
  };
  return map[language] || "#8b949e";
}

function updateListFilterHint(filteredLen, totalLen) {
  const hint = document.getElementById("list-filter-hint");
  if (!hint) return;
  if (searchQuery.trim()) {
    hint.hidden = false;
    hint.textContent = `匹配 ${filteredLen} / ${totalLen}`;
  } else {
    hint.hidden = true;
    hint.textContent = "";
  }
}

function bindFeedListClicks(source, selector) {
  const list = document.getElementById("compact-list");
  list.querySelectorAll(selector).forEach((el) => {
    el.addEventListener("click", () => {
      selectListItem(source, Number(el.dataset.index));
    });
    el.addEventListener("dblclick", () => {
      const item = source?.items?.[Number(el.dataset.index)];
      if (item?.url) {
        window.open(item.url, "_blank", "noopener,noreferrer");
      }
    });
  });
}

function externalLink(url, label) {
  if (!url) return `<span class="compact-external compact-external--empty"></span>`;
  return `<a class="compact-external" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(label)}" aria-label="${escapeHtml(label)}">${icon("external", "icon icon-compact")}</a>`;
}

function applyFeedLayout(mode = getFeedMode()) {
  const panel = document.getElementById("panel-content");
  const list = document.getElementById("compact-list");
  if (!panel || !list) return;

  const modes = ["weibo", "hn", "chinadaily", "github", "journals", "skills", "skills-commits"];
  modes.forEach((m) => {
    panel.classList.remove(`panel-content--${m}-feed`);
    list.classList.remove(
      `${m}-board`,
      "hotboard",
      "hn-board",
      "cd-board",
      "github-board",
      "journals-board",
      "skills-board",
      "commits-board"
    );
  });
  list.classList.remove("hotboard");

  const singleColumn =
    mode === "weibo" || mode === "hn" || mode === "chinadaily" || mode === "skills-commits";
  panel.classList.toggle("panel-split", !singleColumn);
  if (mode) {
    panel.classList.add(`panel-content--${mode}-feed`);
  }

  const boardClass =
    mode === "weibo"
      ? "hotboard"
      : mode === "hn"
        ? "hn-board"
        : mode === "chinadaily"
          ? "cd-board"
          : mode === "github" || mode === "skills"
            ? "github-board"
            : mode === "journals"
              ? "journals-board"
              : mode === "skills-commits"
                ? "commits-board"
                : "";
  if (boardClass) list.classList.add(boardClass);

  const labels = {
    weibo: "微博热搜",
    hn: "Hacker News",
    chinadaily: "China Daily",
    github: "GitHub 仓库",
    journals: "期刊论文",
    skills: "Skills 清单",
    "skills-commits": "最近提交",
  };
  list.setAttribute("aria-label", labels[mode] || "条目");
  closeMobileDetail();
}

function renderActiveList(source, activeIndex) {
  const renderers = { weibo: renderWeiboHotboard, hn: renderHnBoard, chinadaily: renderChinaDailyBoard, github: renderGithubBoard, journals: renderJournalsBoard, "skills-commits": renderSkillsCommitsBoard, skills: renderSkillsBoard };
  (renderers[getFeedMode()] || renderCompactList)(source, activeIndex);
  document.querySelectorAll("#compact-list button.compact-item[data-index]").forEach((row) => {
    const item = source.items[Number(row.dataset.index)];
    const external = row.parentElement.querySelector(".compact-external");
    if (!external || !item) return;
    const actions = document.createElement("span");
    actions.className = "item-row-actions";
    external.replaceWith(actions);
    actions.append(external);
    if (/^https:\/\/news\.ycombinator\.com\/item\?id=\d+$/.test(item.discussionUrl || "")) actions.insertAdjacentHTML("beforeend", `<a class="hn-discussion-link" href="${escapeHtml(item.discussionUrl)}" target="_blank" rel="noopener noreferrer">讨论</a>`);
    actions.insertAdjacentHTML("beforeend", savedItemButtons(item, Number(row.dataset.index)));
  });
}

function renderActiveDetail(item, index) {
  paintActiveDetail(item, index);
  void hydrateActiveReadme(item, index);
}

function paintActiveDetail(item, index) {
  paintActiveDetailBody(item, index);
  decorateReadingDetail(item);
}

function paintActiveDetailBody(item, index) {
  const mode = getFeedMode();
  if (mode === "weibo") return renderWeiboDetail(item, index);
  if (mode === "hn") return renderHnDetail(item, index);
  if (mode === "chinadaily") return renderChinaDailyDetail(item, index);
  if (mode === "skills-commits") return renderSkillsCommitDetail(item, index);
  return renderItemDetail(item, index);
}

function isNatureSkillsSource(sourceKey) {
  return NATURE_SKILLS_KEYS.has(sourceKey);
}

function isScientificSkillsSource(sourceKey) {
  return SCIENTIFIC_SKILLS_KEYS.has(sourceKey);
}

function isTrackedSkillsSource(sourceKey) {
  return TRACKED_SKILLS_KEYS.has(sourceKey);
}

function isReadmeSource(sourceKey) {
  return isGithubSource(sourceKey) || sourceKey === "natureSkills" || sourceKey === "scientificSkills";
}

function fixGithubRelativeUrls(html, fullName) {
  const parts = (fullName || "").split("/");
  if (parts.length < 2) return html;

  const [owner, repo] = parts;
  const rawBase = `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/`;
  const wrap = document.createElement("div");
  wrap.innerHTML = html;

  wrap.querySelectorAll("img[src]").forEach((img) => {
    const src = img.getAttribute("src");
    if (src && !/^https?:\/\//i.test(src) && !src.startsWith("data:")) {
      img.src = new URL(src.replace(/^\.\//, ""), rawBase).href;
    }
  });

  wrap.querySelectorAll("a[href]").forEach((link) => {
    const href = link.getAttribute("href");
    if (href && !/^https?:\/\//i.test(href) && !href.startsWith("#") && !href.startsWith("mailto:")) {
      link.href = new URL(href.replace(/^\.\//, ""), rawBase).href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }
  });

  return wrap.innerHTML;
}

function renderGithubMarkdown(markdown, fullName) {
  if (typeof marked === "undefined") {
    return `<pre class="readme-fallback">${escapeHtml(markdown)}</pre>`;
  }

  marked.setOptions({ gfm: true, breaks: false });
  let html = marked.parse(markdown);
  html = fixGithubRelativeUrls(html, fullName);

  if (typeof DOMPurify !== "undefined") {
    html = DOMPurify.sanitize(html, {
      ADD_ATTR: ["target", "rel", "align"],
      ADD_TAGS: ["details", "summary"],
    });
  }

  return html;
}

function githubRawReadmeUrl(item) {
  const file = item?.readmeFile || "README.md";
  const url = String(item?.url || "");
  const tree = url.match(/github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)\/(.+)$/i);
  if (tree) {
    return `https://raw.githubusercontent.com/${tree[1]}/${tree[2]}/${tree[3]}/${tree[4]}/${file}`;
  }
  const repoPage = url.match(/github\.com\/([^/]+)\/([^/]+)\/?$/i);
  if (repoPage) {
    return `https://raw.githubusercontent.com/${repoPage[1]}/${repoPage[2]}/HEAD/${file}`;
  }
  if (item?.repo) {
    return `https://raw.githubusercontent.com/${item.repo}/HEAD/${file}`;
  }
  return "";
}

async function fetchItemReadme(sourceKey, item, index) {
  if (item?.readme) return item.readme;
  const dateKey = selectedDates[sourceKey] || "latest";
  const cacheKey = `${sourceKey}:${dateKey}:${item.readmePath || item.url || item.title}:${index}`;
  if (dateKey !== "latest" && !item.readmePath) return "";
  if (Object.prototype.hasOwnProperty.call(readmeCache, cacheKey)) return readmeCache[cacheKey];
  if (readmeInflight[cacheKey]) return readmeInflight[cacheKey];

  readmeInflight[cacheKey] = (async () => {
    const versionPath = String(item.readmePath || "");
    const safeVersion = /^data\/readmes\/[a-zA-Z0-9_-]+\/versions\/[a-f0-9]{64}\.md$/.test(versionPath);
    if (versionPath && !safeVersion) return "";
    const localUrl = safeVersion ? versionPath : `data/readmes/${encodeURIComponent(sourceKey)}/${index}.md`;
    try {
      const res = await fetch(`${localUrl}?t=${Date.now()}`);
      if (res.ok) {
        const text = await res.text();
        if (text.trim()) {
          readmeCache[cacheKey] = text;
          return text;
        }
      }
    } catch (_) {}

    // A missing immutable version must never fall back to a changing HEAD.
    const raw = dateKey === "latest" && !versionPath ? githubRawReadmeUrl(item) : "";
    if (raw) {
      try {
        const res = await fetch(raw);
        if (res.ok) {
          const text = await res.text();
          if (text.trim()) {
            readmeCache[cacheKey] = text;
            return text;
          }
        }
      } catch (_) {}
    }
    readmeCache[cacheKey] = "";
    return "";
  })();

  try {
    return await readmeInflight[cacheKey];
  } finally {
    delete readmeInflight[cacheKey];
  }
}

async function hydrateActiveReadme(item, index) {
  if (!item || item.readme || item.readmeMissing || !isReadmeSource(activeSourceKey)) return;
  const seq = panelSyncSeq;
  const sourceKey = activeSourceKey;
  const text = await fetchItemReadme(sourceKey, item, index);
  if (seq !== panelSyncSeq || activeSourceKey !== sourceKey || activeItemIndex !== index) return;
  if (text) {
    item.readme = text;
    if (currentSourceRef?.items?.[index]) currentSourceRef.items[index].readme = text;
  } else {
    item.readmeMissing = true;
  }
  paintActiveDetail(item, index);
}

function renderGithubReadmeBlock(item, repoFullName = null) {
  const fileName = item.readmeFile || "README.md";
  const markdownBase =
    repoFullName ||
    (String(item.title || "").includes("/") ? String(item.title).split(" · ")[0] : null);

  if (!item.readme) {
    const loading = Boolean(item.readmeFile || item.readmePath) && !item.readmeMissing;
    return `
      <details class="readme-panel"${loading ? " open" : ""}>
        <summary class="readme-summary">
          <span class="readme-summary-title">${escapeHtml(fileName)}</span>
          <span class="readme-summary-hint">${loading ? "加载中" : "暂无内容"}</span>
        </summary>
        <p class="detail-desc muted readme-empty">${
          loading ? "正在加载 README…" : (selectedDates[activeSourceKey] && selectedDates[activeSourceKey] !== "latest" ? "这份旧快照未存档 README 正文，不能用当前版本替代。请打开对应仓库核查。" : "该仓库未提供 README，或抓取时未能获取。")
        }</p>
      </details>
    `;
  }

  const html = renderGithubMarkdown(item.readme, markdownBase);
  const truncatedNote = item.readmeTruncated
    ? `<p class="detail-note readme-truncated">内容较长，已截断显示，完整内容请访问仓库。</p>`
    : "";

  return `
    <details class="readme-panel" open>
      <summary class="readme-summary">
        <span class="readme-summary-title">${escapeHtml(fileName)} 完整内容</span>
        <span class="readme-summary-hint">点击折叠 / 展开</span>
      </summary>
      ${truncatedNote}
      <div class="readme-content markdown-body">${html}</div>
    </details>
  `;
}

function initThemeToggle() {
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;

  const darkEl = btn.querySelector(".theme-icon-dark");
  const lightEl = btn.querySelector(".theme-icon-light");
  if (darkEl && typeof ICONS !== "undefined") darkEl.innerHTML = ICONS.moon;
  if (lightEl && typeof ICONS !== "undefined") lightEl.innerHTML = ICONS.sun;

  const apply = (theme) => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("hjl-theme", theme);
    } catch (_) {}
    btn.setAttribute("aria-label", theme === "dark" ? "切换为浅色模式" : "切换为深色模式");
  };

  btn.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    apply(current === "dark" ? "light" : "dark");
  });
}

function renderAbstractBlock(text) {
  if (!text) return `<p class="detail-desc muted">暂无摘要</p>`;
  if (text.length <= 240) {
    return `<p class="detail-desc journal-abstract">${escapeHtml(text)}</p>`;
  }
  const id = `abs-${Math.random().toString(36).slice(2, 9)}`;
  return `
    <div class="abstract-block" data-abstract-id="${id}">
      <p class="detail-desc journal-abstract abstract-short">${escapeHtml(text.slice(0, 240))}…</p>
      <p class="detail-desc journal-abstract abstract-full" hidden>${escapeHtml(text)}</p>
      <button type="button" class="abstract-toggle" data-abstract-id="${id}">展开完整摘要</button>
    </div>
  `;
}

function bindAbstractToggles(root) {
  root.querySelectorAll(".abstract-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const block = btn.closest(".abstract-block");
      if (!block) return;
      const full = block.querySelector(".abstract-full");
      const short = block.querySelector(".abstract-short");
      const expanded = !full.hidden;
      full.hidden = expanded;
      short.hidden = !expanded;
      btn.textContent = expanded ? "展开完整摘要" : "收起摘要";
    });
  });
}

function renderJournalStats(data, source) {
  const box = document.getElementById("journal-stats");
  if (!box) return;

  if (!isJournalSource(activeSourceKey)) {
    box.hidden = true;
    box.innerHTML = "";
    return;
  }

  const items = source?.items || [];
  const oaCount = items.filter((i) => i.isOpenAccess).length;
  const pdfCount = items.filter((i) => i.pdfAvailable).length;
  const dateKey = selectedDates[activeSourceKey] || "latest";
  const period =
    dateKey !== "latest"
      ? `历史快照 · ${formatSnapshotLabel(dateKey)}`
      : data.journalsPeriod || "近半月";

  box.hidden = false;
  box.innerHTML = `
    <div class="journal-stats-head">
      ${icon("book", "icon icon-tree")}
      <div>
        <div class="journal-stats-title">MRI 学术速递</div>
        <div class="journal-stats-period">${escapeHtml(period)}</div>
      </div>
    </div>
    <div class="journal-stat-grid">
      <div class="journal-stat"><span class="journal-stat-val">${items.length}</span><span class="journal-stat-lbl">论文</span></div>
      <div class="journal-stat"><span class="journal-stat-val">${oaCount}</span><span class="journal-stat-lbl">开放获取</span></div>
      <div class="journal-stat"><span class="journal-stat-val">${pdfCount}</span><span class="journal-stat-lbl">PDF 已存档</span></div>
    </div>
  `;
}

function renderJournalDetail(item, index, platform) {
  const panel = document.getElementById("item-detail");
  panel.className = `item-detail journal-paper ${platform.theme}`;

  const rankLabel = String(index + 1).padStart(2, "0");
  const title = item.url
    ? `<a href="${item.url}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.title)}</a>`
    : escapeHtml(item.title);

  const oaClass = item.isOpenAccess ? "oa-open" : "oa-closed";
  const oaText = item.isOpenAccess ? "开放获取" : "机构订阅";

  panel.innerHTML = `
    <div class="detail-body journal-detail">
      <div class="journal-banner">
        <div class="journal-banner-left">
          <span class="journal-badge">${escapeHtml(item.journal || platform.name)}</span>
          <span class="detail-rank-badge">#${rankLabel}</span>
        </div>
        <span class="journal-oa-badge ${oaClass}">${oaText}</span>
      </div>
      <h2 class="detail-title journal-title">${title}</h2>
      ${item.authors ? `<p class="journal-authors">${escapeHtml(item.authors)}</p>` : ""}
      ${item.doi ? `<p class="journal-doi"><span>DOI</span> ${escapeHtml(item.doi)}</p>` : ""}
      <div class="detail-divider"></div>
      ${renderAbstractBlock(item.description)}
      <div class="detail-meta">
        ${item.published ? metaPill(`发表 ${item.published}`, "accent") : ""}
        ${item.isOpenAccess ? metaPill("开放获取", "success") : metaPill("付费访问", "hot")}
        ${item.pdfAvailable ? metaPill("PDF 已本地存档", "success") : ""}
      </div>
      <div class="detail-actions journal-actions">
        ${item.url ? `<a class="btn btn-secondary" href="${item.url}" target="_blank" rel="noopener noreferrer">期刊页面 →</a>` : ""}
        ${item.pdfUrl ? `<a class="btn btn-success" href="${item.pdfUrl}" target="_blank" rel="noopener noreferrer">${icon("file", "icon")} 下载 PDF</a>` : ""}
        ${!item.pdfUrl && item.url ? `<a class="btn btn-primary" href="${item.url}" target="_blank" rel="noopener noreferrer">查看论文 →</a>` : ""}
      </div>
      ${
        !item.pdfUrl && item.isOpenAccess
          ? `<p class="detail-note">本篇为开放获取，暂未找到可下载 PDF。</p>`
          : !item.pdfUrl && item.doi
            ? `<p class="detail-note">完整 PDF 通常需机构订阅权限，已提供 DOI 链接。</p>`
            : ""
      }
    </div>
  `;
  bindAbstractToggles(panel);
}

function renderMobileSubnav(data) {
  const nav = document.getElementById("mobile-subnav");
  if (!nav) return;

  const catalog = getCatalog(data);
  const parent = getParentNode(catalog, activeParentId);
  if (!parent?.children || parent.children.length <= 1) {
    nav.hidden = true;
    nav.innerHTML = "";
    return;
  }

  nav.hidden = false;
  nav.innerHTML = parent.children
    .map((child) => {
      const source = getSource(data, child.sourceKey);
      const active = activeSourceKey === child.sourceKey;
      return `
        <button
          type="button"
          class="mobile-chip${active ? " active" : ""} ${getParentTheme(activeParentId)}"
          data-source-key="${child.sourceKey}"
        >${escapeHtml(source?.label || child.id)}</button>
      `;
    })
    .join("");

  nav.querySelectorAll(".mobile-chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeSourceKey = btn.dataset.sourceKey;
      clearSearchInputs();
      activeItemIndex = 0;
      renderTree(data);
      renderMobileNav(data);
      renderMobileSubnav(data);
      void syncPanel(data, { preserveItemIndex: false });
    });
  });
}

function getParentNode(catalog, parentId) {
  return catalog.find((node) => node.id === parentId) ?? catalog[0];
}

function renderMeta(data) {
  renderHeaderMotto();
  META_SYNC_PLATFORMS.forEach((platform) => {
    const el = document.getElementById(`meta-${platform.id}-at`);
    if (!el) return;
    const iso = resolveMetaTimestamp(data, platform.field);
    el.textContent = iso ? formatDate(iso) : "暂无记录";
  });

  const footerList = document.getElementById("footer-sync-list");
  if (footerList) {
    footerList.innerHTML = META_SYNC_PLATFORMS.map((platform) => {
      const iso = resolveMetaTimestamp(data, platform.field);
      const time = iso ? formatDate(iso) : "暂无记录";
      return `<li><span class="footer-sync-label">${escapeHtml(platform.label)}</span>（${escapeHtml(platform.schedule)}）<strong>${escapeHtml(time)}</strong></li>`;
    }).join("");
  }

  highlightMetaPlatform(activeParentId);
  renderHealth(data);
}

const WORKPLACE_QUOTES = [
  { text: "先把事做成，再把理讲清。", by: "职场生存" },
  { text: "汇报讲结论，沟通留证据，承诺控范围。", by: "职场生存" },
  { text: "少争对错，多争结果；少表态度，多给方案。", by: "职场生存" },
  { text: "能书面确认的，就不要只靠口头。", by: "职场生存" },
  { text: "向上对齐目标，横向对齐接口，向下对齐标准。", by: "职场生存" },
  { text: "情绪可以有，但别让情绪上线。", by: "职场生存" },
  { text: "做得好看不如交付得稳。", by: "职场生存" },
  { text: "把问题拆成可执行的下一步。", by: "职场生存" },
  { text: "边界清晰，才是长期协作的前提。", by: "职场生存" },
  { text: "会提问的人，比会抱怨的人走得更远。", by: "职场生存" },
  { text: "今天能闭环的，就不要拖到明天。", by: "职场生存" },
  { text: "保护精力，比证明自己更重要。", by: "职场生存" },
  { text: "先同步风险，再承诺时间。", by: "职场生存" },
  { text: "记录过程，是给未来的自己买保险。", by: "职场生存" },
  { text: "把功劳分出去，把责任扛起来。", by: "职场生存" },
];

const MOTTO_QUOTES = [
  { text: "行远自迩，登高自卑。", by: "《礼记》" },
  { text: "不积跬步，无以至千里。", by: "荀子" },
  { text: "路漫漫其修远兮，吾将上下而求索。", by: "屈原" },
  { text: "博观而约取，厚积而薄发。", by: "苏轼" },
  { text: "业精于勤，荒于嬉。", by: "韩愈" },
  { text: "知之愈明，则行之愈笃。", by: "朱熹" },
  { text: "简单的事情重复做，你就是专家。", by: "俗语" },
  { text: "今天最好的表现，是明天最低的要求。", by: "佚名" },
];

function dayHash(seed = "") {
  const dayKey = `${new Date().toISOString().slice(0, 10)}:${seed}`;
  let hash = 0;
  for (let i = 0; i < dayKey.length; i += 1) {
    hash = (hash * 31 + dayKey.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function pickQuote(list, seed = "") {
  if (!list.length) return { text: "", by: "" };
  return list[dayHash(seed) % list.length];
}

function renderHeaderMotto() {
  const quote = pickQuote(WORKPLACE_QUOTES, "header");
  const textEl = document.getElementById("header-motto-text");
  const byEl = document.getElementById("header-motto-by");
  const ticker = document.getElementById("ws-ticker");
  if (textEl) textEl.textContent = `“${quote.text}”`;
  if (byEl) byEl.textContent = `— ${quote.by}`;
  if (ticker) ticker.textContent = `“${quote.text}”`;
}

function renderMottoBar() {
  const quote = pickQuote(MOTTO_QUOTES, "sidebar");
  return `
    <aside class="motto-bar" aria-label="今日寄语">
      <p class="motto-text">“${escapeHtml(quote.text)}”</p>
      <p class="motto-by">— ${escapeHtml(quote.by)}</p>
    </aside>
  `;
}

function findSourceMeta(data, sourceKey) {
  for (const parent of getCatalog(data)) {
    const child = parent.children?.find((c) => c.sourceKey === sourceKey);
    if (child) {
      return {
        parentId: parent.id,
        parentLabel: parent.label,
        sourceKey,
        label: getSource(data, sourceKey)?.label || child.id,
      };
    }
  }
  return null;
}

function renderTree(data) {
  const catalog = getCatalog(data);
  const tree = document.getElementById("catalog-tree");

  const pinnedBlock =
    pinStore.length > 0
      ? `
    <div class="tree-pins">
      <div class="tree-pins-title">钉选</div>
      <ul class="tree-leaves tree-pins-list">
        ${pinStore
          .map((sourceKey) => {
            const meta = findSourceMeta(data, sourceKey);
            if (!meta) return "";
            const source = getSource(data, sourceKey);
            const active = activeSourceKey === sourceKey;
            return `<li>
              <button type="button" class="tree-leaf${active ? " active" : ""} ${getParentTheme(meta.parentId)}"
                data-parent-id="${meta.parentId}" data-source-key="${sourceKey}">
                <span class="leaf-name"><span class="leaf-pin-mark" aria-hidden="true"></span>${escapeHtml(meta.label)}</span>
                <span class="leaf-count">${sourceItemCount(source)}</span>
              </button>
            </li>`;
          })
          .join("")}
      </ul>
    </div>`
      : "";

  const catalogHtml = `
    ${pinnedBlock}
    ${isWorkstation() ? "" : renderMottoBar()}
    <div class="sidebar-title">内容目录</div>
    <div class="tree-children tree-children--root">
      ${catalog
        .map(
          (parent) => `
        <details class="tree-node ${getParentTheme(parent.id)}" ${parent.id === activeParentId ? "open" : ""} data-parent-id="${parent.id}">
          <summary class="tree-label">
            ${parentIcon(parent.id)}
            <span>${escapeHtml(parent.label)}</span>
          </summary>
          <ul class="tree-leaves">
            ${parent.children
              .map((child) => {
                const source = getSource(data, child.sourceKey);
                const count = sourceItemCount(source);
                const active =
                  activeParentId === parent.id && activeSourceKey === child.sourceKey;
                const pinned = isPinned(child.sourceKey) ? " ·钉" : "";
                return `
                  <li>
                    <button
                      type="button"
                      class="tree-leaf${active ? " active" : ""}"
                      data-parent-id="${parent.id}"
                      data-source-key="${child.sourceKey}"
                    >
                      <span class="leaf-name">${escapeHtml(source?.label || child.id)}${pinned}</span>
                      <span class="leaf-count">${count}</span>
                    </button>
                  </li>
                `;
              })
              .join("")}
          </ul>
        </details>
      `
        )
        .join("")}
    </div>
  `;

  tree.innerHTML = catalogHtml;

  tree.querySelectorAll(".tree-leaf").forEach((btn) => {
    btn.addEventListener("click", () => {
      jumpToSource(data, btn.dataset.sourceKey);
    });
  });

  tree.querySelectorAll(".tree-node").forEach((node) => {
    const summary = node.querySelector(":scope > summary");
    if (!summary) return;
    summary.addEventListener("click", (event) => {
      const parentId = node.dataset.parentId;
      const sourceKey = firstSourceForParent(data, parentId);
      if (!sourceKey) return;
      if (activeParentId === parentId && activeSourceKey === sourceKey) return;
      event.preventDefault();
      jumpToSource(data, sourceKey);
    });
  });
}

function renderBreadcrumb(data, source) {
  const catalog = getCatalog(data);
  const parent = getParentNode(catalog, activeParentId);
  const dateKey = selectedDates[activeSourceKey] || "latest";
  const historyCrumb =
    dateKey !== "latest"
      ? `<span class="crumb-sep">/</span><span class="crumb crumb-pill crumb-history">${escapeHtml(formatSnapshotLabel(dateKey))}</span>`
      : "";

  document.getElementById("breadcrumb").innerHTML = `
    <span class="crumb crumb-pill">${escapeHtml(parent?.label || "")}</span>
    <span class="crumb-sep">/</span>
    <span class="crumb crumb-pill crumb-current">${escapeHtml(source?.label || "")}</span>
    ${historyCrumb}
  `;
}

function fillCategorySelect(data) {
  const catalog = getCatalog(data);
  const parent = getParentNode(catalog, activeParentId);
  const select = document.getElementById("category-select");

  select.innerHTML = parent.children
    .map((child) => {
      const source = getSource(data, child.sourceKey);
      return `<option value="${child.sourceKey}" ${
        child.sourceKey === activeSourceKey ? "selected" : ""
      }>${escapeHtml(source?.label || child.id)}</option>`;
    })
    .join("");

  select.onchange = () => {
    activeSourceKey = select.value;
    clearSearchInputs();
    activeItemIndex = 0;
    hideHistoryCompare();
    renderTree(data);
    renderMobileNav(data);
    renderMobileSubnav(data);
    updatePinButton();
    void syncPanel(data, { preserveItemIndex: false });
  };
}

function fillDateSelect(data) {
  const select = document.getElementById("date-select");
  if (!select) return;

  const entries = manifest?.sources?.[activeSourceKey] || [];
  const latestHint = formatShortDate(getLatestUpdatedAt(data, activeSourceKey));
  const latestLabel = latestHint ? ` · ${latestHint}` : "";

  const options = [`<option value="latest">最新${latestLabel}</option>`];
  let month = "";
  entries.forEach((entry) => {
    const nextMonth = String(entry.date).slice(0, 7);
    if (nextMonth !== month) {
      if (month) options.push("</optgroup>");
      month = nextMonth;
      options.push(`<optgroup label="${escapeHtml(month)}">`);
    }
    const count = entry.itemCount != null ? ` · ${entry.itemCount} 条` : "";
    const label = formatSnapshotLabel(entry.date);
    options.push(`<option value="${entry.date}">${label}${count}</option>`);
  });

  if (month) options.push("</optgroup>");
  select.innerHTML = options.join("");
  const validDates = new Set(["latest", ...entries.map((entry) => entry.date)]);
  const current = selectedDates[activeSourceKey] || "latest";
  select.value = validDates.has(current) ? current : "latest";
  selectedDates[activeSourceKey] = select.value;

  select.onchange = () => {
    selectedDates[activeSourceKey] = select.value;
    persistDates();
    clearSearchInputs();
    activeItemIndex = 0;
    hideHistoryCompare();
    // bust latest cache when returning to latest after history
    if (select.value === "latest") delete latestSourceCache[activeSourceKey];
    void syncPanel(data, { preserveItemIndex: false });
  };
}

function hideHistoryCompare() {
  const panel = document.getElementById("history-compare-panel");
  if (!panel) return;
  panel.hidden = true;
  panel.innerHTML = "";
}

function previousHistoryDate(sourceKey, currentDateKey) {
  const entries = manifest?.sources?.[sourceKey] || [];
  if (!entries.length) return null;
  if (currentDateKey === "latest") return entries.find(entry => entry.savedAt !== currentSourceRef?.savedAt)?.date || null;
  const idx = entries.findIndex((entry) => entry.date === currentDateKey);
  if (idx < 0) return entries[0]?.date || null;
  return entries[idx + 1]?.date || null;
}

function diffSnapshots(currentItems, previousItems) {
  const prevMap = new Map();
  (previousItems || []).forEach((item) => {
    const fp = itemFingerprint(item);
    if (fp) prevMap.set(fp, item);
  });
  const currMap = new Map();
  (currentItems || []).forEach((item) => {
    const fp = itemFingerprint(item);
    if (fp) currMap.set(fp, item);
  });
  const added = [];
  const removed = [];
  const changed = [];
  currMap.forEach((item, fp) => {
    if (!prevMap.has(fp)) added.push(item);
    else if (["title", "description", "stars", "score", "comments", "language", "published", "pdfUrl"].some(key => JSON.stringify(item[key] ?? null) !== JSON.stringify(prevMap.get(fp)[key] ?? null))) changed.push(item);
  });
  prevMap.forEach((item, fp) => {
    if (!currMap.has(fp)) removed.push(item);
  });
  return { added, removed, changed };
}

function renderHistoryCompare(currentLabel, previousLabel, added, removed, changed) {
  const panel = document.getElementById("history-compare-panel");
  if (!panel) return;
  const listHtml = (items, emptyText) => {
    if (!items.length) return `<li class="muted">${escapeHtml(emptyText)}</li>`;
    return items
      .slice(0, 12)
      .map((item) => `<li>${escapeHtml(item.title || "(无标题)")}</li>`)
      .join("");
  };
  const moreAdded = added.length > 12 ? `（显示前 12 / 共 ${added.length}）` : "";
  const moreRemoved = removed.length > 12 ? `（显示前 12 / 共 ${removed.length}）` : "";
  panel.hidden = false;
  panel.innerHTML = `
    <div class="history-compare-head">
      <strong>快照对比</strong>
      <span class="muted">${escapeHtml(previousLabel)} → ${escapeHtml(currentLabel)}</span>
      <button type="button" id="history-compare-close" class="btn-text">关闭</button>
    </div>
    <div class="history-compare-cols">
      <div>
        <h4>新增 ${added.length}${moreAdded}</h4>
        <ul>${listHtml(added, "无新增")}</ul>
      </div>
      <div>
        <h4>消失 ${removed.length}${moreRemoved}</h4>
        <ul>${listHtml(removed, "无消失")}</ul>
      </div>
      <div>
        <h4>信息变化 ${changed.length}${changed.length > 12 ? "（显示前 12 条）" : ""}</h4>
        <ul>${listHtml(changed, "无变化")}</ul>
      </div>
    </div>
  `;
  document.getElementById("history-compare-close")?.addEventListener("click", hideHistoryCompare);
}

async function runHistoryCompare(data) {
  const sourceKey = activeSourceKey;
  const currentKey = selectedDates[sourceKey] || "latest";
  const previousKey = previousHistoryDate(sourceKey, currentKey);
  const btn = document.getElementById("history-compare-btn");
  if (!previousKey) {
    const panel = document.getElementById("history-compare-panel");
    if (panel) {
      panel.hidden = false;
      panel.innerHTML = `<p class="muted">暂无更早的历史快照可对比。</p>`;
    }
    return;
  }
  if (btn) {
    btn.disabled = true;
    btn.textContent = "对比中…";
  }
  try {
    const current = await resolveSource(data, sourceKey, { lite: true });
    const prevUrl = `data/history/${sourceKey}/${previousKey}.json?t=${Date.now()}`;
    const prevRes = await fetch(prevUrl);
    if (!prevRes.ok) throw new Error(`上一快照加载失败 (${prevRes.status})`);
    const previousSnap = await prevRes.json();
    const { added, removed, changed } = diffSnapshots(current?.items || [], previousSnap?.items || []);
    const currentLabel = currentKey === "latest" ? "最新" : formatSnapshotLabel(currentKey);
    const previousLabel = formatSnapshotLabel(previousKey);
    renderHistoryCompare(currentLabel, previousLabel, added, removed, changed);
  } catch (err) {
    const panel = document.getElementById("history-compare-panel");
    if (panel) {
      panel.hidden = false;
      panel.innerHTML = `<p class="muted">${escapeHtml(err.message || "对比失败")}</p>`;
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = "对比";
    }
  }
}

function bindHistoryCompare(data) {
  const btn = document.getElementById("history-compare-btn");
  if (!btn || btn.dataset.bound === "1") return;
  btn.dataset.bound = "1";
  btn.addEventListener("click", () => {
    void runHistoryCompare(data);
  });
}

function itemSummary(item, index) {
  const rank = `#${index + 1}`;
  if (item.journal) {
    const date = item.published ? ` · ${item.published}` : "";
    return `${rank} [${item.journal}]${date} ${item.title}`;
  }
  if (item.label === "skill") {
    const ver = item.version ? ` v${item.version}` : "";
    return `${rank} [skill]${ver} · ${item.title}`;
  }
  if (item.label === "commit") {
    const sha = item.sha ? ` ${item.sha}` : "";
    const date = item.published ? ` · ${item.published}` : "";
    return `${rank} [commit]${sha}${date} · ${item.title}`;
  }
  if (item.label === "overview") {
    return `${rank} [overview] · ${item.title}`;
  }
  if (item.stars != null) {
    const readmeTag = item.readme && isReadmeSource(activeSourceKey) ? " · README" : "";
    return `${rank} ★${Number(item.stars).toLocaleString()}${readmeTag} · ${item.title}`;
  }
  if (item.score != null) return `${rank} ▲${Number(item.score).toLocaleString()} · ${item.title}`;
  return `${rank} ${item.title}`;
}

function fillItemSelect(source, preferredIndex = 0) {
  const items = source?.items || [];
  if (!items.length) return 0;
  return Math.min(Math.max(0, preferredIndex), items.length - 1);
}

function selectListItem(source, index) {
  const items = source?.items || [];
  if (!items.length) return;
  activeItemIndex = Math.min(Math.max(0, index), items.length - 1);
  markItemSeen(activeSourceKey, items[activeItemIndex]);
  updateNewHints(activeSourceKey, items);
  renderActiveDetail(items[activeItemIndex], activeItemIndex);
  renderActiveList(source, activeItemIndex);
  writeHashRoute();
  openMobileDetailIfNeeded();
}

function feedHasSplitDetail(mode = getFeedMode()) {
  return mode === "github" || mode === "journals" || mode === "skills";
}

function isMobileViewport() {
  return window.matchMedia("(max-width: 860px)").matches;
}

function openMobileDetailIfNeeded() {
  const panel = document.getElementById("panel-content");
  const back = document.getElementById("mobile-detail-back");
  if (!panel?.classList.contains("is-mobile-detail")) window.__workspaceListY = window.scrollY;
  if (!panel || !feedHasSplitDetail()) {
    closeMobileDetail();
    return;
  }
  if (!isMobileViewport()) {
    panel.classList.remove("is-mobile-detail");
    if (back) back.hidden = true;
    return;
  }
  panel.classList.add("is-mobile-detail");
  if (back) back.hidden = false;
  back?.scrollIntoView({ block: "start" });
}

function closeMobileDetail() {
  const panel = document.getElementById("panel-content");
  const back = document.getElementById("mobile-detail-back");
  panel?.classList.remove("is-mobile-detail");
  if (back) back.hidden = true;
}

function bindMobileDetailNav() {
  const back = document.getElementById("mobile-detail-back");
  if (back && back.dataset.bound !== "1") {
    back.dataset.bound = "1";
    back.addEventListener("click", () => {
      closeMobileDetail();
      window.scrollTo({ top: window.__workspaceListY || 0, behavior: "instant" });
    });
  }
  if (window.__hjlMobileDetailBound) return;
  window.__hjlMobileDetailBound = true;
  window.addEventListener("resize", () => {
    if (!isMobileViewport()) closeMobileDetail();
  });
}

function renderWeiboDetail(item, index) {
  const panel = document.getElementById("item-detail");
  if (!panel) return;
  panel.className = "item-detail theme-weibo item-detail--weibo-bar";
  if (!item) {
    panel.innerHTML = `<div class="detail-body weibo-bar-body"><p class="muted">暂无热搜</p></div>`;
    return;
  }
  const rank = index + 1;
  const title = item.url
    ? `<a href="${item.url}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.title)}</a>`
    : escapeHtml(item.title);
  const label = item.label
    ? `<span class="hot-label">${escapeHtml(item.label)}</span>`
    : "";
  const score = formatHotScore(item.score);
  panel.innerHTML = `
    <div class="detail-body weibo-bar-body">
      <span class="hot-rank ${rank <= 3 ? `hot-rank--${rank}` : ""}">${rank}</span>
      <div class="weibo-bar-main">
        <h2 class="weibo-bar-title">${title}${label}</h2>
        ${score ? `<span class="hot-score">${escapeHtml(score)}</span>` : ""}
      </div>
      ${
        item.url
          ? `<a class="btn btn-primary weibo-open-btn" href="${item.url}" target="_blank" rel="noopener noreferrer">打开热搜 →</a>`
          : ""
      }
    </div>
  `;
}

function renderWeiboHotboard(source, activeIndex) {
  const items = source?.items || [];
  const list = document.getElementById("compact-list");
  const filtered = filterItems(items);

  document.getElementById("item-count").textContent = String(filtered.length);
  updateListFilterHint(filtered.length, items.length);

  if (!filtered.length) {
    list.innerHTML = `<li class="compact-empty">${items.length ? "无匹配热搜" : "暂无热搜"}</li>`;
    return;
  }

  list.innerHTML = filtered
    .map(({ item, index }) => {
      const active = index === activeIndex ? " active" : "";
      const isNew = isItemNew(activeSourceKey, item);
      const newClass = isNew ? " is-new" : "";
      const newBadge = isNew ? `<span class="new-badge" aria-label="新内容">新</span>` : "";
      const rank = index + 1;
      const rankClass = rank <= 3 ? ` hot-rank--${rank}` : "";
      const label = item.label ? `<span class="hot-label">${escapeHtml(item.label)}</span>` : "";
      const score = formatHotScore(item.score);

      return `
      <li class="compact-row hotboard-row${newClass}" data-rank="${rank}">
        <button type="button" class="compact-item hotboard-item${active}${newClass}" data-index="${index}" role="option" aria-selected="${active ? "true" : "false"}">
          <span class="hot-rank${rankClass}">${rank}</span>
          <div class="hotboard-body">
            <span class="hotboard-title">${newBadge}${escapeHtml(item.title)}</span>
            ${label}
          </div>
          ${score ? `<span class="hot-score">${escapeHtml(score)}</span>` : `<span class="hot-score hot-score--empty"></span>`}
        </button>
        ${externalLink(item.url, "打开热搜")}
      </li>
    `;
    })
    .join("");

  bindFeedListClicks(source, "button.hotboard-item");
}

function renderHnDetail(item, index) {
  const panel = document.getElementById("item-detail");
  if (!panel) return;
  panel.className = "item-detail theme-hn item-detail--feed-bar";
  if (!item) {
    panel.innerHTML = `<div class="detail-body feed-bar-body"><p class="muted">暂无条目</p></div>`;
    return;
  }
  const rank = index + 1;
  const title = item.url
    ? `<a href="${item.url}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.title)}</a>`
    : escapeHtml(item.title);
  const meta = [
    item.score != null ? `▲ ${Number(item.score).toLocaleString()}` : "",
    item.comments != null ? `${Number(item.comments).toLocaleString()} comments` : "",
    item.owner ? `by ${item.owner}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
  panel.innerHTML = `
    <div class="detail-body feed-bar-body">
      <span class="hn-rank">${rank}</span>
      <div class="feed-bar-main">
        <h2 class="feed-bar-title">${title}</h2>
        ${meta ? `<span class="feed-bar-meta">${escapeHtml(meta)}</span>` : ""}
      </div>
      ${
        item.url
          ? `<a class="btn btn-primary" href="${item.url}" target="_blank" rel="noopener noreferrer">打开原文 →</a>`
          : ""
      }
    </div>
  `;
}

function renderChinaDailyDetail(item, index) {
  const panel = document.getElementById("item-detail");
  if (!panel) return;
  panel.className = "item-detail theme-chinadaily item-detail--cd";
  if (!item) {
    panel.innerHTML = `<div class="detail-body cd-detail-body"><p class="muted">No story selected</p></div>`;
    return;
  }
  const rank = item.rank || index + 1;
  const views =
    item.score != null && Number(item.score) > 0
      ? `${Number(item.score).toLocaleString("en-US")} views`
      : "";
  const meta = [item.label, item.published, item.owner, views].filter(Boolean).join(" · ");
  const desc = item.description
    ? `<p class="cd-detail-dek">${escapeHtml(item.description)}</p>`
    : "";
  const img = item.image
    ? `<div class="cd-detail-media"><img src="${escapeHtml(item.image)}" alt="" loading="lazy" /></div>`
    : "";
  panel.innerHTML = `
    <div class="detail-body cd-detail-body">
      <div class="cd-detail-kicker">
        <span class="cd-detail-rank">${escapeHtml(String(rank))}</span>
        <span class="cd-detail-flag">CHINA DAILY</span>
      </div>
      <h2 class="cd-detail-title">${
        item.url
          ? `<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.title)}</a>`
          : escapeHtml(item.title)
      }</h2>
      ${meta ? `<p class="cd-detail-meta">${escapeHtml(meta)}</p>` : ""}
      ${desc}
      ${img}
      ${
        item.url
          ? `<a class="cd-detail-link" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">Read on China Daily →</a>`
          : ""
      }
    </div>
  `;
}

function renderChinaDailyBoard(source, activeIndex) {
  const items = source?.items || [];
  const list = document.getElementById("compact-list");
  const filtered = filterItems(items);

  document.getElementById("item-count").textContent = String(filtered.length);
  updateListFilterHint(filtered.length, items.length);

  if (!filtered.length) {
    list.innerHTML = `<li class="compact-empty">${items.length ? "无匹配条目" : "暂无条目"}</li>`;
    return;
  }

  list.innerHTML = filtered
    .map(({ item, index }) => {
      const active = index === activeIndex ? " active" : "";
      const isNew = isItemNew(activeSourceKey, item);
      const newClass = isNew ? " is-new" : "";
      const newBadge = isNew ? `<span class="new-badge" aria-label="新内容">新</span>` : "";
      const rank = item.rank || index + 1;
      const views =
        item.score != null && Number(item.score) > 0
          ? `${Number(item.score).toLocaleString("en-US")} views`
          : "";
      const sub = [item.published, item.label, views].filter(Boolean).join(" · ");
      const dek = item.description
        ? `<span class="cd-dek">${escapeHtml(item.description)}</span>`
        : "";

      return `
      <li class="compact-row cd-row${newClass}">
        <button type="button" class="compact-item cd-item${active}${newClass}" data-index="${index}" role="option" aria-selected="${active ? "true" : "false"}">
          <span class="cd-rank" aria-hidden="true">${escapeHtml(String(rank))}</span>
          <div class="cd-body">
            <span class="cd-title">${newBadge}${escapeHtml(item.title)}</span>
            ${dek}
            ${sub ? `<span class="cd-subtext">${escapeHtml(sub)}</span>` : ""}
          </div>
        </button>
        ${externalLink(item.url, "打开原文")}
      </li>`;
    })
    .join("");

  bindFeedListClicks(source, "button.cd-item");
}

function splitRepoTitle(item) {
  const title = String(item?.title || "");
  if (title.includes("/")) {
    const i = title.indexOf("/");
    return {
      owner: title.slice(0, i),
      name: title.slice(i + 1),
      full: title,
    };
  }
  const owner = item?.owner || "";
  return {
    owner,
    name: title,
    full: owner ? `${owner}/${title}` : title,
  };
}

function starIconSvg() {
  return `<svg class="gh-star-icon" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"/></svg>`;
}

function repoIconSvg() {
  return `<svg class="gh-repo-icon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v.563c.09-.033.186-.062.286-.093.41-.123.862-.186 1.214-.186h8ZM4.5 1.5A1 1 0 0 0 3.5 2.5v.563c.09-.033.186-.062.286-.093.41-.123.862-.186 1.214-.186h8v-1Z"/></svg>`;
}

function renderHnBoard(source, activeIndex) {
  const items = source?.items || [];
  const list = document.getElementById("compact-list");
  const filtered = filterItems(items);

  document.getElementById("item-count").textContent = String(filtered.length);
  updateListFilterHint(filtered.length, items.length);

  if (!filtered.length) {
    list.innerHTML = `<li class="compact-empty">${items.length ? "无匹配条目" : "暂无条目"}</li>`;
    return;
  }

  list.innerHTML = filtered
    .map(({ item, index }) => {
      const active = index === activeIndex ? " active" : "";
      const isNew = isItemNew(activeSourceKey, item);
      const newClass = isNew ? " is-new" : "";
      const newBadge = isNew ? `<span class="new-badge" aria-label="新内容">新</span>` : "";
      const rank = index + 1;
      const points = item.score != null ? `${Number(item.score).toLocaleString()} points` : "";
      const by = item.owner ? `by ${escapeHtml(item.owner)}` : "";
      const comments =
        item.comments != null ? `${Number(item.comments).toLocaleString()} comments` : "";
      const sub = [points, by, comments].filter(Boolean).join(" | ");

      return `
      <li class="compact-row hn-row${newClass}">
        <button type="button" class="compact-item hn-item${active}${newClass}" data-index="${index}" role="option" aria-selected="${active ? "true" : "false"}">
          <span class="hn-rank">${rank}.</span>
          <div class="hn-body">
            <span class="hn-title">${newBadge}${escapeHtml(item.title)}</span>
            ${sub ? `<span class="hn-subtext">${sub}</span>` : ""}
          </div>
        </button>
        ${externalLink(item.url, "打开原文")}
      </li>
    `;
    })
    .join("");

  bindFeedListClicks(source, "button.hn-item");
}

function renderGithubStyleList(source, activeIndex, { skills = false } = {}) {
  const items = source?.items || [];
  const list = document.getElementById("compact-list");
  const filtered = filterItems(items);
  const emptyLabel = skills ? "技能" : "仓库";

  document.getElementById("item-count").textContent = String(filtered.length);
  updateListFilterHint(filtered.length, items.length);

  if (!filtered.length) {
    list.innerHTML = `<li class="compact-empty">${items.length ? `无匹配${emptyLabel}` : `暂无${emptyLabel}`}</li>`;
    return;
  }

  list.innerHTML = filtered
    .map(({ item, index }) => {
      const active = index === activeIndex ? " active" : "";
      const isNew = isItemNew(activeSourceKey, item);
      const newClass = isNew ? " is-new" : "";
      const newBadge = isNew ? `<span class="new-badge" aria-label="新内容">新</span>` : "";
      const repo = splitRepoTitle(item);
      const stars =
        item.stars != null
          ? `<span class="gh-stars">${starIconSvg()} ${Number(item.stars).toLocaleString()}</span>`
          : "";
      const lang = item.language
        ? `<span class="gh-lang"><span class="gh-lang-dot" style="background:${languageColor(item.language)}"></span>${escapeHtml(item.language)}</span>`
        : "";
      const desc = item.description
        ? `<p class="gh-desc">${escapeHtml(item.description)}</p>`
        : "";
      const skillBits = skills
        ? [
            item.label ? `<span class="gh-topic">${escapeHtml(item.label)}</span>` : "",
            item.skillCount != null
              ? `<span class="gh-meta-muted">${item.skillCount} skills</span>`
              : "",
            item.latestSha
              ? `<span class="gh-meta-muted">${escapeHtml(String(item.latestSha).slice(0, 7))}</span>`
              : "",
          ]
            .filter(Boolean)
            .join("")
        : "";
      const ownerSpan = repo.owner
        ? `<span class="gh-owner-name">${escapeHtml(repo.owner)}</span><span class="gh-name-sep"> / </span>`
        : "";

      return `
      <li class="compact-row github-row${newClass}">
        <button type="button" class="compact-item github-item${active}${newClass}" data-index="${index}" role="option" aria-selected="${active ? "true" : "false"}">
          <div class="gh-card">
            <div class="gh-card-main">
              <div class="gh-repo-line">
                ${repoIconSvg()}
                <span class="gh-repo-name">${newBadge}${ownerSpan}<span class="gh-repo-leaf">${escapeHtml(repo.name)}</span></span>
              </div>
              ${desc}
              <div class="gh-meta-row">
                ${lang}
                ${stars}
                ${skillBits}
              </div>
            </div>
          </div>
        </button>
        ${externalLink(item.url, skills ? "打开仓库" : "打开仓库")}
      </li>
    `;
    })
    .join("");

  bindFeedListClicks(source, "button.github-item");
}

function renderGithubBoard(source, activeIndex) {
  renderGithubStyleList(source, activeIndex, { skills: false });
}

function renderSkillsBoard(source, activeIndex) {
  renderGithubStyleList(source, activeIndex, { skills: true });
}

function renderJournalsBoard(source, activeIndex) {
  const items = source?.items || [];
  const list = document.getElementById("compact-list");
  const filtered = filterItems(items);

  document.getElementById("item-count").textContent = String(filtered.length);
  updateListFilterHint(filtered.length, items.length);

  if (!filtered.length) {
    list.innerHTML = `<li class="compact-empty">${items.length ? "无匹配论文" : "暂无论文"}</li>`;
    return;
  }

  list.innerHTML = filtered
    .map(({ item, index }) => {
      const active = index === activeIndex ? " active" : "";
      const isNew = isItemNew(activeSourceKey, item);
      const newClass = isNew ? " is-new" : "";
      const newBadge = isNew ? `<span class="new-badge" aria-label="新内容">新</span>` : "";
      const journal = item.journal
        ? `<span class="paper-journal">${escapeHtml(item.journal)}</span>`
        : "";
      const authors = item.authors
        ? `<span class="paper-authors">${escapeHtml(item.authors)}</span>`
        : "";
      const published = item.published
        ? `<span class="paper-date">${escapeHtml(item.published)}</span>`
        : "";
      const badges = [
        item.isOpenAccess ? `<span class="paper-badge paper-badge--oa">OA</span>` : "",
        item.pdfAvailable || item.pdfUrl ? `<span class="paper-badge paper-badge--pdf">PDF</span>` : "",
      ]
        .filter(Boolean)
        .join("");

      return `
      <li class="compact-row journals-row${newClass}">
        <button type="button" class="compact-item journals-item${active}${newClass}" data-index="${index}" role="option" aria-selected="${active ? "true" : "false"}">
          <div class="paper-body">
            <div class="paper-top">${journal}${badges}</div>
            <span class="paper-title">${newBadge}${escapeHtml(plainText(item.title))}</span>
            <div class="paper-meta">${[authors, published].filter(Boolean).join('<span class="paper-sep">·</span>')}</div>
          </div>
        </button>
        ${externalLink(item.url, "打开期刊页面")}
      </li>
    `;
    })
    .join("");

  bindFeedListClicks(source, "button.journals-item");
}

function renderSkillsCommitDetail(item, index) {
  const panel = document.getElementById("item-detail");
  if (!panel) return;
  const platform = getPlatformMeta(activeSourceKey);
  panel.className = `item-detail ${platform.theme} item-detail--feed-bar`;
  if (!item) {
    panel.innerHTML = `<div class="detail-body feed-bar-body"><p class="muted">暂无提交</p></div>`;
    return;
  }
  const title = item.url
    ? `<a href="${item.url}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.title)}</a>`
    : escapeHtml(item.title);
  const meta = [
    item.sha ? String(item.sha).slice(0, 7) : "",
    item.published || "",
    item.owner || "",
  ]
    .filter(Boolean)
    .join(" · ");
  panel.innerHTML = `
    <div class="detail-body feed-bar-body">
      <span class="commit-rank">${index + 1}</span>
      <div class="feed-bar-main">
        <h2 class="feed-bar-title">${title}</h2>
        ${meta ? `<span class="feed-bar-meta">${escapeHtml(meta)}</span>` : ""}
      </div>
      ${
        item.url
          ? `<a class="btn btn-primary" href="${item.url}" target="_blank" rel="noopener noreferrer">查看提交 →</a>`
          : ""
      }
    </div>
  `;
}

function renderSkillsCommitsBoard(source, activeIndex) {
  const items = source?.items || [];
  const list = document.getElementById("compact-list");
  const filtered = filterItems(items);
  const theme = getPlatformMeta(activeSourceKey).theme;

  document.getElementById("item-count").textContent = String(filtered.length);
  updateListFilterHint(filtered.length, items.length);

  if (!filtered.length) {
    list.innerHTML = `<li class="compact-empty">${items.length ? "无匹配提交" : "暂无提交"}</li>`;
    return;
  }

  list.innerHTML = filtered
    .map(({ item, index }) => {
      const active = index === activeIndex ? " active" : "";
      const isNew = isItemNew(activeSourceKey, item);
      const newClass = isNew ? " is-new" : "";
      const newBadge = isNew ? `<span class="new-badge" aria-label="新内容">新</span>` : "";
      const sha = item.sha ? `<span class="commit-sha">${escapeHtml(String(item.sha).slice(0, 7))}</span>` : "";
      const date = item.published
        ? `<span class="commit-date">${escapeHtml(item.published)}</span>`
        : "";
      const label = item.label ? `<span class="skill-label">${escapeHtml(item.label)}</span>` : "";

      return `
      <li class="compact-row commits-row ${theme}${newClass}">
        <button type="button" class="compact-item commits-item${active}${newClass}" data-index="${index}" role="option" aria-selected="${active ? "true" : "false"}">
          ${sha}
          <div class="commit-body">
            <span class="commit-title">${newBadge}${escapeHtml(item.title)}</span>
            <div class="commit-meta">${[date, label].filter(Boolean).join('<span class="paper-sep">·</span>')}</div>
          </div>
        </button>
        ${externalLink(item.url, "查看提交")}
      </li>
    `;
    })
    .join("");

  bindFeedListClicks(source, "button.commits-item");
}

function renderItemDetail(item, index) {
  const panel = document.getElementById("item-detail");
  if (!item) {
    panel.className = "item-detail";
    panel.innerHTML = `<div class="detail-body"><div class="empty-state"><p>当前分类暂无内容。</p></div></div>`;
    return;
  }

  const platform = getPlatformMeta(activeSourceKey);
  if (isWeiboSource(activeSourceKey)) {
    renderWeiboDetail(item, index);
    return;
  }

  if (isJournalSource(activeSourceKey)) {
    renderJournalDetail(item, index, platform);
    return;
  }

  if (isGithubSource(activeSourceKey)) {
    renderGithubDetail(item, index, platform);
    return;
  }

  if (isTrackedSkillsSource(activeSourceKey)) {
    renderTrackedSkillsDetail(item, index, platform);
    return;
  }

  panel.className = `item-detail ${platform.theme}`;

  const title = item.url
    ? `<a href="${item.url}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.title)}</a>`
    : escapeHtml(item.title);

  const desc = item.description
    ? `<p class="detail-desc">${escapeHtml(item.description)}</p>`
    : `<p class="detail-desc muted">暂无描述</p>`;

  const rankLabel = String(index + 1).padStart(2, "0");

  const meta = [
    metaPill(platform.name, "accent"),
    item.journal ? metaPill(item.journal, "accent") : "",
    item.authors ? metaPill(item.authors) : "",
    item.published ? metaPill(`📅 ${item.published}`) : "",
    item.stars != null ? metaPill(`★ ${Number(item.stars).toLocaleString()}`, "star") : "",
    item.score != null ? metaPill(`▲ ${Number(item.score).toLocaleString()}`, "hot") : "",
    item.comments != null ? metaPill(`💬 ${Number(item.comments).toLocaleString()}`) : "",
    item.owner && !item.journal ? metaPill(`@${item.owner}`) : "",
    item.language ? metaPill(item.language, "lang") : "",
    item.label ? metaPill(item.label, "hot") : "",
    item.isOpenAccess ? metaPill("开放获取", "success") : "",
    item.pdfAvailable ? metaPill("PDF 已存档", "success") : "",
  ]
    .filter(Boolean)
    .join("");

  const linkLabel = item.journal || item.doi ? "打开期刊页面" : "打开原文";
  const actionLinks = [
    item.url
      ? `<a class="btn btn-primary" href="${item.url}" target="_blank" rel="noopener noreferrer">${linkLabel} →</a>`
      : "",
    item.pdfUrl
      ? `<a class="btn btn-success" href="${item.pdfUrl}" target="_blank" rel="noopener noreferrer">下载 PDF →</a>`
      : "",
  ].filter(Boolean).join("");

  const pdfNote = !item.pdfUrl && item.isOpenAccess
    ? `<p class="detail-note">本篇为开放获取，但未找到可直接下载的 PDF 文件。</p>`
    : !item.pdfUrl && item.doi
      ? `<p class="detail-note">PDF 通常需机构订阅；已提供 DOI 期刊页面链接。</p>`
      : "";

  panel.innerHTML = `
    <div class="detail-body">
      <div class="detail-header">
        <span class="detail-rank-badge">#${rankLabel}</span>
        ${metaPill(platform.name, "accent")}
      </div>
      <h2 class="detail-title">${title}</h2>
      <div class="detail-divider"></div>
      ${desc}
      <div class="detail-meta">${meta}</div>
      <div class="detail-actions">${actionLinks}</div>
      ${pdfNote}
    </div>
  `;
}

function renderGithubDetail(item, index, platform) {
  const panel = document.getElementById("item-detail");
  panel.className = `item-detail ${platform.theme}`;

  const title = item.url
    ? `<a href="${item.url}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.title)}</a>`
    : escapeHtml(item.title);

  const desc = item.description
    ? `<p class="detail-desc">${escapeHtml(item.description)}</p>`
    : `<p class="detail-desc muted">暂无描述</p>`;

  const rankLabel = String(index + 1).padStart(2, "0");
  const readmeBlock = renderGithubReadmeBlock(item);

  const meta = [
    metaPill(platform.name, "accent"),
    item.stars != null ? metaPill(`★ ${Number(item.stars).toLocaleString()}`, "star") : "",
    item.owner ? metaPill(`@${item.owner}`) : "",
    item.language ? metaPill(item.language, "lang") : "",
    item.readme
      ? metaPill("README 已收录", "success")
      : item.readmeMissing
        ? metaPill("无 README", "default")
        : metaPill("README 加载中", "default"),
  ]
    .filter(Boolean)
    .join("");

  panel.innerHTML = `
    <div class="detail-body">
      <div class="detail-header">
        <span class="detail-rank-badge">#${rankLabel}</span>
        ${metaPill(platform.name, "accent")}
      </div>
      <h2 class="detail-title">${title}</h2>
      <div class="detail-divider"></div>
      ${desc}
      <div class="detail-meta">${meta}</div>
      <div class="detail-actions">
        ${item.url ? `<a class="btn btn-primary" href="${item.url}" target="_blank" rel="noopener noreferrer">打开仓库 →</a>` : ""}
      </div>
      ${readmeBlock}
    </div>
  `;
}

function renderTrackedSkillsDetail(item, index, platform) {
  const panel = document.getElementById("item-detail");
  panel.className = `item-detail ${platform.theme}`;

  const title = item.url
    ? `<a href="${item.url}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.title)}</a>`
    : escapeHtml(item.title);

  const desc = item.description
    ? `<p class="detail-desc">${escapeHtml(item.description)}</p>`
    : `<p class="detail-desc muted">暂无描述</p>`;

  const rankLabel = String(index + 1).padStart(2, "0");
  const repoFullName = TRACKED_SKILLS_REPO[activeSourceKey] || item.repo || "";
  const showReadme =
    activeSourceKey === "natureSkills" || activeSourceKey === "scientificSkills";
  const readmeBlock = showReadme ? renderGithubReadmeBlock(item, repoFullName) : "";
  const repoUrl = repoFullName ? `https://github.com/${repoFullName}` : item.url || "#";

  const meta = [
    metaPill(platform.name, "accent"),
    item.label ? metaPill(item.label, "hot") : "",
    item.version ? metaPill(`v${item.version}`, "lang") : "",
    item.sha ? metaPill(item.sha, "lang") : "",
    item.published ? metaPill(item.published, "accent") : "",
    item.stars != null ? metaPill(`★ ${Number(item.stars).toLocaleString()}`, "star") : "",
    item.skillCount != null ? metaPill(`${item.skillCount} skills`, "success") : "",
    item.owner ? metaPill(`@${item.owner}`) : "",
    showReadme && item.readme
      ? metaPill("SKILL/README 已收录", "success")
      : showReadme && !item.readmeMissing
        ? metaPill("README 加载中", "default")
        : "",
  ]
    .filter(Boolean)
    .join("");

  const primaryLabel =
    item.label === "commit" ? "打开提交 →" : item.label === "skill" ? "打开 Skill →" : "打开仓库 →";

  panel.innerHTML = `
    <div class="detail-body">
      <div class="detail-header">
        <span class="detail-rank-badge">#${rankLabel}</span>
        ${metaPill(platform.name, "accent")}
      </div>
      <h2 class="detail-title">${title}</h2>
      <div class="detail-divider"></div>
      ${desc}
      <div class="detail-meta">${meta}</div>
      <div class="detail-actions">
        ${item.url ? `<a class="btn btn-primary" href="${item.url}" target="_blank" rel="noopener noreferrer">${primaryLabel}</a>` : ""}
        <a class="btn btn-secondary" href="${repoUrl}" target="_blank" rel="noopener noreferrer">源仓库 →</a>
      </div>
      ${readmeBlock}
    </div>
  `;
}

function renderCompactList(source, activeIndex) {
  const items = source?.items || [];
  const list = document.getElementById("compact-list");
  const filtered = filterItems(items);
  const hint = document.getElementById("list-filter-hint");

  document.getElementById("item-count").textContent = String(filtered.length);

  if (hint) {
    if (searchQuery.trim()) {
      hint.hidden = false;
      hint.textContent = `匹配 ${filtered.length} / ${items.length}`;
    } else {
      hint.hidden = true;
      hint.textContent = "";
    }
  }

  if (!filtered.length) {
    list.innerHTML = `<li class="compact-empty">${items.length ? "无匹配条目" : "暂无条目"}</li>`;
    return;
  }

  list.innerHTML = filtered
    .map(({ item, index }) => {
      const active = index === activeIndex ? " active" : "";
      const isNew = isItemNew(activeSourceKey, item);
      const meta = itemCompactMeta(item);
      const journalClass = isJournalSource(activeSourceKey) ? " compact-item-journal" : "";
      const newClass = isNew ? " is-new" : "";
      const newBadge = isNew ? `<span class="new-badge" aria-label="新内容">新</span>` : "";
      const external = item.url
        ? `<a class="compact-external" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer" title="打开原链接" aria-label="打开原链接">${icon("external", "icon icon-compact")}</a>`
        : `<span class="compact-external compact-external--empty"></span>`;

      return `
      <li class="compact-row${newClass}">
        <button type="button" class="compact-item${active}${journalClass}${newClass}" data-index="${index}" role="option" aria-selected="${active ? "true" : "false"}">
          <span class="compact-rank">${index + 1}</span>
          <div class="compact-body${isJournalSource(activeSourceKey) ? " compact-body-journal" : ""}">
            <span class="compact-title">${newBadge}${escapeHtml(item.title)}</span>
            ${meta ? `<span class="compact-meta">${escapeHtml(meta)}</span>` : ""}
          </div>
        </button>
        ${external}
      </li>
    `;
    })
    .join("");

  list.querySelectorAll("button.compact-item").forEach((el) => {
    el.addEventListener("click", () => {
      selectListItem(source, Number(el.dataset.index));
    });
  });
}

async function syncPanel(data, { preserveItemIndex = true } = {}) {
  const seq = ++panelSyncSeq;
  const sourceKey = activeSourceKey;
  applyFeedLayout(getFeedMode(sourceKey));
  applyPanelTheme();
  highlightMetaPlatform(activeParentId);
  fillCategorySelect(data);
  fillDateSelect(data);
  renderBreadcrumb(data, getSource(data, sourceKey) || { label: sourceKey });
  writeHashRoute();
  const stub = getSource(data, sourceKey);
  const descEl = document.getElementById("section-desc");
  if (descEl) {
    descEl.textContent = stub?.description || "加载中…";
    descEl.classList.remove("section-desc--history");
  }
  const listEl = document.getElementById("compact-list");
  if (listEl) listEl.innerHTML = `<li class="compact-empty">加载中…</li>`;
  const countEl = document.getElementById("item-count");
  if (countEl) countEl.textContent = "…";
  const detailEl = document.getElementById("item-detail");
  if (detailEl) {
    detailEl.innerHTML = `<div class="detail-body"><p class="muted">加载中…</p></div>`;
  }

  const paint = (source) => {
    if (seq !== panelSyncSeq || activeSourceKey !== sourceKey) return false;
    const items = source?.items || [];
    currentSourceRef = source;
    fillContentFilters(items);
    updateContentStatus(source);
    workspaceRecordVisit(sourceKey, source);
    bootstrapSeenIfNeeded(sourceKey, items);
    const previousIndex = preserveItemIndex ? activeItemIndex : 0;
    const dateKey = selectedDates[sourceKey] || "latest";

    renderBreadcrumb(data, source);
    fillCategorySelect(data);
    fillDateSelect(data);

    let desc = source?.description || "";
    if (dateKey !== "latest") {
      desc = `【历史快照 ${formatSnapshotLabel(dateKey)}】${desc ? ` ${desc}` : ""}`;
    } else if (sourceKey === WEIBO_REALTIME_KEY) {
      const hint = weiboRealtimeLiveHint();
      if (hint) desc = `${hint}${desc ? ` ${desc}` : ""}`;
    }
    const descEl = document.getElementById("section-desc");
    descEl.textContent = desc;
    descEl.classList.toggle("section-desc--history", dateKey !== "latest");

    renderJournalStats(data, source);
    renderMobileSubnav(data);

    const searchInput = document.getElementById("search-input");
    if (searchInput && searchInput.value !== searchQuery) {
      searchInput.value = searchQuery;
    }
    const ghSearch = document.getElementById("gh-chrome-search");
    if (ghSearch && ghSearch.value !== searchQuery) {
      ghSearch.value = searchQuery;
    }

    activeItemIndex = fillItemSelect(source, previousIndex);
    const filtered = filterItems(items);
    if (filtered.length && !filtered.some(({ index }) => index === activeItemIndex)) {
      activeItemIndex = filtered[0].index;
    }

    updateNewHints(sourceKey, items);
    updatePinButton();
    renderActiveDetail(filtered.length ? items[activeItemIndex] : null, activeItemIndex);
    renderActiveList(source, activeItemIndex);
    writeHashRoute();
    triggerPanelFade();
    if (preserveItemIndex && items.length) {
      openMobileDetailIfNeeded();
    }
    return true;
  };

  const dateKey = selectedDates[sourceKey] || "latest";
  const preferLite = dateKey === "latest" && sourceKey !== WEIBO_REALTIME_KEY;

  try {
    const first = await resolveSource(data, sourceKey, { lite: preferLite });
    if (!paint(first)) return;
  } catch (err) {
    if (seq !== panelSyncSeq || activeSourceKey !== sourceKey) return;
    document.getElementById("section-desc").textContent = err.message;
    currentSourceRef = null;
    document.getElementById("item-count").textContent = "0";
    document.getElementById("compact-list").innerHTML = `<li class="compact-empty">暂无条目</li>`;
    document.getElementById("item-detail").innerHTML =
      `<div class="detail-body"><div class="empty-state"><p>${escapeHtml(err.message)}</p><button type="button" onclick="void syncPanel(appData)">重试加载</button></div></div>`;
    updateNewHints(sourceKey, []);
    writeHashRoute();
  }
}

function bindSearch(data) {
  const inputs = [
    document.getElementById("search-input"),
    document.getElementById("gh-chrome-search"),
  ].filter(Boolean);

  let timer = null;
  const runFilter = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      void (async () => {
        try {
          const source = await resolveSource(data, activeSourceKey, {
            lite: activeSourceKey !== WEIBO_REALTIME_KEY,
          });
          const filtered = filterItems(source?.items || []);
          if (filtered.length && !filtered.some(({ index }) => index === activeItemIndex)) {
            activeItemIndex = filtered[0].index;
          }
          renderActiveDetail((source?.items || [])[activeItemIndex], activeItemIndex);
          renderActiveList(source, activeItemIndex);
          writeHashRoute();
        } catch (_) {
          /* ignore */
        }
      })();
    }, 120);
  };

  inputs.forEach((input) => {
    if (input.dataset.bound === "1") return;
    input.dataset.bound = "1";
    input.addEventListener("input", () => {
      searchQuery = input.value || "";
      inputs.forEach((other) => {
        if (other !== input && other.value !== searchQuery) other.value = searchQuery;
      });
      runFilter();
    });
  });
}

function bindMarkRead() {
  const btn = document.getElementById("mark-read-btn");
  if (!btn || btn.dataset.bound === "1") return;
  btn.dataset.bound = "1";
  btn.addEventListener("click", () => {
    const items = currentSourceRef?.items || [];
    markSourceSeen(activeSourceKey, items);
    updateNewHints(activeSourceKey, items);
    renderActiveList(currentSourceRef, activeItemIndex);
  });
}

function bindPinButton(data) {
  const btn = document.getElementById("pin-source-btn");
  if (!btn || btn.dataset.bound === "1") return;
  btn.dataset.bound = "1";
  btn.addEventListener("click", () => {
    togglePin(activeSourceKey);
    updatePinButton();
    renderTree(data);
  });
}

async function buildDigest(data) {
  const body = document.getElementById("digest-body");
  if (!body) return;
  body.innerHTML = `<p class="muted">正在汇总各栏目…</p>`;

  const sourceKeys = [];
  getCatalog(data).forEach((parent) => {
    parent.children?.forEach((child) => sourceKeys.push(child.sourceKey));
  });

  const rows = await Promise.all(
    sourceKeys.map(async (sourceKey) => {
      try {
        const source = await resolveSource(data, sourceKey, { lite: true });
        const items = source?.items || [];
        bootstrapSeenIfNeeded(sourceKey, items);
        const newCount = countNewItems(sourceKey, items);
        const newItems = items.filter((item) => isItemNew(sourceKey, item)).slice(0, 5);
        const meta = findSourceMeta(data, sourceKey);
        const updated = getLatestUpdatedAt(data, sourceKey);
        return {
          sourceKey,
          label: meta?.label || source?.label || sourceKey,
          parentLabel: meta?.parentLabel || "",
          parentId: meta?.parentId || "github",
          count: items.length,
          newCount,
          newItems,
          updated,
        };
      } catch (_) {
        return null;
      }
    })
  );

  const valid = rows.filter(Boolean);
  const totalNew = valid.reduce((n, row) => n + row.newCount, 0);
  const today = new Date().toLocaleDateString("zh-CN");

  body.innerHTML = `
    <p class="digest-lead">${escapeHtml(today)} · 共检测到 <strong>${totalNew}</strong> 条相对上次浏览的新内容</p>
    <div class="digest-grid">
      ${valid
        .map((row) => {
          const platform = platformForSource(row.parentId, row.sourceKey);
          const health = healthStatus(row.updated, platform);
          const news =
            row.newItems.length > 0
              ? `<ul class="digest-new-list">${row.newItems
                  .map((item) => `<li>${escapeHtml(item.title || "")}</li>`)
                  .join("")}${row.newCount > row.newItems.length ? `<li>…另有 ${row.newCount - row.newItems.length} 条</li>` : ""}</ul>`
              : `<p class="muted digest-empty">暂无新条目</p>`;
          return `<section class="digest-card ${getParentTheme(row.parentId)}">
            <header>
              <h3>${escapeHtml(row.label)}</h3>
              <span class="health-pill health-${health.level}">${escapeHtml(health.label)}</span>
            </header>
            <p class="digest-meta">${row.count} 条 · 新 ${row.newCount} · ${escapeHtml(row.updated ? formatDate(row.updated) : "—")}</p>
            ${news}
            <button type="button" class="btn-text digest-jump" data-source-key="${row.sourceKey}">打开栏目</button>
          </section>`;
        })
        .join("")}
    </div>
  `;

  body.querySelectorAll(".digest-jump").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.getElementById("digest-dialog")?.close();
      jumpToSource(data, btn.dataset.sourceKey);
    });
  });
}

function bindDigest(data) {
  const openBtns = [
    document.getElementById("open-digest-btn"),
    document.getElementById("ws-digest-btn"),
  ].filter(Boolean);
  const dialog = document.getElementById("digest-dialog");
  const closeBtn = document.getElementById("digest-close-btn");
  if (!dialog || !openBtns.length) return;
  openBtns.forEach((openBtn) => {
    if (openBtn.dataset.bound === "1") return;
    openBtn.dataset.bound = "1";
    openBtn.addEventListener("click", () => {
      dialog.showModal();
      void buildDigest(data);
    });
  });
  closeBtn?.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  const swUrl = new URL("sw.js", window.location.href);
  navigator.serviceWorker.register(swUrl.href).catch(() => {
    /* ignore offline registration failures */
  });
}

async function forceRefreshSiteData() {
  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((key) => key.startsWith("clatch-")).map((key) => caches.delete(key))
      );
    }
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((reg) => reg.unregister()));
    }
  } catch (_) {
    /* ignore */
  }
  Object.keys(latestSourceCache).forEach((key) => delete latestSourceCache[key]);
  Object.keys(historyCache).forEach((key) => delete historyCache[key]);
  const url = new URL(window.location.href);
  url.searchParams.set("refresh", String(Date.now()));
  window.location.replace(url.toString());
}

function bindForceRefresh() {
  const btns = [
    document.getElementById("force-refresh-btn"),
    document.getElementById("ws-refresh-btn"),
  ].filter(Boolean);
  btns.forEach((btn) => {
    if (btn.dataset.bound === "1") return;
    btn.dataset.bound = "1";
    btn.addEventListener("click", () => {
      btn.disabled = true;
      btn.textContent = "刷新中…";
      void forceRefreshSiteData();
    });
  });
}

function isTypingTarget(el) {
  if (!el) return false;
  const tag = (el.tagName || "").toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || el.isContentEditable;
}

function moveSelection(delta) {
  if (!currentSourceRef) return;
  const filtered = filterItems(currentSourceRef.items || []);
  if (!filtered.length) return;
  let pos = filtered.findIndex(({ index }) => index === activeItemIndex);
  if (pos < 0) pos = 0;
  pos = Math.min(Math.max(0, pos + delta), filtered.length - 1);
  selectListItem(currentSourceRef, filtered[pos].index);
  const activeBtn = document.querySelector(`#compact-list button[data-index="${filtered[pos].index}"]`);
  activeBtn?.scrollIntoView({ block: "nearest" });
}

function openActiveItem() {
  const item = currentSourceRef?.items?.[activeItemIndex];
  if (item?.url) {
    markItemSeen(activeSourceKey, item);
    updateNewHints(activeSourceKey, currentSourceRef.items || []);
    window.open(item.url, "_blank", "noopener,noreferrer");
  }
}

function itemSearchHay(item) {
  return `${item.title || ""} ${plainText(item.description || "")} ${item.owner || ""} ${item.label || ""} ${item.language || ""} ${item.repo || ""} ${item.authors || ""} ${item.doi || ""} ${item.journal || ""} ${item.published || ""}`.toLowerCase();
}

async function loadPaletteItemIndex(data) {
  if (paletteItemIndex) return paletteItemIndex;
  if (paletteItemPromise) return paletteItemPromise;
  paletteItemPromise = (async () => {
    const keys = flattenCatalogSources(data);
    const rows = [];
    await Promise.all(
      keys.map(async (key) => {
        try {
          const source = await resolveSource(data, key, { lite: true });
          const parent = findSourceMeta(data, key);
          (source?.items || []).forEach((item, index) => {
            rows.push({
              id: `item:${key}:${index}`,
              title: item.title || "(无标题)",
              hint: `${parent?.parentLabel || getPlatformMeta(key).name} · 条目`,
              hay: itemSearchHay(item),
              run: () => jumpToSource(data, key, index),
            });
          });
        } catch (_) {
          /* skip a source that failed to load */
        }
      })
    );
    paletteItemIndex = rows;
    return rows;
  })();
  try {
    return await paletteItemPromise;
  } catch (_) {
    paletteItemPromise = null;
    return [];
  }
}

function commandPaletteItems(data) {
  const items = [];
  getCatalog(data).forEach((parent) => {
    parent.children?.forEach((child) => {
      const source = getSource(data, child.sourceKey);
      items.push({
        id: `go:${child.sourceKey}`,
        title: `${parent.label} / ${source?.label || child.id}`,
        hint: child.sourceKey,
        run: () => jumpToSource(data, child.sourceKey, 0),
      });
    });
  });
  items.push(
    {
      id: "act:digest",
      title: "打开今日摘要",
      hint: "摘要",
      run: () => {
        const dialog = document.getElementById("digest-dialog");
        dialog?.showModal();
        void buildDigest(data);
      },
    },
    {
      id: "act:focus",
      title: isFocusMode() ? "退出专注模式" : "进入专注模式",
      hint: "F",
      run: () => setFocusMode(!isFocusMode()),
    },
    {
      id: "act:density",
      title: getDensity() === "compact" ? "切换为舒适密度" : "切换为紧凑密度",
      hint: "D",
      run: () => setDensity(getDensity() === "compact" ? "comfortable" : "compact"),
    },
    {
      id: "act:layout",
      title: isWorkstation() ? "切换为经典布局" : "切换为工作站布局",
      hint: "布局",
      run: () => {
        setWorkstation(!isWorkstation());
        renderTree(data);
      },
    },
    {
      id: "act:refresh",
      title: "强制刷新数据",
      hint: "刷新",
      run: () => void forceRefreshSiteData(),
    }
  );
  return items;
}

function bindCommandPalette(data) {
  const dialog = document.getElementById("command-palette");
  const input = document.getElementById("command-palette-input");
  const list = document.getElementById("command-palette-list");
  const openBtn = document.getElementById("ws-command-btn");
  if (!dialog || !input || !list || dialog.dataset.bound === "1") return;
  dialog.dataset.bound = "1";

  let filtered = [];
  let selected = 0;
  let renderSeq = 0;

  const paintPalette = (items) => {
    filtered = items;
    if (selected >= filtered.length) selected = Math.max(0, filtered.length - 1);
    list.innerHTML = filtered.length
      ? filtered
          .map(
            (item, idx) => `
      <li>
        <button type="button" class="command-palette-item" role="option" aria-selected="${idx === selected}" data-index="${idx}">
          <span>${escapeHtml(item.title)}</span>
          <small>${escapeHtml(item.hint || "")}</small>
        </button>
      </li>`
          )
          .join("")
      : `<li class="command-palette-item">无匹配命令或条目</li>`;
    list.querySelectorAll(".command-palette-item[data-index]").forEach((btn) => {
      btn.addEventListener("click", () => runIndex(Number(btn.dataset.index)));
    });
  };

  const renderList = () => {
    const q = (input.value || "").trim().toLowerCase();
    const commands = commandPaletteItems(data);
    const matchedCommands = commands.filter((item) => {
      if (!q) return true;
      return `${item.title} ${item.hint} ${item.id}`.toLowerCase().includes(q);
    });
    if (!q) {
      paintPalette(matchedCommands);
      return;
    }
    const seq = ++renderSeq;
    if (!paletteItemIndex && !paletteItemPromise) void loadPaletteItemIndex(data);
    const applyItems = (rows) => {
      if (seq !== renderSeq) return;
      const matchedItems = rows
        .filter((row) => row.title.toLowerCase().includes(q) || row.hay.includes(q))
        .slice(0, 12);
      paintPalette([...matchedItems, ...matchedCommands]);
    };
    if (paletteItemIndex) {
      applyItems(paletteItemIndex);
      return;
    }
    paintPalette(matchedCommands);
    void loadPaletteItemIndex(data).then(applyItems);
  };

  const runIndex = (idx) => {
    const item = filtered[idx];
    if (!item) return;
    dialog.close();
    item.run();
  };

  const openPalette = () => {
    input.value = "";
    selected = 0;
    renderList();
    dialog.showModal();
    input.focus();
  };

  openBtn?.addEventListener("click", openPalette);
  input.addEventListener("input", () => {
    selected = 0;
    renderList();
  });
  input.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      selected = Math.min(selected + 1, Math.max(0, filtered.length - 1));
      renderList();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      selected = Math.max(0, selected - 1);
      renderList();
    } else if (event.key === "Enter") {
      event.preventDefault();
      runIndex(selected);
    }
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  window.__hjlOpenPalette = openPalette;
}

function bindShortcutsDialog() {
  const dialog = document.getElementById("shortcuts-dialog");
  const openBtn = document.getElementById("ws-help-btn");
  const closeBtn = document.getElementById("shortcuts-close-btn");
  if (!dialog || dialog.dataset.bound === "1") return;
  dialog.dataset.bound = "1";
  openBtn?.addEventListener("click", () => dialog.showModal());
  closeBtn?.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
}

function bindWorkstationShell(data) {
  syncWorkstationButtons();
  const layoutBtn = document.getElementById("ws-layout-btn");
  const focusBtn = document.getElementById("ws-focus-btn");
  const densityBtn = document.getElementById("ws-density-btn");
  if (layoutBtn && layoutBtn.dataset.bound !== "1") {
    layoutBtn.dataset.bound = "1";
    layoutBtn.addEventListener("click", () => {
      setWorkstation(!isWorkstation());
      renderTree(data);
    });
  }
  if (focusBtn && focusBtn.dataset.bound !== "1") {
    focusBtn.dataset.bound = "1";
    focusBtn.addEventListener("click", () => setFocusMode(!isFocusMode()));
  }
  if (densityBtn && densityBtn.dataset.bound !== "1") {
    densityBtn.dataset.bound = "1";
    densityBtn.addEventListener("click", () => {
      setDensity(getDensity() === "compact" ? "comfortable" : "compact");
    });
  }
  bindCommandPalette(data);
  bindShortcutsDialog();
}

function bindKeyboard(data) {
  if (window.__hjlKeysBound) return;
  window.__hjlKeysBound = true;
  document.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      window.__hjlOpenPalette?.();
      return;
    }
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const typing = isTypingTarget(event.target);
    if (event.target?.closest?.("button, a, summary, [role='button']") || document.querySelector("dialog[open]")) return;
    const palette = document.getElementById("command-palette");
    if (palette?.open) return;

    if (event.key === "/" && !typing) {
      event.preventDefault();
      const platform = document.documentElement.getAttribute("data-platform");
      const preferGh =
        !isWorkstation() &&
        (platform === "github" ||
          platform === "natureSkills" ||
          platform === "scientificSkills");
      (preferGh
        ? document.getElementById("gh-chrome-search")
        : document.getElementById("search-input")
      )?.focus();
      return;
    }
    if (event.key === "Escape") {
      document.getElementById("command-palette")?.close();
      document.getElementById("shortcuts-dialog")?.close();
      const panel = document.getElementById("panel-content");
      if (panel?.classList.contains("is-mobile-detail") && !typing) {
        event.preventDefault();
        closeMobileDetail();
        return;
      }
      const main = document.getElementById("search-input");
      const gh = document.getElementById("gh-chrome-search");
      const active = document.activeElement;
      if (
        (main && (active === main || searchQuery)) ||
        (gh && active === gh)
      ) {
        clearSearchInputs();
        main?.blur();
        gh?.blur();
        if (currentSourceRef) {
          renderActiveList(currentSourceRef, activeItemIndex);
          updateNewHints(activeSourceKey, currentSourceRef.items || []);
        }
      }
      return;
    }
    if (typing) return;
    if (event.key === "?") {
      event.preventDefault();
      document.getElementById("shortcuts-dialog")?.showModal();
      return;
    }
    if (event.key === "f" || event.key === "F") {
      event.preventDefault();
      setFocusMode(!isFocusMode());
      return;
    }
    if (event.key === "d" || event.key === "D") {
      event.preventDefault();
      setDensity(getDensity() === "compact" ? "comfortable" : "compact");
      return;
    }
    if (event.key === "[" || event.key === "]") {
      event.preventDefault();
      cycleSource(data, event.key === "]" ? 1 : -1);
      return;
    }
    if (/^[1-7]$/.test(event.key)) {
      event.preventDefault();
      const parentId = BOARD_SHORTCUTS[Number(event.key) - 1];
      if (parentId) jumpToSource(data, firstSourceForParent(data, parentId));
      return;
    }
    if (event.key === "j" || event.key === "J") {
      event.preventDefault();
      moveSelection(1);
    } else if (event.key === "k" || event.key === "K") {
      event.preventDefault();
      moveSelection(-1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      openActiveItem();
    }
  });
}

async function loadContent() {
  const loading = document.getElementById("loading");
  const layout = document.getElementById("app-layout");
  loading.style.display = "block";
  layout.hidden = true;

  loadStoredDates();
  seenStore = loadSeenStore();
  pinStore = loadPins();

  try {
    const bust = Date.now();
    const [metaRes, manifestRes] = await Promise.all([
      fetch(`${META_URL}?t=${bust}`),
      fetch(`${MANIFEST_URL}?t=${bust}`),
      loadLiveEndpoints(),
    ]);

    if (metaRes.ok) {
      appData = await metaRes.json();
    } else {
      const contentRes = await fetch(`${DATA_URL}?t=${bust}`);
      if (!contentRes.ok) throw new Error(`HTTP ${contentRes.status}`);
      appData = await contentRes.json();
    }

    manifest = manifestRes.ok ? await manifestRes.json() : { sources: {} };

    const route = parseHashRoute();
    suppressHashWrite = true;
    if (route) applyRoute(appData, route, { sync: false });
    suppressHashWrite = false;

    renderMeta(appData);
    renderTree(appData);
    renderMobileNav(appData);
    renderMobileSubnav(appData);
    bindSearch(appData);
    bindMarkRead();
    bindPinButton(appData);
    bindDigest(appData);
    bindForceRefresh();
    bindHistoryCompare(appData);
    bindMobileDetailNav();
    bindWorkstationShell(appData);
    bindKeyboard(appData);
    updatePinButton();
    registerServiceWorker();
    await syncPanel(appData, { preserveItemIndex: Boolean(route) });
    bindReadingTools();
    initWorkspaceTools();

    loading.style.display = "none";
    document.getElementById("mobile-nav").hidden = false;
    layout.hidden = false;
  } catch (err) {
    loading.style.display = "none";
    const error = document.getElementById("error");
    error.style.display = "block";
    error.innerHTML = `<p>加载失败：${escapeHtml(err.message)}。请检查网络；本地预览需要 HTTP 服务器。</p><button type="button" onclick="location.reload()">重试</button>`;
  }
}

window.addEventListener("popstate", () => {
  if (!appData) return;
  clearSearchInputs();
  applyRoute(appData, parseHashRoute() || { sourceKey: "github", dateKey: "latest", itemIndex: 0 });
});

window.addEventListener("hashchange", () => {
  if (!appData) return;
  const route = parseHashRoute();
  if (!route) return;
  suppressHashWrite = true;
  applyRoute(appData, route, { sync: true });
  suppressHashWrite = false;
});

function backgroundImageStore(operation, image) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("hjl-background", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("images");
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("请关闭其他网站标签页后重试。"));
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => db.close();
      const transaction = db.transaction("images", operation === "get" ? "readonly" : "readwrite");
      const store = transaction.objectStore("images");
      const result = operation === "put" ? store.put(image, "custom") : store[operation]("custom");
      transaction.oncomplete = () => { db.close(); resolve(result.result); };
      transaction.onabort = transaction.onerror = () => { db.close(); reject(transaction.error || new Error("图片保存失败。")); };
    };
  });
}

async function prepareBackgroundImage(file) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("请选择 JPG、PNG 或 WebP 图片。");
  if (!file.size || file.size > 20 * 1024 * 1024) throw new Error("图片大小需在 0 到 20 MB 之间。");
  let bitmap;
  try { bitmap = await createImageBitmap(file); }
  catch (_) { throw new Error("无法读取这张图片，请更换有效图片。"); }
  try {
    if (bitmap.width * bitmap.height > 40000000) throw new Error("图片超过 4000 万像素，请先缩小后再上传。");
    const scale = Math.min(1, 1920 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/webp", 0.85));
    if (!blob) throw new Error("图片处理失败，请更换图片重试。");
    return blob;
  } finally { bitmap.close(); }
}

function initBackgroundSettings() {
  const root = document.documentElement;
  const dialog = document.getElementById("background-dialog");
  const range = document.getElementById("background-shade");
  const panelStrength = document.getElementById("background-panel-strength");
  const imageFirst = document.getElementById("background-image-first");
  const choices = [...dialog.querySelectorAll("[data-background-choice]")];
  const fileInput = document.getElementById("background-file");
  const position = document.getElementById("background-position");
  const remove = document.getElementById("background-remove");
  const status = document.getElementById("background-save-status");
  let imageUrl = "", revision = 0, previewSettings = null;
  let settings = { preset: "default", shade: 45, panelStrength: 55, position: "center" };
  try {
    const saved = JSON.parse(localStorage.getItem("hjl-background-v1") || "null");
    if (saved && choices.some(button => button.dataset.backgroundChoice === saved.preset)) settings.preset = saved.preset;
    if (Number.isFinite(saved?.shade) && saved.shade >= 5 && saved.shade <= 85) settings.shade = saved.shade;
    if (Number.isFinite(saved?.panelStrength) && saved.panelStrength >= 20 && saved.panelStrength <= 100) settings.panelStrength = saved.panelStrength;
    if (["center", "top", "bottom"].includes(saved?.position)) settings.position = saved.position;
  } catch (_) {}
  const apply = (persist = true) => {
    root.setAttribute("data-background", settings.preset);
    root.style.setProperty("--background-shade", `${settings.shade}%`);
    root.style.setProperty("--background-panel-strength", `${settings.panelStrength}%`);
    root.style.setProperty("--background-position", settings.position);
    position.value = settings.position;
    position.disabled = settings.preset !== "custom";
    choices.find(button => button.dataset.backgroundChoice === "custom").disabled = !imageUrl;
    remove.disabled = !imageUrl || fileInput.disabled;
    range.value = settings.shade;
    range.disabled = settings.preset === "default" || settings.preset === "plain";
    panelStrength.value = settings.panelStrength;
    panelStrength.disabled = imageFirst.disabled = range.disabled;
    document.getElementById("background-panel-value").textContent = `${settings.panelStrength}%`;
    document.getElementById("background-shade-value").textContent = `${settings.shade}%`;
    choices.forEach(button => button.setAttribute("aria-pressed", String(button.dataset.backgroundChoice === settings.preset)));
    if (persist) {
      try {
        localStorage.setItem("hjl-background-v1", JSON.stringify(settings));
        document.getElementById("background-save-status").textContent = "已保存，下次打开自动应用。";
      } catch (_) {
        document.getElementById("background-save-status").textContent = "当前效果已应用，但浏览器未允许保存设置。";
      }
    }
  };
  const setImage = blob => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    imageUrl = blob ? URL.createObjectURL(blob) : "";
    root.style.setProperty("--custom-background-image", imageUrl ? `url("${imageUrl}")` : "none");
  };
  choices.forEach(button => button.onclick = () => { settings.preset = button.dataset.backgroundChoice; apply(); });
  range.oninput = () => { settings.shade = Number(range.value); apply(); };
  panelStrength.oninput = () => { settings.panelStrength = Number(panelStrength.value); apply(); };
  imageFirst.onclick = () => { settings.shade = 10; settings.panelStrength = 35; apply(); };
  position.onchange = () => { settings.position = position.value; apply(); };
  fileInput.onchange = async () => {
    const file = fileInput.files[0];
    if (!file) return;
    revision++;
    fileInput.disabled = remove.disabled = true;
    status.textContent = "正在处理并保存图片…";
    try {
      const blob = await prepareBackgroundImage(file);
      await backgroundImageStore("put", blob);
      setImage(blob);
      settings.preset = "custom";
      settings.shade = 20;
      settings.panelStrength = 55;
      apply();
    } catch (error) { status.textContent = `未更换背景：${error.message || "浏览器存储不可用。"}`; }
    finally { fileInput.disabled = false; remove.disabled = !imageUrl; fileInput.value = ""; }
  };
  remove.onclick = async () => {
    revision++;
    fileInput.disabled = remove.disabled = true;
    try {
      await backgroundImageStore("delete");
      setImage(null);
      if (settings.preset === "custom") settings.preset = "default";
      apply();
      status.textContent = "已删除浏览器中的背景图片。";
    } catch (_) { status.textContent = "删除失败，原图片仍保留，请重试。"; }
    finally { fileInput.disabled = false; remove.disabled = !imageUrl; }
  };
  document.getElementById("background-open").onclick = () => { previewSettings = { ...settings }; dialog.showModal(); };
  document.getElementById("background-reading").onclick = () => { settings.shade = 65; settings.panelStrength = 95; apply(); };
  document.getElementById("background-undo").onclick = () => { if (previewSettings) { settings = { ...previewSettings }; if (settings.preset === "custom" && !imageUrl) settings.preset = "default"; apply(); } };
  document.getElementById("background-close").onclick = () => dialog.close();
  document.getElementById("background-reset").onclick = () => { settings = { preset: "default", shade: 45, panelStrength: 55, position: "center" }; apply(); };
  apply(false);
  backgroundImageStore("get").then(blob => {
    if (revision) return;
    if (blob instanceof Blob) setImage(blob);
    else if (settings.preset === "custom") {
      settings.preset = "default";
      status.textContent = "保存的图片已不存在，请重新上传。";
    }
    apply(false);
  }).catch(() => {
    if (revision) return;
    if (settings.preset === "custom") settings.preset = "default";
    apply(false);
    status.textContent = "浏览器图片存储不可用，仍可使用预设背景。";
  });
}

initBackgroundSettings();
initThemeToggle();
renderHeaderMotto();
loadContent();
