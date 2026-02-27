import prisma from '@/lib/prisma'

export type HRWorkflowActorKind = 'BRANCH_MANAGER' | 'HR_MANAGER' | 'HR_EMPLOYEE'

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

  // Step 0
  if (stepOrder === 0) {
    if (BRANCH_MANAGER_FIRST_STEP_TYPES.has(requestType)) {
      const managerId = await getStageManagerUserIdForRequester(requesterUserId)
      return {
        userIds: managerId ? [managerId] : [],
        actor: 'BRANCH_MANAGER',
        labelAr: 'اعتماد مدير الفرع'
      }
    }

    if (HR_EMPLOYEE_FIRST_STEP_TYPES.has(requestType)) {
      const hrEmployees = await getUserIdsBySystemRoleName('HR_EMPLOYEE')

      // Fallback to legacy role if RBAC not assigned
      if (hrEmployees.length === 0) {
        const legacy = await prisma.user.findMany({ where: { role: 'HR_EMPLOYEE' }, select: { id: true } })
        return {
          userIds: legacy.map((u) => u.id),
          actor: 'HR_EMPLOYEE',
          labelAr: requestType === 'SALARY_CERTIFICATE' ? 'إعداد التعريف' : 'مراجعة الموارد البشرية'
        }
      }

      return {
        userIds: hrEmployees,
        actor: 'HR_EMPLOYEE',
        labelAr: requestType === 'SALARY_CERTIFICATE' ? 'إعداد التعريف' : 'مراجعة الموارد البشرية'
      }
    }
  }

  // Step 1 (final HR manager approval for all covered types)
  if (stepOrder === 1) {
    const hrManagers = await getUserIdsBySystemRoleName('HR_MANAGER')

    // Fallback: ADMIN legacy role if HR_MANAGER not assigned yet
    if (hrManagers.length === 0) {
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } })
      return { userIds: admins.map((u) => u.id), actor: 'HR_MANAGER', labelAr: 'اعتماد مدير الموارد البشرية' }
    }

    return { userIds: hrManagers, actor: 'HR_MANAGER', labelAr: 'اعتماد مدير الموارد البشرية' }
  }

  // Any further steps are not defined in the new routing
  return { userIds: [], actor: 'HR_MANAGER', labelAr: 'غير محدد' }
}

export function getExpectedHRWorkflowStepCount(requestType: string): number {
  // For now, all supported HR request types are 2-step flows
  // (Step 0 varies by type; Step 1 = HR manager)
  if (BRANCH_MANAGER_FIRST_STEP_TYPES.has(requestType) || HR_EMPLOYEE_FIRST_STEP_TYPES.has(requestType)) {
    return 2
  }

  // Default to DB workflow length if unknown
  return 2
}
