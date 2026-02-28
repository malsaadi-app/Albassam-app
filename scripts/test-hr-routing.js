#!/usr/bin/env node
/*
  Creates temporary HR requests and prints the routed approvers per step.
  It does not send notifications.

  Usage:
    node scripts/test-hr-routing.js
*/

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Minimal routing replica (we can't import TS modules directly in this runtime).
  const BRANCH_MANAGER_FIRST_STEP_TYPES = new Set([
    'LEAVE',
    'UNPAID_LEAVE',
    'FLIGHT_BOOKING',
    'VISA_EXIT_REENTRY_SINGLE',
    'VISA_EXIT_REENTRY_MULTI',
    'RESIGNATION'
  ])

  async function getStageManagerUserIdForRequester(requesterUserId) {
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

  async function getRequesterBranchId(requesterUserId) {
    const emp = await prisma.employee.findUnique({ where: { userId: requesterUserId }, select: { branchId: true } })
    return emp?.branchId || null
  }

  async function getHrReviewerUserIdsForBranch(branchId) {
    const cov = await prisma.employeeBranchCoverage.findMany({
      where: { branchId, module: 'HR', active: true },
      select: { employee: { select: { userId: true } } }
    })
    const ids = cov.map((c) => c.employee.userId).filter(Boolean)
    if (ids.length === 0) {
      const legacy = await prisma.user.findMany({ where: { role: 'HR_EMPLOYEE' }, select: { id: true } })
      return legacy.map((u) => u.id)
    }
    return [...new Set(ids)]
  }

  async function getAdminUserIds() {
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } })
    return admins.map((u) => u.id)
  }

  async function route({ requestType, requesterUserId, stepOrder }) {
    const branchId = await getRequesterBranchId(requesterUserId)

    if (stepOrder === 0) {
      if (BRANCH_MANAGER_FIRST_STEP_TYPES.has(requestType)) {
        const managerId = await getStageManagerUserIdForRequester(requesterUserId)
        return { userIds: managerId ? [managerId] : [], labelAr: 'اعتماد المدير المباشر' }
      }
      if (branchId) {
        return { userIds: await getHrReviewerUserIdsForBranch(branchId), labelAr: 'مراجعة الموارد البشرية' }
      }
      const legacy = await prisma.user.findMany({ where: { role: 'HR_EMPLOYEE' }, select: { id: true } })
      return { userIds: legacy.map((u) => u.id), labelAr: 'مراجعة الموارد البشرية' }
    }

    if (stepOrder === 1) {
      if (BRANCH_MANAGER_FIRST_STEP_TYPES.has(requestType)) {
        if (branchId) return { userIds: await getHrReviewerUserIdsForBranch(branchId), labelAr: 'مراجعة الموارد البشرية' }
        const legacy = await prisma.user.findMany({ where: { role: 'HR_EMPLOYEE' }, select: { id: true } })
        return { userIds: legacy.map((u) => u.id), labelAr: 'مراجعة الموارد البشرية' }
      }
      return { userIds: await getAdminUserIds(), labelAr: 'اعتماد نهائي' }
    }

    if (stepOrder === 2) {
      return { userIds: await getAdminUserIds(), labelAr: 'اعتماد نهائي' }
    }

    return { userIds: [], labelAr: 'غير محدد' }
  }

  // Pick a real requester with branchId = "مجمع البسام الأهلية بنين" (pilot user)
  const requester = await prisma.user.findUnique({ where: { username: 'User1boys' } })
  if (!requester) throw new Error('Requester user not found: User1boys')

  const emp = await prisma.employee.findFirst({ where: { userId: requester.id }, include: { branch: true } })
  if (!emp?.branchId) throw new Error('Requester is not linked to an employee with branchId')

  console.log('Requester:', { username: requester.username, userId: requester.id, branch: emp.branch?.name })

  const createdIds = []

  // 1) HR-first flow test: SALARY_CERTIFICATE (2 steps)
  {
    const req = await prisma.hRRequest.create({
      data: {
        type: 'SALARY_CERTIFICATE',
        employeeId: requester.id,
        status: 'PENDING_REVIEW',
        currentWorkflowStep: 0,
        purpose: 'TEST: salary certificate'
      }
    })
    createdIds.push(req.id)

    const s0 = await route({ requestType: req.type, requesterUserId: requester.id, stepOrder: 0 })
    const s1 = await route({ requestType: req.type, requesterUserId: requester.id, stepOrder: 1 })

    console.log('\n[TEST] SALARY_CERTIFICATE')
    console.log(' step0 ->', s0)
    console.log(' step1 ->', s1)
  }

  // 2) Manager-first flow test: LEAVE (3 steps)
  {
    const req = await prisma.hRRequest.create({
      data: {
        type: 'LEAVE',
        employeeId: requester.id,
        status: 'PENDING_REVIEW',
        currentWorkflowStep: 0,
        startDate: new Date('2026-03-01T00:00:00.000Z'),
        endDate: new Date('2026-03-02T00:00:00.000Z'),
        leaveType: 'annual',
        reason: 'TEST: leave'
      }
    })
    createdIds.push(req.id)

    const s0 = await route({ requestType: req.type, requesterUserId: requester.id, stepOrder: 0 })
    const s1 = await route({ requestType: req.type, requesterUserId: requester.id, stepOrder: 1 })
    const s2 = await route({ requestType: req.type, requesterUserId: requester.id, stepOrder: 2 })

    console.log('\n[TEST] LEAVE')
    console.log(' step0 ->', s0)
    console.log(' step1 ->', s1)
    console.log(' step2 ->', s2)
  }

  // Resolve usernames for readability
  const ids = new Set()
  for (const step of [0, 1, 2]) {
    // no-op
  }

  // Cleanup
  await prisma.hRRequest.deleteMany({ where: { id: { in: createdIds } } })
  console.log(`\nCleanup: deleted ${createdIds.length} test requests`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
