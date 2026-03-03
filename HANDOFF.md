# HANDOFF.md — Albassam Platform (Developer Handoff)

> **This file must be kept up to date.**
>
> Rule: if you change behavior, data model, routing rules, or add/modify a module, **update this file in the same PR**.
>
> Goal: any developer/agent can open this file and continue work without asking for context.

## Where to find “the truth”
- **Long-term product memory / decisions:** `/data/.openclaw/workspace/MEMORY.md`
- **Daily log (what happened today):** `/data/.openclaw/workspace/memory/YYYY-MM-DD.md`
- **Runbook (ops/deploy/restore):** `/data/.openclaw/workspace/albassam-tasks/RUNBOOK.md`
- **Code repo root:** `/data/.openclaw/workspace/albassam-tasks`

## Environment / stack
- Next.js (App Router) + TypeScript
- Prisma + Supabase Postgres
- Process manager: PM2 (`albassam-app`) + Cloudflared tunnel (`cloudflared`)
- Prod URL: https://app.albassam-app.com

## Current focus / next milestone (keep updated)
**Current focus:** finish **Org Structure V2** + then implement HR routing rules.

**Next milestone checklist (order):**
1) ✅ Org structure: coverageScope UI (BRANCH / MULTI_BRANCH / ALL) + branch picker.
2) ✅ Org structure: ADMIN assignments UI (teacher stage(s)) on employee page (basic).
3) ✅ HR routing rules: implement per-request-type routing + admin UI to edit (boys first).
4) Security P0: tighten uploads (`/api/upload`) + private files.
5) Resume Transport module.

---

# 1) Org Structure module (enterprise)

## Goal
Support real org reality:
- Schools: quality department + subject sub-departments + supervisors + teachers.
- Dual reporting lines:
  - `ADMIN` line (e.g., Stage Manager)
  - `FUNCTIONAL` line (e.g., Subject Supervisor)
- Teachers can be assigned to multiple stages.
- Supervisors/heads can cover multiple branches.

## Key DB models
Located in `prisma/schema.prisma`:
- `OrgUnit` (tree)
- `OrgUnitAssignment`

Important enums:
- `OrgUnitType`: SCHOOL / STAGE / DEPARTMENT / SUB_DEPARTMENT
- `OrgAssignmentType`: ADMIN / FUNCTIONAL
- `OrgAssignmentRole`: HEAD / SUPERVISOR / MEMBER
- `OrgCoverageScope`: BRANCH / MULTI_BRANCH / ALL

## Admin UI
Page:
- `app/settings/org-structure/page.tsx`  → `/settings/org-structure`

What it supports now:
- View org tree per branch.
- Assign **Supervisor** (FUNCTIONAL/SUPERVISOR) with search.
- Assign **Members** (FUNCTIONAL/MEMBER) via multi-select + filter:
  - Teachers / Staff / All
  - Teacher filter logic: position contains "معلم" OR specialization is present.
- List members under a unit.
- Optional view: include child units' members.
- Bulk actions: select many → bulk add to a unit OR bulk move to a unit.
- Unassigned flow: show employees with no org membership and bulk assign.
- Unit management: rename unit; merge two units.
- Create org unit under branch or parent + optional **Head/Manager** assignment (role=HEAD) (one head).

## Org structure API endpoints
Under `app/api/settings/org-structure/*`:
- `GET /api/settings/org-structure?branchId=...`
- `PUT /api/settings/org-structure/assignments`
- `PATCH /api/settings/org-structure/:id`
- `POST /api/settings/org-structure/create`
- `POST /api/settings/org-structure/merge`
- `POST /api/settings/org-structure/move-member`
- `POST /api/settings/org-structure/bulk-add-members`
- `POST /api/settings/org-structure/bulk-move-members`
- `GET /api/settings/org-structure/unassigned?branchId=...`
- `POST /api/settings/org-structure/auto-assign-teachers` (maps by Employee.department/specialization)
- `POST /api/settings/org-structure/ensure-stages`
- `POST /api/settings/org-structure/cleanup-stages`
- `POST /api/settings/org-structure/sync-stage-members`

Auth note:
- Org structure APIs allow **legacy ADMIN** OR **RBAC superadmin**.

## Remaining work (agreed)
1) coverageScope UI for HEAD/SUPERVISOR.
2) ADMIN assignments UI for teachers (stages).

---

# 2) HR routing rules (per request type)

Goal:
- Route specific HR request types via stage manager (ADMIN line) then branch VP, then HR review/final.

Desired chain (example):
requester → stage manager → branch VP → HR manager → HR execution (delegate pool)

Status (legacy routing):
- Implemented boys-chain routing for: LEAVE + VISA_EXIT_REENTRY_SINGLE + VISA_EXIT_REENTRY_MULTI + RESIGNATION.
- Stage manager source: Org Structure STAGE→HEAD (fallback to legacy Stage.manager/deputy).
- HR execution: HR manager delegates to one/pool/any user.

## Compatibility mode: Workflow Builder first
- HR routing now prefers Workflow Builder **Published** rules (requestType+branch) and falls back to legacy routing.
- Entry point: `lib/hrWorkflowRouting.ts` (keeps old behavior if no builder match).
- Builder resolver: `lib/hrWorkflowBuilderRouting.ts`

## Audit timeline permissions
- Approvers in chain (VP/manager) can view audit timeline:
  - `GET /api/hr/requests/[id]/audit`

---

# 4) Workflow Builder (new)

## Purpose
General workflow templates + versioning for HR (now) and procurement/maintenance later.

## DB tables (migration)
- WorkflowDefinition
- WorkflowVersion (Draft/Published)
- WorkflowRule (requestType+branch)
- WorkflowStepDefinition

## UI
- `/settings/workflow-builder`

## API
- `GET/POST /api/settings/workflow-builder`
- `GET/PUT /api/settings/workflow-builder/[workflowId]`
- `POST /api/settings/workflow-builder/[workflowId]/clone`
- `POST /api/settings/workflow-builder/versions/[versionId]/publish`
- Templates:
  - `POST /api/settings/workflow-builder/templates/schools`

## Templates (HR Schools)
- Button: "إنشاء قوالب المدارس (HR)" creates 4 Draft workflows (Arabic names).
- Must Publish each Draft version to take effect.

## How to test (HR Workflow Builder → runtime)
1) As ADMIN:
   - Go to `/settings/workflow-builder`
   - Click "إنشاء قوالب المدارس (HR)" (should create 4 workflows once)
   - Open each workflow and **Publish** the Draft version.
2) Create test HR requests (from any employee in an ACTIVE school branch):
   - LEAVE
   - VISA_EXIT_REENTRY_SINGLE
   - VISA_EXIT_REENTRY_MULTI
   - RESIGNATION
3) Verify routing (builder-first):
   - Step 1: STAGE_HEAD resolves via Org Structure STAGE→HEAD
   - Step 2: VP_EDUCATIONAL resolves via `EducationalRoutingSettings` for the branch
   - Step 3: HR Manager (USER)
   - Step 4: HR Execution (DELEGATE_POOL)
   - If no Published rule exists, legacy routing should still work.
4) Verify Timeline:
   - Approvers (e.g., VP/Stage Head/HR) can view audit timeline on request details.
   - Endpoint returns 200: `GET /api/hr/requests/[id]/audit`

## Ops notes
- Cloudflared tunnel requires `CLOUDFLARED_TOKEN` in `.env` (do NOT commit).
- PM2 ecosystem loads `.env` at runtime to provide token/DB/etc.

## How to test (Ops: tunnel + auth + impersonation)
### A) Tunnel / public health
1) `curl -s -o /dev/null -w "%{http_code}\n" https://app.albassam-app.com/api/health` → expect `200`.
2) If `530`, check tunnel:
   - `pm2 list` (cloudflared should be online)
   - Ensure `.env` contains `CLOUDFLARED_TOKEN` (do NOT commit)
   - `pm2 restart cloudflared --update-env`

### B) Session cookie across subdomains
1) Login on `https://app.albassam-app.com`.
2) Open `https://app.albassam-app.com/api/auth/me` → expect `200` and user payload.
3) If using other subdomain (e.g. `p.albassam-app.com`), confirm the same session works.
   - Cookie domain in production is `.albassam-app.com`.

### C) Admin impersonation
1) As ADMIN go to `/hr/employees` and click "🔄 دخول" on any employee.
2) Expect redirect to `/dashboard` as target user.
3) Confirm state via `GET /api/auth/me`:
   - `isImpersonating: true`
   - `user.id` should be the target user.
4) Revert:
   - Call `POST /api/auth/revert-impersonation` (or use UI if present) and verify `isImpersonating: false`.

---

# 3) Transport module (paused until org structure + HR routing are finished)

Sidebar:
- `app/components/Sidebar.tsx` includes section "الخدمات المساندة".

## Drivers (MVP)
- Page: `app/support-services/transport/drivers/page.tsx` → `/support-services/transport/drivers`
- API: `GET /api/transport/drivers` (driver = Employee.position contains "سائق")

## Vehicles (MVP)
- Prisma model: `TransportVehicle` (+ migration)
- Page: `app/support-services/transport/vehicles/page.tsx` → `/support-services/transport/vehicles`
- API: `GET/POST /api/transport/vehicles`

Future scope:
- Driver ↔ Vehicle assignment
- Inspections
- Services/maintenance logs
- Passengers (students/employees) + daily roster + check-in UI

---

# Ops / deploy
Use:
- `/data/.openclaw/workspace/albassam-tasks/RUNBOOK.md`

Common gotcha:
- Next build may fail with EACCES under `.next_run*` due to root-owned files; fix:
  `sudo chown -R node:node .next .next_run*`

---

# Update checklist (must do with every meaningful change)

When you change anything meaningful (behavior, DB schema, routing rules, permissions, new module/page/API):

1) Update **this file** (`HANDOFF.md`)
- What changed
- Where (paths)
- How to test
- Any migration / rollout notes

2) Update long-term memory
- If it affects roadmap/decisions: update `/data/.openclaw/workspace/MEMORY.md`

3) Update daily log
- Add 5–15 lines to `/data/.openclaw/workspace/memory/YYYY-MM-DD.md`

4) Sanity checks
- `npx tsc -p tsconfig.json --noEmit`
- `npm run build`
- Restart (PM2) + confirm `/api/health` is 200

5) If you added a DB migration
- `npx prisma generate`
- `npx prisma migrate deploy`
- Mention migration id in `HANDOFF.md`
