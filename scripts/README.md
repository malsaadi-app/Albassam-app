# 🛠️ Deployment & Maintenance Scripts

## Available Scripts

### 1. `verify-build.sh`
**Purpose:** Verify that the production build is complete and valid

**Usage:**
```bash
./scripts/verify-build.sh
```

**Checks:**
- ✅ .next directory exists
- ✅ All required manifest files present
- ✅ Files are not empty/corrupted
- ✅ Standalone directory exists
- ✅ Build manifest contains pages

**Exit Codes:**
- `0` - Build is valid and complete
- `1` - Build is incomplete or invalid

---

### 2. `deploy-safe.sh`
**Purpose:** Complete safe deployment process with verification

**Usage:**
```bash
./scripts/deploy-safe.sh
```

**Steps:**
1. Clean old build artifacts
2. Build for production (NODE_ENV=production)
3. Verify build integrity
4. Test server startup
5. Deploy to PM2
6. Run health check
7. Save PM2 configuration

**Use this for:** All production deployments

---

### 3. `health-monitor.sh`
**Purpose:** Check application health and performance

**Usage:**
```bash
# One-time check
./scripts/health-monitor.sh

# Continuous monitoring (recommended)
watch -n 60 ./scripts/health-monitor.sh
```

**Monitors:**
- PM2 process status
- Restart count (alerts if >5)
- HTTP response (200 OK check)
- Memory usage
- CPU usage
- Response time

**Outputs:**
- `/tmp/albassam-health-alert.log` - Alerts log
- `/tmp/albassam-last-health-check.txt` - Last check timestamp

---

## Quick Reference

### Before Deployment
```bash
npm run type-check              # Check TypeScript
./scripts/verify-build.sh       # Verify build (after building)
```

### Deployment
```bash
./scripts/deploy-safe.sh        # Automated safe deployment
```

### After Deployment
```bash
./scripts/health-monitor.sh     # Check app health
pm2 logs albassam-app          # View logs
```

### Troubleshooting
```bash
pm2 list                        # Check process status
pm2 logs albassam-app --err    # View error logs
./scripts/verify-build.sh       # Verify build integrity
```

---

## Setting Up Automated Monitoring

Add to crontab for continuous monitoring:

```bash
# Edit crontab
crontab -e

# Add these lines:

# Health check every 5 minutes
*/5 * * * * cd /data/.openclaw/workspace/albassam-tasks && ./scripts/health-monitor.sh >> /tmp/health-monitor.log 2>&1

# Daily build verification at 2 AM
0 2 * * * cd /data/.openclaw/workspace/albassam-tasks && ./scripts/verify-build.sh >> /tmp/build-verify.log 2>&1
```

---

## Dependencies

All scripts require:
- `bash` shell
- `jq` (for JSON parsing) - Install: `apt-get install jq` or `brew install jq`
- `curl` (for HTTP checks)
- `pm2` (for process management)
- `node` & `npm` (for Next.js)

---

**Created:** 2026-03-11  
**Purpose:** Prevent production deployment failures
