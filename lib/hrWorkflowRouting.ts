import prisma from '@/lib/prisma'

export type HRWorkflowActorKind = 'DIRECT_MANAGER' | 'HR_REVIEWER' | 'ADMIN'

// Which request types require direct manager as first step
const BRANCH_MANAGER_FIRST_STEP_TYPES = new Set<string>([
  'LEAVE',
  'UNPAID_LEAVE',
  'FLIGHT_BOOKING',
  'VISA_EXIT_REENTRY_SINGLE',
  'VISA_EXIT_REENTRY_MULTI',
  'RESIGNATION'
])

// Educational chain (boys branch only for now)
const EDUCATIONAL_CHAIN_TYPES = new Set<string>([
  'LEAVE',
  'VISA_EXIT_REENTRY_SINGLE',
  'VISA_EXIT_REENTRY_MULTI',
  'RESIGNATION'
])

const BOYS_BRANCH_NAME = 'مجمع البسام الأهلية بنين'

// Which request types start in HR (HR employee prepares/reviews first)
const HR_EMPLOYEE_FIRST_STEP_TYPES = new Set<string>([
  'TICKET_ALLOWANCE',
  'HOUSING_ALLOWANCE',
  'SALARY_CERTIFICATE'
])

export async function getStageManagerUserIdForRequester(requesterUserId: string): Promise<string | null> {
  // Prefer org-structure STAGE->HEAD (new model)
  const employee = await prisma.employee.findUnique({
    where: { userId: requesterUserId },
    select: {
      id: true,
      branchId: true,
      stageId: true,
      stage: {
        select: {
          manager: { select: { userId: true } },
          deputy: { select: { userId: true } }
        }
      }
    }
  })

  // Prefer legacy Stage relation name -> OrgUnit STAGE name (stable)
  if (employee?.branchId) {
    const stageName = (employee as any)?.stage?.name || null
    if (stageName) {
      const stageUnit = await prisma.orgUnit.findFirst({
        where: { branchId: employee.branchId, type: 'STAGE', isActive: true, name: { contains: stageName } },
        select: { id: true },
      })

      if (stageUnit) {
        const head = await prisma.orgUnitAssignment.findFirst({
          where: { orgUnitId: stageUnit.id, active: true, role: 'HEAD', assignmentType: 'FUNCTIONAL' },
          select: { employee: { select: { userId: true } } },
        })
        if (head?.employee?.userId) return head.employee.userId
      }
    }

    // Fallback: try any ADMIN assignment to STAGE org unit (member), take its stage unit and find HEAD.
    const adminStage = await prisma.orgUnitAssignment.findFirst({
      where: {
        employeeId: employee?.id || '__none__',
        active: true,
        assignmentType: 'ADMIN',
        role: 'MEMBER',
        orgUnit: { branchId: employee.branchId, type: 'STAGE', isActive: true },
      },
      select: { orgUnitId: true },
    })

    if (adminStage?.orgUnitId) {
      const head = await prisma.orgUnitAssignment.findFirst({
        where: { orgUnitId: adminStage.orgUnitId, active: true, role: 'HEAD', assignmentType: 'FUNCTIONAL' },
        select: { employee: { select: { userId: true } } },
      })
      if (head?.employee?.userId) return head.employee.userId
    }
  }

  // Final fallback: old Stage.manager/deputy
  return employee?.stage?.manager?.userId || employee?.stage?.deputy?.userId || null
}

async function getRequesterBranchId(requesterUserId: string): Promise<string | null> {
  const emp = await prisma.employee.findUnique({
    where: { userId: requesterUserId },
    select: { branchId: true }
  })
  return emp?.branchId || null
}

async function isBoysBranch(branchId: string | null): Promise<boolean> {
  if (!branchId) return false
  const b = await prisma.branch.findUnique({ where: { id: branchId }, select: { name: true } })
  return b?.name === BOYS_BRANCH_NAME
}

async function getVpEducationalUserIdForBranch(branchId: string): Promise<string | null> {
  const s = await prisma.educationalRoutingSettings.findUnique({
    where: { branchId },
    select: { vpEducationalUserId: true }
  })
  return s?.vpEducationalUserId || null
}

async function getHrReviewerUserIdsForBranch(branchId: string): Promise<string[]> {
  const cov = await prisma.employeeBranchCoverage.findMany({
    where: { branchId, module: 'HR', active: true },
    select: { employee: { select: { userId: true } } }
  })

  const ids = cov.map((c) => c.employee.userId).filter((x): x is string => !!x)

  // Fallback: any HR_EMPLOYEE if no coverage configured
  if (ids.length === 0) {
    const legacy = await prisma.user.findMany({ where: { role: 'HR_EMPLOYEE' }, select: { id: true } })
    return legacy.map((u) => u.id)
  }

  // de-dupe
  return [...new Set(ids)]
}

async function getAdminUserIds(): Promise<string[]> {
  const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } })
  return admins.map((u) => u.id)
}

export async function getUserIdsBySystemRoleName(roleName: string): Promise<string[]> {
  const users = await prisma.user.findMany({
    where: {
      systemRole: {
        is: { name: roleName }
      }
    },
    select: { id: true }
  })

  return users.map((u) => u.id)
}

export async function getApproverUserIdsForHRRequestStep(params: {
  requestType: string
  requesterUserId: string
  stepOrder: number
}): Promise<{ userIds: string[]; actor: HRWorkflowActorKind; labelAr: string }> {
  const { requestType, requesterUserId, stepOrder } = params

  const branchId = await getRequesterBranchId(requesterUserId)

  // Step 0
  if (stepOrder === 0) {
    if (BRANCH_MANAGER_FIRST_STEP_TYPES.has(requestType)) {
      const managerId = await getStageManagerUserIdForRequester(requesterUserId)
      return {
        userIds: managerId ? [managerId] : [],
        actor: 'DIRECT_MANAGER',
        labelAr: 'اعتماد المدير المباشر'
      }
    }

    // HR starts first
    if (branchId) {
      const hrIds = await getHrReviewerUserIdsForBranch(branchId)
      return {
        userIds: hrIds,
        actor: 'HR_REVIEWER',
        labelAr: requestType === 'SALARY_CERTIFICATE' ? 'إعداد التعريف' : 'مراجعة الموارد البشرية'
      }
    }

    const fallback = await prisma.user.findMany({ where: { role: 'HR_EMPLOYEE' }, select: { id: true } })
    return { userIds: fallback.map((u) => u.id), actor: 'HR_REVIEWER', labelAr: 'مراجعة الموارد البشرية' }
  }

  // Step 1
  if (stepOrder === 1) {
    if (EDUCATIONAL_CHAIN_TYPES.has(requestType)) {
      // Boys branch: VP educational affairs step
      if (await isBoysBranch(branchId)) {
        const vpId = branchId ? await getVpEducationalUserIdForBranch(branchId) : null
        return { userIds: vpId ? [vpId] : [], actor: 'DIRECT_MANAGER', labelAr: 'اعتماد نائب الرئيس للشؤون التعليمية' }
      }

      // Non-boys branches: skip VP step (handled by auto-skip in API)
      return { userIds: [], actor: 'DIRECT_MANAGER', labelAr: 'اعتماد نائب الرئيس للشؤون التعليمية' }
    }

    if (BRANCH_MANAGER_FIRST_STEP_TYPES.has(requestType)) {
      // After manager approval, HR reviewers (by branch coverage)
      if (branchId) {
        const hrIds = await getHrReviewerUserIdsForBranch(branchId)
        return { userIds: hrIds, actor: 'HR_REVIEWER', labelAr: 'مراجعة الموارد البشرية' }
      }
      const fallback = await prisma.user.findMany({ where: { role: 'HR_EMPLOYEE' }, select: { id: true } })
      return { userIds: fallback.map((u) => u.id), actor: 'HR_REVIEWER', labelAr: 'مراجعة الموارد البشرية' }
    }

    // HR-first flows: step 1 is final admin approval
    const admins = await getAdminUserIds()
    return { userIds: admins, actor: 'ADMIN', labelAr: 'اعتماد نهائي' }
  }

  // Step 2
  if (stepOrder === 2) {
    if (EDUCATIONAL_CHAIN_TYPES.has(requestType)) {
      // HR manager step (company-wide). Prefer systemRole=HR_MANAGER, fallback to admins.
      const hrManagers = await getUserIdsBySystemRoleName('HR_MANAGER')
      if (hrManagers.length) return { userIds: hrManagers, actor: 'ADMIN', labelAr: 'اعتماد مدير الموارد البشرية' }
      const admins = await getAdminUserIds()
      return { userIds: admins, actor: 'ADMIN', labelAr: 'اعتماد مدير الموارد البشرية' }
    }

    // admin final for manager-first flows
    const admins = await getAdminUserIds()
    return { userIds: admins, actor: 'ADMIN', labelAr: 'اعتماد نهائي' }
  }

  // Step 3: HR executor(s) — default handler is HR manager (can delegate to any user/pool)
  if (stepOrder === 3) {
    const hrManagers = await getUserIdsBySystemRoleName('HR_MANAGER')
    if (hrManagers.length) return { userIds: hrManagers, actor: 'ADMIN', labelAr: 'تنفيذ الموارد البشرية' }
    const admins = await getAdminUserIds()
    return { userIds: admins, actor: 'ADMIN', labelAr: 'تنفيذ الموارد البشرية' }
  }

  return { userIds: [], actor: 'ADMIN', labelAr: 'غير محدد' }
}

export function getExpectedHRWorkflowStepCount(requestType: string): number {
  // Educational chain (boys branch): manager -> VP -> HR -> admin
  if (EDUCATIONAL_CHAIN_TYPES.has(requestType)) return 4

  // Manager-first flows: manager -> HR -> admin
  if (BRANCH_MANAGER_FIRST_STEP_TYPES.has(requestType)) return 3

  // HR-first flows: HR -> admin
  if (HR_EMPLOYEE_FIRST_STEP_TYPES.has(requestType)) return 2

  return 2
}
