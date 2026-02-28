import prisma from '@/lib/prisma'

export type HRWorkflowActorKind = 'DIRECT_MANAGER' | 'HR_REVIEWER' | 'ADMIN'

// Which request types require branch manager as first step
const BRANCH_MANAGER_FIRST_STEP_TYPES = new Set<string>([
  'LEAVE',
  'UNPAID_LEAVE',
  'FLIGHT_BOOKING',
  'VISA_EXIT_REENTRY_SINGLE',
  'VISA_EXIT_REENTRY_MULTI',
  'RESIGNATION'
])

// Which request types start in HR (HR employee prepares/reviews first)
const HR_EMPLOYEE_FIRST_STEP_TYPES = new Set<string>([
  'TICKET_ALLOWANCE',
  'HOUSING_ALLOWANCE',
  'SALARY_CERTIFICATE'
])

export async function getStageManagerUserIdForRequester(requesterUserId: string): Promise<string | null> {
  const employee = await prisma.employee.findUnique({
    where: { userId: requesterUserId },
    select: {
      stage: {
        select: {
          manager: { select: { userId: true } },
          deputy: { select: { userId: true } }
        }
      }
    }
  })

  return employee?.stage?.manager?.userId || employee?.stage?.deputy?.userId || null
}

async function getRequesterBranchId(requesterUserId: string): Promise<string | null> {
  const emp = await prisma.employee.findUnique({
    where: { userId: requesterUserId },
    select: { branchId: true }
  })
  return emp?.branchId || null
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

  // Step 2 (admin final) for manager-first flows
  if (stepOrder === 2) {
    const admins = await getAdminUserIds()
    return { userIds: admins, actor: 'ADMIN', labelAr: 'اعتماد نهائي' }
  }

  return { userIds: [], actor: 'ADMIN', labelAr: 'غير محدد' }
}

export function getExpectedHRWorkflowStepCount(requestType: string): number {
  // Manager-first flows: manager -> HR -> admin
  if (BRANCH_MANAGER_FIRST_STEP_TYPES.has(requestType)) return 3

  // HR-first flows: HR -> admin
  if (HR_EMPLOYEE_FIRST_STEP_TYPES.has(requestType)) return 2

  return 2
}
