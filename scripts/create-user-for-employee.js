#!/usr/bin/env node
/*
  Create (or upsert) a User account for an existing Employee and link it.

  Usage:
    node scripts/create-user-for-employee.js --nationalId 2189... --username mokesh --displayName "موكيش تشاند" --role USER --password Test1234 --maintenanceRole TECHNICIAN --maintenanceTeam BUILDING

  Notes:
  - Password is hashed with bcrypt.
  - Links by setting Employee.userId = User.id
*/

const bcrypt = require('bcryptjs')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

function arg(name, def = null) {
  const i = process.argv.indexOf(`--${name}`)
  if (i === -1) return def
  return process.argv[i + 1] ?? def
}

async function main() {
  const nationalId = arg('nationalId')
  const username = arg('username')
  const displayName = arg('displayName')
  const role = arg('role', 'USER')
  const password = arg('password', 'Test1234')
  const maintenanceRole = arg('maintenanceRole', null)
  const maintenanceTeam = arg('maintenanceTeam', null)

  if (!nationalId || !username || !displayName) {
    console.error('Missing required args: --nationalId --username --displayName')
    process.exit(1)
  }

  const emp = await prisma.employee.findUnique({ where: { nationalId } })
  if (!emp) {
    console.error('Employee not found for nationalId:', nationalId)
    process.exit(1)
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const user = await prisma.user.upsert({
    where: { username },
    create: { username, displayName, role, passwordHash },
    update: { displayName, role, passwordHash },
  })

  // Link employee -> user
  await prisma.employee.update({
    where: { id: emp.id },
    data: {
      userId: user.id,
      ...(maintenanceRole ? { maintenanceRole } : {}),
      ...(maintenanceTeam ? { maintenanceTeam } : {}),
    },
  })

  console.log(JSON.stringify({ ok: true, username: user.username, userId: user.id, employeeId: emp.id }, null, 2))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
