/**
 * Cloudflare Worker: proxy Weibo hot_band → HJL Clatch weiboRealtime shape.
 *
 * Deploy: see workers/README.md
 * Route examples: GET /  or  GET /realtime
 */

const WEIBO_BAND_URL = "https://weibo.com/ajax/statuses/hot_band";
const LIMIT = 30;
const EDGE_CACHE_SECONDS = 45;

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Referer: "https://weibo.com/",
  Accept: "application/json",
  "X-Requested-With": "XMLHttpRequest",
};

function corsHeaders(origin) {
  const allow =
    !origin ||
    origin.includes("jasper499.github.io") ||
    origin.includes("localhost") ||
    origin.includes("127.0.0.1")
      ? origin || "*"
      : "https://jasper499.github.io";
  return {
    "Access-Control-Allow-Origin": allow === "null" ? "*" : allow,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function jsonResponse(body, status, origin, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders(origin),
      ...extraHeaders,
    },
  });
}

function parseHotValue(value) {
  if (typeof value === "number") return Math.trunc(value);
  if (typeof value === "string" && /^\d+$/.test(value)) return Number(value);
  return 0;
}

function buildTopicUrl(entry) {
  const word = entry.word || entry.note || "";
  const key = entry.word_scheme || `#${word}`;
  return `https://s.weibo.com/weibo?q=${encodeURIComponent(key)}&t=31&band_rank=1&Refer=top`;
}

function entryToItem(entry) {
  if (!entry || entry.is_ad) return null;
  const word = String(entry.word || entry.note || "").trim();
  if (!word) return null;
  const label = entry.label_name || "";
  const category = entry.category || "";
  const descParts = [label, category].filter(Boolean);
  const item = {
    title: word,
    description: descParts.join(" · "),
    url: buildTopicUrl(entry),
    score: parseHotValue(entry.num),
    owner: "微博实时",
    label,
  };
  if (category) item.category = category;
  if (typeof entry.onboard_time === "number" && entry.onboard_time > 0) {
    item.onboardTime = Math.trunc(entry.onboard_time);
  }
  return item;
}

function buildRealtimePayload(bandList) {
  const entries = (bandList || []).filter((e) => e && typeof e === "object");
  entries.sort((a, b) => (b.onboard_time || 0) - (a.onboard_time || 0));
  const items = [];
  for (const entry of entries) {
    const item = entryToItem(entry);
    if (!item) continue;
    items.push(item);
    if (items.length >= LIMIT) break;
  }
  const fetchedAt = new Date().toISOString();
  const fetchedDate = fetchedAt.slice(0, 10);
  return {
    sourceKey: "weiboRealtime",
    savedAt: fetchedAt,
    fetchedAt,
    live: true,
    label: "实时",
    description: `微博实时上升榜（按上榜时间排序，即时拉取 ${fetchedAt}，共 ${items.length} 条）`,
    updateFrequency: "live",
    fetchedDate,
    items,
  };
}

async function fetchRealtime() {
  const res = await fetch(WEIBO_BAND_URL, {
    headers: BROWSER_HEADERS,
    cf: { cacheTtl: EDGE_CACHE_SECONDS, cacheEverything: true },
  });
  if (!res.ok) {
    throw new Error(`Weibo upstream ${res.status}`);
  }
  const data = await res.json();
  if (data.ok !== 1) {
    throw new Error("Weibo unexpected payload");
  }
  return buildRealtimePayload((data.data && data.data.band_list) || []);
}

export default {
  async fetch(request, _env, ctx) {
    const origin = request.headers.get("Origin") || "";
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
    if (request.method !== "GET") {
      return jsonResponse({ error: "method not allowed" }, 405, origin);
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";
    if (path !== "/" && path !== "/realtime" && path !== "/weibo/realtime") {
      return jsonResponse(
        { error: "not found", hint: "GET / or /realtime" },
        404,
        origin
      );
    }

    const cache = caches.default;
    const cacheKey = new Request(url.toString(), request);
    const cached = await cache.match(cacheKey);
    if (cached) {
      const headers = new Headers(cached.headers);
      Object.entries(corsHeaders(origin)).forEach(([k, v]) => headers.set(k, v));
      headers.set("X-Weibo-Live-Cache", "HIT");
      return new Response(cached.body, { status: cached.status, headers });
    }

    try {
      const payload = await fetchRealtime();
      const response = jsonResponse(payload, 200, origin, {
        "Cache-Control": `public, max-age=${EDGE_CACHE_SECONDS}`,
        "X-Weibo-Live-Cache": "MISS",
      });
      ctx.waitUntil(cache.put(cacheKey, response.clone()));
      return response;
    } catch (err) {
      return jsonResponse(
        { error: "upstream_failed", message: String(err && err.message ? err.message : err) },
        502,
        origin
      );
    }
  },
};
