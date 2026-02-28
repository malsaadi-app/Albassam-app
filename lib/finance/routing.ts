import prisma from '@/lib/prisma'

export async function resolveFinanceRouting(department: string) {
  // For now:
  // - HR department manager = user "mohammed" (admin)
  // - accountant = "aljili"
  // - finance manager = "mustafa"

  const [deptMgr, accountant, financeMgr] = await Promise.all([
    prisma.user.findUnique({ where: { username: department === 'HR' ? 'mohammed' : 'mohammed' } }),
    prisma.user.findUnique({ where: { username: 'aljili' } }),
    prisma.user.findUnique({ where: { username: 'mustafa' } })
  ])

  return {
    departmentManagerUserId: deptMgr?.id ?? null,
    accountantUserId: accountant?.id ?? null,
    financeManagerUserId: financeMgr?.id ?? null
  }
}

export function canCreateFinanceRequest(role: string) {
  return role === 'HR_EMPLOYEE' || role === 'PROCUREMENT_OFFICER' || role === 'ADMIN'
}
