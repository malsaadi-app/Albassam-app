# Backend Workflows & RBAC – Implementation Notes (2026-02-27)

## Scope requested
- HR request types focus:
  - Leave types
  - Ticket allowance
  - Housing allowance
  - Salary Certificate
  - Visa exit/re-entry (single/multi)
  - Resignation
- Approval routing:
  - **Leave/Visa/Resignation:** Branch Manager → HR Manager → close (or delegate to HR employee)
  - **Salary certificate:** HR employee prepares → HR manager approves
  - **Allowances:** HR employee review/return → HR manager approve
- Procurement workflow:
  - Professional path: **abdullahsh → mq**
- Constraint: **do not break existing endpoints**; DB changes only if needed.

---

## What was implemented

### 1) Added missing HR request types (Prisma enum + server-side validation)
**Files changed**
- `prisma/schema.prisma`
  - Extended `RequestType` enum with:
    - `VISA_EXIT_REENTRY_SINGLE`
    - `VISA_EXIT_REENTRY_MULTI`
    - `RESIGNATION`
- `app/api/hr/requests/route.ts`
  - Extended Zod enum validation for `type`.
- `lib/hrRequestConfig.ts`
  - Extended `HRRequestType` union + `HR_REQUEST_TYPE_CONFIG` with required fields.

**Notes**
- These new types are now accepted by the API, and server-side required-fields validation is enforced through `HR_REQUEST_TYPE_CONFIG`.

> ⚠️ DB migration needed: adding enum values requires running Prisma migration against the real DB.

---

### 2) Implemented dynamic HR approval routing (Branch Manager / HR roles)
Problem: existing `HRRequestTypeWorkflow.steps` were stored with **fixed userId per step**, which cannot represent “branch manager of the requester’s stage” or “any HR employee/manager”.

Solution: keep existing workflow tables/endpoints, but **resolve the responsible approver dynamically** at runtime.

**New module**
- `lib/hrWorkflowRouting.ts`
  - Resolves approver user IDs for a given `(requestType, requesterUserId, stepOrder)`:
    - Step 0:
      - Leave/Visa/Resignation/Flight/Unpaid: **stage manager** (fallback: deputy)
      - Allowances + Salary certificate: **all HR_EMPLOYEE system-role users** (fallback: legacy `role=HR_EMPLOYEE`)
    - Step 1:
      - **all HR_MANAGER system-role users** (fallback: legacy `role=ADMIN`)

**Endpoints updated (no URL changes)**
- `POST /api/hr/requests` (create)
  - First-step notification is now sent to dynamically resolved approver(s) (branch manager / HR employees).
- `POST /api/hr/requests/[id]/process-step`
  - Authorization check now uses dynamic routing (not `workflowStep.userId`).
  - Next-step notification uses dynamic routing (may notify multiple HR managers).
- `lib/dashboard/pendingApprovals.ts`
  - Pending approvals now use dynamic routing for HR requests (so branch managers / HR managers can see their approvals even if steps store placeholder IDs).

**How branch manager is resolved**
- Uses `Employee.userId -> Employee.stage -> Stage.manager.userId` (fallback to deputy).

---

### 3) RBAC: switched “review” and “approve” endpoints to permissions
To reduce reliance on legacy `User.role` (ADMIN/HR_EMPLOYEE/USER), the following were updated:

- `POST /api/hr/requests/[id]/review`
  - Now requires `hr_requests.review` (or SUPER_ADMIN).
  - When approved, it now notifies **HR_MANAGER** system-role users (fallback ADMIN).

- `POST /api/hr/requests/[id]/approve`
  - Now requires `hr_requests.approve` (or SUPER_ADMIN).

This aligns with the RBAC roles seeded in `scripts/seed-rbac.js`.

---

### 4) Procurement workflow: seed path abdullahsh → mq (if users exist)
**File updated**
- `prisma/seed.ts` (`ensureWorkflows`)
  - For procurement categories, preferred reviewer/approver are:
    - reviewer: `username=abdullahsh`
    - approver: `username=mq`
  - If not found, it falls back to the provided seed `reviewerUserId/approverUserId`.

---

## Important behavioral changes
- HR workflow approvals are now **role/relationship-based**:
  - Branch manager is not hard-coded; it’s resolved by the requester’s assigned stage.
  - HR employees and HR managers are resolved by **SystemRole**.
- Steps in `HRWorkflowStep` still store a `userId` (FK) but this is now effectively a placeholder for these flows.

---

## Open items / needs clarification before final merge
### Delegation: “HR Manager → close or delegate to HR employee”
Current implementation supports:
- Branch Manager → HR Manager approval chain (2-step)
- HR employee prepares/reviews → HR manager approves

But **“delegate to HR employee” from HR manager** is not yet implemented because it needs a clear UX + data model decision, e.g.:
- Add a new action (`delegate`) + store assigned HR employee on the request
- Or add a new workflow step dynamically
- Or use the newer generic workflow tables (`WorkflowApprovalLog` / `WorkflowReferral`) consistently

Please confirm the desired behavior:
1) Is delegation a one-time assignment (HR manager picks an HR employee to handle), then request returns to HR manager?
2) Should delegation be visible in dashboards and auditable?
3) Can any HR employee act, or only the delegated one?

---

## Files changed (quick list)
- `prisma/schema.prisma`
- `lib/hrRequestConfig.ts`
- `lib/hrWorkflowRouting.ts` (new)
- `app/api/hr/requests/route.ts`
- `app/api/hr/requests/[id]/process-step/route.ts`
- `app/api/hr/requests/[id]/review/route.ts`
- `app/api/hr/requests/[id]/approve/route.ts`
- `lib/dashboard/pendingApprovals.ts`
- `prisma/seed.ts`

---

## Migration / deployment note
Because `RequestType` enum was extended, production requires:
- `prisma migrate` (or equivalent) to apply enum changes
- `prisma generate` for updated client types
