import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'

type QaUserSpec = {
  username: string
  displayName: string
  role: 'ADMIN' | 'HR_EMPLOYEE' | 'USER'
  employee: {
    fullNameAr: string
    nationalId: string
    nationality: string
    phone: string
    employeeNumber: string
    department: string
    position: string
    basicSalary: number
  }
}

const QA_PASSWORD = process.env.QA_PASSWORD || 'qa12345'

const QA_BRANCHES = [
  { name: 'مدارس البسام الأهلية بنين — QA', type: 'SCHOOL' as const },
  { name: 'مدارس البسام الأهلية بنات — QA', type: 'SCHOOL' as const },
]

const QA_USERS: QaUserSpec[] = [
  {
    username: 'qa_admin',
    displayName: 'QA Admin',
    role: 'ADMIN',
    employee: {
      fullNameAr: 'QA Admin',
      nationalId: '9000000001',
      nationality: 'QA',
      phone: '0500000001',
      employeeNumber: 'QA-0001',
      department: 'QA',
      position: 'QA Admin',
      basicSalary: 0,
    },
  },
  {
    username: 'qa_hr',
    displayName: 'QA HR',
    role: 'HR_EMPLOYEE',
    employee: {
      fullNameAr: 'QA HR',
      nationalId: '9000000002',
      nationality: 'QA',
      phone: '0500000002',
      employeeNumber: 'QA-0002',
      department: 'QA',
      position: 'QA HR',
      basicSalary: 0,
    },
  },
  {
    username: 'qa_user',
    displayName: 'QA User',
    role: 'USER',
    employee: {
      fullNameAr: 'QA User',
      nationalId: '9000000003',
      nationality: 'QA',
      phone: '0500000003',
      employeeNumber: 'QA-0003',
      department: 'QA',
      position: 'QA User',
      basicSalary: 0,
    },
  },
]

async function ensureBranches() {
  const created: any[] = []
  for (const b of QA_BRANCHES) {
    const existing = await prisma.branch.findFirst({ where: { name: b.name } })
    if (existing) {
      created.push({ id: existing.id, name: existing.name, status: 'exists' })
      continue
    }

    const branch = await prisma.branch.create({
      data: {
        name: b.name,
        // @ts-ignore prisma enum
        type: b.type,
        // status defaults to ACTIVE
        city: 'Riyadh',
      },
    })
    created.push({ id: branch.id, name: branch.name, status: 'created' })

    // Create a few default stages for this QA branch (safe + helps routing)
    const stageNames = ['ابتدائي', 'متوسط', 'ثانوي']
    for (const sName of stageNames) {
      const existingStage = await prisma.stage.findFirst({
        where: { branchId: branch.id, name: sName },
      })
      if (!existingStage) {
        await prisma.stage.create({
          data: {
            name: sName,
            branchId: branch.id,
          },
        })
      }
    }
  }
  return created
}

async function ensureUsersAndEmployees(primaryBranchId: string) {
  const results: any[] = []

  for (const spec of QA_USERS) {
    const passwordHash = await bcrypt.hash(QA_PASSWORD, 10)

    const user = await prisma.user.upsert({
      where: { username: spec.username },
      update: {
        displayName: spec.displayName,
        role: spec.role,
        passwordHash,
        notificationsEnabled: false,
      },
      create: {
        username: spec.username,
        displayName: spec.displayName,
        role: spec.role,
        passwordHash,
        notificationsEnabled: false,
      },
      select: { id: true, username: true, role: true },
    })

    // Ensure employee record linked to this user
    const existingEmp = await prisma.employee.findFirst({
      where: {
        OR: [{ userId: user.id }, { nationalId: spec.employee.nationalId }, { employeeNumber: spec.employee.employeeNumber }],
      },
      select: { id: true },
    })

    let employeeId: string
    if (existingEmp?.id) {
      const updated = await prisma.employee.update({
        where: { id: existingEmp.id },
        data: {
          fullNameAr: spec.employee.fullNameAr,
          nationalId: spec.employee.nationalId,
          nationality: spec.employee.nationality,
          phone: spec.employee.phone,
          employeeNumber: spec.employee.employeeNumber,
          department: spec.employee.department,
          position: spec.employee.position,
          basicSalary: spec.employee.basicSalary,
          userId: user.id,
          branchId: primaryBranchId,
        },
        select: { id: true },
      })
      employeeId = updated.id
    } else {
      const created = await prisma.employee.create({
        data: {
          fullNameAr: spec.employee.fullNameAr,
          nationalId: spec.employee.nationalId,
          nationality: spec.employee.nationality,
          phone: spec.employee.phone,
          employeeNumber: spec.employee.employeeNumber,
          department: spec.employee.department,
          position: spec.employee.position,
          basicSalary: spec.employee.basicSalary,
          userId: user.id,
          branchId: primaryBranchId,
        },
        select: { id: true },
      })
      employeeId = created.id
    }

    results.push({ username: user.username, role: user.role, employeeId })
  }

  return results
}

async function main() {
  const branches = await ensureBranches()
  const primaryQaBranch = await prisma.branch.findFirst({ where: { name: QA_BRANCHES[0].name } })
  if (!primaryQaBranch) throw new Error('QA branch not found after creation')

  const users = await ensureUsersAndEmployees(primaryQaBranch.id)

  console.log(JSON.stringify({
    ok: true,
    qaPassword: QA_PASSWORD,
    branches,
    users,
  }, null, 2))
}

main()
  .catch((e) => {
    console.error('setup-qa-prod failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
