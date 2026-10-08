#!/usr/bin/env bash
# Runs Lighthouse over every page of the built site and writes one HTML and
# one JSON report per page to lighthouse/, named <page>.report.html and
# <page>.report.json. scripts/assemble-reports.ts publishes that directory.
#
# The lighthouse CI job runs this, one shard per matrix entry. It builds the
# site itself, so it also works from a clean checkout, and it uses the
# Chromium Playwright installed rather than a second browser.
#
# LIGHTHOUSE_SHARD=<n>/<total> audits only the n-th of <total> slices of the
# pages (see lighthouse-shard.sh). Unset, it audits every page. Pages are
# audited one at a time, about 10s each, so the shard count is what keeps the
# job short as the catalogue grows a page per report.
#
# Lighthouse 13 needs Node 22.19 or newer. The CI job installs one; bun's
# node compatibility isn't a substitute for a tool that spawns Chrome.
set -euo pipefail

cd "$(dirname "$0")/.."

PORT=43211
OUT=lighthouse

bun run build
rm -rf "$OUT"
mkdir -p "$OUT"

# Not Astro's default 4321 or the end-to-end port 43210: another preview
# server on this machine would otherwise answer for the wrong site.
ASTRO_PREVIEW_BACKGROUND=1 bun run preview --port "$PORT" &
server=$!
until curl --fail --silent --output /dev/null "http://localhost:$PORT/"; do
  kill -0 "$server" 2>/dev/null || { echo "preview server exited early" >&2; exit 1; }
  sleep 1
done

chrome=$(bun -e 'import { chromium } from "@playwright/test"; console.log(chromium.executablePath())')

# One browser for every page, rather than one launch per page: Chrome
# occasionally fails to start when launched repeatedly, and lighthouse then
# stops with "waiting for dynamic debugging port". Lighthouse attaches to a
# browser it didn't start and leaves it running.
CDP_PORT=43212
profile=$(mktemp -d)
"$chrome" --headless=new --no-sandbox --remote-debugging-port="$CDP_PORT" \
  --user-data-dir="$profile" about:blank >/dev/null 2>&1 &
browser=$!
# Wait for Chrome to exit before deleting its profile, which it is still
# writing to otherwise.
trap 'kill "$server" "$browser" 2>/dev/null || true; wait "$browser" 2>/dev/null || true; rm -rf "$profile" || true' EXIT
until curl --fail --silent --output /dev/null "http://localhost:$CDP_PORT/json/version"; do
  kill -0 "$browser" 2>/dev/null || { echo "chrome exited early" >&2; exit 1; }
  sleep 1
done

IFS=/ read -r shard shards <<<"${LIGHTHOUSE_SHARD:-1/1}"

# dist/index.html is the home page; dist/privacy/index.html is "privacy".
find dist -name index.html | sort | scripts/lighthouse-shard.sh "$shard" "$shards" | while read -r file; do
  dir=$(dirname "${file#dist}")
  path=${dir#/}
  page=${path:-home}
  page=${page//\//-}
  echo "Lighthouse: /${path}"
  node node_modules/lighthouse/cli/index.js "http://localhost:$PORT/${path:+$path/}" \
    --port "$CDP_PORT" \
    --output html --output json \
    --output-path "$OUT/$page" \
    --quiet
done

ls "$OUT"
