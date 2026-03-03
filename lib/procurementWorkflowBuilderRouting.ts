import prisma from '@/lib/prisma'

export async function getProcurementStepDefinitionFromBuilder(params: {
  requestType: 'PURCHASE_REQUEST'
  requestedByUserId: string
  category: string
  stepIndex: number
}): Promise<{
  stepType: string
  titleAr: string | null
  requireComment: boolean
  configJson: any
} | null> {
  const { requestedByUserId, category, stepIndex } = params

  const emp = await prisma.employee.findUnique({ where: { userId: requestedByUserId }, select: { branchId: true } })
  if (!emp?.branchId) return null

  const candidates = await prisma.workflowRule.findMany({
    where: {
      enabled: true,
      requestType: 'PURCHASE_REQUEST',
      branchId: emp.branchId,
      workflowVersion: { status: 'PUBLISHED' },
    } as any,
    select: { workflowVersionId: true, conditionsJson: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  const match = candidates.find((c: any) => {
    const cond = c.conditionsJson || {}
    return !cond.category || String(cond.category) === String(category)
  })

  if (!match) return null

  const step = await prisma.workflowStepDefinition.findFirst({
    where: { workflowVersionId: match.workflowVersionId, order: stepIndex + 1 },
    select: { stepType: true, titleAr: true, requireComment: true, configJson: true },
  })

  if (!step) return null

  return {
    stepType: String(step.stepType),
    titleAr: step.titleAr ?? null,
    requireComment: !!step.requireComment,
    configJson: step.configJson || {},
  }
}

export async function resolveProcurementAssigneesFromBuilder(params: {
  requestedByUserId: string
  category: string
  stepIndex: number
}): Promise<{ userIds: string[]; labelAr: string } | null> {
  const step = await getProcurementStepDefinitionFromBuilder({
    requestType: 'PURCHASE_REQUEST',
    requestedByUserId: params.requestedByUserId,
    category: params.category,
    stepIndex: params.stepIndex,
  })

  if (!step) return null

  const labelAr = step.titleAr || 'خطوة'

  if (step.stepType === 'PROCUREMENT_GATEKEEPER') {
    const emp = await prisma.employee.findUnique({ where: { userId: params.requestedByUserId }, select: { branchId: true } })
    if (!emp?.branchId) return { userIds: [], labelAr }

    const coverages = await prisma.employeeBranchCoverage.findMany({
      where: {
        branchId: emp.branchId,
        module: 'PROCUREMENT',
        active: true,
        role: 'GATEKEEPER',
        employee: { userId: { not: null } },
      },
      select: { employee: { select: { userId: true } } },
    })

    const userIds = coverages.map((c) => c.employee.userId).filter((x): x is string => !!x)
    return { userIds, labelAr }
  }

  if (step.stepType === 'SYSTEM_ROLE') {
    const roleName = String(step.configJson?.systemRoleName || '').trim()
    if (!roleName) return { userIds: [], labelAr }

    const users = await prisma.user.findMany({ where: { systemRole: { is: { name: roleName } } }, select: { id: true } })
    return { userIds: users.map((u) => u.id), labelAr }
  }

  if (step.stepType === 'USER') {
    const id = step.configJson?.userId
    return { userIds: id ? [String(id)] : [], labelAr }
  }

  if (step.stepType === 'DELEGATE_POOL') {
    const cfg: any = step.configJson || {}
    const mode = String(cfg.mode || 'pool')
    const allowAny = cfg.allowAny !== false
    const userIds = Array.isArray(cfg.userIds) ? cfg.userIds.map(String).filter(Boolean) : []

    if (mode === 'single' && userIds.length) return { userIds: [userIds[0]], labelAr }
    if (mode === 'pool' && userIds.length) return { userIds: Array.from(new Set<string>(userIds)), labelAr }

    if (mode === 'any') {
      const pr = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } })
      return { userIds: pr.map((u) => u.id), labelAr }
    }

    if (allowAny) {
      const managers = await prisma.user.findMany({ where: { systemRole: { is: { name: 'PROCUREMENT_MANAGER' } } }, select: { id: true } })
      if (managers.length) return { userIds: managers.map((u) => u.id), labelAr }
    }

    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } })
    return { userIds: admins.map((u) => u.id), labelAr }
  }

  return { userIds: [], labelAr }
}
