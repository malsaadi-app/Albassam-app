import prisma from '@/lib/prisma'

// Builder-driven routing for HR Requests.
// Reads Workflow Builder (WorkflowDefinition/Version/Rule/StepDefinition) and resolves approver userIds.

export type BuilderRoutingResult = {
  userIds: string[]
  labelAr: string
  source: 'BUILDER'
}

async function getRequesterContext(requesterUserId: string) {
  const emp = await prisma.employee.findUnique({
    where: { userId: requesterUserId },
    select: { branchId: true, stageId: true, departmentId: true },
  })
  return { branchId: emp?.branchId || null, stageId: (emp as any)?.stageId || null, departmentId: (emp as any)?.departmentId || null }
}

async function resolveStageHead(requesterUserId: string): Promise<string | null> {
  const employee = await prisma.employee.findUnique({
    where: { userId: requesterUserId },
    select: {
      id: true,
      branchId: true,
      stage: { select: { name: true, manager: { select: { userId: true } }, deputy: { select: { userId: true } } } },
    },
  })

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

  return employee?.stage?.manager?.userId || employee?.stage?.deputy?.userId || null
}

async function resolveVpEducational(branchId: string): Promise<string | null> {
  const s = await prisma.educationalRoutingSettings.findUnique({
    where: { branchId },
    select: { vpEducationalUserId: true },
  })
  return s?.vpEducationalUserId || null
}

function stepLabelAr(step: any): string {
  return String(step?.titleAr || 'خطوة')
}

export async function getStepDefinitionFromBuilder(params: {
  requestType: string
  requesterUserId: string
  stepOrder: number
}): Promise<{ stepType: string; titleAr: string | null; requireComment: boolean; allowConsult: boolean; allowDelegation: boolean; configJson: any } | null> {
  const { requestType, requesterUserId, stepOrder } = params
  const { branchId, stageId, departmentId } = await getRequesterContext(requesterUserId)
  if (!branchId) return null

  const baseWhere: any = {
    enabled: true,
    requestType,
    branchId,
    workflowVersion: { status: 'PUBLISHED' },
  }

  // Candidate rules for this requestType+branch. We'll evaluate conditions in JS.
  const candidates = await prisma.workflowRule.findMany({
    where: baseWhere,
    select: { workflowVersionId: true, conditionsJson: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const matches = (c: any) => {
    const cond = c.conditionsJson || {}
    if (cond.stageId && String(cond.stageId) !== String(stageId)) return false
    if (cond.departmentId && String(cond.departmentId) !== String(departmentId)) return false
    return true
  }

  // Most specific wins: (stage + dept) > (stage) > (dept) > (none)
  const specificity = (c: any) => {
    const cond = c.conditionsJson || {}
    let s = 0
    if (cond.stageId) s += 2
    if (cond.departmentId) s += 1
    return s
  }

  const filtered = candidates.filter(matches)
  if (!filtered.length) return null

  filtered.sort((a: any, b: any) => specificity(b) - specificity(a) || (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
  const match = filtered[0]

  if (!match) return null

  const step = await prisma.workflowStepDefinition.findFirst({
    where: { workflowVersionId: match.workflowVersionId, order: stepOrder + 1 },
    select: { titleAr: true, stepType: true, configJson: true, requireComment: true, allowConsult: true, allowDelegation: true },
  })

  if (!step) return null

  return {
    stepType: String(step.stepType),
    titleAr: step.titleAr ?? null,
    requireComment: !!step.requireComment,
    allowConsult: !!step.allowConsult,
    allowDelegation: !!step.allowDelegation,
    configJson: step.configJson || {},
  }
}

export async function getApproverUserIdsForHRRequestStepFromBuilder(params: {
  requestType: string
  requesterUserId: string
  stepOrder: number
}): Promise<BuilderRoutingResult | null> {
  const { requestType, requesterUserId, stepOrder } = params
  const { branchId } = await getRequesterContext(requesterUserId)
  if (!branchId) return null

  const stepDef = await getStepDefinitionFromBuilder({ requestType, requesterUserId, stepOrder })
  if (!stepDef) return null

  const step: any = { titleAr: stepDef.titleAr, stepType: stepDef.stepType, configJson: stepDef.configJson }

  const labelAr = stepLabelAr(step)

  // Resolve userIds by stepType/config
  if (step.stepType === 'STAGE_HEAD') {
    const id = await resolveStageHead(requesterUserId)
    return { userIds: id ? [id] : [], labelAr, source: 'BUILDER' }
  }

  if (step.stepType === 'VP_EDUCATIONAL') {
    const id = await resolveVpEducational(branchId)
    return { userIds: id ? [id] : [], labelAr, source: 'BUILDER' }
  }

  if (step.stepType === 'SYSTEM_ROLE') {
    const cfg: any = step.configJson || {}
    const roleName = String(cfg.systemRoleName || '').trim()
    if (!roleName) return { userIds: [], labelAr, source: 'BUILDER' }

    const users = await prisma.user.findMany({
      where: { systemRole: { is: { name: roleName } } },
      select: { id: true },
    })
    return { userIds: users.map((u) => u.id), labelAr, source: 'BUILDER' }
  }

  if (step.stepType === 'USER') {
    const cfg: any = step.configJson || {}
    const id = cfg.userId
    return { userIds: id ? [String(id)] : [], labelAr, source: 'BUILDER' }
  }

  if (step.stepType === 'DELEGATE_POOL') {
    const cfg: any = step.configJson || {}
    const mode = String(cfg.mode || 'pool') // single | pool | any
    const allowAny = cfg.allowAny !== false
    const userIds = Array.isArray(cfg.userIds) ? cfg.userIds.map(String).filter(Boolean) : []

    // If explicit users configured, honor them.
    if (mode === 'single' && userIds.length) {
      return { userIds: [userIds[0]], labelAr, source: 'BUILDER' }
    }
    if (mode === 'pool' && userIds.length) {
      return { userIds: Array.from(new Set<string>(userIds)), labelAr, source: 'BUILDER' }
    }

    // Mode 'any': allow any HR employee (and admins) to process.
    if (mode === 'any') {
      const hrEmployees = await prisma.user.findMany({ where: { role: 'HR_EMPLOYEE' }, select: { id: true } })
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } })
      const ids = [...hrEmployees.map((u) => u.id), ...admins.map((u) => u.id)]
      return { userIds: [...new Set(ids)], labelAr, source: 'BUILDER' }
    }

    // Fallback (no explicit users): use HR_MANAGER system role if available, else admins.
    if (allowAny) {
      const hrManagers = await prisma.user.findMany({
        where: { systemRole: { is: { name: 'HR_MANAGER' } } },
        select: { id: true },
      })
      if (hrManagers.length) return { userIds: hrManagers.map((u) => u.id), labelAr, source: 'BUILDER' }
    }

    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } })
    return { userIds: admins.map((u) => u.id), labelAr, source: 'BUILDER' }
  }

  // Unknown step type (future)
  return { userIds: [], labelAr, source: 'BUILDER' }
}
