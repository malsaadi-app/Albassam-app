# Albassam Platform — System Map (High-level)

> الهدف: مرجع سريع يخلّيك/يخليني نتحرك داخل المشروع بسرعة بدون ما نضيع: (وين الصفحة؟ وين الـ API؟ وين الصلاحيات؟ وين قاعدة البيانات؟ وين اللوق؟).

**Production URL:** https://app.albassam-app.com  
**Health:** `/api/health`  
**Repo folder (inside container):** `/data/.openclaw/workspace/albassam-tasks`

---

## 0) Runtime / Infra map

**Client (Browser)** → **Cloudflare Tunnel** → **VPS (Hostinger)** → **PM2** → **Next.js app (port 3000)** → **Supabase Postgres** (+ optional **Upstash Redis**)

### Processes (PM2)
- `albassam-app`: runs `npm start` (Next.js) on port `3000` (cluster mode, instances=1)
- `cloudflared`: Cloudflare tunnel (`tunnel run --token $CLOUDFLARED_TOKEN`)

Config: `ecosystem.config.js`

### Edge / reverse proxy
- Cloudflare tunnel ingress: `cloudflared-config.yml`
- Caddy reverse proxy config exists: `Caddyfile` (reverse_proxy → localhost:3000)

### Backups
Folder: `backups/`
- **Code snapshots:** `albassam-tasks_<timestamp>.tar.gz`
- **DB dumps (Supabase):** `supabase_<timestamp>.dump`

Runbook: `RUNBOOK.md` + `BACKUP_RESTORE_GUIDE.md`

---

## 1) Tech stack
- Next.js **15** (App Router) + React **19** + TypeScript
- Prisma **6** (ORM)
- Database: **PostgreSQL** (Supabase)
- Sessions: **iron-session** (cookie-based)
- Validation: Zod (in `/lib/validations/*`)
- Logs: winston (see `/lib/logger.ts` + `logs/` folder)
- Cache: memory + Upstash Redis (see `/lib/cache*.ts`)

---

## 2) Project structure (what to open first)

### UI (pages)
- `app/**/page.tsx`

### Backend (API routes)
- `app/api/**/route.ts`

### Shared logic
- `lib/` (auth, permissions, cache, workflows, routing, etc.)

### DB schema / migrations
- `prisma/schema.prisma`
- `prisma/migrations/`

---

## 3) Authentication & Session

### Session cookie
- Cookie name: `albassam_tasks_session`
- TTL/maxAge: 7 days
- Secret env var: `SESSION_PASSWORD` (must exist, 32+ chars)

Source: `lib/session.ts`

### Auth helper functions
- `requireAuth(cookies)`
- `requireAdmin(cookies)`
- `requireHR(cookies)`

Source: `lib/auth.ts`

### Auth API
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/impersonate` (admin)
- `POST /api/auth/revert-impersonation`

---

## 4) Authorization (RBAC)

يوجد نظامين متعايشين:

### A) Legacy role (سريع/بسيط)
حقل `User.role` (enum `Role`) مستخدم في `lib/auth.ts` (ADMIN / HR_EMPLOYEE / USER).

### B) RBAC الجديد (SystemRole + Permissions)
- `User.roleId` → relation `systemRole`
- `systemRole.permissions[]` → permission names like: `hr.employees.read` … إلخ

Helper:
- `lib/permissions.ts` provides cached permission checks:
  - `hasPermission(userId, perm)`
  - `requirePermission(userId, perm)`
  - `hasModuleAccess(userId, modulePrefix)`

**ملاحظة عملية:** أي Endpoint/صفحة جديدة يفضّل تعتمد RBAC الجديد (permissions) بدل حصرها على role legacy.

---

## 5) Core domain modules (UI + API)

### Tasks
UI: `app/tasks/page.tsx`  
API:
- `/api/tasks` (CRUD/list)
- `/api/tasks/search`
- `/api/tasks/bulk`

Related models: `Task`, `Comment`, `ActivityLog`, `TaskTemplate`

### Approvals / Workflows
UI:
- `app/approvals/page.tsx`
- `app/workflows/*`

API:
- `/api/workflows`
- `/api/workflows/process`
- `/api/workflows/approvals`, `/api/workflows/my-approvals`

### HR
UI: `app/hr/*` (dashboard, employees, job titles, departments, requests, replacements, …)  
API (examples):
- `/api/hr/employees`
- `/api/hr/attendance`
- `/api/hr/requests`
- `/api/hr/positions`
- `/api/hr/headcount`
- `/api/settings/hr-workflows` (+ per-type workflows)

### Employees (generic)
UI: mostly under `app/hr/employees` + profile link  
API:
- `/api/employees`
- `/api/employees/[id]`

Model: `Employee`

### Attendance
UI: `app/attendance/page.tsx` + HR attendance pages  
API:
- `/api/attendance`
- `/api/settings/attendance`

### Procurement
UI: `app/procurement/*`  
API:
- `/api/procurement/requests`
- `/api/procurement/suppliers`
- `/api/procurement/supplier-requests`
- `/api/procurement/quotations`
- `/api/procurement/purchase-orders`
- `/api/procurement/goods-receipts`

### Maintenance
UI: `app/maintenance/*`  
API:
- `/api/maintenance/requests`
- `/api/maintenance/assets`
- `/api/maintenance/technicians`
- `/api/maintenance/access`

### Finance
UI: `app/finance/requests/page.tsx`  
API:
- `/api/finance/requests`

### Admin
UI: `app/admin/*`  
API:
- `/api/admin/users`
- `/api/admin/delegations`

---

## 6) Utility / platform endpoints
- Health: `GET /api/health`
- Public status: `GET /api/status`
- Monitoring (admin): `GET /api/monitoring`
- Metrics: `GET /api/metrics`
- Cache test: `GET /api/cache/test`
- Sidebar counts: `GET /api/sidebar/counts`

---

## 7) Files / uploads
- Upload endpoints:
  - `/api/upload`
  - `/api/upload/approvals`
- Storage folder (inside project): `uploads/`
  - Example subfolder: `uploads/hr-requests/`

---

## 8) Environment variables (production essentials)
(تفاصيل أكثر في `RUNBOOK.md` و `ENV_VARIABLES.md`)

Must-have:
- `DATABASE_URL` (Supabase Postgres)
- `SESSION_PASSWORD` (iron-session)

Usually needed:
- `CLOUDFLARED_TOKEN` (for tunnel process)
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (if redis cache is enabled)
- Telegram alerting (optional): `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ALERT_CHAT_ID`

---

## 9) “Where do I change X?” (practical pointers)

- **Employee Job Title / Department normalization**
  - DB: `Employee.jobTitleId`, `Employee.departmentId` + master data tables (`JobTitle`, `Department`)
  - API: `/api/employees/*` + `/api/hr/employees/*`
  - UI: `app/hr/employees/*` + print/profile views

- **Passwords / Users management**
  - Model: `User.passwordHash`
  - API: `/api/users`, `/api/admin/users`, `/api/auth/*`
  - Docs: `USERS_CREDENTIALS.md`

---

## 10) Quick commands (inside the environment)

```bash
# App health
curl -s http://localhost:3000/api/health
curl -s https://app.albassam-app.com/api/health

# PM2
sudo env PM2_HOME=/data/.pm2 PATH=/data/.npm-global/bin:$PATH pm2 list
sudo env PM2_HOME=/data/.pm2 PATH=/data/.npm-global/bin:$PATH pm2 restart albassam-app
sudo env PM2_HOME=/data/.pm2 PATH=/data/.npm-global/bin:$PATH pm2 logs albassam-app --lines 200 --nostream
```

---

## Appendix A) Route inventory (generated)

### API route roots (folders)
`app/api/*`: admin, attendance, auth, branches, cache, dashboard, employees, finance, health, hr, images, maintenance, metrics, monitoring, notifications, procurement, push, replacements, reports, settings, sidebar, stages, status, tasks, templates, upload, users, workflows.

### UI route roots (folders)
`app/*`: admin, approvals, attendance, auth, branches, dashboard, finance, hr, maintenance, notifications, procurement, profile, reports, settings, tasks, workflows, …
