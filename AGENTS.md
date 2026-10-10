# AGENTS.md

## Cursor Cloud specific instructions

### What this project is
Static, client-side website (`index.html` + `css/` + `js/`) that renders the JSON in
`data/content.json`. A set of pure-Python scripts under `scripts/` fetch data from public
APIs (GitHub, Hacker News, Weibo, journals) and rewrite `data/content.json` / `data/history/`.
There is **no build step** and **no third-party Python packages** (`requirements.txt` is
standard-library-only), so no dependency install is needed.

### Running the site (dev)
The page uses `fetch()` for `data/content.json`, so it cannot be opened via `file://`.
Serve it over HTTP from the repo root: `python3 -m http.server 8080`, then open
`http://localhost:8080/`. See `README.md` for the same instructions.

### Running the fetch scripts
Run from the repo root, e.g. `python3 scripts/update_hackernews.py`,
`python3 scripts/update_weibo.py`, `python3 scripts/update_content.py` (GitHub),
`python3 scripts/update_journals.py`.

Gotchas:
- The scripts and GitHub Actions workflows invoke the interpreter as `python`, but this VM
  only has `python3` on PATH. Use `python3 ...` when running them manually.
- The scripts require outbound network access and **overwrite** `data/content.json`,
  `data/manifest.json`, and add files under `data/history/`. These regenerated data files are
  normally committed by the scheduled workflows; do not commit them as part of unrelated code
  changes (revert with `git checkout -- data/` if you only ran them to test).
- `update_content.py` (GitHub) can hit the GitHub API rate limit (403) when unauthenticated;
  set `GITHUB_TOKEN` to raise the limit.

### Lint / test / build
There is no linter, no automated test suite, and no build. "Testing" means serving the site
and confirming it renders `data/content.json`, and/or running a fetch script and checking its
stdout + the regenerated JSON.
