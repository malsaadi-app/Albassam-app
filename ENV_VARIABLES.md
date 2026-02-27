# 🔐 Environment Variables Documentation

## Required Variables

### `DATABASE_URL`
**Type:** String  
**Required:** Yes  
**Format:** `postgresql://USER:PASSWORD@HOST:PORT/DATABASE`

PostgreSQL database connection string. Used by Prisma for all database operations.

**Example:**
```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/albassam"
```

**Production:** Supabase PostgreSQL (Free tier)

---

### `SESSION_PASSWORD`
**Type:** String  
**Required:** Yes  
**Minimum:** 32 characters  
**Security:** Must be random and secure

Secret key for encrypting session cookies. Critical for security.

**Generate secure password:**
```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# OpenSSL
openssl rand -hex 32
```

**Example:**
```bash
SESSION_PASSWORD="b7Fq8tsHJGyVer7brsqwxshGOrSVGUHQsvbMPvizrEdWQLB3kXcdc19shWRrG9ZF"
```

---

## Optional Variables

### `APP_NAME`
**Type:** String  
**Required:** No  
**Default:** `"Albassam Schools App"`

Application name displayed in UI and metadata.

---

### `APP_URL`
**Type:** String (URL)  
**Required:** No  
**Default:** `"https://app.albassam-app.com"`

Base URL for the application. Used for:
- Email links
- OAuth redirects
- Absolute URLs in metadata

---

### `SEED_DEFAULT_PASSWORD`
**Type:** String  
**Required:** No  
**Default:** `"AbS0MqAwLAHo!"`

Default password for seeded users when running `npm run seed`.

**⚠️ Security Note:** Change this in production and force users to change passwords on first login.

---

### `DEEPSEEK_API_KEY`
**Type:** String  
**Required:** No  
**Default:** None

API key for DeepSeek AI integration (if enabled).

**Format:** `sk-xxxxxxxxxxxxx`

**Get API key:** https://platform.deepseek.com

---

### `CLOUDFLARED_TOKEN`
**Type:** String  
**Required:** Recommended (production)  

Cloudflare Tunnel token used by `cloudflared` (PM2 process).

**Security note:** Do not hardcode this token in `ecosystem.config.js`. Provide via `.env` / process environment and rotate when needed.

---

### `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`
**Type:** String  
**Required:** No (optional caching)  

Upstash Redis REST credentials used by `@upstash/redis`.

**Common pitfall:** `WRONGPASS` means you used a wrong token (often Redis password instead of REST token) or mixed URL/token from different DBs.

---

### `TELEGRAM_BOT_TOKEN` / `TELEGRAM_ALERT_CHAT_ID`
**Type:** String  
**Required:** No (optional alerting)  

Used by `lib/alerting.ts` to send alerts to Telegram.

---

## Setup Instructions

### 1. Copy example file
```bash
cp .env.example .env
```

### 2. Fill in required variables
Edit `.env` and replace all `CHANGE_ME` values:
- `SESSION_PASSWORD` - Generate random 32+ chars
- `DATABASE_URL` - Your PostgreSQL connection string

### 3. Verify configuration
```bash
npm run build
```

---

## Security Best Practices

### ✅ DO:
- Use strong random passwords (32+ characters)
- Keep `.env` file out of version control (`.gitignore`)
- Use different passwords for development/production
- Rotate secrets regularly (every 90 days)
- Store production secrets in secure vault (1Password, Bitwarden)

### ❌ DON'T:
- Commit `.env` to git
- Share `.env` files via email/Slack
- Use weak or predictable passwords
- Reuse passwords across environments
- Hardcode secrets in code

---

## Troubleshooting

### "SESSION_PASSWORD must be at least 32 characters"
Generate a new secure password:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### "Database connection failed"
1. Check `DATABASE_URL` format
2. Verify database is running
3. Test connection:
```bash
npx prisma db pull
```

### "Prisma Client initialization error"
Regenerate Prisma Client:
```bash
npx prisma generate
```

---

## Environment-Specific Notes

### Development
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/albassam_dev"
SESSION_PASSWORD="dev_secret_at_least_32_characters_long_12345"
```

### Production
```bash
DATABASE_URL="postgresql://postgres:STRONG_PASSWORD@production-host:5432/albassam"
SESSION_PASSWORD="<64-char random hex string>"
```

Use production-grade secrets from secure vault.

---

**Last updated:** February 24, 2026  
**Phase:** Phase 1 - Security & Stability
