"""Fetch K-Dense-AI/scientific-agent-skills via jsDelivr (+ optional Atom commits).

As of upstream v2.43.0, skills live under `skills/` (not `scientific-skills/`).
jsDelivr package meta may still label the tree as `scientific-skills`; we accept
either directory name for enumeration, but always fetch from `skills/` first.
"""

from __future__ import annotations

import hashlib
import json
import os
import re
import sys
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone

REPO = "K-Dense-AI/scientific-agent-skills"
REPO_HTML = f"https://github.com/{REPO}"
SKILLS_DIR = "skills"
SKILLS_DIR_LEGACY = "scientific-skills"
JSDELIVR_META = f"https://data.jsdelivr.com/v1/packages/gh/{REPO}@main"
JSDELIVR_RAW = f"https://cdn.jsdelivr.net/gh/{REPO}@main"
RAW_GITHUB = f"https://raw.githubusercontent.com/{REPO}/main"
COMMITS_ATOM = f"https://github.com/{REPO}/commits/main.atom"
GITHUB_API_CONTENTS = f"https://api.github.com/repos/{REPO}/contents/{SKILLS_DIR}"
USER_AGENT = "clatch-scientific-agent-skills-updater/1.0"
SKILL_README_MAX = 25_000
COMMITS_LIMIT = 15
FETCH_WORKERS = 8


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _http_get_text(url: str, timeout: int = 40, accept: str = "*/*") -> str:
    headers = {"User-Agent": USER_AGENT, "Accept": accept}
    token = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
    if token and "api.github.com" in url:
        headers["Authorization"] = f"Bearer {token}"
        headers["Accept"] = "application/vnd.github+json"
        headers["X-GitHub-Api-Version"] = "2022-11-28"
    req = urllib.request.Request(url, headers=headers)
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


def _names_from_tree_node(node: dict | None) -> list[str]:
    if not node:
        return []
    names = []
    for child in node.get("files") or []:
        if child.get("type") != "directory":
            continue
        name = child.get("name") or ""
        if not name or name.startswith("_") or name.startswith("."):
            continue
        names.append(name)
    return names


def list_skill_names_via_github_api() -> list[str]:
    token = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
    if not token:
        return []
    print("正在通过 GitHub API 枚举 skills …")
    try:
        data = _http_get_json(GITHUB_API_CONTENTS, timeout=40)
    except (urllib.error.HTTPError, urllib.error.URLError, json.JSONDecodeError, TimeoutError) as exc:
        print(f"GitHub API 枚举失败: {exc}", file=sys.stderr)
        return []

    if not isinstance(data, list):
        return []
    names = []
    for entry in data:
        if entry.get("type") != "dir":
            continue
        name = entry.get("name") or ""
        if not name or name.startswith("_") or name.startswith("."):
            continue
        names.append(name)
    return sorted(names)


def list_skill_names_via_jsdelivr() -> list[str]:
    print("正在通过 jsDelivr 枚举 skills …")
    try:
        data = _http_get_json(JSDELIVR_META, timeout=60)
    except (urllib.error.HTTPError, urllib.error.URLError, json.JSONDecodeError, TimeoutError) as exc:
        print(f"jsDelivr 枚举失败: {exc}", file=sys.stderr)
        return []

    files = data.get("files") or []
    preferred = None
    legacy = None
    for node in files:
        if node.get("type") != "directory":
            continue
        name = node.get("name") or ""
        if name == SKILLS_DIR:
            preferred = node
        elif name == SKILLS_DIR_LEGACY:
            legacy = node

    names = _names_from_tree_node(preferred) or _names_from_tree_node(legacy)
    return sorted(names)


def list_skill_names() -> list[str]:
    names = list_skill_names_via_github_api()
    if names:
        return names
    return list_skill_names_via_jsdelivr()


def fetch_commits_from_atom(limit: int = COMMITS_LIMIT) -> list[dict]:
    print("正在读取提交 Atom feed…")
    try:
        raw = _http_get_text(COMMITS_ATOM, timeout=20)
    except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError) as exc:
        print(f"提交 Atom 获取失败: {exc}", file=sys.stderr)
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
                "repo": REPO,
            }
        )
    return items


def _fetch_one_skill(name: str) -> dict | None:
    candidates = [
        f"{JSDELIVR_RAW}/{SKILLS_DIR}/{name}/SKILL.md",
        f"{RAW_GITHUB}/{SKILLS_DIR}/{name}/SKILL.md",
        f"{JSDELIVR_RAW}/{SKILLS_DIR_LEGACY}/{name}/SKILL.md",
        f"{RAW_GITHUB}/{SKILLS_DIR_LEGACY}/{name}/SKILL.md",
    ]
    raw = ""
    last_exc: Exception | None = None
    for url in candidates:
        try:
            raw = _http_get_text(url, timeout=40)
            break
        except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError) as exc:
            last_exc = exc
            continue
    if not raw:
        print(f"跳过 {name}: {last_exc}", file=sys.stderr)
        return None

    meta, _ = parse_frontmatter(raw)
    body, truncated = truncate_text(raw)
    description = meta.get("description") or f"Scientific Agent Skills · {name}"
    if len(description) > 180:
        description = description[:177] + "…"

    return {
        "title": meta.get("name") or name,
        "description": description,
        "url": f"{REPO_HTML}/tree/main/{SKILLS_DIR}/{name}",
        "readme": body,
        "readmeTruncated": truncated,
        "readmeFile": "SKILL.md",
        "version": meta.get("version") or "",
        "author": meta.get("author") or "K-Dense-AI",
        "label": "skill",
        "owner": "K-Dense-AI",
        "repo": REPO,
    }


def fetch_skills(names: list[str]) -> list[dict]:
    items: list[dict] = []
    done = 0
    total = len(names)
    with ThreadPoolExecutor(max_workers=FETCH_WORKERS) as pool:
        futures = {pool.submit(_fetch_one_skill, name): name for name in names}
        for future in as_completed(futures):
            done += 1
            item = future.result()
            if item:
                items.append(item)
            if done % 20 == 0 or done == total:
                print(f"  …已处理 {done}/{total}（成功 {len(items)}）")
    items.sort(key=lambda x: (x.get("title") or "").lower())
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
        stored, truncated = truncate_text(stored, max_bytes=40_000)

    description = (
        "Turn any AI agent into an AI Scientist — scientific agent skills for biology, "
        "chemistry, medicine, and drug discovery."
    )
    if stored:
        for line in stored.splitlines():
            stripped = line.strip()
            if not stripped or stripped.startswith("#") or stripped.startswith("!") or stripped.startswith("[!["):
                continue
            description = stripped[:220]
            break

    return {
        "title": f"{REPO} · 仓库总览",
        "description": description,
        "url": REPO_HTML,
        "stars": 0,
        "language": "Python",
        "owner": "K-Dense-AI",
        "label": "overview",
        "published": commits[0]["published"] if commits else datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "readme": stored or None,
        "readmeTruncated": truncated,
        "readmeFile": "README.md",
        "skillCount": skill_count,
        "latestSha": latest_sha,
        "repo": REPO,
    }


def scientific_skills_catalog_entry() -> dict:
    return {
        "id": "scientificSkills",
        "label": "Scientific Skills",
        "children": [
            {"id": "scientificSkills", "sourceKey": "scientificSkills"},
            {"id": "scientificSkillsCommits", "sourceKey": "scientificSkillsCommits"},
        ],
    }


def build_scientific_skills_payload() -> dict:
    skill_names = list_skill_names()
    if not skill_names:
        raise RuntimeError("未能枚举 skills 目录")

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
            "scientificSkills": {
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
            "scientificSkillsCommits": {
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
