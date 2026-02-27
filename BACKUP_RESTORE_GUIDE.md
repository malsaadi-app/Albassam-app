# 📦 Backup & Restore Guide - Albassam Schools App

**Last Updated:** February 24, 2026  
**Database:** PostgreSQL (Supabase)  
**Status:** ✅ Automated backups enabled

---

## 🎯 Overview

Albassam Schools App uses **Supabase PostgreSQL** with automatic backup system.

### Backup Strategy

**Automatic (Supabase-managed):**
- ✅ Daily automatic backups
- ✅ 7-day retention (Free tier)
- ✅ Point-in-time recovery (PITR)
- ✅ Managed by Supabase infrastructure

**Manual (Optional):**
- 📋 Backup metadata tracking
- 📋 On-demand backups via dashboard

---

## 📊 Backup Schedule

### Automatic Backups (Supabase)
- **Frequency:** Daily
- **Time:** Managed by Supabase (typically at night UTC)
- **Retention:** 7 days (Free tier)
- **Storage:** Supabase S3 buckets
- **Access:** Via Supabase Dashboard

### Metadata Tracking (Our System)
- **Frequency:** Daily at 3:00 AM (Europe/Paris)
- **Script:** `scripts/backup-supabase.js`
- **Cron Job:** `albassam:daily-backup`
- **Purpose:** Track backup status & metadata

---

## 🔍 Check Backup Status

### Via Supabase Dashboard

1. Go to: https://supabase.com/dashboard
2. Select project: `uvizfidyfhxwekqbtkma`
3. Navigate to: **Database → Backups**
4. View:
   - Last backup time
   - Backup size
   - Retention policy
   - Download link

### Via Command Line

```bash
cd /data/.openclaw/workspace/albassam-tasks
node scripts/backup-supabase.js
```

This will:
- Check Supabase backup status
- Create metadata file
- Log backup information

### Check Metadata Files

```bash
ls -lh backups/backup_metadata_*.json | tail -5
cat backups/backup_metadata_<date>.json
```

---

## 💾 Manual Backup (On-Demand)

### Method 1: Supabase Dashboard (Recommended)

1. Go to Supabase Dashboard → Database → Backups
2. Click "Create Backup"
3. Wait for completion (~2-5 minutes)
4. Download if needed

### Method 2: Local Backup via pg_dump

**Prerequisites:**
- PostgreSQL client installed
- Database credentials from `.env`

```bash
# Extract DATABASE_URL from .env
export DATABASE_URL="postgresql://..."

# Run pg_dump (if available)
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Compress
gzip backup_$(date +%Y%m%d).sql
```

**Note:** pg_dump not available in container. Use Supabase dashboard instead.

### Method 3: Export via Prisma

```bash
cd /data/.openclaw/workspace/albassam-tasks

# Export schema
npx prisma db pull

# Generate migration
npx prisma migrate dev --create-only --name backup_$(date +%Y%m%d)
```

---

## 🔄 Restore Procedure

### Scenario 1: Recent Data Loss (< 7 days)

**Use Supabase Point-in-Time Recovery (PITR)**

1. Go to Supabase Dashboard → Database → Backups
2. Click "Restore" next to desired backup
3. Select restore point (date & time)
4. Confirm restore operation
5. Wait for completion (~5-10 minutes)
6. Verify data integrity

**⚠️ Warning:** This will restore the ENTIRE database to that point in time. All changes after that point will be lost.

---

### Scenario 2: Complete Database Restore

**From Supabase Backup:**

1. **Stop Application:**
   ```bash
   cd /data/.openclaw/workspace/albassam-tasks
   /skeleton/.npm-global/bin/pm2 stop albassam
   ```

2. **Restore via Supabase Dashboard:**
   - Go to: Database → Backups
   - Select backup
   - Click "Restore"
   - Confirm

3. **Verify Database:**
   ```bash
   npx prisma db pull
   npx prisma generate
   ```

4. **Test Connection:**
   ```bash
   node scripts/backup-supabase.js
   ```

5. **Restart Application:**
   ```bash
   /skeleton/.npm-global/bin/pm2 restart albassam
   ```

6. **Verify Application:**
   - Login: https://app.albassam-app.com
   - Check data integrity
   - Test critical features

---

### Scenario 3: Restore from Local Backup (pg_dump)

**If you have a local SQL backup:**

```bash
# Extract backup
gunzip backup_YYYYMMDD.sql.gz

# Restore (requires psql)
psql $DATABASE_URL < backup_YYYYMMDD.sql

# Or via Supabase SQL Editor:
# 1. Go to Supabase Dashboard → SQL Editor
# 2. Paste SQL content
# 3. Run query
```

**⚠️ Warning:** This method requires PostgreSQL client and may not work in all environments.

---

## 🧪 Test Restore (Dry Run)

**Recommended:** Test restore procedure quarterly

1. **Create Test Database:**
   - Supabase Dashboard → Create New Project
   - Name: `albassam-test`

2. **Restore to Test Database:**
   - Follow restore procedure above
   - Use test database URL

3. **Verify Data:**
   - Connect application to test database
   - Check all features
   - Verify data integrity

4. **Document Results:**
   - Record any issues
   - Update this guide if needed

5. **Cleanup:**
   - Delete test project
   - Switch back to production

---

## 📋 Backup Verification Checklist

Run this checklist monthly:

- [ ] Check Supabase backup status (last 7 days)
- [ ] Verify backup metadata files exist
- [ ] Check backup sizes (should be consistent)
- [ ] Review backup logs for errors
- [ ] Test restore on test database (quarterly)
- [ ] Update documentation if procedures change

---

## 🚨 Emergency Recovery

### Database Corrupted or Unavailable

**Step 1: Assess Situation**
```bash
# Check database connection
npx prisma db pull

# Check Supabase status
# Visit: https://status.supabase.com
```

**Step 2: Contact Supabase Support**
- Email: support@supabase.com
- Dashboard: Submit ticket
- Discord: Supabase community

**Step 3: Restore from Backup**
- Follow "Scenario 2: Complete Database Restore" above

**Step 4: Notify Users**
- Update status page
- Send email/notification
- Estimate recovery time

**Step 5: Post-Recovery**
- Verify all data
- Check application logs
- Document incident
- Implement preventive measures

---

## 📞 Emergency Contacts

### Technical
- **Developer:** محمد (Mohammed)
- **Hosting:** Hostinger Support
- **Database:** Supabase Support

### Database Credentials
- **Location:** `/data/.openclaw/workspace/albassam-tasks/.env`
- **Variable:** `DATABASE_URL`
- **Access:** Restricted (production)

---

## 🔒 Backup Security

### Current Security Measures
- ✅ Database credentials encrypted in `.env`
- ✅ Supabase backups encrypted at rest
- ✅ Backups stored in secure S3 buckets
- ✅ Access controlled via Supabase dashboard
- ✅ Metadata files have restricted permissions

### Best Practices
1. **Never commit `.env` to git**
2. **Rotate database passwords quarterly**
3. **Use strong Supabase passwords**
4. **Enable 2FA on Supabase account**
5. **Regularly audit access logs**
6. **Test restore procedure quarterly**

---

## 📈 Monitoring

### What to Monitor
- Daily backup completion
- Backup file sizes (trend analysis)
- Supabase backup dashboard
- Application logs during backup time
- Disk space on Supabase

### Alerts
- ⚠️ Backup failure (critical)
- ⚠️ Backup size anomaly (warning)
- ⚠️ Disk space low (warning)
- ⚠️ Connection errors during backup (warning)

---

## 🔄 Backup Retention Policy

### Supabase Automatic Backups
- **Daily:** Last 7 days (Free tier)
- **Weekly:** Not available on Free tier
- **Monthly:** Not available on Free tier

### Metadata Files (Our System)
- **Retention:** Last 30 metadata files
- **Cleanup:** Automatic via cron job
- **Location:** `backups/backup_metadata_*.json`

### Upgrade Options (Future)
If more retention is needed:
- **Supabase Pro:** 14-day retention + PITR
- **Supabase Team:** 30-day retention + PITR
- **Manual Archives:** Export monthly to external storage

---

## 🛠️ Troubleshooting

### Backup Script Fails

**Error:** "pg_dump not found"
**Solution:** Use Supabase dashboard for backups (pg_dump not available in container)

**Error:** "DATABASE_URL not found"
**Solution:** Check `.env` file exists and contains `DATABASE_URL`

**Error:** "Permission denied"
**Solution:** 
```bash
chmod +x scripts/backup-supabase.js
chmod 600 .env
```

### Restore Fails

**Error:** "Connection refused"
**Solution:** 
- Check Supabase status
- Verify DATABASE_URL is correct
- Check network connectivity

**Error:** "Database already exists"
**Solution:** Use `DROP DATABASE` first (⚠️ destructive!)

**Error:** "Schema mismatch"
**Solution:**
```bash
npx prisma migrate reset
npx prisma migrate deploy
npx prisma generate
```

---

## 📚 Additional Resources

- [Supabase Backup Documentation](https://supabase.com/docs/guides/platform/backups)
- [PostgreSQL Backup Best Practices](https://www.postgresql.org/docs/current/backup.html)
- [Prisma Migrate Guide](https://www.prisma.io/docs/concepts/components/prisma-migrate)

---

**Document Version:** 1.0  
**Last Tested:** February 24, 2026  
**Next Review:** May 24, 2026 (3 months)
