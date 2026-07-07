#!/usr/bin/env bash
# Cron wrapper: triggers the article-ingestion endpoint on the running app.
# Installed to run every few hours by deploy/provision.sh.
set -euo pipefail

DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Load APP_URL + CRON_SECRET from the app's .env
set -a
# shellcheck disable=SC1091
. "$DIR/.env"
set +a

BASE="${APP_URL:-https://sydan.org}"
curl -fsS -m 180 \
  -H "Authorization: Bearer ${CRON_SECRET:-}" \
  "${BASE%/}/api/cron/ingest"
echo   # newline after the JSON response
