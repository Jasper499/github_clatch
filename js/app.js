const DATA_URL = "data/content.json";

const SOURCE_KEYS = ["github", "githubActive", "hackernews"];

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

function renderMeta(data) {
  document.getElementById("updated-at").textContent = formatDate(data.updatedAt);
  document.getElementById("period-days").textContent = data.periodDays || 7;
}

function renderCard(item, index) {
  const rank = index + 1;
  const title = item.url
    ? `<a href="${item.url}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.title)}</a>`
    : escapeHtml(item.title);

  const desc = item.description
    ? `<p class="card-desc">${escapeHtml(item.description)}</p>`
    : "";

  const lang = item.language
    ? `<span class="lang-tag">${escapeHtml(item.language)}</span>`
    : "";

  const stars = item.stars != null
    ? `<span class="stars">★ ${Number(item.stars).toLocaleString()}</span>`
    : "";

  const score = item.score != null
    ? `<span>▲ ${Number(item.score).toLocaleString()}</span>`
    : "";

  const comments = item.comments != null
    ? `<span>💬 ${Number(item.comments).toLocaleString()}</span>`
    : "";

  const owner = item.owner ? `<span>@${escapeHtml(item.owner)}</span>` : "";

  return `
    <article class="card">
      <div class="card-rank">#${rank}</div>
      <h3 class="card-title">${title}</h3>
      ${desc}
      <div class="card-meta">
        ${stars}
        ${score}
        ${comments}
        ${owner}
        ${lang}
      </div>
    </article>
  `;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function renderSection(key, source) {
  const container = document.getElementById(`grid-${key}`);
  const items = source?.items || [];

  if (!items.length) {
    container.innerHTML = `
      <div class="empty-state">
        <p>暂无数据。请运行 <code>python scripts/update_content.py</code> 抓取最新内容。</p>
      </div>
    `;
    return;
  }

  container.innerHTML = items.map(renderCard).join("");
}

function setupTabs() {
  const tabs = document.querySelectorAll(".tab");
  const sections = document.querySelectorAll(".section");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.target;
      tabs.forEach((t) => t.classList.toggle("active", t === tab));
      sections.forEach((s) => s.classList.toggle("active", s.id === `section-${target}`));
    });
  });
}

async function loadContent() {
  const loading = document.getElementById("loading");
  loading.style.display = "block";

  try {
    const res = await fetch(`${DATA_URL}?t=${Date.now()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    renderMeta(data);

    SOURCE_KEYS.forEach((key) => {
      const source = data.sources?.[key];
      if (source) {
        document.getElementById(`title-${key}`).textContent = source.label;
        document.getElementById(`desc-${key}`).textContent = source.description;
        document.querySelector(`.tab[data-target="${key}"]`).textContent = source.label;
        renderSection(key, source);
      }
    });

    loading.style.display = "none";
  } catch (err) {
    loading.style.display = "none";
    document.getElementById("error").style.display = "block";
    document.getElementById("error").textContent =
      `加载失败：${err.message}。若本地预览，请用 HTTP 服务器打开（见 README）。`;
  }
}

setupTabs();
loadContent();
