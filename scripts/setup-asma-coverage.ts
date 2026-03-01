import prisma from '@/lib/prisma'

const ASMA_NATIONAL_ID = '1026380699'
const BRANCH_NAMES = ['مجمع البسام الأهلية بنات', 'مجمع البسام العالمية بنات']

async function main() {
  const asma = await prisma.employee.findFirst({
    where: { nationalId: ASMA_NATIONAL_ID },
    select: { id: true, fullNameAr: true },
  })
  if (!asma) throw new Error(`Asma employee not found by nationalId=${ASMA_NATIONAL_ID}`)

  const branches = await prisma.branch.findMany({
    where: { name: { in: BRANCH_NAMES } },
    select: { id: true, name: true },
  })

  const missing = BRANCH_NAMES.filter((n) => !branches.find((b) => b.name === n))
  if (missing.length) {
    throw new Error(`Branches not found: ${missing.join(', ')}`)
  }

  const results: any[] = []

  for (const b of branches) {
    for (const module of ['PROCUREMENT', 'MAINTENANCE'] as const) {
      const rec = await prisma.employeeBranchCoverage.upsert({
        where: {
          employeeId_branchId_module: {
            employeeId: asma.id,
            branchId: b.id,
            // @ts-ignore prisma enum
            module,
          },
        },
        update: { active: true, role: 'GATEKEEPER' },
        create: {
          employeeId: asma.id,
          branchId: b.id,
          // @ts-ignore prisma enum
          module,
          role: 'GATEKEEPER',
          active: true,
        },
      })
      results.push({ branch: b.name, module, id: rec.id })
    }
  }

  console.log(JSON.stringify({ ok: true, asma, results }, null, 2))
}

main()
  .catch((e) => {
    console.error('setup-asma-coverage failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
