import prisma from '@/lib/prisma'

/**
 * Resolve responsible userIds for procurement workflow steps.
 *
 * Step 0: branch/module gatekeepers (EmployeeBranchCoverage module=PROCUREMENT, role=GATEKEEPER, active)
 * Fallback: configured workflow step userId
 */
export async function resolveProcurementStepAssignees(opts: {
  requestedByUserId: string
  workflowCategory: any
  stepIndex: number
  fallbackUserId?: string | null
}): Promise<string[]> {
  const { requestedByUserId, stepIndex, fallbackUserId } = opts

  // Only step0 is dynamic for now.
  if (stepIndex !== 0) {
    return fallbackUserId ? [fallbackUserId] : []
  }

  // Find requester employee -> branchId
  const emp = await prisma.employee.findUnique({
    where: { userId: requestedByUserId },
    select: { branchId: true },
  })

  if (!emp?.branchId) {
    return fallbackUserId ? [fallbackUserId] : []
  }

  const coverages = await prisma.employeeBranchCoverage.findMany({
    where: {
      branchId: emp.branchId,
      module: 'PROCUREMENT',
      active: true,
      role: 'GATEKEEPER',
      employee: { userId: { not: null } },
    },
    select: {
      employee: { select: { userId: true } },
    },
  })

  const userIds = coverages
    .map((c) => c.employee.userId)
    .filter((x): x is string => !!x)

  // If none configured, fallback to workflow config
  return userIds.length ? userIds : fallbackUserId ? [fallbackUserId] : []
}
