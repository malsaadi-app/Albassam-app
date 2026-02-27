# Overnight report — Albassam system (Pilot setup)

Date: 2026-02-27

## What you asked for
- Start with 3 branches (~20 users), then roll out to all branches.
- Attendance (GPS geofence 50m) + late/absence tracking + justification requests.
- HR request workflows + procurement workflows + payroll.
- Do it “properly from the start” (not a quick hack) and be ready for launch/testing.

---

## ✅ Work completed

### 1) Permanent data model support for per-employee morning grace
- Added field: `Employee.morningGraceMinutes` (nullable)
- Applied DB change with SQL (because existing Prisma migrations include SQLite `PRAGMA` and break shadow-db migration validation).

**Why SQL?**
`prisma migrate dev` fails on this repo due to older migration scripts that are not cleanly re-playable on Postgres shadow DB. So we applied a safe `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` and then regenerated Prisma Client.

### 2) Attendance logic updated (production-grade)
Updated `app/api/attendance/route.ts`:
- Work start time for late calculation now uses priority:
  1) Stage override
  2) Branch schedule
  3) Global AttendanceSettings fallback
- Morning grace for lateness now uses:
  - `employee.morningGraceMinutes` if set
  - otherwise global `AttendanceSettings.lateThresholdMinutes`
- Geofencing remains enforced (already implemented) using:
  - Stage geofence first, then Branch geofence, then global settings.

### 3) Payroll deduction calculation updated
Updated `app/api/hr/payroll/calculate-deductions/route.ts`:
- Uses expected start/end times per employee:
  - Stage override > Branch schedule > Global AttendanceSettings
- Uses branch `workDays` to skip non-working days.
- Uses per-employee `morningGraceMinutes` for **late check-in only** (as requested).
- Early-leave uses the global threshold (no exception requested for checkout).

### 4) Pilot branches configured (GPS + radius + schedule)
Branches updated:
- شركة الصفر التجارية
  - lat 26.367333, lng 50.125361
  - geofenceRadius = 50m
  - schedule 07:00–16:00
- مجمع البسام الأهلية بنين
  - lat 26.474528, lng 50.127861
  - geofenceRadius = 50m
  - schedule 07:00–14:00
- مجمع البسام الأهلية بنات
  - lat 26.463694, lng 50.117833
  - geofenceRadius = 50m
  - schedule 07:00–14:00

Work days: Sun–Thu (`0,1,2,3,4`).

### 5) Pilot users created + linked to branches
A setup script was added and run:
- Script: `scripts/setup-pilot.js`
- Default pilot password (temporary): **Test1234**

Users ensured:
- HR manager:
  - `Mohammedhr` (role: HR_EMPLOYEE)
- Branch managers:
  - `mohammedtj` (branch: الصفر)
  - `khalidj` (branch: بنين)
  - `hinds` (branch: بنات)
- Procurement:
  - `abdullahsh` (procurement officer)
  - `mq` (procurement manager)
- 60-min grace users:
  - `abdulrahman` (الصفر) — morningGraceMinutes=60
  - `ibrahim` (بنين) — morningGraceMinutes=60
  - `asma` (بنات) — morningGraceMinutes=60
- Regular employees:
  - `User1zero`, `User2zero`
  - `User1boys`, `User2boys`
  - `User1girls`, `User2girls`

Notes:
- For pilot accounts, minimal Employee records were created with dummy HR fields to satisfy required schema constraints (nationalId, employeeNumber, etc). Before production, these should be replaced with real employee data.

### 6) Build + restart
- `npm run build` completed successfully.
- PM2 `albassam-app` restarted (using the correct PM2_HOME).

---

## ⚠️ Important security notes

### Cloudflare tunnel token
A Cloudflare tunnel token was previously present in `ecosystem.config.js` and was exposed in chat earlier.
Action required:
- Refresh/rotate token in Cloudflare Zero Trust.
- Move token into `.env` and reference via `process.env.CLOUDFLARED_TOKEN` (do NOT hardcode it in code).

### Upstash Redis
Build logs show:
- `Redis ping failed … WRONGPASS invalid or missing auth token`
So cache is currently falling back to memory cache.
Action required:
- Verify `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (or whichever variables used) in `.env`.

---

## How to test (Pilot acceptance)

### Attendance (GPS + geofence)
For each pilot branch user:
1) Login
2) Go to Attendance
3) Try check-in **inside** branch location → should succeed
4) Try check-in **outside** branch location → should fail with distance/maxDistance
5) Verify late status after grace:
   - Default users: late after 15 minutes
   - Exception users: late after 60 minutes

### Payroll deduction calculation
Use HR manager:
- Go to Payroll module → calculate deductions for a month
- Confirm late minutes are computed after grace.

---

## What’s next
1) Implement HR request types & workflows exactly as specified (Leave, Visa, Salary definition, Housing/Tickets, Resignation).
2) Procurement workflows: ensure steps and approvals (abdullahsh → mq) with branch-aware rules.
3) Launch readiness:
   - Replace temporary passwords
   - Remove hardcoded secrets
   - Fix Upstash tokens
   - Backups + restore drill
   - Monitoring/alerts
