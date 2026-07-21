#!/usr/bin/env bash
# Stage expected paths first, then call:
#   bash scripts/git_push_with_retry.sh "commit message" [github_output_var]
# If there is nothing staged, exits 0 and optionally writes changed=false.
set -euo pipefail

MSG="${1:?commit message required}"
OUT_VAR="${2:-}"

write_out() {
  local key="$1"
  local value="$2"
  if [[ -n "${OUT_VAR}" && -n "${GITHUB_OUTPUT:-}" ]]; then
    echo "${key}=${value}" >> "${GITHUB_OUTPUT}"
  fi
}

if git diff --staged --quiet; then
  echo "No changes to commit."
  write_out changed false
  exit 0
fi

git commit -m "${MSG}"

for attempt in 1 2 3 4 5; do
  if git pull --rebase origin main && git push origin HEAD; then
    echo "Push succeeded on attempt ${attempt}."
    write_out changed true
    exit 0
  fi
  echo "Push/rebase failed on attempt ${attempt}, retrying..."
  git rebase --abort 2>/dev/null || true
  git fetch origin main || true
  sleep $((attempt * 2))
done

echo "Failed to push after retries" >&2
write_out changed false
exit 1
