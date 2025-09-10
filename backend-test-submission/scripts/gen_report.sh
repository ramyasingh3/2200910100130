#!/usr/bin/env bash
set -euo pipefail

# Generates a static HTML report with request, response, and response time
# so you can take screenshots without using Postman.

API_BASE=${API_BASE:-http://localhost:3000}
CODE=${1:-abcd5}
OUTDIR="$(cd "$(dirname "$0")/../.." && pwd)/docs/backend"
mkdir -p "$OUTDIR"

timestamp() { date -u +%Y-%m-%dT%H:%M:%SZ; }

echo "Creating short URL for code=$CODE at $API_BASE" >&2

# 1) CREATE
CREATE_BODY=$(cat <<JSON
{ "url": "https://example.com", "validity": 30, "shortcode": "$CODE" }
JSON
)

CREATE_HEADERS="$OUTDIR/create.headers.txt"
CREATE_BODY_OUT="$OUTDIR/create.response.json"
CREATE_TIME=$(curl -s -w '%{time_total}' -o "$CREATE_BODY_OUT" -D "$CREATE_HEADERS" \
  -H 'Content-Type: application/json' \
  -X POST "$API_BASE/shorturls" \
  -d "$CREATE_BODY")

# 2) REDIRECT (do not follow)
REDIRECT_HEADERS="$OUTDIR/redirect.headers.txt"
REDIRECT_TIME=$(curl -s -o /dev/null -D "$REDIRECT_HEADERS" -w '%{time_total}' "$API_BASE/$CODE")

# 3) STATS
STATS_HEADERS="$OUTDIR/stats.headers.txt"
STATS_BODY_OUT="$OUTDIR/stats.response.json"
STATS_TIME=$(curl -s -w '%{time_total}' -o "$STATS_BODY_OUT" -D "$STATS_HEADERS" "$API_BASE/shorturls/$CODE/stats")

# HTML report
REPORT="$OUTDIR/report.html"
cat > "$REPORT" <<HTML
<!doctype html>
<meta charset="utf-8" />
<title>Backend API Report</title>
<style>
  body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; margin: 24px; }
  h2 { margin-top: 32px; }
  pre { background: #111; color: #fff; padding: 12px; border-radius: 6px; overflow: auto; }
  code { color: #cde; }
  .badge { display: inline-block; background:#eee; border:1px solid #ccc; padding:2px 8px; border-radius: 999px; font-size: 12px; }
</style>
<h1>URL Shortener Backend — Request/Response/Time</h1>
<p>Generated at <code>$(timestamp)</code></p>

<h2>1) Create Short URL (POST /shorturls) <span class="badge">time: ${CREATE_TIME}s</span></h2>
<h3>Request Body</h3>
<pre id="create-body">$(printf '%s' "$CREATE_BODY" | sed 's/&/\&/g; s/</\&lt;/g')</pre>
<h3>Response</h3>
<pre id="create-headers">$(sed 's/&/\&/g; s/</\&lt;/g' "$CREATE_HEADERS")</pre>
<pre id="create-json">$(sed 's/&/\&/g; s/</\&lt;/g' "$CREATE_BODY_OUT")</pre>

<h2>2) Redirect (GET /$CODE) <span class="badge">time: ${REDIRECT_TIME}s</span></h2>
<p>Shows 302 with Location header (no body).</p>
<pre id="redirect-headers">$(sed 's/&/\&/g; s/</\&lt;/g' "$REDIRECT_HEADERS")</pre>

<h2>3) Stats (GET /shorturls/$CODE/stats) <span class="badge">time: ${STATS_TIME}s</span></h2>
<pre id="stats-headers">$(sed 's/&/\&/g; s/</\&lt;/g' "$STATS_HEADERS")</pre>
<pre id="stats-json">$(sed 's/&/\&/g; s/</\&lt;/g' "$STATS_BODY_OUT")</pre>
HTML

echo "Wrote: $REPORT" >&2

