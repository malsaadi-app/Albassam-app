# 🚀 Deployment Guide - Albassam HR System

## ⚠️ CRITICAL: Preventing Production Failures

This guide was created after resolving a critical production incident (502 Bad Gateway, 1300+ crash loops).

---

## 📋 Pre-Deployment Checklist

Before deploying to production, **ALWAYS** complete these checks:

### 1. Code Quality
- [ ] All TypeScript errors fixed (`npm run type-check`)
- [ ] All ESLint warnings reviewed
- [ ] No console.log statements in production code
- [ ] All tests passing (when implemented)

### 2. Build Verification
- [ ] Clean build artifacts: `rm -rf .next .turbo node_modules/.cache`
- [ ] Production build succeeds: `NODE_ENV=production npm run build`
- [ ] Verify build script passes: `./scripts/verify-build.sh`
- [ ] All required manifest files present (routes, prerender, etc.)

### 3. Configuration Check
- [ ] `output: 'standalone'` is set in next.config.ts
- [ ] Environment variables are set (.env.local for production)
- [ ] Database connection string is correct
- [ ] All API keys and secrets are configured

### 4. Local Testing
- [ ] App starts successfully: `npm start`
- [ ] Homepage loads (http://localhost:3000)
- [ ] Login functionality works
- [ ] Critical pages load without errors
- [ ] No console errors in browser

---

## 🛡️ Safe Deployment Process

### Option 1: Automated Safe Deployment (Recommended)

```bash
cd /data/.openclaw/workspace/albassam-tasks
./scripts/deploy-safe.sh
```

This script will:
1. Clean old build artifacts
2. Build for production
3. Verify build integrity
4. Test server startup
5. Deploy to PM2
6. Run health checks
7. Save PM2 configuration

### Option 2: Manual Deployment

```bash
# 1. Clean
rm -rf .next .turbo node_modules/.cache

# 2. Build
NODE_ENV=production npm run build

# 3. Verify
./scripts/verify-build.sh

# 4. Deploy to PM2
pm2 delete albassam-app || true
pm2 start node_modules/.bin/next --name albassam-app -- start -p 3000

# 5. Health check
sleep 5
curl -I http://localhost:3000

# 6. Save config
pm2 save
```

---

## 🔍 Post-Deployment Verification

After deployment, verify these points:

```bash
# Check PM2 status
pm2 list

# Verify no crash loops (restart count should be stable)
pm2 show albassam-app

# Check HTTP response
curl -I http://localhost:3000

# Monitor logs for errors
pm2 logs albassam-app --lines 50

# Run health monitor
./scripts/health-monitor.sh
```

---

## 🚨 Incident Response - If App Crashes

### Quick Diagnosis

```bash
# 1. Check PM2 status
pm2 list

# 2. View error logs
pm2 logs albassam-app --err --lines 100

# 3. Check build integrity
./scripts/verify-build.sh
```

### Common Issues & Solutions

#### Issue: "Could not find a production build"
**Cause:** Incomplete or missing build artifacts  
**Solution:**
```bash
cd /data/.openclaw/workspace/albassam-tasks
rm -rf .next
NODE_ENV=production npm run build
./scripts/verify-build.sh
pm2 restart albassam-app
```

#### Issue: Crash Loop (High Restart Count)
**Cause:** Runtime errors, missing dependencies, or config issues  
**Solution:**
```bash
# View detailed error logs
pm2 logs albassam-app --err --lines 200

# Check for TypeScript errors
npm run type-check

# Rebuild from scratch
./scripts/deploy-safe.sh
```

#### Issue: HTTP 502/503 Errors
**Cause:** App not responding or crashed  
**Solution:**
```bash
# Stop the app
pm2 stop albassam-app

# Clean rebuild
rm -rf .next
NODE_ENV=production npm run build

# Restart
pm2 restart albassam-app

# Verify
curl -I http://localhost:3000
```

---

## 📊 Monitoring & Health Checks

### Automated Health Monitoring

Run the health monitor script periodically:

```bash
# Manual check
./scripts/health-monitor.sh

# Add to cron (every 5 minutes)
crontab -e
# Add line:
# */5 * * * * cd /data/.openclaw/workspace/albassam-tasks && ./scripts/health-monitor.sh >> /tmp/health-monitor.log 2>&1
```

### Key Metrics to Monitor

1. **PM2 Status** - Should always be "online"
2. **Restart Count** - Should be stable (not increasing rapidly)
3. **Memory Usage** - Normal range: 300-500MB
4. **CPU Usage** - Normal range: 0-10% idle, <50% under load
5. **HTTP Response** - Should return 200 OK
6. **Response Time** - Should be <1s for homepage

---

## 🔧 Configuration Reference

### Required next.config.ts Settings

```typescript
const nextConfig: NextConfig = {
  // CRITICAL: Enables standalone production builds
  output: 'standalone',
  
  // Fix workspace root detection
  outputFileTracingRoot: path.join(__dirname),
  
  // Other settings...
}
```

### Required Files After Build

- `.next/routes-manifest.json` (>50KB)
- `.next/prerender-manifest.json` (>50KB)
- `.next/build-manifest.json` (>1KB)
- `.next/app-build-manifest.json` (>100KB)
- `.next/required-server-files.json` (>5KB)
- `.next/standalone/` directory

---

## 📚 Best Practices

### Before Every Deployment

1. ✅ Run `npm run type-check` - catch type errors early
2. ✅ Run `./scripts/verify-build.sh` - verify build integrity
3. ✅ Test locally with `npm start` - ensure app starts
4. ✅ Review recent changes - understand what changed
5. ✅ Have rollback plan ready - be prepared to revert

### During Deployment

1. ✅ Use the safe deployment script
2. ✅ Monitor PM2 logs in real-time
3. ✅ Run health checks immediately after
4. ✅ Test critical user journeys (login, dashboard, etc.)
5. ✅ Keep old build as backup

### After Deployment

1. ✅ Monitor for 10-15 minutes
2. ✅ Check error logs every 5 minutes
3. ✅ Verify restart count is stable
4. ✅ Test from external network (not just localhost)
5. ✅ Document any issues encountered

---

## 🆘 Emergency Rollback

If critical issues occur after deployment:

```bash
# 1. Stop current app
pm2 stop albassam-app

# 2. Restore from Git (if changes were committed)
git log --oneline -5  # Find last good commit
git checkout <commit-hash>

# 3. Rebuild
NODE_ENV=production npm run build

# 4. Restart
pm2 restart albassam-app

# 5. Verify
curl -I http://localhost:3000
```

---

## 📞 Support Contacts

**Technical Issues:**
- Check logs: `pm2 logs albassam-app`
- Review this guide
- Check Git commit history: `git log`

**Critical Production Outage:**
1. Follow incident response steps above
2. Run health monitor: `./scripts/health-monitor.sh`
3. Review deployment checklist
4. Consider emergency rollback

---

## 📝 Change Log

### 2026-03-11 - Initial Version
- Created after resolving critical 502 Bad Gateway incident
- Added standalone mode configuration
- Created deployment automation scripts
- Established monitoring procedures

---

**Remember:** Prevention is better than cure. Always follow the checklist! ✅
