#!/usr/bin/env bash
set -euo pipefail

API_BASE=${API_BASE:-http://localhost:3000}
CODE=${1:-abcd1}

echo "# Create"
curl -s -X POST "$API_BASE/shorturls" \
  -H 'Content-Type: application/json' \
  -d "{\"url\":\"https://example.com\",\"validity\":30,\"shortcode\":\"$CODE\"}" | tee create.json
echo

echo "# Redirect (show headers only)"
curl -i -s "$API_BASE/$CODE" | head -n 20 || true
echo

echo "# Stats"
curl -s "$API_BASE/shorturls/$CODE/stats" | tee stats.json
echo

