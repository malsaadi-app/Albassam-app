# 🔧 دليل المدير - نظام إدارة مدارس الباسم

**الإصدار:** 1.0  
**التاريخ:** فبراير 2026  
**الجمهور:** مديرو النظام، فريق تقنية المعلومات

---

## 📑 جدول المحتويات

1. [نظرة عامة](#نظرة-عامة)
2. [البنية التحتية](#البنية-التحتية)
3. [التثبيت](#التثبيت)
4. [الإعدادات](#الإعدادات)
5. [إدارة المستخدمين](#إدارة-المستخدمين)
6. [النسخ الاحتياطي](#النسخ-الاحتياطي)
7. [المراقبة](#المراقبة)
8. [الأمان](#الأمان)
9. [استكشاف الأخطاء](#استكشاف-الأخطاء)
10. [الصيانة](#الصيانة)

---

## 🌐 نظرة عامة

### المواصفات التقنية

```yaml
النظام:
  الاسم: نظام إدارة مدارس الباسم
  الإصدار: 1.0
  التقنية: Next.js 15 + React 19 + PostgreSQL
  اللغة: TypeScript
  النشر: Cloudflare Tunnel + Hostinger VPS

الخادم:
  المزود: Hostinger
  المعالج: 4 cores
  الذاكرة: 8 GB RAM
  التخزين: 200 GB SSD
  الموقع: West Europe (Ireland)

قاعدة البيانات:
  النوع: PostgreSQL 15
  المزود: Supabase (Free tier)
  النسخ الاحتياطي: يومي تلقائي (7 أيام احتفاظ)
  الموقع: West EU (Ireland)

التخزين المؤقت:
  النوع: Upstash Redis
  الموقع: Europe (Ireland)
  الذاكرة: 256 MB
  الحد الأقصى: 10,000 commands/day

المراقبة:
  Logs: Winston (daily rotation)
  Uptime: UptimeRobot (recommended)
  Alerts: Telegram (configured)
```

### العناوين المهمة

- **Production URL:** https://app.albassam-app.com
- **Server IP:** 76.13.50.89 (srv1362897.hstgr.cloud)
- **Container ID:** 490d9c3678d8
- **Database:** Supabase Project `uvizfidyfhxwekqbtkma`
- **Redis:** Upstash `usable-manatee-39501`

---

## 🏗️ البنية التحتية

### المكونات

```
Internet
   ↓
Cloudflare Tunnel (1bf45762)
   ↓
Hostinger VPS (76.13.50.89)
   ↓
Docker Container (490d9c3678d8)
   ↓
PM2 Process Manager
   ├─ albassam (Next.js App)
   └─ cloudflared (Tunnel)
   ↓
┌──────────────────────┬──────────────────────┐
│                      │                      │
Supabase PostgreSQL   Upstash Redis          Files
(Database)            (Cache)                (/uploads)
```

### الاتصالات

**الخارجية:**
- `https://app.albassam-app.com` → Cloudflare Tunnel → Port 3000

**الداخلية:**
- Next.js App → PostgreSQL (Session Pooler)
- Next.js App → Redis (REST API)
- Next.js App → File System (/uploads)

---

## 💻 التثبيت

### المتطلبات

**على الخادم:**
```bash
# Node.js LTS
node --version  # v22.22.0+

# PM2
npm install -g pm2

# pnpm (optional)
npm install -g pnpm
```

### التثبيت من الصفر

```bash
# 1. Clone repository (إذا كان على Git)
git clone <repository-url>
cd albassam-tasks

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env
nano .env

# 4. Setup database
npx prisma generate
npx prisma migrate deploy
npx prisma db seed

# 5. Build production
npm run build

# 6. Start with PM2
pm2 start npm --name "albassam" -- start
pm2 save
pm2 startup
```

### متغيرات البيئة (.env)

```bash
# Database
DATABASE_URL="postgresql://postgres:[PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:5432/postgres"

# Redis Cache
UPSTASH_REDIS_REST_URL="https://usable-manatee-39501.upstash.io"
UPSTASH_REDIS_REST_TOKEN="[TOKEN]"

# Session
SESSION_SECRET="[GENERATE_RANDOM_32_CHARS]"

# App
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://app.albassam-app.com"

# Optional: Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="noreply@albassam-app.com"
SMTP_PASS="[APP_PASSWORD]"

# Optional: File Storage
MAX_FILE_SIZE="10485760"  # 10 MB
UPLOAD_DIR="./uploads"
```

---

## ⚙️ الإعدادات

### PM2 Configuration

**ملف ecosystem.config.js:**

```javascript
module.exports = {
  apps: [
    {
      name: 'albassam',
      script: 'npm',
      args: 'start',
      cwd: '/data/.openclaw/workspace/albassam-tasks',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'cloudflared',
      script: '/usr/local/bin/cloudflared',
      args: 'tunnel --no-autoupdate run --token [TOKEN]',
      autorestart: true,
      watch: false
    }
  ]
};
```

### Cloudflare Tunnel Setup

```bash
# 1. Install cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared
sudo chmod +x /usr/local/bin/cloudflared

# 2. Start tunnel with PM2
pm2 start cloudflared --name cloudflared -- tunnel --no-autoupdate run --token [TOKEN]
pm2 save
```

### Nginx Reverse Proxy (Optional)

إذا أردت استخدام Nginx أمام التطبيق:

```nginx
server {
    listen 80;
    server_name app.albassam-app.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 👤 إدارة المستخدمين

### إنشاء حساب admin

**من Console:**

```bash
# Connect to database
psql $DATABASE_URL

# Create admin user
INSERT INTO "User" (
  "username",
  "password",  -- bcrypt hashed
  "displayName",
  "role",
  "isActive",
  "createdAt",
  "updatedAt"
) VALUES (
  'admin',
  '$2b$10$[HASHED_PASSWORD]',  -- Use bcrypt to hash
  'مدير النظام',
  'ADMIN',
  true,
  NOW(),
  NOW()
);
```

**من UI:**

1. سجل دخول كـ admin
2. اذهب إلى "المستخدمون"
3. اضغط "إضافة مستخدم"
4. املأ البيانات:
   - اسم المستخدم
   - كلمة المرور
   - الاسم الكامل
   - الصلاحية: ADMIN
5. احفظ

### الصلاحيات

| الدور | الصلاحيات |
|------|-----------|
| **USER** | - عرض ملفه الشخصي<br>- تسجيل الحضور<br>- عرض مهامه<br>- تقديم طلبات |
| **HR** | صلاحيات USER +<br>- إدارة الموظفين<br>- مراجعة طلبات الإجازة<br>- عرض تقارير الحضور |
| **ADMIN** | صلاحيات HR +<br>- إدارة المستخدمين<br>- الصلاحيات<br>- إعدادات النظام<br>- جميع التقارير |

### إيقاف/تفعيل مستخدم

```sql
-- Disable user
UPDATE "User" SET "isActive" = false WHERE "username" = 'username';

-- Enable user
UPDATE "User" SET "isActive" = true WHERE "username" = 'username';
```

---

## 💾 النسخ الاحتياطي

### النسخ الاحتياطي التلقائي

**Supabase Backups:**
- يومياً تلقائياً
- احتفاظ: 7 أيام
- Point-in-time recovery متاح

**التحقق من النسخ:**
```bash
# List backups (Supabase Dashboard)
# https://supabase.com/dashboard/project/uvizfidyfhxwekqbtkma/database/backups
```

### النسخ الاحتياطي اليدوي

**Database Backup:**

```bash
# Full backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Compressed backup
pg_dump $DATABASE_URL | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Schema only
pg_dump $DATABASE_URL --schema-only > schema_$(date +%Y%m%d).sql
```

**Files Backup:**

```bash
# Backup uploads directory
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz ./uploads

# Backup to external storage
rsync -avz ./uploads/ user@backup-server:/backups/albassam/
```

**Full System Backup:**

```bash
#!/bin/bash
# backup-full.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/$DATE"

mkdir -p $BACKUP_DIR

# Database
pg_dump $DATABASE_URL | gzip > $BACKUP_DIR/database.sql.gz

# Files
tar -czf $BACKUP_DIR/uploads.tar.gz ./uploads
tar -czf $BACKUP_DIR/logs.tar.gz ./logs

# Config
cp .env $BACKUP_DIR/env.txt
cp ecosystem.config.js $BACKUP_DIR/

echo "Backup complete: $BACKUP_DIR"
```

### الاستعادة

**من Supabase:**
1. Dashboard → Database → Backups
2. اختر النسخة
3. Restore

**من ملف SQL:**

```bash
# Restore full backup
psql $DATABASE_URL < backup.sql

# Restore compressed
gunzip -c backup.sql.gz | psql $DATABASE_URL
```

---

## 📊 المراقبة

### PM2 Monitoring

```bash
# Real-time monitoring
pm2 monit

# Process list
pm2 list

# Logs
pm2 logs albassam --lines 100

# Restart count
pm2 info albassam
```

### Application Logs

**Log Files:**
```
logs/
├── error-2026-02-24.log    # Error logs (30 days)
├── combined-2026-02-24.log # All logs (14 days)
└── http-2026-02-24.log     # HTTP logs (7 days)
```

**View Logs:**
```bash
# Tail error log
tail -f logs/error-$(date +%Y-%m-%d).log

# Search for errors
grep "ERROR" logs/combined-*.log

# View HTTP requests
tail -f logs/http-$(date +%Y-%m-%d).log
```

### Health Checks

**Internal Health:**
```bash
curl http://localhost:3000/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "database": true,
  "timestamp": "2026-02-24T17:00:00.000Z",
  "uptime": 3631.488
}
```

**Public Status:**
```bash
curl https://app.albassam-app.com/api/status
```

### Performance Monitoring

**Access monitoring endpoint:**
```bash
curl http://localhost:3000/api/monitoring
```

**Metrics available:**
- HTTP requests (total, per endpoint)
- Response times (min, max, avg, p50, p95, p99)
- Cache hit rate
- Error rate
- Active users
- Database connections

### UptimeRobot Setup

1. Sign up at https://uptimerobot.com
2. Add Monitor:
   - Type: HTTPS
   - URL: https://app.albassam-app.com/api/status
   - Interval: 5 minutes
3. Alert Contacts:
   - Email: admin@albassam-app.com
   - Telegram: (optional)

---

## 🔒 الأمان

### Security Headers

**Configured Headers:**
```javascript
X-DNS-Prefetch-Control: off
X-Frame-Options: DENY
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'
```

### Rate Limiting

**Configured Limits:**
- Login: 5 attempts / 15 minutes / IP
- API: 100 requests / 15 minutes / IP
- File Upload: 10 uploads / hour / user

### SSL/TLS

**Certificate:**
- Managed by Cloudflare
- Auto-renewal
- Grade: A+

### Firewall Rules

**Recommended UFW rules:**
```bash
# Allow SSH
ufw allow 22/tcp

# Allow HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Allow only from Cloudflare IPs (optional)
# See: https://www.cloudflare.com/ips/

# Enable firewall
ufw enable
```

### Security Audits

**Run security audit:**
```bash
# npm vulnerabilities
npm audit

# High severity only
npm audit --audit-level=high

# Fix automatically
npm audit fix
```

**Check OWASP Top 10:**
- See: `OWASP_TOP_10_CHECKLIST.md`
- Current coverage: 80%

---

## 🔧 استكشاف الأخطاء

### التطبيق لا يعمل

**1. Check PM2:**
```bash
pm2 list
pm2 logs albassam --lines 50
```

**2. Check Port:**
```bash
netstat -tulpn | grep 3000
lsof -i :3000
```

**3. Check Database:**
```bash
curl http://localhost:3000/api/health
```

**4. Restart:**
```bash
pm2 restart albassam
```

### قاعدة البيانات بطيئة

**1. Check Connections:**
```sql
SELECT count(*) FROM pg_stat_activity;
```

**2. Check Long Queries:**
```sql
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active' AND now() - pg_stat_activity.query_start > interval '5 seconds';
```

**3. Kill Long Query:**
```sql
SELECT pg_terminate_backend(PID);
```

### Redis Cache Issues

**Check Connection:**
```bash
curl "https://usable-manatee-39501.upstash.io/ping" \
  -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN"
```

**Clear Cache:**
```bash
curl "https://usable-manatee-39501.upstash.io/flushdb" \
  -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN"
```

### مشاكل الملفات

**Check Disk Space:**
```bash
df -h
du -sh ./uploads
```

**Check Permissions:**
```bash
ls -la ./uploads
chmod -R 755 ./uploads
```

### خطأ 502 Bad Gateway

**Causes:**
1. التطبيق متوقف → `pm2 restart albassam`
2. Port مغلق → Check firewall
3. Cloudflare Tunnel down → `pm2 restart cloudflared`

### بطء التطبيق

**1. Check CPU/Memory:**
```bash
htop
pm2 monit
```

**2. Check Cache Hit Rate:**
```bash
curl http://localhost:3000/api/monitoring | grep cache
```

**3. Check Database:**
```sql
SELECT * FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;
```

---

## 🛠️ الصيانة

### تحديثات النظام

**Update Dependencies:**
```bash
npm update
npm outdated
npm audit fix
```

**Update Node.js:**
```bash
nvm install lts/*
nvm use lts/*
npm rebuild
```

**Update Database Schema:**
```bash
# Generate migration
npx prisma migrate dev --name update_description

# Deploy to production
npx prisma migrate deploy
```

### تنظيف الملفات

**Clear Old Logs:**
```bash
find ./logs -name "*.log" -mtime +30 -delete
```

**Clear Old Uploads:**
```bash
# Manual review recommended
find ./uploads -mtime +365 -ls
```

**Clear Cache:**
```bash
npm cache clean --force
rm -rf .next/cache
```

### Performance Optimization

**Analyze Bundle:**
```bash
npm run build
npm run analyze  # If configured
```

**Database Vacuum:**
```sql
VACUUM ANALYZE;
```

**Reindex:**
```sql
REINDEX DATABASE postgres;
```

### نقطة استعادة

**Create Restore Point:**
```bash
#!/bin/bash
# restore-point.sh

DATE=$(date +%Y%m%d_%H%M%S)
RESTORE_DIR="/restore-points/$DATE"

mkdir -p $RESTORE_DIR

# Backup everything
pg_dump $DATABASE_URL | gzip > $RESTORE_DIR/db.sql.gz
tar -czf $RESTORE_DIR/uploads.tar.gz ./uploads
tar -czf $RESTORE_DIR/code.tar.gz --exclude=node_modules --exclude=.next .

echo "Restore point created: $RESTORE_DIR"
```

---

## 📞 الدعم

### Escalation Path

**Level 1: Admin**
- مشاكل المستخدمين
- إعادة تعيين كلمات المرور
- الصلاحيات

**Level 2: DevOps**
- مشاكل الخادم
- قاعدة البيانات
- النشر

**Level 3: Developer**
- أخطاء برمجية
- تطوير ميزات جديدة
- تحسينات

### Contacts

- **Admin:** admin@albassam-app.com
- **DevOps:** devops@albassam-app.com  
- **Developer:** dev@albassam-app.com
- **Emergency:** 0500123456

---

## 📚 مراجع إضافية

- **OWASP Top 10:** `OWASP_TOP_10_CHECKLIST.md`
- **Security Audit:** `SECURITY_AUDIT.md`
- **Backup Guide:** `BACKUP_RESTORE_GUIDE.md`
- **Environment Variables:** `ENV_VARIABLES.md`
- **Launch Plan:** `LAUNCH_PLAN.md`
- **Testing Strategy:** `TESTING_STRATEGY.md`

---

**آخر تحديث:** فبراير 2026  
**الإصدار:** 1.0  
**المسؤول:** فريق تقنية المعلومات  

---

© 2026 مدارس الباسم - جميع الحقوق محفوظة
