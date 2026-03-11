# 🧪 Testing Guide - Albassam HR System

## Overview

Comprehensive testing suite to verify all system components, calculations, and integrations.

---

## 📋 Test Suites Available

### 1️⃣ **API Endpoints Test** (`scripts/test-apis.sh`)
**Purpose:** Verify all API endpoints are accessible and responding correctly

**Tests:**
- ✅ Authentication endpoints (session, health, status)
- ✅ Dashboard endpoints (stats, analytics)
- ✅ HR endpoints (employees, requests, leave balance)
- ✅ Payroll endpoints (runs, payslips)
- ✅ Attendance endpoints (records, corrections, history)
- ✅ Workflow endpoints (approvals, workflows)
- ✅ Procurement, Maintenance, Finance endpoints
- ✅ Inventory, Branches, Tasks, Notifications

**Total Endpoints Tested:** 50+

**Usage:**
```bash
./scripts/test-apis.sh
```

---

### 2️⃣ **Database Integrity Test** (`scripts/test-database.js`)
**Purpose:** Verify database schema, relationships, and data consistency

**Tests:**
- ✅ Model counts (users, employees, branches, etc.)
- ✅ Relationship integrity (employee→user, user→role, etc.)
- ✅ Data consistency (no duplicate employee numbers, valid emails)
- ✅ Attendance data validity (work hours < 24, etc.)
- ✅ Payroll calculation consistency
- ✅ Workflow integrity (published workflows, pending approvals)
- ✅ Database performance (query speed tests)

**Usage:**
```bash
node scripts/test-database.js
```

---

### 3️⃣ **Payroll System Test** (`scripts/test-payroll.js`)
**Purpose:** Comprehensive payroll calculation and workflow integration testing

**Tests:**
- ✅ Payroll calculation engine accuracy
- ✅ Total salary = basic + allowances + additions - deductions
- ✅ Payroll run generation (create runs with employee lines)
- ✅ Attendance deduction integration
- ✅ Recurring deduction items
- ✅ Payroll history retrieval
- ✅ Run locking mechanism (DRAFT vs LOCKED status)

**Usage:**
```bash
node scripts/test-payroll.js
```

---

### 4️⃣ **Workflows & Requests Test** (`scripts/test-workflows.js`)
**Purpose:** Comprehensive testing of all request types and complete workflow cycles

**Tests:**
- ✅ HR requests (all types, status distribution, workflow integration)
- ✅ Attendance corrections (excuse/permission/correction types)
- ✅ Procurement requests (status, workflow links)
- ✅ Maintenance requests (status, workflow integration)
- ✅ Finance requests (status, workflow integration)
- ✅ Workflow definitions (published status, steps configuration)
- ✅ Runtime approvals (status distribution, escalation, approval times)
- ✅ Complete workflow cycle (submission → approval/rejection)
- ✅ Cross-system integration (Attendance→Workflow→Payroll)
- ✅ Approver assignment validation
- ✅ Stale approval detection (>30 days)

**Coverage:**
- 5 request types fully tested
- Workflow cycle validation
- Integration testing across systems
- Performance metrics (approval times)

**Usage:**
```bash
node scripts/test-workflows.js
```

---

### 5️⃣ **Build Verification Test** (`scripts/verify-build.sh`)
**Purpose:** Ensure production build is complete and valid

**Tests:**
- ✅ .next directory exists
- ✅ All required manifest files present
- ✅ Files are not empty/corrupted
- ✅ Standalone directory exists
- ✅ Build manifest contains pages

**Usage:**
```bash
./scripts/verify-build.sh
```

---

### 6️⃣ **Master Test Runner** (`scripts/run-all-tests.sh`)
**Purpose:** Execute all test suites in sequence with comprehensive reporting

**Features:**
- ✅ Runs all 6 test suites sequentially
- ✅ Interactive (press Enter between suites)
- ✅ Generates timestamped log file
- ✅ Success rate calculation
- ✅ Colored output for easy reading
- ✅ Final comprehensive report

**Usage:**
```bash
./scripts/run-all-tests.sh
```

---

## 🚀 Quick Start

### Run All Tests (Recommended)
```bash
cd /data/.openclaw/workspace/albassam-tasks
./scripts/run-all-tests.sh
```

### Run Individual Suite
```bash
# API tests only
./scripts/test-apis.sh

# Database tests only
node scripts/test-database.js

# Payroll tests only
node scripts/test-payroll.js

# Workflows & requests tests only
node scripts/test-workflows.js

# Build verification only
./scripts/verify-build.sh
```

---

## 📊 Understanding Test Results

### Test Status Indicators

- **✅ PASSED (Green)** - Test passed successfully
- **❌ FAILED (Red)** - Critical test failure, requires fixing
- **⚠️  WARNING (Yellow)** - Non-critical issue, may need attention
- **ℹ️  INFO (Blue)** - Informational output

### Exit Codes

- `0` - All tests passed
- `1` - One or more tests failed

---

## 🔍 Test Categories

### Critical Tests (Must Pass)
- ✅ API health check (system is online)
- ✅ Database connectivity
- ✅ User authentication
- ✅ Payroll calculations
- ✅ Build integrity

### Important Tests (Should Pass)
- ✅ All API endpoints responding
- ✅ Data relationships intact
- ✅ Workflow system functional
- ✅ Deduction integration working

### Warning Tests (Nice to Have)
- ✅ All tables populated
- ✅ No escalated approvals
- ✅ Query performance optimal

---

## 📝 Test Logs

All test runs generate timestamped log files:
```
/tmp/albassam-test-results-YYYYMMDD-HHMMSS.log
```

### Viewing Logs
```bash
# View latest log
ls -lt /tmp/albassam-test-results-* | head -1 | awk '{print $9}' | xargs cat

# Search for failures
grep -i "failed" /tmp/albassam-test-results-*.log
```

---

## 🛠️ Troubleshooting

### Common Issues

#### 1. "App may be offline"
**Solution:** Ensure the app is running
```bash
pm2 list
pm2 restart albassam-app
```

#### 2. "Database connection failed"
**Solution:** Check Prisma connection
```bash
cd /data/.openclaw/workspace/albassam-tasks
npx prisma db pull
```

#### 3. "Build verification failed"
**Solution:** Rebuild the app
```bash
rm -rf .next
NODE_ENV=production npm run build
```

#### 4. "Payroll calculation error"
**Solution:** Check lib/payroll.ts for any recent changes
```bash
git diff lib/payroll.ts
```

---

## 📈 Success Criteria

### Production Ready Checklist

- [ ] API test suite: 100% passed
- [ ] Database tests: 0 failures, < 5 warnings
- [ ] Payroll tests: All calculations correct
- [ ] Build verification: Complete build present
- [ ] Overall success rate: ≥ 95%

### Deployment Approval

System is approved for deployment when:
1. ✅ All critical tests pass
2. ✅ No failed tests in payroll suite
3. ✅ Database integrity verified
4. ✅ API health check successful
5. ✅ Success rate ≥ 95%

---

## 🔄 Test Maintenance

### When to Run Tests

**Before Every Deployment:**
```bash
./scripts/run-all-tests.sh
```

**After Code Changes:**
```bash
# If changed payroll code
node scripts/test-payroll.js

# If changed API routes
./scripts/test-apis.sh

# If changed database models
node scripts/test-database.js
```

**Daily Health Check:**
```bash
curl http://localhost:3000/api/health
./scripts/health-monitor.sh
```

### Updating Tests

When adding new features:
1. Add corresponding test cases
2. Update test expectations
3. Document new tests in this file
4. Run full suite to verify no regressions

---

## 📞 Support

### Test Failures

1. **Review the log file** - Check `/tmp/albassam-test-results-*.log`
2. **Run individual suite** - Isolate the failing test
3. **Check recent changes** - `git log --oneline -10`
4. **Verify environment** - `pm2 list`, `npm run type-check`
5. **Rebuild if needed** - `./scripts/deploy-safe.sh`

### Performance Issues

If tests are slow:
```bash
# Check database performance
node scripts/test-database.js

# Check API response times
time curl -I http://localhost:3000/api/dashboard
```

---

## 📚 Additional Resources

- **Deployment Guide:** See `DEPLOYMENT.md`
- **Health Monitoring:** See `scripts/health-monitor.sh`
- **Build Verification:** See `scripts/verify-build.sh`
- **API Documentation:** See `/api` routes

---

## 🎯 Testing Best Practices

1. **Always test before deployment**
2. **Run full suite, not just individual tests**
3. **Review all warnings, not just failures**
4. **Keep test logs for debugging**
5. **Update tests when adding features**
6. **Test in production-like environment**
7. **Verify rollback procedures**

---

**Created:** 2026-03-11
**Purpose:** Ensure system reliability and quality
**Maintainer:** Development Team

---

**Remember:** A passing test suite means the system is ready. A failing test suite means we caught issues before users did! 🎯
