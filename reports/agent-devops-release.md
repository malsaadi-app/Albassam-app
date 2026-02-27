# DevOps / Release Hardening — Albassam Group Platform (VPS + Docker + PM2 + Cloudflare Tunnel)

Date: 2026-02-27

## Scope (what I covered)
1) Safe secrets handling for Cloudflare tunnel (no token in repo; rotate guidance; PM2 reads `CLOUDFLARED_TOKEN`).
2) Upstash Redis `WRONGPASS` troubleshooting + required env vars + safe verification.
3) Backups + restore drill documentation (practical quarterly test).
4) Monitoring: minimal plan (UptimeRobot + optional Telegram alerts + optional Sentry).

---

## 1) Cloudflare tunnel secret handling (cloudflared token)

### What was wrong
`ecosystem.config.js` had a **hardcoded** `cloudflared tunnel run --token <...>` string.
- This is a high-risk secret leak (token in source tree, backups, copies, screenshots, etc.).

### What I changed
- Updated: `albassam-tasks/ecosystem.config.js`
  - Removed hardcoded token.
  - Now runs with:
    - `args: \`tunnel run --token ${process.env.CLOUDFLARED_TOKEN || ''}\``
  - Added comments clarifying rotation + “do not hardcode”.

### Required operational change
- Ensure `CLOUDFLARED_TOKEN` exists in the runtime environment (recommended: `.env`).
- Restart the `cloudflared` PM2 app after updating `.env`.

### Token rotation runbook (added)
Documented in `RUNBOOK.md`:
- Rotate token in Cloudflare Zero Trust.
- Update `.env` with `CLOUDFLARED_TOKEN=...`.
- `pm2 restart cloudflared`.
- Verify via `/api/health` and PM2 logs.

### Note (risk tradeoff)
Even when sourced from env, the `--token` may be visible to **privileged users** (process args). Still significantly safer than hardcoding it in repo. If later desired, we can move to **credentials-file + config** mode to avoid `--token` entirely.

---

## 2) Upstash Redis `WRONGPASS` (required env vars + safe verification)

### Required env vars
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

### Typical cause of WRONGPASS
- Using the **Redis password** instead of the **REST token**, or mixing URL/token from different Upstash DBs.

### Safe verification (no secrets displayed)
- Public endpoint:
  - `GET https://app.albassam-app.com/api/cache/test`
  - Expect: `cacheType: "redis"` and `stats.type: "redis"`.
  - If it falls back to memory, check logs for `Redis ping failed`.

### Direct verification (same env)
Provided in `RUNBOOK.md` (Node one-liner) to run `ping()` against Upstash using the env vars.

---

## 3) Backups + restore drill

### Current state
- There is already a strong guide: `BACKUP_RESTORE_GUIDE.md`.
- Backup scripts exist under `scripts/`:
  - `backup-db.sh`, `backup-postgresql.sh`, `restore-db.sh`

### Improvement made
Expanded `RUNBOOK.md` with a **practical quarterly restore drill**:
- Take a production `pg_dump` (custom format) into `backups/`.
- Restore into a *new test Supabase project* using `pg_restore`.
- Validate login + key pages + `/api/health`.
- Document result/date.

This reduces “we have backups but never tested restore” risk.

---

## 4) Monitoring (minimum viable plan)

### Already available in repo
- `UPTIMEROBOT_SETUP.md` (external monitoring)
- `scripts/health-monitor.ts` + `lib/alerting.ts` (internal checks + alert hooks)
- Sentry is documented as optional in `PHASE_3_MILESTONE_3_SENTRY.md`.

### Recommended baseline
1) **UptimeRobot**
   - Monitor `https://app.albassam-app.com/api/health` (keyword: `"ok"`).
   - Optional additional monitors: `/` and possibly a second keyword check for DB health.

2) **Telegram alerts** (optional but low effort)
   - Set:
     - `TELEGRAM_BOT_TOKEN`
     - `TELEGRAM_ALERT_CHAT_ID`
   - Run `npx tsx scripts/health-monitor.ts` periodically (cron/pm2 cron). This script already calls `Alerts.*`.

3) **Sentry**
   - Keep as “turn on when needed” (after pilot if error volume warrants).

---

## Documentation updates made
- Updated: `RUNBOOK.md`
  - Added clearer env var sections (Cloudflare token, Upstash troubleshooting, Telegram alerting).
  - Added quarterly backup/restore drill steps.
  - Added minimal monitoring plan references.

- Updated: `.env.example`
  - Added `CLOUDFLARED_TOKEN`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ALERT_CHAT_ID`, `ALERT_WEBHOOK_URL`.
  - Clarified Upstash REST token vs Redis password.

- Updated: `ENV_VARIABLES.md`
  - Added documentation blocks for `CLOUDFLARED_TOKEN`, Upstash Redis REST vars, Telegram alert vars.

---

## Next actions (for main agent / operator)
1) Put real values into `.env` on the VPS/container runtime:
   - `CLOUDFLARED_TOKEN=...`
   - `UPSTASH_REDIS_REST_URL=...`
   - `UPSTASH_REDIS_REST_TOKEN=...`
   - (optional) `TELEGRAM_BOT_TOKEN=...`
   - (optional) `TELEGRAM_ALERT_CHAT_ID=...`

2) Restart processes:
   - `pm2 restart cloudflared`
   - `pm2 restart albassam-app`

3) Verify:
   - `/api/health` (public)
   - `/api/cache/test` (should report redis if Upstash correct)

4) Schedule the restore drill quarterly and record results.
