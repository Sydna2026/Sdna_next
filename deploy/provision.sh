#!/usr/bin/env bash
###############################################################################
# provision.sh — one script that deploys sydan.org end-to-end.
#
# Run it on the server as root. First run installs everything, clones the repo,
# builds, starts the app under PM2, configures its own Nginx site, and gets an
# SSL certificate. Re-running it just updates the site. It is idempotent and
# will NOT disturb any other app already running on the server.
#
# Quickest start (one line on the server, as root):
#   curl -fsSL https://raw.githubusercontent.com/Sydna2026/Sdna_next/main/deploy/provision.sh -o /tmp/provision.sh \
#     && DOMAIN=sydan.org CERTBOT_EMAIL=you@example.com bash /tmp/provision.sh
#
# Or, if the repo is already cloned:
#   cd /opt/sydan && DOMAIN=sydan.org CERTBOT_EMAIL=you@example.com bash deploy/provision.sh
#
# Optional overrides (env vars):
#   PORT           preferred internal port (default 3100; auto-bumps if taken)
#   APP_DIR        where to deploy (default /opt/sydan)
#   CERTBOT_EMAIL  email for Let's Encrypt (SSL skipped if empty)
###############################################################################
set -euo pipefail

DOMAIN="${DOMAIN:-sydan.org}"
WWW_DOMAIN="www.${DOMAIN}"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-}"
APP_DIR="${APP_DIR:-/opt/sydan}"
REPO_URL="${REPO_URL:-https://github.com/Sydna2026/Sdna_next.git}"
APP_NAME="sydan"
NODE_MAJOR=22
DESIRED_PORT="${PORT:-3100}"

log() { echo -e "\n==> $*"; }

if [ "$(id -u)" -ne 0 ]; then
  echo "Please run as root (e.g. 'sudo bash deploy/provision.sh')." >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

# ---------------------------------------------------------------------------
# 1. Get the code onto the server (clone first run, update afterwards)
# ---------------------------------------------------------------------------
if ! command -v git >/dev/null 2>&1; then
  log "Installing git"
  apt-get update && apt-get install -y git
fi

if [ ! -d "$APP_DIR/.git" ]; then
  log "Cloning repository into $APP_DIR"
  mkdir -p "$(dirname "$APP_DIR")"
  git clone "$REPO_URL" "$APP_DIR"
else
  log "Updating repository in $APP_DIR"
  git -C "$APP_DIR" fetch --all --prune
  git -C "$APP_DIR" reset --hard origin/main
fi
cd "$APP_DIR"

# ---------------------------------------------------------------------------
# 2. Pick a free internal port and remember it (so it stays stable on re-runs)
# ---------------------------------------------------------------------------
PORT_FILE="$APP_DIR/.deploy_port"
port_in_use() { ss -ltnH 2>/dev/null | awk '{print $4}' | grep -qE "[:.]${1}\$"; }

if [ -f "$PORT_FILE" ]; then
  PORT="$(cat "$PORT_FILE")"
else
  PORT="$DESIRED_PORT"
  while port_in_use "$PORT"; do
    log "Port $PORT is already in use (another app?) — trying $((PORT + 1))"
    PORT=$((PORT + 1))
  done
  echo "$PORT" > "$PORT_FILE"
fi
export PORT
log "Using internal port $PORT for this app"

# ---------------------------------------------------------------------------
# 3. System dependencies (each guarded, so re-runs are quick no-ops)
# ---------------------------------------------------------------------------
if ! command -v node >/dev/null 2>&1 || [ "$(node -v | cut -c2- | cut -d. -f1)" -lt "$NODE_MAJOR" ]; then
  log "Installing Node.js ${NODE_MAJOR} LTS"
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
  apt-get install -y nodejs
fi
command -v nginx   >/dev/null 2>&1 || { log "Installing Nginx";   apt-get update && apt-get install -y nginx; }
command -v pm2     >/dev/null 2>&1 || { log "Installing PM2";     npm install -g pm2; }
command -v certbot >/dev/null 2>&1 || { log "Installing Certbot"; apt-get install -y certbot python3-certbot-nginx; }

# ---------------------------------------------------------------------------
# 4. Firewall (only if ufw is active; opens web + keeps SSH)
# ---------------------------------------------------------------------------
if command -v ufw >/dev/null 2>&1; then
  ufw allow OpenSSH      >/dev/null 2>&1 || true
  ufw allow 'Nginx Full' >/dev/null 2>&1 || true
fi

# ---------------------------------------------------------------------------
# 5a. Environment file (created once; never overwritten so secrets persist)
# ---------------------------------------------------------------------------
gen_secret() { openssl rand -hex 24 2>/dev/null || head -c 24 /dev/urandom | od -An -tx1 | tr -d ' \n'; }
# Append KEY="VALUE" to .env only if KEY is not already present.
ensure_env_var() {
  local key="$1" value="$2"
  grep -qE "^${key}=" "$APP_DIR/.env" 2>/dev/null || echo "${key}=\"${value}\"" >> "$APP_DIR/.env"
}

if [ ! -f "$APP_DIR/.env" ]; then
  log "Creating starter .env (edit it to add your Resend key + admin password)"
  cat > "$APP_DIR/.env" <<ENV
# Auto-created by provision.sh. Fill in RESEND_API_KEY to enable email sending.
# Absolute DB path so Prisma resolves the same file at migrate + runtime.
DATABASE_URL="file:${APP_DIR}/prisma/sdna.db"
APP_URL="https://${DOMAIN}"
RESEND_API_KEY=""
EMAIL_FROM="SDAN <news@${DOMAIN}>"
CRON_SECRET="$(gen_secret)"
ADMIN_EMAIL=""
ADMIN_PASSWORD=""
ENV
else
  # Existing .env: make sure newer keys exist without touching current values.
  ensure_env_var "CRON_SECRET" "$(gen_secret)"
  ensure_env_var "ADMIN_EMAIL" ""
  ensure_env_var "ADMIN_PASSWORD" ""
fi

# ---------------------------------------------------------------------------
# 5b. Install dependencies + build
# ---------------------------------------------------------------------------
# Use 'npm install' (not 'npm ci') so the lockfile self-heals when new deps
# are added. postinstall runs 'prisma generate'; build runs it again + next build.
log "Installing dependencies (npm install)"
npm install --no-fund --no-audit
log "Building production bundle"
npm run build

# ---------------------------------------------------------------------------
# 5c. Database: create/update schema and seed specializations (idempotent)
# ---------------------------------------------------------------------------
log "Applying database schema (prisma db push)"
# --accept-data-loss lets non-interactive schema changes (e.g. dropping an
# unused column) proceed. This app's data is the subscriber/article tables,
# which are preserved by additive/compatible changes.
npx prisma db push --skip-generate --accept-data-loss
log "Seeding specializations"
npx prisma db seed || log "Seed step reported an issue (continuing)."

# ---------------------------------------------------------------------------
# 6. Run under PM2 on the chosen port + survive reboots
# ---------------------------------------------------------------------------
mkdir -p "$APP_DIR/logs"
if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
  log "Reloading PM2 app on port $PORT"
  pm2 reload ecosystem.config.js --update-env
else
  log "Starting PM2 app on port $PORT"
  pm2 start ecosystem.config.js
fi
pm2 save
pm2 startup systemd -u root --hp /root >/dev/null 2>&1 || true

# ---------------------------------------------------------------------------
# 7. Nginx site for THIS domain only (other apps' sites are left untouched)
# ---------------------------------------------------------------------------
log "Writing Nginx site for ${DOMAIN} -> 127.0.0.1:${PORT}"
cat > "/etc/nginx/sites-available/${DOMAIN}" <<NGINX
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} ${WWW_DOMAIN};

    client_max_body_size 10M;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    location / {
        proxy_pass http://127.0.0.1:${PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
    }

    location /_next/static/ {
        proxy_pass http://127.0.0.1:${PORT};
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
NGINX

# Enable only our site. We do NOT remove the default or any other app's config.
ln -sf "/etc/nginx/sites-available/${DOMAIN}" "/etc/nginx/sites-enabled/${DOMAIN}"
nginx -t
systemctl reload nginx

# ---------------------------------------------------------------------------
# 8. Install a short 'redeploy' command (so future updates are one word)
# ---------------------------------------------------------------------------
log "Installing 'redeploy' command"
cat > /usr/local/bin/redeploy <<REDEPLOY
#!/usr/bin/env bash
# Pull latest main, rebuild, and restart the sydan app.
cd "${APP_DIR}" && bash deploy/provision.sh "\$@"
REDEPLOY
chmod +x /usr/local/bin/redeploy

# ---------------------------------------------------------------------------
# 8b. Install cron job that polls research feeds for new articles
# ---------------------------------------------------------------------------
log "Installing article-ingestion cron (every 6 hours)"
chmod +x "${APP_DIR}/deploy/ingest.sh" 2>/dev/null || true
cat > /etc/cron.d/sydna-ingest <<CRON
# Poll research feeds for new articles and email subscribers. Managed by provision.sh.
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
0 */6 * * * root ${APP_DIR}/deploy/ingest.sh >> ${APP_DIR}/logs/ingest.log 2>&1
CRON
chmod 644 /etc/cron.d/sydna-ingest

# ---------------------------------------------------------------------------
# 9. SSL / HTTPS
# Section 7 rewrites the Nginx file as HTTP-only every run, which removes the
# 443 block certbot adds. So: if a cert already exists we must RE-INSTALL it
# into the freshly written Nginx site (no new cert issued — no rate limits).
# If no cert exists yet, obtain one (which also installs the 443 block).
# ---------------------------------------------------------------------------
if [ -d "/etc/letsencrypt/live/${DOMAIN}" ]; then
  log "Re-applying HTTPS to the Nginx site from the existing certificate"
  certbot install --nginx --cert-name "${DOMAIN}" --redirect --non-interactive \
    || log "Could not reinstall SSL into Nginx (check: certbot certificates)."
elif [ -n "$CERTBOT_EMAIL" ]; then
  log "Obtaining Let's Encrypt certificate for ${DOMAIN}"
  certbot --nginx -d "${DOMAIN}" -d "${WWW_DOMAIN}" \
    --non-interactive --agree-tos -m "${CERTBOT_EMAIL}" --redirect \
    || log "Certbot failed (is DNS pointing here yet?) — site still serves on HTTP."
else
  log "SKIPPING SSL: re-run with CERTBOT_EMAIL=you@example.com to enable HTTPS."
fi

# Make sure Nginx is running the final config.
nginx -t && systemctl reload nginx || true

log "Done. Site: https://${DOMAIN}  (internal port ${PORT}, PM2 app '${APP_NAME}')"
