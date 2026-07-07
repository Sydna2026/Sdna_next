#!/usr/bin/env bash
# Set (or change) the admin email + password for the site.
# Writes ADMIN_EMAIL and ADMIN_PASSWORD into the app's .env and restarts it.
#
# Usage on the server:
#   bash /opt/sydan/deploy/set-admin.sh
# It will prompt for the email and password (password input is hidden).
#
# Non-interactive (e.g. from another script):
#   ADMIN_EMAIL="you@example.com" ADMIN_PASSWORD="secret" bash deploy/set-admin.sh --no-prompt
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/sydan}"
ENV_FILE="$APP_DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "No .env found at $ENV_FILE. Deploy the app first."
  exit 1
fi

EMAIL="${ADMIN_EMAIL:-}"
PASS="${ADMIN_PASSWORD:-}"

if [ "${1:-}" != "--no-prompt" ]; then
  read -rp "Admin email: " EMAIL
  read -rsp "Admin password: " PASS
  echo
fi

if [ -z "$EMAIL" ] || [ -z "$PASS" ]; then
  echo "Both email and password are required."
  exit 1
fi

# Passwords wrapped in single quotes in .env are taken literally. A single
# quote inside the password would break that, so reject it.
case "$PASS" in
  *\'*) echo "Please choose a password without a single-quote ( ' ) character."; exit 1 ;;
esac

# Replace an existing KEY line (if any) and append the new value.
set_var() {
  local key="$1" val="$2"
  if grep -qE "^${key}=" "$ENV_FILE"; then
    grep -vE "^${key}=" "$ENV_FILE" > "${ENV_FILE}.tmp" && mv "${ENV_FILE}.tmp" "$ENV_FILE"
  fi
  printf "%s='%s'\n" "$key" "$val" >> "$ENV_FILE"
}

set_var "ADMIN_EMAIL" "$EMAIL"
set_var "ADMIN_PASSWORD" "$PASS"
echo "Saved admin credentials to $ENV_FILE"

# Restart so the app picks up the new values.
if command -v pm2 >/dev/null 2>&1; then
  pm2 restart sydan --update-env >/dev/null 2>&1 || true
  echo "Restarted the app."
else
  echo "Restart the app to apply (e.g. pm2 restart sydan --update-env)."
fi

echo "You can now log in at https://sydan.org/admin with ${EMAIL}."
