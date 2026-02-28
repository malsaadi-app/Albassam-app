#!/usr/bin/env node
/*
  Upsert EmployeeBranchCoverage records.

  Usage examples:
    node scripts/set-employee-coverage.js --nationalId 1058789486 --module HR --branch "مجمع البسام الأهلية للبنات" --role HR_BRANCH

  Params:
    --nationalId  <employee national id>
    --module      HR|PROCUREMENT|MAINTENANCE
    --branch      branch name (exact)
    --role        optional free text
    --active      true|false (default true)
*/

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

function arg(name, def = null) {
  const i = process.argv.indexOf(`--${name}`)
  if (i === -1) return def
  return process.argv[i + 1] ?? def
}

async function main() {
  const nationalId = arg('nationalId')
  const module = arg('module')
  const branchName = arg('branch')
  const role = arg('role', null)
  const activeRaw = arg('active', 'true')
  const active = activeRaw !== 'false'

  if (!nationalId || !module || !branchName) {
    console.error('Missing required args: --nationalId --module --branch')
    process.exit(1)
  }

  const emp = await prisma.employee.findUnique({ where: { nationalId } })
  if (!emp) {
    console.error('Employee not found:', nationalId)
    process.exit(1)
  }

  const branch = await prisma.branch.findFirst({ where: { name: branchName } })
  if (!branch) {
    console.error('Branch not found by name:', branchName)
    process.exit(1)
  }

  const cov = await prisma.employeeBranchCoverage.upsert({
    where: { employeeId_branchId_module: { employeeId: emp.id, branchId: branch.id, module } },
    create: { employeeId: emp.id, branchId: branch.id, module, role, active },
    update: { role, active },
  })

  console.log(JSON.stringify({ ok: true, coverage: cov }, null, 2))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
