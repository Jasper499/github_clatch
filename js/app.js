const DATA_URL = "data/content.json";
const META_URL = "data/meta.json";
const MANIFEST_URL = "data/manifest.json";
const SOURCES_BASE = "data/sources";
const DATES_STORAGE_KEY = "hjl-source-dates";
const SEEN_STORAGE_KEY = "hjl-seen-v1";
const SEEN_MAX_PER_SOURCE = 400;
const PINS_STORAGE_KEY = "hjl-pins-v1";

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
    children: [{ id: "weibo", sourceKey: "weibo" }],
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

const PLATFORM_META = {
  github: { theme: "theme-github", short: "GH", name: "GitHub" },
  githubActive: { theme: "theme-github", short: "GH", name: "GitHub" },
  hackernews: { theme: "theme-hn", short: "HN", name: "Hacker News" },
  weibo: { theme: "theme-weibo", short: "WB", name: "微博" },
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
    journals: "theme-journals",
    natureSkills: "theme-nature",
    scientificSkills: "theme-scientific",
  };
  return map[parentId] || "theme-github";
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
  if (!brand || !sub) return;

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

function highlightMetaPlatform(platformId) {
  document.querySelectorAll(".meta-sync-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.platform === platformId);
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

function healthStatus(iso, maxAgeHours) {
  if (!iso) return { level: "bad", label: "无数据" };
  const ageMs = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ageMs)) return { level: "bad", label: "时间异常" };
  const ageHours = ageMs / 36e5;
  if (ageHours <= maxAgeHours) return { level: "ok", label: "正常" };
  if (ageHours <= maxAgeHours * 1.75) return { level: "warn", label: "偏旧" };
  return { level: "bad", label: "过期" };
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

function renderHealth(data) {
  const list = document.getElementById("health-list");
  if (!list) return;
  list.innerHTML = META_SYNC_PLATFORMS.map((platform) => {
    const iso = resolveMetaTimestamp(data, platform.field);
    const status = healthStatus(iso, platform.maxAgeHours || 48);
    const time = iso ? formatDate(iso) : "暂无记录";
    return `<li class="health-item health-${status.level}">
      <span class="health-dot" aria-hidden="true"></span>
      <span class="health-label">${escapeHtml(platform.label)}</span>
      <span class="health-status">${escapeHtml(status.label)}</span>
      <span class="health-time">${escapeHtml(time)}</span>
    </li>`;
  }).join("");
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
  if (sourceKey === "weibo" && data.weiboUpdatedAt) return data.weiboUpdatedAt;
  if (sourceKey === "hackernews" && data.hackernewsUpdatedAt) return data.hackernewsUpdatedAt;
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

async function resolveSource(data, sourceKey = activeSourceKey) {
  const dateKey = selectedDates[sourceKey] || "latest";
  if (dateKey === "latest") {
    if (latestSourceCache[sourceKey]) return latestSourceCache[sourceKey];

    const url = `${SOURCES_BASE}/${sourceKey}.json`;
    try {
      const res = await fetch(`${url}?t=${Date.now()}`);
      if (res.ok) {
        const snapshot = await res.json();
        latestSourceCache[sourceKey] = snapshot;
        if (data.sources?.[sourceKey]) {
          data.sources[sourceKey].itemCount = (snapshot.items || []).length;
          data.sources[sourceKey].label = snapshot.label || data.sources[sourceKey].label;
          data.sources[sourceKey].description =
            snapshot.description || data.sources[sourceKey].description;
        }
        return snapshot;
      }
    } catch (_) {
      /* fall through to embedded content.json sources */
    }

    const embedded = getSource(data, sourceKey);
    if (embedded?.items) {
      latestSourceCache[sourceKey] = embedded;
      return embedded;
    }
    throw new Error(`栏目数据加载失败 (${sourceKey})`);
  }

  const cacheKey = `${sourceKey}:${dateKey}`;
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
  if (!q) {
    return items.map((item, index) => ({ item, index }));
  }
  return items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => {
      const hay = `${item.title || ""} ${item.description || ""} ${item.owner || ""} ${item.label || ""} ${item.sha || ""}`.toLowerCase();
      return hay.includes(q);
    });
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
  history.replaceState(null, "", next);
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
      searchQuery = "";
      activeItemIndex = 0;
      const searchInput = document.getElementById("search-input");
      if (searchInput) searchInput.value = "";
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
  return sourceKey === "weibo";
}

function isHackerNewsSource(sourceKey = activeSourceKey) {
  return sourceKey === "hackernews";
}

function isSkillsCommitSource(sourceKey = activeSourceKey) {
  return sourceKey === "natureSkillsCommits" || sourceKey === "scientificSkillsCommits";
}

function isSkillsOverviewSource(sourceKey = activeSourceKey) {
  return sourceKey === "natureSkills" || sourceKey === "scientificSkills";
}

/** @returns {'weibo'|'hn'|'github'|'journals'|'skills'|'skills-commits'|null} */
function getFeedMode(sourceKey = activeSourceKey) {
  if (isWeiboSource(sourceKey)) return "weibo";
  if (isHackerNewsSource(sourceKey)) return "hn";
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

  const modes = ["weibo", "hn", "github", "journals", "skills", "skills-commits"];
  modes.forEach((m) => {
    panel.classList.remove(`panel-content--${m}-feed`);
    list.classList.remove(`${m}-board`, "hotboard", "hn-board", "github-board", "journals-board", "skills-board", "commits-board");
  });
  list.classList.remove("hotboard");

  const singleColumn = mode === "weibo" || mode === "hn" || mode === "skills-commits";
  panel.classList.toggle("panel-split", !singleColumn);
  if (mode) {
    panel.classList.add(`panel-content--${mode}-feed`);
  }

  const boardClass =
    mode === "weibo"
      ? "hotboard"
      : mode === "hn"
        ? "hn-board"
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
    github: "GitHub 仓库",
    journals: "期刊论文",
    skills: "Skills 清单",
    "skills-commits": "最近提交",
  };
  list.setAttribute("aria-label", labels[mode] || "条目");
}

function renderActiveList(source, activeIndex) {
  const mode = getFeedMode();
  if (mode === "weibo") return renderWeiboHotboard(source, activeIndex);
  if (mode === "hn") return renderHnBoard(source, activeIndex);
  if (mode === "github") return renderGithubBoard(source, activeIndex);
  if (mode === "journals") return renderJournalsBoard(source, activeIndex);
  if (mode === "skills-commits") return renderSkillsCommitsBoard(source, activeIndex);
  if (mode === "skills") return renderSkillsBoard(source, activeIndex);
  return renderCompactList(source, activeIndex);
}

function renderActiveDetail(item, index) {
  const mode = getFeedMode();
  if (mode === "weibo") return renderWeiboDetail(item, index);
  if (mode === "hn") return renderHnDetail(item, index);
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

function renderGithubReadmeBlock(item, repoFullName = null) {
  const fileName = item.readmeFile || "README.md";
  const markdownBase =
    repoFullName ||
    (String(item.title || "").includes("/") ? String(item.title).split(" · ")[0] : null);

  if (!item.readme) {
    return `
      <details class="readme-panel">
        <summary class="readme-summary">
          <span class="readme-summary-title">${escapeHtml(fileName)}</span>
          <span class="readme-summary-hint">暂无内容</span>
        </summary>
        <p class="detail-desc muted readme-empty">该仓库未提供 README，或抓取时未能获取。</p>
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
      searchQuery = "";
      activeItemIndex = 0;
      const searchInput = document.getElementById("search-input");
      if (searchInput) searchInput.value = "";
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
  const weekEl = document.getElementById("week-label");
  if (weekEl) {
    weekEl.textContent = data.weekLabel || `近 ${data.periodDays || 7} 天`;
  }

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
  const weekLabel = data.weekLabel || "本周精选";
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

  const weekNode = `
    ${pinnedBlock}
    <details class="tree-node tree-root" open>
      <summary class="tree-label tree-label-root">
        ${icon("calendar", "icon icon-tree")}
        <span>${escapeHtml(weekLabel)}</span>
      </summary>
      <div class="tree-children">
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
    </details>
  `;

  tree.innerHTML = weekNode;

  tree.querySelectorAll(".tree-leaf").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeParentId = btn.dataset.parentId;
      activeSourceKey = btn.dataset.sourceKey;
      searchQuery = "";
      activeItemIndex = 0;
      const searchInput = document.getElementById("search-input");
      if (searchInput) searchInput.value = "";
      renderTree(data);
      renderMobileNav(data);
      renderMobileSubnav(data);
      updatePinButton();
      void syncPanel(data, { preserveItemIndex: false });
    });
  });
}

function renderBreadcrumb(data, source) {
  const catalog = getCatalog(data);
  const parent = getParentNode(catalog, activeParentId);
  const weekLabel = data.weekLabel || "本周精选";
  const dateKey = selectedDates[activeSourceKey] || "latest";
  const historyCrumb =
    dateKey !== "latest"
      ? `<span class="crumb-sep">/</span><span class="crumb crumb-pill crumb-history">${escapeHtml(formatSnapshotLabel(dateKey))}</span>`
      : "";

  document.getElementById("breadcrumb").innerHTML = `
    <span class="crumb crumb-pill">${escapeHtml(weekLabel)}</span>
    <span class="crumb-sep">/</span>
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
    searchQuery = "";
    activeItemIndex = 0;
    const searchInput = document.getElementById("search-input");
    if (searchInput) searchInput.value = "";
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
  entries.forEach((entry) => {
    const count = entry.itemCount != null ? ` · ${entry.itemCount} 条` : "";
    const label = formatSnapshotLabel(entry.date);
    options.push(`<option value="${entry.date}">${label}${count}</option>`);
  });

  select.innerHTML = options.join("");
  const validDates = new Set(["latest", ...entries.map((entry) => entry.date)]);
  const current = selectedDates[activeSourceKey] || "latest";
  select.value = validDates.has(current) ? current : "latest";
  selectedDates[activeSourceKey] = select.value;

  select.onchange = () => {
    selectedDates[activeSourceKey] = select.value;
    persistDates();
    searchQuery = "";
    activeItemIndex = 0;
    const searchInput = document.getElementById("search-input");
    if (searchInput) searchInput.value = "";
    // bust latest cache when returning to latest after history
    if (select.value === "latest") delete latestSourceCache[activeSourceKey];
    void syncPanel(data, { preserveItemIndex: false });
  };
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
    item.readme ? metaPill("README 已收录", "success") : metaPill("无 README", "default"),
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
    (activeSourceKey === "natureSkills" || activeSourceKey === "scientificSkills") && item.readme;
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
    showReadme ? metaPill("SKILL/README 已收录", "success") : "",
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
  let source;
  applyFeedLayout(getFeedMode());

  try {
    source = await resolveSource(data, activeSourceKey);
  } catch (err) {
    document.getElementById("section-desc").textContent = err.message;
    document.getElementById("item-count").textContent = "0";
    document.getElementById("compact-list").innerHTML = `<li class="compact-empty">暂无条目</li>`;
    document.getElementById("item-detail").innerHTML =
      `<div class="detail-body"><div class="empty-state"><p>${escapeHtml(err.message)}</p></div></div>`;
    updateNewHints(activeSourceKey, []);
    writeHashRoute();
    return;
  }

  const items = source?.items || [];
  currentSourceRef = source;
  bootstrapSeenIfNeeded(activeSourceKey, items);
  const previousIndex = preserveItemIndex ? activeItemIndex : 0;
  const dateKey = selectedDates[activeSourceKey] || "latest";

  renderBreadcrumb(data, source);
  fillCategorySelect(data);
  fillDateSelect(data);
  applyPanelTheme();
  highlightMetaPlatform(activeParentId);

  let desc = source?.description || "";
  if (dateKey !== "latest") {
    desc = `【历史快照 ${formatSnapshotLabel(dateKey)}】${desc ? ` ${desc}` : ""}`;
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

  activeItemIndex = fillItemSelect(source, previousIndex);
  const filtered = filterItems(items);
  if (filtered.length && !filtered.some(({ index }) => index === activeItemIndex)) {
    activeItemIndex = filtered[0].index;
  }

  updateNewHints(activeSourceKey, items);
  updatePinButton();
  renderActiveDetail(items[activeItemIndex], activeItemIndex);
  renderActiveList(source, activeItemIndex);
  writeHashRoute();
  triggerPanelFade();
}

function bindSearch(data) {
  const input = document.getElementById("search-input");
  if (!input || input.dataset.bound === "1") return;
  input.dataset.bound = "1";
  let timer = null;
  input.addEventListener("input", () => {
    searchQuery = input.value || "";
    clearTimeout(timer);
    timer = setTimeout(() => {
      void (async () => {
        try {
          const source = await resolveSource(data, activeSourceKey);
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
        const source = await resolveSource(data, sourceKey);
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
          const health = healthStatus(row.updated, platform?.maxAgeHours || 48);
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
      const sourceKey = btn.dataset.sourceKey;
      const meta = findSourceMeta(data, sourceKey);
      if (!meta) return;
      activeParentId = meta.parentId;
      activeSourceKey = sourceKey;
      searchQuery = "";
      activeItemIndex = 0;
      document.getElementById("digest-dialog")?.close();
      renderTree(data);
      renderMobileNav(data);
      renderMobileSubnav(data);
      updatePinButton();
      void syncPanel(data, { preserveItemIndex: false });
    });
  });
}

function bindDigest(data) {
  const openBtn = document.getElementById("open-digest-btn");
  const dialog = document.getElementById("digest-dialog");
  const closeBtn = document.getElementById("digest-close-btn");
  if (!openBtn || !dialog || openBtn.dataset.bound === "1") return;
  openBtn.dataset.bound = "1";
  openBtn.addEventListener("click", () => {
    dialog.showModal();
    void buildDigest(data);
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

function bindKeyboard() {
  if (window.__hjlKeysBound) return;
  window.__hjlKeysBound = true;
  document.addEventListener("keydown", (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const typing = isTypingTarget(event.target);

    if (event.key === "/" && !typing) {
      event.preventDefault();
      document.getElementById("search-input")?.focus();
      return;
    }
    if (event.key === "Escape") {
      const input = document.getElementById("search-input");
      if (input && (document.activeElement === input || searchQuery)) {
        searchQuery = "";
        input.value = "";
        input.blur();
        if (currentSourceRef) {
          renderActiveList(currentSourceRef, activeItemIndex);
          updateNewHints(activeSourceKey, currentSourceRef.items || []);
        }
      }
      return;
    }
    if (typing) return;
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
    bindKeyboard();
    updatePinButton();
    registerServiceWorker();
    await syncPanel(appData, { preserveItemIndex: Boolean(route) });

    loading.style.display = "none";
    document.getElementById("mobile-nav").hidden = false;
    layout.hidden = false;
  } catch (err) {
    loading.style.display = "none";
    const error = document.getElementById("error");
    error.style.display = "block";
    error.textContent =
      `加载失败：${err.message}。若本地预览，请用 HTTP 服务器打开（见 README）。`;
  }
}

window.addEventListener("hashchange", () => {
  if (!appData) return;
  const route = parseHashRoute();
  if (!route) return;
  suppressHashWrite = true;
  applyRoute(appData, route, { sync: true });
  suppressHashWrite = false;
});

initThemeToggle();
loadContent();
