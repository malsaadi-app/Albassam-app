# Albassam Group Platform — Runbook

> هدف الملف: أي مطوّر يقدر يشغّل/يحدّث/يرجّع النظام بدون ما يسأل أحد.

## Project location
- Host (VPS): `/docker/openclaw-fx2z/data/.openclaw/workspace/albassam-tasks`
- Container: `openclaw-fx2z-openclaw-1`
  - In-container path: `/data/.openclaw/workspace/albassam-tasks`

## Quick status
```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

curl -s -o /dev/null -w "local /api/health: %{http_code}\n" http://localhost:3000/api/health
curl -s -o /dev/null -w "public /api/health: %{http_code}\n" https://app.albassam-app.com/api/health

sudo env PM2_HOME=/data/.pm2 PATH=/data/.npm-global/bin:$PATH pm2 list
```

## Start/Restart app
```bash
sudo env PM2_HOME=/data/.pm2 PATH=/data/.npm-global/bin:$PATH pm2 restart albassam-app
sudo env PM2_HOME=/data/.pm2 PATH=/data/.npm-global/bin:$PATH pm2 restart cloudflared
```

## Deploy (safe-ish procedure)
> This repo is inside `/data/.openclaw/workspace/albassam-tasks` and IS a git repo.

```bash
cd /data/.openclaw/workspace/albassam-tasks

# 1) Update code
git pull

# 2) Install deps (only if needed)
npm ci

# 3) Prisma
npx prisma generate
npx prisma migrate deploy

# 4) Build
npm run build

# If build fails with EACCES under .next_run*:
#   sudo chown -R node:node .next .next_run*

# 5) Restart app
sudo env PM2_HOME=/data/.pm2 PATH=/data/.npm-global/bin:$PATH pm2 restart albassam-app

# 6) Health check
curl -s -o /dev/null -w "public /api/health: %{http_code}\n" https://app.albassam-app.com/api/health
```

## Logs
```bash
sudo env PM2_HOME=/data/.pm2 PATH=/data/.npm-global/bin:$PATH pm2 logs albassam-app --lines 200 --nostream
sudo env PM2_HOME=/data/.pm2 PATH=/data/.npm-global/bin:$PATH pm2 logs cloudflared --lines 200 --nostream
```

## Backups
### Code
- Folder: `backups/`
- Create:
```bash
cd /docker/openclaw-fx2z/data/.openclaw/workspace/albassam-tasks
TS=$(date +%F_%H%M%S)
tar -czf "backups/albassam-tasks_${TS}.tar.gz" \
  --exclude='./node_modules' --exclude='./.next' --exclude='./backups' --exclude='./.pm2' .
ls -lah backups | tail -n 10
```

### Database (Supabase Postgres)
Prereq: `pg_dump` (installed via `brew install libpq` on this VPS)
```bash
cd /docker/openclaw-fx2z/data/.openclaw/workspace/albassam-tasks
export PATH="/home/linuxbrew/.linuxbrew/opt/libpq/bin:$PATH"
TS=$(date +%F_%H%M%S)
set -a; . ./.env; set +a
pg_dump "$DATABASE_URL" --format=custom --no-owner --no-privileges -f "backups/supabase_${TS}.dump"
ls -lah backups | tail -n 10
```

## Restore
### Restore code to a separate folder
```bash
FILE="backups/albassam-tasks_<TS>.tar.gz"
mkdir -p /docker/restore_albassam
tar -xzf "/docker/openclaw-fx2z/data/.openclaw/workspace/albassam-tasks/${FILE}" -C /docker/restore_albassam
```

### Restore DB
> Decide target: same Supabase project vs new project.
> Use `pg_restore` against target DB URL.

## Environment variables
- Main file: `.env` (never commit it)
- Load it when running commands:
  ```bash
  set -a; . ./.env; set +a
  ```

### Required (production)
- `DATABASE_URL` (Supabase Postgres)
- `SESSION_PASSWORD` (32+ chars random)

### Recommended secrets (production)
#### Cloudflare Tunnel (`cloudflared`)
- `CLOUDFLARED_TOKEN` (Cloudflare Tunnel token)

**Why:** `ecosystem.config.js` must not contain secrets. Token is injected via environment.

**Rotate token (safe procedure):**
1. Cloudflare Zero Trust → **Access/Tunnels** → Tunnel → **Rotate token** (or create new token).
2. Update `.env` on the host/container:
   ```bash
   cd /docker/openclaw-fx2z/data/.openclaw/workspace/albassam-tasks
   sudo nano .env
   # set CLOUDFLARED_TOKEN=...
   ```
3. Restart tunnel:
   ```bash
   sudo env PM2_HOME=/data/.pm2 PATH=/data/.npm-global/bin:$PATH pm2 restart cloudflared
   ```
4. Verify:
   ```bash
   curl -s -o /dev/null -w "public /api/health: %{http_code}\n" https://app.albassam-app.com/api/health
   sudo env PM2_HOME=/data/.pm2 PATH=/data/.npm-global/bin:$PATH pm2 logs cloudflared --lines 50 --nostream
   ```

> Note: passing `--token` means the token may be visible to privileged users in process args; still better than hardcoding it in git.

#### Upstash Redis (cache)
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

**Common issue:** `WRONGPASS` (invalid token). Usually means you copied the **Redis password** or wrong token instead of the **REST token**, or mixed URL/token from different databases.

**Safe verification (no secret output):**
- App endpoint:
  ```bash
  curl -s https://app.albassam-app.com/api/cache/test | head
  ```
  - If it reports `cacheType: "redis"` and `stats.type: "redis"` → OK.
  - If it falls back to memory, check app logs for `Redis ping failed`.

**Direct verification (inside same env):**
```bash
cd /docker/openclaw-fx2z/data/.openclaw/workspace/albassam-tasks
set -a; . ./.env; set +a
node -e "const {Redis}=require('@upstash/redis'); const r=new Redis({url:process.env.UPSTASH_REDIS_REST_URL, token:process.env.UPSTASH_REDIS_REST_TOKEN}); r.ping().then(console.log).catch(e=>{console.error('PING_FAIL', e.message); process.exit(1);});"
```

#### Telegram alerts (optional but recommended)
Used by `lib/alerting.ts` + `scripts/health-monitor.ts`:
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_ALERT_CHAT_ID`
- (optional) `ALERT_WEBHOOK_URL`

## Backup & restore drill (recommended quarterly)
Reference: `BACKUP_RESTORE_GUIDE.md`

**هدف الاختبار:** نتأكد أننا نقدر نرجّع النظام (DB + app) بدون مفاجآت.

1. Create a *new* Supabase project (test) and keep its `DATABASE_URL_TEST`.
2. Take a production dump:
   ```bash
   cd /docker/openclaw-fx2z/data/.openclaw/workspace/albassam-tasks
   export PATH="/home/linuxbrew/.linuxbrew/opt/libpq/bin:$PATH"
   TS=$(date +%F_%H%M%S)
   set -a; . ./.env; set +a
   pg_dump "$DATABASE_URL" --format=custom --no-owner --no-privileges -f "backups/prod_${TS}.dump"
   ```
3. Restore into the test database:
   ```bash
   export DATABASE_URL_TEST="postgresql://..."
   pg_restore --no-owner --no-privileges --clean --if-exists --dbname "$DATABASE_URL_TEST" "backups/prod_${TS}.dump"
   ```
4. Point a temporary deployment (or local run) at `DATABASE_URL_TEST` and verify:
   - login works
   - key pages load
   - `/api/health` returns ok
5. Document date + result.

## Monitoring (minimum viable)
1. **UptimeRobot** monitors:
   - `https://app.albassam-app.com/api/health` (keyword: `"ok"`)
   - optional: homepage `/`
   Reference: `UPTIMEROBOT_SETUP.md`

2. **Telegram alerts** (for internal health checks / scripts):
   - Configure env vars above.
   - Run periodically:
     ```bash
     npx tsx scripts/health-monitor.ts
     ```

3. **Sentry** (optional, later): see `PHASE_3_MILESTONE_3_SENTRY.md`.
