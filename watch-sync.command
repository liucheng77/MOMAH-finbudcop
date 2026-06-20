#!/bin/bash
# Auto-sync: watches this folder and commits + pushes to GitHub on every change.
# Double-click to run (macOS opens it in Terminal). Requires git auth already set up
# (e.g. `gh auth login`, or a stored credential helper / SSH key).
# Ctrl+C to stop.
cd "$(dirname "$0")" || exit 1

echo "Auto-sync watching $(pwd)"
echo "Commits + pushes to 'origin main' whenever files change. Ctrl+C to stop."
echo

while true; do
  if [ -n "$(git status --porcelain)" ]; then
    git add -A
    git commit -m "auto-sync: $(date '+%Y-%m-%d %H:%M:%S')" >/dev/null 2>&1
    if git push origin main >/dev/null 2>&1; then
      echo "[$(date '+%H:%M:%S')] pushed changes"
    else
      echo "[$(date '+%H:%M:%S')] commit done, push failed (check auth / network)"
    fi
  fi
  sleep 10
done
