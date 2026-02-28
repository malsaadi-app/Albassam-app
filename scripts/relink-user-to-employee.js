#!/usr/bin/env node
/*
  Force re-link a User (by username) to the Employee with given nationalId.

  It will:
  - Find the currently linked employee (Employee.userId = user.id) and set its userId = null
  - Link the target employee by setting Employee.userId = user.id

  Safety:
  - Refuses if the target employee is already linked to another user.

  Usage:
    node scripts/relink-user-to-employee.js --username mohammed --nationalId 1075380111
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

  const target = await prisma.employee.findUnique({ where: { nationalId } })
  if (!target) {
    console.error('Employee not found for nationalId:', nationalId)
    process.exit(1)
  }

  if (target.userId && target.userId !== user.id) {
    console.error('Target employee is already linked to a different user:', { targetEmployeeId: target.id, existingUserId: target.userId, newUserId: user.id })
    process.exit(1)
  }

  const current = await prisma.employee.findFirst({ where: { userId: user.id } })

  await prisma.$transaction(async (tx) => {
    if (current && current.id !== target.id) {
      await tx.employee.update({ where: { id: current.id }, data: { userId: null } })
    }
    await tx.employee.update({ where: { id: target.id }, data: { userId: user.id } })
  })

  const after = await prisma.employee.findUnique({
    where: { id: target.id },
    include: { branch: true, stage: true, user: true }
  })

  console.log(JSON.stringify({
    ok: true,
    username,
    linkedTo: {
      employeeId: after.id,
      nationalId: after.nationalId,
      fullNameAr: after.fullNameAr,
      employeeNumber: after.employeeNumber,
      branch: after.branch?.name,
      stage: after.stage?.name,
    },
    unlinkedEmployeeId: current && current.id !== target.id ? current.id : null,
  }, null, 2))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
