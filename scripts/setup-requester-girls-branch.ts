import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'

const USERNAME = 'qa_requester_girls'
const PASSWORD = process.env.QA_PASSWORD || 'qa12345'
const BRANCH_NAME = 'مجمع البسام الأهلية بنات'

async function main() {
  const branch = await prisma.branch.findFirst({ where: { name: BRANCH_NAME }, select: { id: true, name: true } })
  if (!branch) throw new Error(`Branch not found: ${BRANCH_NAME}`)

  const passwordHash = await bcrypt.hash(PASSWORD, 10)

  const user = await prisma.user.upsert({
    where: { username: USERNAME },
    update: { displayName: 'QA Requester (Girls Branch)', role: 'USER', passwordHash, notificationsEnabled: false },
    create: { username: USERNAME, displayName: 'QA Requester (Girls Branch)', role: 'USER', passwordHash, notificationsEnabled: false },
    select: { id: true, username: true },
  })

  const emp = await prisma.employee.upsert({
    where: { nationalId: '9000000201' },
    update: { userId: user.id, fullNameAr: 'QA طالبة طلب', employeeNumber: 'QA-0201', branchId: branch.id, phone: '0500000201', nationality: 'QA', department: 'QA', position: 'Requester', basicSalary: 0 },
    create: {
      fullNameAr: 'QA طالبة طلب',
      nationalId: '9000000201',
      nationality: 'QA',
      phone: '0500000201',
      employeeNumber: 'QA-0201',
      department: 'QA',
      position: 'Requester',
      basicSalary: 0,
      dateOfBirth: new Date('1990-01-01'),
      gender: 'FEMALE',
      maritalStatus: 'SINGLE',
      hireDate: new Date(),
      employmentType: 'PERMANENT',
      status: 'ACTIVE',
      userId: user.id,
      branchId: branch.id,
    },
    select: { id: true },
  })

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

  console.log(JSON.stringify({ ok: true, branch, username: USERNAME, password: PASSWORD, userId: user.id }, null, 2))
}

main()
  .catch((e) => {
    console.error('setup-requester-girls-branch failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
