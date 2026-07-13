"""Fetch GitHub trending repos and README markdown."""

from __future__ import annotations

import base64
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

PERIOD_DAYS = 7
README_MAX_BYTES = 80_000
USER_AGENT = "clatch-weekly-updater/1.0"


def _auth_headers(extra: dict | None = None) -> dict:
    headers = {"Accept": "application/json", "User-Agent": USER_AGENT}
    if extra:
        headers.update(extra)
    token = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers


def http_get(url: str, headers: dict | None = None) -> dict | list | str:
    req_headers = _auth_headers(headers)
    req = urllib.request.Request(url, headers=req_headers)
    with urllib.request.urlopen(req, timeout=30) as resp:
        body = resp.read()
        accept = req_headers.get("Accept", "")
        if "raw" in accept:
            return body.decode("utf-8", errors="replace")
        return json.loads(body.decode("utf-8"))


def _fetch_readme_from_raw(owner: str, repo: str) -> str | None:
    branches = ("HEAD", "main", "master")
    names = ("README.md", "readme.md", "README.MD", "Readme.md")
    for branch in branches:
        for name in names:
            url = f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{name}"
            try:
                req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
                with urllib.request.urlopen(req, timeout=20) as resp:
                    return resp.read().decode("utf-8", errors="replace")
            except urllib.error.HTTPError:
                continue
            except urllib.error.URLError:
                continue
    return None


def _pack_readme(markdown: str, readme_file: str = "README.md") -> dict:
    truncated = len(markdown.encode("utf-8")) > README_MAX_BYTES
    if truncated:
        markdown = markdown.encode("utf-8")[:README_MAX_BYTES].decode("utf-8", errors="ignore")
    return {
        "readme": markdown,
        "readmeTruncated": truncated,
        "readmeFile": readme_file,
    }


def fetch_repo_readme(full_name: str) -> dict | None:
    """Return README markdown payload for a repository, or None if unavailable."""
    if "/" not in full_name:
        return None

    owner, repo = full_name.split("/", 1)
    has_token = bool(os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN"))

    if not has_token:
        raw_markdown = _fetch_readme_from_raw(owner, repo)
        if raw_markdown and raw_markdown.strip():
            return _pack_readme(raw_markdown)
        return None

    url = f"https://api.github.com/repos/{owner}/{repo}/readme"

    try:
        data = http_get(url, headers={"Accept": "application/vnd.github.raw+json"})
        if isinstance(data, str) and data.strip():
            return _pack_readme(data)
    except urllib.error.HTTPError as exc:
        if exc.code not in (403, 404):
            print(f"README API 失败 ({full_name}): HTTP {exc.code}", file=sys.stderr)
    except urllib.error.URLError as exc:
        print(f"README API 失败 ({full_name}): {exc}", file=sys.stderr)

    try:
        data = http_get(url)
        if isinstance(data, dict):
            content = data.get("content")
            if content:
                markdown = base64.b64decode(content).decode("utf-8", errors="replace")
                return _pack_readme(markdown, data.get("name", "README.md"))
    except (urllib.error.HTTPError, urllib.error.URLError):
        pass

    raw_markdown = _fetch_readme_from_raw(owner, repo)
    if raw_markdown and raw_markdown.strip():
        return _pack_readme(raw_markdown)

    return None


def fetch_github_repos(query_suffix: str, since: str, limit: int = 20) -> list[dict]:
    q = f"{query_suffix} stars:>10"
    params = urllib.parse.urlencode(
        {
            "q": q,
            "sort": "stars",
            "order": "desc",
            "per_page": str(min(limit, 30)),
        }
    )
    url = f"https://api.github.com/search/repositories?{params}"

    try:
        data = http_get(url)
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        print(f"GitHub API error ({exc.code}): {body}", file=sys.stderr)
        if exc.code == 403 and "rate limit" in body.lower():
            print("提示：设置 GITHUB_TOKEN 环境变量可提高 API 限额。", file=sys.stderr)
        return []

    has_token = bool(os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN"))
    items = []
    for repo in data.get("items", [])[:limit]:
        full_name = repo.get("full_name") or repo.get("name", "unknown")
        item = {
            "title": full_name,
            "description": repo.get("description") or "",
            "url": repo.get("html_url", ""),
            "stars": repo.get("stargazers_count", 0),
            "language": repo.get("language") or "",
            "owner": (repo.get("owner") or {}).get("login", ""),
        }

        readme = fetch_repo_readme(full_name)
        if readme:
            item.update(readme)

        items.append(item)
        if not has_token:
            time.sleep(0.35)

    return items
