const DATA_URL = "data/content.json";

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
let activeParentId = "github";
let activeSourceKey = "github";

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
  if (parentId === "github") return "🐙";
  if (parentId === "weibo") return "🔥";
  if (parentId === "journals") return "📚";
  return "📰";
}

function getParentNode(catalog, parentId) {
  return catalog.find((node) => node.id === parentId) ?? catalog[0];
}

function renderMeta(data) {
  document.getElementById("updated-at").textContent = formatDate(data.updatedAt);
  document.getElementById("week-label").textContent =
    data.weekLabel || `近 ${data.periodDays || 7} 天`;
}

function renderTree(data) {
  const catalog = getCatalog(data);
  const weekLabel = data.weekLabel || "本周精选";
  const tree = document.getElementById("catalog-tree");

  const weekNode = `
    <details class="tree-node tree-root" open>
      <summary class="tree-label tree-label-root">
        <span class="tree-icon">📅</span>
        <span>${escapeHtml(weekLabel)}</span>
      </summary>
      <div class="tree-children">
        ${catalog
          .map(
            (parent) => `
          <details class="tree-node" ${parent.id === activeParentId ? "open" : ""} data-parent-id="${parent.id}">
            <summary class="tree-label">
              <span class="tree-icon">${platformIcon(parent.id)}</span>
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
      syncPanel(data);
    });
  });
}

function renderBreadcrumb(data) {
  const catalog = getCatalog(data);
  const parent = getParentNode(catalog, activeParentId);
  const source = getSource(data, activeSourceKey);
  const weekLabel = data.weekLabel || "本周精选";

  document.getElementById("breadcrumb").innerHTML = `
    <span class="crumb">📅 ${escapeHtml(weekLabel)}</span>
    <span class="crumb-sep">/</span>
    <span class="crumb">${escapeHtml(parent?.label || "")}</span>
    <span class="crumb-sep">/</span>
    <span class="crumb crumb-current">${escapeHtml(source?.label || "")}</span>
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
    syncPanel(data, { preserveItemIndex: false });
  };
}

function itemSummary(item, index) {
  const rank = `#${index + 1}`;
  if (item.journal) {
    const date = item.published ? ` · ${item.published}` : "";
    return `${rank} [${item.journal}]${date} ${item.title}`;
  }
  if (item.stars != null) return `${rank} ★${Number(item.stars).toLocaleString()} · ${item.title}`;
  if (item.score != null) return `${rank} ▲${Number(item.score).toLocaleString()} · ${item.title}`;
  return `${rank} ${item.title}`;
}

function fillItemSelect(data, preferredIndex = 0) {
  const source = getSource(data, activeSourceKey);
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
    panel.innerHTML = `<div class="empty-state"><p>当前分类暂无内容。</p></div>`;
    return;
  }

  const title = item.url
    ? `<a href="${item.url}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.title)}</a>`
    : escapeHtml(item.title);

  const desc = item.description
    ? `<p class="detail-desc">${escapeHtml(item.description)}</p>`
    : `<p class="detail-desc muted">暂无描述</p>`;

  const meta = [
    item.authors ? `<span>${escapeHtml(item.authors)}</span>` : "",
    item.published ? `<span>📅 ${escapeHtml(item.published)}</span>` : "",
    item.journal ? `<span class="lang-tag">${escapeHtml(item.journal)}</span>` : "",
    item.stars != null ? `<span class="meta-stars">★ ${Number(item.stars).toLocaleString()}</span>` : "",
    item.score != null ? `<span>▲ ${Number(item.score).toLocaleString()}</span>` : "",
    item.comments != null ? `<span>💬 ${Number(item.comments).toLocaleString()}</span>` : "",
    item.owner && !item.journal ? `<span>@${escapeHtml(item.owner)}</span>` : "",
    item.language ? `<span class="lang-tag">${escapeHtml(item.language)}</span>` : "",
    item.label ? `<span class="hot-label">${escapeHtml(item.label)}</span>` : "",
    item.isOpenAccess ? `<span class="oa-tag">开放获取</span>` : "",
  ]
    .filter(Boolean)
    .join("");

  const actionLinks = [
    item.url
      ? `<a class="detail-link" href="${item.url}" target="_blank" rel="noopener noreferrer">打开期刊页面 →</a>`
      : "",
    item.pdfUrl
      ? `<a class="detail-link pdf-link" href="${item.pdfUrl}" target="_blank" rel="noopener noreferrer">下载 PDF（已保存本地）→</a>`
      : "",
  ].filter(Boolean).join("");

  const pdfNote = !item.pdfUrl && item.isOpenAccess
    ? `<p class="detail-note">本篇为开放获取，但未找到可直接下载的 PDF 文件。</p>`
    : !item.pdfUrl && item.doi
      ? `<p class="detail-note">PDF 通常需机构订阅；已提供 DOI 期刊页面链接。</p>`
      : "";

  panel.innerHTML = `
    <div class="detail-rank">第 ${index + 1} 条</div>
    <h2 class="detail-title">${title}</h2>
    ${desc}
    <div class="detail-meta">${meta}</div>
    <div class="detail-actions">${actionLinks}</div>
    ${pdfNote}
  `;
}

function renderCompactList(data, activeIndex) {
  const source = getSource(data, activeSourceKey);
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
      const inner = `
          <span class="compact-rank">${index + 1}</span>
          <span class="compact-title">${escapeHtml(item.title)}</span>
          ${item.url ? `<span class="compact-link-icon" aria-hidden="true">↗</span>` : ""}
      `;

      if (item.url) {
        return `
      <li>
        <a
          href="${escapeHtml(item.url)}"
          target="_blank"
          rel="noopener noreferrer"
          class="compact-item${active}"
          data-index="${index}"
        >${inner}</a>
      </li>
    `;
      }

      return `
      <li>
        <button type="button" class="compact-item${active}" data-index="${index}">
          ${inner}
        </button>
      </li>
    `;
    })
    .join("");

  list.querySelectorAll(".compact-item").forEach((el) => {
    el.addEventListener("click", () => {
      const index = Number(el.dataset.index);
      document.getElementById("item-select").value = String(index);
      renderItemDetail(items[index], index);
      renderCompactList(data, index);
    });
  });
}

function syncPanel(data, { preserveItemIndex = true } = {}) {
  const source = getSource(data, activeSourceKey);
  const items = source?.items || [];
  const previousIndex = preserveItemIndex ? Number(document.getElementById("item-select").value) || 0 : 0;

  renderBreadcrumb(data);
  fillCategorySelect(data);
  document.getElementById("section-desc").textContent = source?.description || "";

  const activeIndex = fillItemSelect(data, previousIndex);
  renderItemDetail(items[activeIndex], activeIndex);
  renderCompactList(data, activeIndex);
}

async function loadContent() {
  const loading = document.getElementById("loading");
  const layout = document.getElementById("app-layout");
  loading.style.display = "block";
  layout.hidden = true;

  try {
    const res = await fetch(`${DATA_URL}?t=${Date.now()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    appData = await res.json();

    renderMeta(appData);
    renderTree(appData);
    syncPanel(appData, { preserveItemIndex: false });

    loading.style.display = "none";
    layout.hidden = false;
  } catch (err) {
    loading.style.display = "none";
    const error = document.getElementById("error");
    error.style.display = "block";
    error.textContent =
      `加载失败：${err.message}。若本地预览，请用 HTTP 服务器打开（见 README）。`;
  }
}

loadContent();
