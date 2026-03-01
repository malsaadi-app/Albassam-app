import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'

/**
 * Generate login users for employees who have no linked userId.
 * Username = nationalId digits, Password = same (hashed).
 *
 * Scope: ONLY employees with userId = null.
 */

function digits(s: string) {
  return s.replace(/\D/g, '')
}

async function main() {
  const employees = await prisma.employee.findMany({
    where: {
      userId: null,
      nationalId: { not: '' },
    },
    select: {
      id: true,
      nationalId: true,
      fullNameAr: true,
      employeeNumber: true,
    },
  })

  let created = 0
  let updatedExisting = 0
  let linked = 0
  const skipped: any[] = []

  for (const emp of employees) {
    const nid = digits(emp.nationalId || '')
    if (!nid) {
      skipped.push({ employeeId: emp.id, name: emp.fullNameAr, reason: 'NO_NATIONAL_ID' })
      continue
    }

    const passwordHash = await bcrypt.hash(nid, 10)

    const existingUser = await prisma.user.findUnique({
      where: { username: nid },
      select: { id: true },
    })

    if (existingUser) {
      // Update password for testing + link to employee
      await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          passwordHash,
        },
      })
      updatedExisting++

      await prisma.employee.update({
        where: { id: emp.id },
        data: { userId: existingUser.id },
      })
      linked++
      continue
    }

    const user = await prisma.user.create({
      data: {
        username: nid,
        displayName: emp.fullNameAr,
        role: 'USER',
        passwordHash,
        notificationsEnabled: false,
      },
      select: { id: true },
    })

    await prisma.employee.update({
      where: { id: emp.id },
      data: { userId: user.id },
    })

    created++
    linked++
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        employeesWithoutUserBefore: employees.length,
        usersCreated: created,
        usersPasswordResetExisting: updatedExisting,
        employeesLinked: linked,
        skippedCount: skipped.length,
        skipped: skipped.slice(0, 20),
      },
      null,
      2
    )
  )
}

main()
  .catch((e) => {
    console.error('generate-missing-users-from-nationalid failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
