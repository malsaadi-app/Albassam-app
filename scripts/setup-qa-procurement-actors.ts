import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'

const QA_PASSWORD = process.env.QA_PASSWORD || 'qa12345'

const USERS = [
  { username: 'qa_asma', displayName: 'QA Asma (Gatekeeper)', role: 'ADMIN' as const, nationalId: '9000000101', employeeNumber: 'QA-0101' },
  { username: 'qa_mq', displayName: 'QA mq (Procurement)', role: 'ADMIN' as const, nationalId: '9000000102', employeeNumber: 'QA-0102' },
  { username: 'qa_abdullah', displayName: 'QA Abdullah (Buyer)', role: 'ADMIN' as const, nationalId: '9000000103', employeeNumber: 'QA-0103' },
]

const QA_BRANCHES = ['مجمع البسام الأهلية بنات', 'مجمع البسام العالمية بنات']

async function main() {
  const passwordHash = await bcrypt.hash(QA_PASSWORD, 10)

  const qaUsers: { username: string; id: string }[] = []

  for (const u of USERS) {
    const user = await prisma.user.upsert({
      where: { username: u.username },
      update: { displayName: u.displayName, role: u.role, passwordHash, notificationsEnabled: false },
      create: { username: u.username, displayName: u.displayName, role: u.role, passwordHash, notificationsEnabled: false },
      select: { id: true, username: true },
    })

    // Ensure employee
    const emp = await prisma.employee.upsert({
      where: { nationalId: u.nationalId },
      update: { fullNameAr: u.displayName, employeeNumber: u.employeeNumber, userId: user.id, phone: '0500000100', nationality: 'QA', department: 'QA', position: u.displayName, basicSalary: 0 },
      create: {
        fullNameAr: u.displayName,
        nationalId: u.nationalId,
        nationality: 'QA',
        phone: '0500000100',
        employeeNumber: u.employeeNumber,
        department: 'QA',
        position: u.displayName,
        basicSalary: 0,
        dateOfBirth: new Date('1990-01-01'),
        gender: 'MALE',
        maritalStatus: 'SINGLE',
        hireDate: new Date(),
        employmentType: 'PERMANENT',
        status: 'ACTIVE',
        userId: user.id,
      },
      select: { id: true },
    })

    qaUsers.push({ username: user.username, id: user.id })

    // Ensure leave balance record exists (safe)
    await prisma.leaveBalance.upsert({
      where: { employeeId: emp.id },
      update: {},
      create: {
        employeeId: emp.id,
        year: new Date().getFullYear(),
        annualTotal: 30,
        annualUsed: 0,
        annualRemaining: 30,
        casualTotal: 5,
        casualUsed: 0,
        casualRemaining: 5,
        emergencyTotal: 0,
        emergencyUsed: 0,
        emergencyRemaining: 0,
      },
    })
  }

  // Add coverage for qa_asma gatekeeper for both branches
  const qaAsma = await prisma.employee.findFirst({ where: { nationalId: '9000000101' }, select: { id: true } })
  if (!qaAsma) throw new Error('qa_asma employee not found')

  const branches = await prisma.branch.findMany({ where: { name: { in: QA_BRANCHES } }, select: { id: true, name: true } })
  for (const b of branches) {
    for (const module of ['PROCUREMENT', 'MAINTENANCE'] as const) {
      await prisma.employeeBranchCoverage.upsert({
        where: {
          employeeId_branchId_module: {
            employeeId: qaAsma.id,
            branchId: b.id,
            // @ts-ignore
            module,
          },
        },
        update: { active: true, role: 'GATEKEEPER' },
        create: { employeeId: qaAsma.id, branchId: b.id, // @ts-ignore
          module, active: true, role: 'GATEKEEPER' },
      })
    }
  }

  console.log(JSON.stringify({ ok: true, qaPassword: QA_PASSWORD, users: USERS.map(u=>u.username) }, null, 2))
}

main()
  .catch((e) => {
    console.error('setup-qa-procurement-actors failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
