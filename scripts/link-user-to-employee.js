#!/usr/bin/env node
/*
  Link an existing User (by username) to an existing Employee (by nationalId).

  Usage:
    node scripts/link-user-to-employee.js --username mohammed --nationalId 1075380111

  Safety:
  - Refuses to link if Employee.userId is already set to a different user.
  - Refuses to link if User is already linked to another employee.
*/

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

function arg(name) {
  const i = process.argv.indexOf(`--${name}`)
  if (i === -1) return null
  return process.argv[i + 1] ?? null
}

async function main() {
  const username = arg('username')
  const nationalId = arg('nationalId')

  if (!username || !nationalId) {
    console.error('Missing required args: --username --nationalId')
    process.exit(1)
  }

  const user = await prisma.user.findUnique({ where: { username } })
  if (!user) {
    console.error('User not found:', username)
    process.exit(1)
  }

  const emp = await prisma.employee.findUnique({ where: { nationalId } })
  if (!emp) {
    console.error('Employee not found for nationalId:', nationalId)
    process.exit(1)
  }

  if (emp.userId && emp.userId !== user.id) {
    console.error('Employee is already linked to a different user:', { employeeId: emp.id, existingUserId: emp.userId, newUserId: user.id })
    process.exit(1)
  }

  const otherEmp = await prisma.employee.findFirst({ where: { userId: user.id } })
  if (otherEmp && otherEmp.id !== emp.id) {
    console.error('User is already linked to a different employee:', { username, userId: user.id, otherEmployeeId: otherEmp.id, targetEmployeeId: emp.id })
    process.exit(1)
  }

  await prisma.employee.update({ where: { id: emp.id }, data: { userId: user.id } })

  const updated = await prisma.employee.findUnique({
    where: { id: emp.id },
    select: { id: true, fullNameAr: true, nationalId: true, employeeNumber: true, user: { select: { username: true, role: true } } }
  })

  console.log(JSON.stringify({ ok: true, linked: updated }, null, 2))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
