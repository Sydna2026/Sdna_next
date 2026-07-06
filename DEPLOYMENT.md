# Deploying sydan.org — one script, run on the server

Everything is done by a single script: **`deploy/provision.sh`**. Run it on the
server as root and it installs Node, Nginx, PM2, and Certbot, clones the repo,
builds the site, starts it under PM2, adds its own Nginx site, and gets a free
SSL certificate. Re-run the same script anytime to update the site.

- **Repo:** https://github.com/Sydna2026/Sdna_next (public, branch `main`)
- **Server:** `187.124.180.7` (Ubuntu, SSH as `root`)
- **Domain:** `sydan.org`
- **Stack:** Nginx (80/443, SSL) → Next.js via PM2 on an internal port

### Runs alongside your other app — no conflicts

- **Port:** the script auto-picks a **free** internal port (starts at `3100` and
  bumps up if taken), so it won't clash with your existing app on `3000`. The
  chosen port is saved in `.deploy_port` and reused on every re-run.
- **Nginx:** it adds a site block **only** for `sydan.org` and never edits or
  removes any other site. Nginx routes by domain name, so your other app keeps
  working exactly as before.

---

## Step 1 — Point DNS at the server (in your registrar)

Add two A records for **sydan.org**:

| Type | Host  | Value           |
| ---- | ----- | --------------- |
| A    | `@`   | `187.124.180.7` |
| A    | `www` | `187.124.180.7` |

Verify before doing SSL: `dig +short sydan.org` should return `187.124.180.7`.

---

## Step 2 — Run the script on the server

SSH in and run one command (replace the email with yours — it's used for the
SSL certificate):

```bash
ssh root@187.124.180.7
```

```bash
curl -fsSL https://raw.githubusercontent.com/Sydna2026/Sdna_next/main/deploy/provision.sh -o /tmp/provision.sh \
  && DOMAIN=sydan.org CERTBOT_EMAIL=you@example.com bash /tmp/provision.sh
```

That's the whole deployment. When it finishes, open **https://sydan.org**.

> The first run takes a few minutes (installing packages + first build).
> If DNS hasn't propagated yet, the site comes up on `http://` and you can
> just re-run the same command later to add HTTPS.

---

## Updating the site later

After the first deploy, a `redeploy` command is installed. To ship changes,
push to `main`, then on the server just run:

```bash
redeploy
```

That pulls the latest `main`, rebuilds, and restarts on the same port. (It's a
thin wrapper around `cd /var/www/sydan && bash deploy/provision.sh`, so that
still works too. Domain/email are only needed the first time SSL is set up.)

---

## Useful checks on the server

```bash
pm2 status                 # is the app running?
pm2 logs sydan             # app logs
cat /var/www/sydan/.deploy_port   # which internal port it chose
ss -ltnp | grep nginx      # nginx listening on 80/443
nginx -t                   # nginx config OK?
```

---

## Optional overrides

Pass these as env vars before the command if you ever need to:

| Variable        | Default                | Purpose                              |
| --------------- | ---------------------- | ------------------------------------ |
| `PORT`          | `3100` (auto-bumps)    | Preferred internal port              |
| `APP_DIR`       | `/var/www/sydan`       | Where the app is deployed            |
| `CERTBOT_EMAIL` | *(empty = skip SSL)*   | Email for the Let's Encrypt cert     |

Example: `PORT=4000 CERTBOT_EMAIL=you@example.com bash deploy/provision.sh`

---

## Troubleshooting

- **Site on http:// but not https://** — DNS wasn't pointing here when you ran
  it, or `CERTBOT_EMAIL` was empty. Fix DNS, confirm `dig +short sydan.org`,
  then re-run the script.
- **502 Bad Gateway** — the Node app isn't up: `pm2 status`, `pm2 logs sydan`.
- **Worried about the other app** — the script only touches
  `sites-available/sydan.org` + `sites-enabled/sydan.org` and its own PM2
  process `sydan`; nothing else is modified.
- **Build runs out of memory on a small VPS** — add swap once:
  ```bash
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  ```

---

## Note on repo access (deploy keys)

Because this repo is **public**, the script clones it over HTTPS with no
credentials — no deploy key needed. If you later make the repo **private**,
create a read-only deploy key on the server and switch to SSH:

```bash
ssh-keygen -t ed25519 -C "sydan-deploy-key" -f ~/.ssh/sydan_deploy -N ""
cat ~/.ssh/sydan_deploy.pub    # add on GitHub: repo → Settings → Deploy keys (read-only)
printf 'Host github.com\n  IdentityFile ~/.ssh/sydan_deploy\n  IdentitiesOnly yes\n' >> ~/.ssh/config
```

Then run the script with `REPO_URL=git@github.com:Sydna2026/Sdna_next.git`.
