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
1) Org structure: add **coverageScope UI** (BRANCH / MULTI_BRANCH / ALL) + branch picker.
2) Org structure: add **ADMIN assignments UI** (teacher stage(s)) + optional weighting.
3) HR routing rules: implement per-request-type routing + admin UI to edit.
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
requester → stage manager → branch VP → HR manager (محمد/admin) → HR executors (khalidj/mohammedz)

Status:
- Not fully implemented yet. Next after finishing Org Structure V2.

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
