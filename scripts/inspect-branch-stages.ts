import prisma from '@/lib/prisma'

const FROM = process.env.FROM || 'مجمع البسام الأهلية بنات'
const TO = process.env.TO || 'مجمع البسام الأهلية للبنات'

async function main() {
  const from = await prisma.branch.findFirst({ where: { name: FROM }, select: { id: true, name: true } })
  const to = await prisma.branch.findFirst({ where: { name: TO }, select: { id: true, name: true } })

  if (!from || !to) {
    console.log({ from, to })
    return
  }

  const stagesFrom = await prisma.stage.findMany({ where: { branchId: from.id }, select: { id: true, name: true } })
  const stagesTo = await prisma.stage.findMany({ where: { branchId: to.id }, select: { id: true, name: true } })

  console.log(JSON.stringify({ from: from.name, to: to.name, stagesFrom, stagesTo }, null, 2))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
