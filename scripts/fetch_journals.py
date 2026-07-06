"""Fetch recent MRI-related articles from top journals via CrossRef + OA PDF lookup."""

from __future__ import annotations

import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

USER_AGENT = "clatch-journal-fetcher/1.0"
UNPAYWALL_EMAIL = os.environ.get("UNPAYWALL_EMAIL", "clatch.journal@proton.me")
LOOKBACK_DAYS = 45
FETCH_LIMIT = 40
DISPLAY_LIMIT = 15
MAX_PDF_BYTES = 25 * 1024 * 1024

MRI_TERMS = (
    "mri",
    "magnetic resonance",
    "fmri",
    "f-mri",
    "functional mri",
    "bold",
    "diffusion-weighted",
    "diffusion weighted",
    "dwi",
    "dti",
    "tensor imaging",
    "spin echo",
    "gradient echo",
    "t1-weighted",
    "t2-weighted",
    "t1w",
    "t2w",
    "magnetization transfer",
    "spectroscopy",
    "mrs",
    "k-space",
    "kspace",
    "rf pulse",
    "parallel imaging",
    "susceptibility",
    "perfusion imaging",
    "arterial spin",
)

JOURNALS = [
    {
        "id": "mrm",
        "label": "Magnetic Resonance in Medicine",
        "short": "MRM",
        "issn": "0740-3194",
    },
    {
        "id": "tmi",
        "label": "IEEE Transactions on Medical Imaging",
        "short": "TMI",
        "issn": "0278-0062",
    },
    {
        "id": "media",
        "label": "Medical Image Analysis",
        "short": "MedIA",
        "issn": "1361-8415",
    },
]


def _mailto_agent() -> str:
    return f"{USER_AGENT} (mailto:{UNPAYWALL_EMAIL})"


def http_get_json(url: str, timeout: int = 30) -> dict | list:
    req = urllib.request.Request(
        url,
        headers={"Accept": "application/json", "User-Agent": _mailto_agent()},
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def strip_jats(text: str) -> str:
    if not text:
        return ""
    cleaned = re.sub(r"<[^>]+>", " ", text)
    return re.sub(r"\s+", " ", cleaned).strip()


def is_mri_related(title: str, abstract: str) -> bool:
    combined = f"{title} {abstract}".lower()
    return any(term in combined for term in MRI_TERMS)


def format_date_parts(item: dict) -> str:
    for key in ("published-print", "published-online", "issued", "created"):
        parts = item.get(key, {}).get("date-parts")
        if parts and parts[0]:
            values = parts[0]
            if len(values) >= 3:
                return f"{values[0]:04d}-{values[1]:02d}-{values[2]:02d}"
            if len(values) == 2:
                return f"{values[0]:04d}-{values[1]:02d}-01"
            if len(values) == 1:
                return f"{values[0]:04d}-01-01"
    return ""


def format_authors(item: dict) -> str:
    names = []
    for author in item.get("author", [])[:4]:
        given = author.get("given", "")
        family = author.get("family", "")
        name = f"{given} {family}".strip()
        if name:
            names.append(name)
    if not names:
        return ""
    if len(item.get("author", [])) > len(names):
        return ", ".join(names) + ", et al."
    return ", ".join(names)


def lookup_unpaywall(doi: str) -> dict:
    query = urllib.parse.urlencode({"email": UNPAYWALL_EMAIL})
    url = f"https://api.unpaywall.org/v2/{doi}?{query}"
    try:
        return http_get_json(url, timeout=20)
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError):
        return {}


def lookup_europe_pmc(doi: str) -> dict:
    query = urllib.parse.urlencode(
        {"query": f'DOI:"{doi}"', "format": "json", "resultType": "core"}
    )
    url = f"https://www.ebi.ac.uk/europepmc/webservices/rest/search?{query}"
    try:
        data = http_get_json(url, timeout=20)
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError):
        return {}

    results = data.get("resultList", {}).get("result", [])
    return results[0] if results else {}


def resolve_pdf_url(doi: str) -> tuple[str | None, bool]:
    unpaywall = lookup_unpaywall(doi)
    is_oa = bool(unpaywall.get("is_oa"))
    location = unpaywall.get("best_oa_location") or {}
    pdf_url = location.get("url_for_pdf")
    if pdf_url:
        return pdf_url, is_oa

    epmc = lookup_europe_pmc(doi)
    if epmc.get("hasPDF") == "Y" and epmc.get("pmcid"):
        return f"https://europepmc.org/articles/{epmc['pmcid']}/pdf", True

    return None, is_oa


def safe_pdf_name(doi: str) -> str:
    return doi.replace("/", "_").replace(":", "_") + ".pdf"


def download_pdf(url: str, dest: Path) -> bool:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": _mailto_agent(), "Accept": "application/pdf,*/*"},
    )
    try:
        with urllib.request.urlopen(req, timeout=90) as resp:
            content_type = resp.headers.get("Content-Type", "")
            data = resp.read()
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError) as exc:
        print(f"  PDF 下载失败: {dest.name} ({exc})", file=sys.stderr)
        return False

    if len(data) > MAX_PDF_BYTES:
        print(f"  PDF 过大，跳过: {dest.name}", file=sys.stderr)
        return False

    if not data.startswith(b"%PDF") and "pdf" not in content_type.lower():
        print(f"  非 PDF 内容，跳过: {dest.name}", file=sys.stderr)
        return False

    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(data)
    return True


def fetch_semantic_scholar(doi: str) -> dict:
    encoded = urllib.parse.quote(f"DOI:{doi}")
    url = (
        "https://api.semanticscholar.org/graph/v1/paper/"
        f"{encoded}?fields=abstract,openAccessPdf,isOpenAccess"
    )
    try:
        return http_get_json(url, timeout=20)
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError):
        return {}


def should_include_article(journal_id: str, title: str, abstract: str) -> bool:
    if journal_id == "mrm":
        return True
    return is_mri_related(title, abstract)


def fetch_journal_articles(journal: dict, papers_root: Path | None = None) -> list[dict]:
    from_date = (datetime.now(timezone.utc) - timedelta(days=LOOKBACK_DAYS)).strftime(
        "%Y-%m-%d"
    )
    params = urllib.parse.urlencode(
        {
            "rows": str(FETCH_LIMIT),
            "sort": "published",
            "order": "desc",
            "filter": f"from-pub-date:{from_date},type:journal-article",
        }
    )
    url = f"https://api.crossref.org/journals/{journal['issn']}/works?{params}"

    try:
        payload = http_get_json(url)
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError) as exc:
        print(f"{journal['short']} CrossRef 错误: {exc}", file=sys.stderr)
        return []

    items = []
    pdf_downloads = 0
    max_pdf_per_journal = 5

    for work in payload.get("message", {}).get("items", []):
        title = (work.get("title") or [""])[0].strip()
        if not title:
            continue

        doi = work.get("DOI", "")
        if not doi:
            continue

        abstract = strip_jats(work.get("abstract", ""))
        scholar = {}
        if not abstract and journal["id"] in {"tmi", "media"}:
            scholar = fetch_semantic_scholar(doi)
            time.sleep(0.35)
            abstract = scholar.get("abstract") or ""

        if not should_include_article(journal["id"], title, abstract):
            continue

        published = format_date_parts(work)
        description = abstract[:320] + ("…" if len(abstract) > 320 else "")
        if not description:
            description = f"{journal['short']} · {published or '近期发表'}"

        scholar_pdf = (scholar.get("openAccessPdf") or {}).get("url")
        is_oa = bool(scholar.get("isOpenAccess"))
        pdf_url = scholar_pdf

        if papers_root:
            resolved_pdf, resolved_oa = resolve_pdf_url(doi)
            time.sleep(0.25)
            is_oa = is_oa or resolved_oa
            pdf_url = pdf_url or resolved_pdf

        local_pdf = None
        pdf_available = False

        if papers_root and pdf_url and pdf_downloads < max_pdf_per_journal:
            dest = papers_root / journal["id"] / safe_pdf_name(doi)
            if download_pdf(pdf_url, dest):
                local_pdf = f"papers/{journal['id']}/{dest.name}"
                pdf_available = True
                pdf_downloads += 1
                print(f"  已下载 PDF: {dest}")

        items.append(
            {
                "title": title,
                "description": description,
                "url": f"https://doi.org/{doi}",
                "doi": doi,
                "authors": format_authors(work),
                "published": published,
                "journal": journal["short"],
                "owner": journal["short"],
                "isOpenAccess": is_oa,
                "pdfAvailable": pdf_available,
                "pdfUrl": local_pdf,
                "pdfSourceUrl": pdf_url or "",
            }
        )

        if len(items) >= DISPLAY_LIMIT:
            break

    return items


def journal_source_meta(journal: dict, items: list[dict], period_label: str) -> dict:
    downloaded = sum(1 for item in items if item.get("pdfAvailable"))
    return {
        "label": journal["label"],
        "description": (
            f"近 {LOOKBACK_DAYS} 天 {journal['short']} 期刊 MRI 相关论文"
            f"（{period_label}，共 {len(items)} 篇，已下载开放获取 PDF {downloaded} 篇）"
        ),
        "updateFrequency": "biweekly",
        "items": items,
    }


def journals_catalog_entry() -> dict:
    return {
        "id": "journals",
        "label": "MRI 顶刊",
        "children": [
            {"id": journal["id"], "sourceKey": journal["id"]} for journal in JOURNALS
        ],
    }


def period_label() -> str:
    end = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    start = (datetime.now(timezone.utc) - timedelta(days=LOOKBACK_DAYS)).strftime(
        "%Y-%m-%d"
    )
    return f"{start} ~ {end}"


def fetch_all_journals(papers_root: Path | None = None) -> tuple[dict[str, list[dict]], str]:
    period = period_label()
    results: dict[str, list[dict]] = {}
    for journal in JOURNALS:
        print(f"正在抓取 {journal['short']} …")
        results[journal["id"]] = fetch_journal_articles(journal, papers_root)
        print(f"  {journal['short']}: {len(results[journal['id']])} 篇")
    return results, period
