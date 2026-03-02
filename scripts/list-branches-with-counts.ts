import prisma from '@/lib/prisma'

async function main() {
  const branches = await prisma.branch.findMany({
    select: {
      id: true,
      name: true,
      type: true,
      status: true,
      _count: { select: { employees: true, stages: true } },
    },
    orderBy: { name: 'asc' },
  })

  console.log(
    JSON.stringify(
      branches.map((b) => ({
        id: b.id,
        name: b.name,
        type: b.type,
        status: b.status,
        employees: b._count.employees,
        stages: b._count.stages,
      })),
      null,
      2
    )
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
