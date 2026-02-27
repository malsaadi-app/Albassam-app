# Deployment Guide - Albassam Schools App

**Version:** 1.0  
**Last Updated:** February 24, 2026  
**Audience:** DevOps, System Administrators

---

## 📚 Overview

This guide covers the deployment and maintenance of the Albassam Schools application.

**Current Production:**
- **URL:** https://app.albassam-app.com
- **Server:** Hostinger VPS (76.13.50.89)
- **Container:** Docker (490d9c3678d8)
- **Database:** PostgreSQL (Supabase)
- **Process Manager:** PM2
- **Tunnel:** Cloudflare Tunnel

---

## 🏗️ Architecture

```
┌─────────────────┐
│   Cloudflare    │ (SSL, CDN, Protection)
│     Tunnel      │
└────────┬────────┘
         │
┌────────▼────────┐
│  Hostinger VPS  │ (76.13.50.89)
│   Docker Host   │
└────────┬────────┘
         │
┌────────▼────────┐
│     Docker      │ (490d9c3678d8)
│   Container     │
├─────────────────┤
│  PM2 Manager    │
│  ┌───────────┐  │
│  │ Next.js   │  │ Port 3000
│  │   App     │  │
│  └───────────┘  │
│  ┌───────────┐  │
│  │Cloudflared│  │
│  └───────────┘  │
└─────────────────┘
         │
┌────────▼────────┐
│    Supabase     │ (West EU - Ireland)
│   PostgreSQL    │
└─────────────────┘
```

---

## ⚙️ System Requirements

### Minimum Requirements
- **CPU:** 2 cores
- **RAM:** 2 GB
- **Storage:** 10 GB
- **Node.js:** 18.x or higher
- **Docker:** 20.x or higher (optional)

### Recommended (Production)
- **CPU:** 4 cores
- **RAM:** 4 GB
- **Storage:** 20 GB SSD
- **Bandwidth:** 100 GB/month

---

## 🚀 Deployment Methods

### Method 1: PM2 (Current Production)

**Prerequisites:**
```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
npm install -g pm2
```

**Deployment Steps:**

1. **Clone Repository**
```bash
git clone https://github.com/your-org/albassam-tasks.git
cd albassam-tasks
```

2. **Install Dependencies**
```bash
npm install
```

3. **Configure Environment**
```bash
cp .env.example .env
nano .env
```

**Required Environment Variables:**
```env
# Database
DATABASE_URL="postgresql://user:pass@host:5432/dbname"

# App
NEXT_PUBLIC_APP_URL="https://app.albassam-app.com"
NODE_ENV="production"

# Session Secret
SESSION_SECRET="your-super-secret-key-change-this"

# Cloudflare Tunnel (optional)
TUNNEL_TOKEN="your-tunnel-token"
```

4. **Setup Database**
```bash
npx prisma migrate deploy
npx prisma generate
```

5. **Build Application**
```bash
npm run build
```

6. **Start with PM2**
```bash
pm2 start npm --name "albassam" -- start
pm2 save
pm2 startup
```

7. **Setup Cloudflare Tunnel** (optional)
```bash
# Install cloudflared
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Run tunnel
pm2 start cloudflared --name "cloudflared" -- tunnel run --token YOUR_TOKEN
pm2 save
```

**Verify Deployment:**
```bash
pm2 list
curl http://localhost:3000/api/health
```

---

### Method 2: Docker (Alternative)

**Dockerfile:**
```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - SESSION_SECRET=${SESSION_SECRET}
      - NODE_ENV=production
    restart: unless-stopped

  cloudflared:
    image: cloudflare/cloudflared:latest
    command: tunnel run --token ${TUNNEL_TOKEN}
    restart: unless-stopped
```

**Deploy:**
```bash
docker-compose up -d
```

---

### Method 3: Vercel (Quick Deploy)

**Prerequisites:**
- Vercel account
- GitHub repository

**Steps:**

1. Push code to GitHub
2. Import repository in Vercel
3. Configure environment variables
4. Deploy

**Environment Variables in Vercel:**
```
DATABASE_URL=postgresql://...
SESSION_SECRET=...
NODE_ENV=production
```

---

## 🗄️ Database Setup

### Supabase (Recommended - Current)

**Advantages:**
- ✅ Free tier (500MB, 2GB bandwidth)
- ✅ Automatic backups (daily)
- ✅ Connection pooling
- ✅ Real-time monitoring
- ✅ Point-in-time recovery

**Setup:**

1. **Create Project**
   - Go to https://supabase.com
   - Create new project
   - Region: West EU (Ireland)

2. **Get Connection String**
   - Settings → Database
   - Copy "Session Pooler" connection string

3. **Update .env**
   ```env
   DATABASE_URL="postgresql://user:pass@db.xxx.supabase.co:5432/postgres"
   ```

4. **Run Migrations**
   ```bash
   npx prisma migrate deploy
   ```

5. **Seed Data** (optional)
   ```bash
   npm run seed
   ```

---

### Self-Hosted PostgreSQL (Alternative)

**Install PostgreSQL:**
```bash
sudo apt install postgresql postgresql-contrib
```

**Create Database:**
```bash
sudo -u postgres psql
CREATE DATABASE albassam;
CREATE USER albassam_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE albassam TO albassam_user;
\q
```

**Connection String:**
```env
DATABASE_URL="postgresql://albassam_user:secure_password@localhost:5432/albassam"
```

---

## 🔒 Security Configuration

### SSL/HTTPS

**With Cloudflare Tunnel (Recommended):**
- Automatic SSL
- DDoS protection
- No need to expose ports

**With Nginx:**
```nginx
server {
    listen 443 ssl http2;
    server_name app.albassam-app.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Firewall

```bash
# UFW (Uncomplicated Firewall)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### Environment Variables Security

**Never commit .env to git:**
```bash
# Add to .gitignore
.env
.env.local
.env.production
```

**Use secure secrets:**
```bash
# Generate secure SESSION_SECRET
openssl rand -base64 32
```

---

## 📊 Monitoring & Logging

### PM2 Monitoring

**View Logs:**
```bash
pm2 logs albassam
pm2 logs albassam --lines 100
pm2 logs albassam --err
```

**Monitor Status:**
```bash
pm2 status
pm2 monit
```

**View Metrics:**
```bash
pm2 show albassam
```

### Application Logs

**Winston Logs (Built-in):**
```
logs/
├── error-YYYY-MM-DD.log    (30 days retention)
├── combined-YYYY-MM-DD.log (14 days retention)
└── http-YYYY-MM-DD.log     (7 days retention)
```

**View Logs:**
```bash
tail -f logs/error-$(date +%Y-%m-%d).log
tail -f logs/combined-$(date +%Y-%m-%d).log
```

### Health Checks

**Internal Health Check:**
```bash
curl http://localhost:3000/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "database": true,
  "timestamp": "2026-02-24T15:00:00.000Z",
  "uptime": 12345
}
```

**Public Status:**
```bash
curl https://app.albassam-app.com/api/status
```

### UptimeRobot (Recommended)

**Setup:**
1. Create account at https://uptimerobot.com
2. Add monitor:
   - Type: HTTP(s)
   - URL: https://app.albassam-app.com/api/health
   - Interval: 5 minutes
   - Keyword: "ok"
3. Configure alerts (Email/Telegram)

**See:** `UPTIMEROBOT_SETUP.md` for details

---

## 🔄 Updates & Maintenance

### Application Updates

**Zero-Downtime Updates:**

1. **Pull Latest Code**
   ```bash
   git pull origin main
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Run Migrations**
   ```bash
   npx prisma migrate deploy
   ```

4. **Build**
   ```bash
   npm run build
   ```

5. **Reload PM2**
   ```bash
   pm2 reload albassam
   ```

**Note:** PM2 `reload` ensures zero downtime (graceful restart)

### Database Migrations

**Create Migration:**
```bash
npx prisma migrate dev --name migration_name
```

**Apply to Production:**
```bash
npx prisma migrate deploy
```

**Rollback** (if needed):
```bash
# Restore from backup
# See Backup section below
```

### Dependency Updates

**Check for updates:**
```bash
npm outdated
```

**Update packages:**
```bash
npm update
```

**Security audit:**
```bash
npm audit
npm audit fix
```

---

## 💾 Backup & Recovery

### Automatic Backups (Supabase)

**Current Setup:**
- ✅ Daily automatic backups (3:00 AM)
- ✅ 7-day retention
- ✅ Point-in-time recovery (last 7 days)

**Restore from Supabase:**
1. Go to Supabase Dashboard
2. Database → Backups
3. Select backup
4. Click "Restore"

### Manual Backup

**Database Backup:**
```bash
# Using pg_dump (if self-hosted)
pg_dump -U albassam_user -h localhost albassam > backup-$(date +%Y%m%d).sql

# Using Prisma
npx prisma db pull --output backup/schema-$(date +%Y%m%d).prisma
```

**Full Backup Script:**
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d)
BACKUP_DIR="/backups"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database (Supabase auto-handles this)
echo "Database auto-backed up by Supabase"

# Backup uploads
tar -czf $BACKUP_DIR/uploads-$DATE.tar.gz public/uploads

# Backup .env
cp .env $BACKUP_DIR/.env-$DATE

# Backup logs
tar -czf $BACKUP_DIR/logs-$DATE.tar.gz logs/

# Keep only last 30 days
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR"
```

**Schedule Backup (Cron):**
```bash
crontab -e
```

Add:
```cron
0 3 * * * /path/to/backup.sh >> /var/log/backup.log 2>&1
```

### Recovery

**Database Recovery:**
```bash
# From Supabase backup
# Use Supabase Dashboard (automatic)

# From manual backup (pg_dump)
psql -U albassam_user -h localhost albassam < backup-20260224.sql
```

**Application Recovery:**
```bash
# Restore uploads
tar -xzf uploads-20260224.tar.gz -C public/

# Restore logs
tar -xzf logs-20260224.tar.gz
```

---

## 🚨 Troubleshooting

### Application Won't Start

**Check PM2 Status:**
```bash
pm2 list
pm2 logs albassam --err
```

**Common Issues:**

1. **Port Already in Use:**
   ```bash
   lsof -i :3000
   kill -9 PID
   ```

2. **Database Connection Failed:**
   ```bash
   # Test connection
   psql $DATABASE_URL
   
   # Check .env
   cat .env | grep DATABASE_URL
   ```

3. **Build Errors:**
   ```bash
   # Clean and rebuild
   rm -rf .next
   npm run build
   ```

### High Memory Usage

**Check Memory:**
```bash
free -h
pm2 show albassam
```

**Restart Application:**
```bash
pm2 restart albassam
```

**Increase Memory Limit:**
```bash
pm2 delete albassam
pm2 start npm --name "albassam" --max-memory-restart 1G -- start
pm2 save
```

### Slow Performance

**Check:**
1. Database queries (check logs)
2. Network latency
3. Cache hit rate (see monitoring API)
4. CPU/Memory usage

**Optimize:**
```bash
# Clear cache
curl -X POST http://localhost:3000/api/cache/clear

# Restart
pm2 restart albassam
```

### Database Issues

**Check Connection:**
```bash
psql $DATABASE_URL -c "SELECT 1"
```

**Check Migrations:**
```bash
npx prisma migrate status
```

**Reset Database** (⚠️ DANGER - development only):
```bash
npx prisma migrate reset
```

---

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] Code reviewed and tested
- [ ] Tests passing (`npm test`)
- [ ] Build successful (`npm run build`)
- [ ] Environment variables configured
- [ ] Database migrations prepared
- [ ] Backup created

### Deployment
- [ ] Pull latest code
- [ ] Install dependencies
- [ ] Run migrations
- [ ] Build application
- [ ] Reload PM2
- [ ] Verify health check
- [ ] Check logs for errors

### Post-Deployment
- [ ] Test critical flows (login, CRUD)
- [ ] Monitor error logs (5 minutes)
- [ ] Check performance metrics
- [ ] Verify backups
- [ ] Update documentation
- [ ] Notify team

---

## 📞 Support

**DevOps Support:**
- Email: devops@albassam.com
- Emergency: [Phone Number]
- Slack: #devops-support

**Documentation:**
- System: `/docs/`
- API: `/docs/API.md`
- Architecture: `/docs/ARCHITECTURE.md`

---

**Last Updated:** February 24, 2026  
**Maintained by:** DevOps Team  
**Next Review:** March 2026
