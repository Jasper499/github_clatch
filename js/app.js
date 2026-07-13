const DATA_URL = "data/content.json";
const MANIFEST_URL = "data/manifest.json";
const DATES_STORAGE_KEY = "hjl-source-dates";

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
];

let appData = null;
let manifest = null;
let activeParentId = "github";
let activeSourceKey = "github";
let selectedDates = {};
const historyCache = {};

const PLATFORM_META = {
  github: { theme: "theme-github", short: "GH", name: "GitHub" },
  githubActive: { theme: "theme-github", short: "GH", name: "GitHub" },
  hackernews: { theme: "theme-hn", short: "HN", name: "Hacker News" },
  weibo: { theme: "theme-weibo", short: "WB", name: "微博" },
  mrm: { theme: "theme-journals", short: "MR", name: "MRM" },
  tmi: { theme: "theme-journals", short: "TM", name: "TMI" },
  media: { theme: "theme-journals", short: "MD", name: "MedIA" },
};

const JOURNAL_KEYS = new Set(["mrm", "tmi", "media"]);

const META_SYNC_PLATFORMS = [
  { id: "github", label: "GitHub", schedule: "每周一", field: "githubUpdatedAt" },
  { id: "hackernews", label: "Hacker News", schedule: "每日 10/22 点", field: "hackernewsUpdatedAt" },
  { id: "weibo", label: "微博", schedule: "每日 10/22 点", field: "weiboUpdatedAt" },
  { id: "journals", label: "MRI 顶刊", schedule: "每月 1/15 日", field: "journalsUpdatedAt" },
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
}

function highlightMetaPlatform(platformId) {
  document.querySelectorAll(".meta-sync-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.platform === platformId);
  });
}

function resolveMetaTimestamp(data, field) {
  if (data[field]) return data[field];
  if (field === "githubUpdatedAt" || field === "hackernewsUpdatedAt" || field === "weiboUpdatedAt") {
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

function getLatestUpdatedAt(data, sourceKey) {
  if (sourceKey === "weibo" && data.weiboUpdatedAt) return data.weiboUpdatedAt;
  if (sourceKey === "hackernews" && data.hackernewsUpdatedAt) return data.hackernewsUpdatedAt;
  if ((sourceKey === "github" || sourceKey === "githubActive") && data.githubUpdatedAt) {
    return data.githubUpdatedAt;
  }
  if (JOURNAL_KEYS.has(sourceKey) && data.journalsUpdatedAt) return data.journalsUpdatedAt;
  return data.updatedAt;
}

async function resolveSource(data, sourceKey = activeSourceKey) {
  const dateKey = selectedDates[sourceKey] || "latest";
  if (dateKey === "latest") return getSource(data, sourceKey);

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

function getCatalog(data) {
  return data.catalog?.length ? data.catalog : DEFAULT_CATALOG;
}

function getSource(data, key) {
  return data.sources?.[key] ?? null;
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

function renderGithubReadmeBlock(item) {
  const fileName = item.readmeFile || "README.md";

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

  const html = renderGithubMarkdown(item.readme, item.title);
  const truncatedNote = item.readmeTruncated
    ? `<p class="detail-note readme-truncated">README 较长，已截断显示前 80KB，完整内容请访问仓库。</p>`
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
      ? `历史快照 · ${dateKey}`
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
}

function renderTree(data) {
  const catalog = getCatalog(data);
  const weekLabel = data.weekLabel || "本周精选";
  const tree = document.getElementById("catalog-tree");

  const weekNode = `
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
                  const count = source?.items?.length ?? 0;
                  const active =
                    activeParentId === parent.id && activeSourceKey === child.sourceKey;
                  return `
                    <li>
                      <button
                        type="button"
                        class="tree-leaf${active ? " active" : ""}"
                        data-parent-id="${parent.id}"
                        data-source-key="${child.sourceKey}"
                      >
                        <span class="leaf-name">${escapeHtml(source?.label || child.id)}</span>
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
      renderTree(data);
      renderMobileNav(data);
      renderMobileSubnav(data);
      void syncPanel(data);
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
      ? `<span class="crumb-sep">/</span><span class="crumb crumb-pill crumb-history">${escapeHtml(dateKey)}</span>`
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
    renderTree(data);
    renderMobileNav(data);
    renderMobileSubnav(data);
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
    options.push(`<option value="${entry.date}">${entry.date}${count}</option>`);
  });

  select.innerHTML = options.join("");
  const validDates = new Set(["latest", ...entries.map((entry) => entry.date)]);
  const current = selectedDates[activeSourceKey] || "latest";
  select.value = validDates.has(current) ? current : "latest";
  selectedDates[activeSourceKey] = select.value;

  select.onchange = () => {
    selectedDates[activeSourceKey] = select.value;
    persistDates();
    void syncPanel(data, { preserveItemIndex: false });
  };
}

function itemSummary(item, index) {
  const rank = `#${index + 1}`;
  if (item.journal) {
    const date = item.published ? ` · ${item.published}` : "";
    return `${rank} [${item.journal}]${date} ${item.title}`;
  }
  if (item.stars != null) {
    const readmeTag = item.readme && isGithubSource(activeSourceKey) ? " · README" : "";
    return `${rank} ★${Number(item.stars).toLocaleString()}${readmeTag} · ${item.title}`;
  }
  if (item.score != null) return `${rank} ▲${Number(item.score).toLocaleString()} · ${item.title}`;
  return `${rank} ${item.title}`;
}

function fillItemSelect(source, preferredIndex = 0) {
  const items = source?.items || [];
  const select = document.getElementById("item-select");

  if (!items.length) {
    select.innerHTML = `<option value="">暂无条目</option>`;
    select.disabled = true;
    return 0;
  }

  select.disabled = false;
  select.innerHTML = items
    .map(
      (item, index) =>
        `<option value="${index}">${escapeHtml(itemSummary(item, index))}</option>`
    )
    .join("");

  const index = Math.min(Math.max(preferredIndex, 0), items.length - 1);
  select.value = String(index);
  select.onchange = () => renderItemDetail(items[Number(select.value)], Number(select.value));
  return index;
}

function renderItemDetail(item, index) {
  const panel = document.getElementById("item-detail");
  if (!item) {
    panel.className = "item-detail";
    panel.innerHTML = `<div class="detail-body"><div class="empty-state"><p>当前分类暂无内容。</p></div></div>`;
    return;
  }

  const platform = getPlatformMeta(activeSourceKey);
  if (isJournalSource(activeSourceKey)) {
    renderJournalDetail(item, index, platform);
    return;
  }

  if (isGithubSource(activeSourceKey)) {
    renderGithubDetail(item, index, platform);
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

function renderCompactList(source, activeIndex) {
  const items = source?.items || [];
  const list = document.getElementById("compact-list");

  document.getElementById("item-count").textContent = String(items.length);

  if (!items.length) {
    list.innerHTML = `<li class="compact-empty">暂无条目</li>`;
    return;
  }

  list.innerHTML = items
    .map((item, index) => {
      const active = index === activeIndex ? " active" : "";
      const meta = itemCompactMeta(item);
      const inner = `
        <span class="compact-rank">${index + 1}</span>
        <div class="compact-body${isJournalSource(activeSourceKey) ? " compact-body-journal" : ""}">
          <span class="compact-title">${escapeHtml(item.title)}</span>
          ${meta ? `<span class="compact-meta">${escapeHtml(meta)}</span>` : ""}
        </div>
        ${item.url ? icon("external", "icon icon-compact") : ""}
      `;

      const journalClass = isJournalSource(activeSourceKey) ? " compact-item-journal" : "";

      if (item.url) {
        return `
      <li>
        <a
          href="${escapeHtml(item.url)}"
          target="_blank"
          rel="noopener noreferrer"
          class="compact-item${active}${journalClass}"
          data-index="${index}"
        >${inner}</a>
      </li>
    `;
      }

      return `
      <li>
        <button type="button" class="compact-item${active}${journalClass}" data-index="${index}">
          ${inner}
        </button>
      </li>
    `;
    })
    .join("");

  list.querySelectorAll("button.compact-item").forEach((el) => {
    el.addEventListener("click", () => {
      const index = Number(el.dataset.index);
      document.getElementById("item-select").value = String(index);
      renderItemDetail(items[index], index);
      renderCompactList(source, index);
    });
  });

  list.querySelectorAll("a.compact-item").forEach((el) => {
    el.addEventListener("click", () => {
      const index = Number(el.dataset.index);
      document.getElementById("item-select").value = String(index);
      renderItemDetail(items[index], index);
      list.querySelectorAll(".compact-item").forEach((node) => {
        node.classList.toggle("active", Number(node.dataset.index) === index);
      });
    });
  });
}

async function syncPanel(data, { preserveItemIndex = true } = {}) {
  let source;
  try {
    source = await resolveSource(data, activeSourceKey);
  } catch (err) {
    document.getElementById("section-desc").textContent = err.message;
    document.getElementById("item-count").textContent = "0";
    document.getElementById("compact-list").innerHTML = `<li class="compact-empty">暂无条目</li>`;
    document.getElementById("item-detail").innerHTML =
      `<div class="detail-body"><div class="empty-state"><p>${escapeHtml(err.message)}</p></div></div>`;
    return;
  }

  const items = source?.items || [];
  const previousIndex = preserveItemIndex
    ? Number(document.getElementById("item-select").value) || 0
    : 0;
  const dateKey = selectedDates[activeSourceKey] || "latest";

  renderBreadcrumb(data, source);
  fillCategorySelect(data);
  fillDateSelect(data);
  applyPanelTheme();

  let desc = source?.description || "";
  if (dateKey !== "latest") {
    desc = `【历史快照 ${dateKey}】${desc ? ` ${desc}` : ""}`;
  }
  const descEl = document.getElementById("section-desc");
  descEl.textContent = desc;
  descEl.classList.toggle("section-desc--history", dateKey !== "latest");

  renderJournalStats(data, source);
  renderMobileSubnav(data);

  const activeIndex = fillItemSelect(source, previousIndex);
  renderItemDetail(items[activeIndex], activeIndex);
  renderCompactList(source, activeIndex);
  triggerPanelFade();
}

async function loadContent() {
  const loading = document.getElementById("loading");
  const layout = document.getElementById("app-layout");
  loading.style.display = "block";
  layout.hidden = true;

  loadStoredDates();

  try {
    const [contentRes, manifestRes] = await Promise.all([
      fetch(`${DATA_URL}?t=${Date.now()}`),
      fetch(`${MANIFEST_URL}?t=${Date.now()}`),
    ]);
    if (!contentRes.ok) throw new Error(`HTTP ${contentRes.status}`);
    appData = await contentRes.json();
    manifest = manifestRes.ok ? await manifestRes.json() : { sources: {} };

    renderMeta(appData);
    renderTree(appData);
    renderMobileNav(appData);
    renderMobileSubnav(appData);
    await syncPanel(appData, { preserveItemIndex: false });

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

initThemeToggle();
loadContent();
