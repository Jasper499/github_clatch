"""Fetch Yuan1z0825/nature-skills via jsDelivr (+ optional Atom commits)."""

from __future__ import annotations

import hashlib
import json
import re
import sys
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

REPO = "Yuan1z0825/nature-skills"
REPO_HTML = f"https://github.com/{REPO}"
JSDELIVR_META = f"https://data.jsdelivr.com/v1/packages/gh/{REPO}@main"
JSDELIVR_RAW = f"https://cdn.jsdelivr.net/gh/{REPO}@main"
COMMITS_ATOM = f"https://github.com/{REPO}/commits/main.atom"
USER_AGENT = "clatch-nature-skills-updater/1.0"
SKILL_README_MAX = 100_000
COMMITS_LIMIT = 15

KNOWN_SKILLS = [
    "nature-academic-search",
    "nature-citation",
    "nature-data",
    "nature-downloader",
    "nature-experiment-log",
    "nature-figure",
    "nature-literature-pipeline",
    "nature-paper-to-patent",
    "nature-paper2ppt",
    "nature-polishing",
    "nature-proposal-writer",
    "nature-reader",
    "nature-ref-verifier",
    "nature-response",
    "nature-reviewer",
    "nature-statistics",
    "nature-writing",
]


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _http_get_text(url: str, timeout: int = 40) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "*/*"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read().decode("utf-8", errors="replace")


def _http_get_json(url: str, timeout: int = 40) -> dict | list:
    return json.loads(_http_get_text(url, timeout=timeout))


def parse_frontmatter(text: str) -> tuple[dict, str]:
    if not text.startswith("---"):
        return {}, text
    parts = text.split("---", 2)
    if len(parts) < 3:
        return {}, text
    meta: dict = {}
    for line in parts[1].splitlines():
        line = line.strip()
        if not line or ":" not in line:
            continue
        key, value = line.split(":", 1)
        meta[key.strip()] = value.strip().strip("\"'")
    return meta, parts[2].lstrip("\n")


def truncate_text(text: str, max_bytes: int = SKILL_README_MAX) -> tuple[str, bool]:
    encoded = text.encode("utf-8")
    if len(encoded) <= max_bytes:
        return text, False
    return encoded[:max_bytes].decode("utf-8", errors="ignore"), True


def list_skill_names() -> list[str]:
    print("正在通过 jsDelivr 枚举 skills …")
    try:
        data = _http_get_json(JSDELIVR_META)
    except (urllib.error.HTTPError, urllib.error.URLError, json.JSONDecodeError, TimeoutError) as exc:
        print(f"jsDelivr 枚举失败，使用内置列表: {exc}", file=sys.stderr)
        return list(KNOWN_SKILLS)

    names = set()
    for file_info in data.get("files") or []:
        name = file_info.get("name") or ""
        m = re.match(r"^/?skills/([^/]+)/", name)
        if m and not m.group(1).startswith("_"):
            names.add(m.group(1))

    return sorted(names) if names else list(KNOWN_SKILLS)


def fetch_commits_from_atom(limit: int = COMMITS_LIMIT) -> list[dict]:
    print("正在读取提交 Atom feed…")
    try:
        raw = _http_get_text(COMMITS_ATOM, timeout=20)
    except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError) as exc:
        print(f"提交 Atom 获取失败（可稍后由 Actions 补全）: {exc}", file=sys.stderr)
        return []

    ns = {"a": "http://www.w3.org/2005/Atom"}
    try:
        root = ET.fromstring(raw)
    except ET.ParseError as exc:
        print(f"Atom 解析失败: {exc}", file=sys.stderr)
        return []

    items = []
    for entry in root.findall("a:entry", ns)[:limit]:
        title = (entry.findtext("a:title", default="", namespaces=ns) or "").strip()
        link_el = entry.find("a:link", ns)
        url = link_el.get("href") if link_el is not None else REPO_HTML
        updated = (entry.findtext("a:updated", default="", namespaces=ns) or "")[:10]
        author = entry.findtext("a:author/a:name", default="", namespaces=ns) or ""
        sha_match = re.search(r"/commit/([0-9a-f]{7,40})", url or "")
        full_sha = sha_match.group(1) if sha_match else ""
        short_sha = full_sha[:7] if full_sha else ""
        content = entry.findtext("a:content", default="", namespaces=ns) or title
        content = re.sub(r"<[^>]+>", "", content).strip()
        items.append(
            {
                "title": title or short_sha,
                "description": content or title,
                "url": url,
                "sha": short_sha,
                "fullSha": full_sha,
                "owner": author,
                "published": updated,
                "label": "commit",
            }
        )
    return items


def fetch_skills(names: list[str]) -> list[dict]:
    items = []
    for name in names:
        url = f"{JSDELIVR_RAW}/skills/{name}/SKILL.md"
        try:
            raw = _http_get_text(url, timeout=40)
        except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError) as exc:
            print(f"跳过 {name}: {exc}", file=sys.stderr)
            continue

        meta, _ = parse_frontmatter(raw)
        body, truncated = truncate_text(raw)
        description = meta.get("description") or f"Nature Skills · {name}"
        if len(description) > 180:
            description = description[:177] + "…"

        items.append(
            {
                "title": meta.get("name") or name,
                "description": description,
                "url": f"{REPO_HTML}/tree/main/skills/{name}",
                "readme": body,
                "readmeTruncated": truncated,
                "readmeFile": "SKILL.md",
                "version": meta.get("version") or "",
                "author": meta.get("author") or "",
                "label": "skill",
                "owner": "Yuan1z0825",
            }
        )
        print(f"  [ok] {name}")
    return items


def content_fingerprint(overview_readme: str, skills: list[dict], commits: list[dict]) -> str:
    h = hashlib.sha1()
    h.update((overview_readme or "").encode("utf-8"))
    for skill in skills:
        h.update((skill.get("title") or "").encode("utf-8"))
        h.update((skill.get("readme") or "").encode("utf-8"))
    if commits and commits[0].get("fullSha"):
        h.update(commits[0]["fullSha"].encode("utf-8"))
    return h.hexdigest()


def build_overview_item(skill_count: int, latest_sha: str, commits: list[dict], readme: str) -> dict:
    truncated = False
    stored = readme
    if stored:
        stored, truncated = truncate_text(stored)

    description = "符合 Nature 论文学术表达和科研绘图的 Skill 合集"
    if stored:
        for line in stored.splitlines():
            stripped = line.strip()
            if not stripped or stripped.startswith("#") or stripped.startswith("!") or stripped.startswith("[!["):
                continue
            description = stripped[:200]
            break

    return {
        "title": f"{REPO} · 仓库总览",
        "description": description,
        "url": REPO_HTML,
        "stars": 0,
        "language": "Python",
        "owner": "Yuan1z0825",
        "label": "overview",
        "published": commits[0]["published"] if commits else datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "readme": stored or None,
        "readmeTruncated": truncated,
        "readmeFile": "README.md",
        "skillCount": skill_count,
        "latestSha": latest_sha,
    }


def nature_skills_catalog_entry() -> dict:
    return {
        "id": "natureSkills",
        "label": "Nature Skills",
        "children": [
            {"id": "natureSkills", "sourceKey": "natureSkills"},
            {"id": "natureSkillsCommits", "sourceKey": "natureSkillsCommits"},
        ],
    }


def build_nature_skills_payload() -> dict:
    skill_names = list_skill_names()
    print(f"正在抓取 {len(skill_names)} 个 Skill…")
    skills = fetch_skills(skill_names)
    if not skills:
        raise RuntimeError("未能获取任何 Skill 内容")

    readme = ""
    try:
        readme = _http_get_text(f"{JSDELIVR_RAW}/README.md", timeout=40)
        print("  [ok] README.md")
    except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError) as exc:
        print(f"README 获取失败: {exc}", file=sys.stderr)

    commits = fetch_commits_from_atom()
    fingerprint = content_fingerprint(readme, skills, commits)
    latest_sha = (commits[0]["fullSha"] if commits else "") or fingerprint
    overview = build_overview_item(len(skills), latest_sha, commits, readme)

    return {
        "fetchedAt": _utc_now_iso(),
        "latestSha": latest_sha,
        "repo": {
            "fullName": REPO,
            "description": overview.get("description") or "",
            "url": REPO_HTML,
            "stars": 0,
            "language": "Python",
            "pushedAt": commits[0]["published"] if commits else overview.get("published") or "",
        },
        "sources": {
            "natureSkills": {
                "label": "Skills 清单",
                "description": (
                    f"跟踪 {REPO}：共 {len(skills)} 个技能"
                    f"（最近同步 {overview.get('published') or '-'}）"
                ),
                "updateFrequency": "daily",
                "repo": REPO,
                "latestSha": latest_sha,
                "items": [overview, *skills],
            },
            "natureSkillsCommits": {
                "label": "最近提交",
                "description": (
                    f"最近 {len(commits)} 条提交动态"
                    if commits
                    else "暂时无法读取 GitHub 提交动态，已同步 Skills 正文"
                ),
                "updateFrequency": "daily",
                "repo": REPO,
                "latestSha": latest_sha,
                "items": commits,
            },
        },
    }
