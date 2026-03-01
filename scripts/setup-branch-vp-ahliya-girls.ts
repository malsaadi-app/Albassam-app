import prisma from '@/lib/prisma'

const BRANCH_NAME = 'مجمع البسام الأهلية للبنات'
const VP_USERNAME = 'basmah'

async function main() {
  const branch = await prisma.branch.findFirst({ where: { name: BRANCH_NAME }, select: { id: true, name: true } })
  if (!branch) throw new Error(`Branch not found: ${BRANCH_NAME}`)

  const vpUser = await prisma.user.findUnique({ where: { username: VP_USERNAME }, select: { id: true, username: true, displayName: true } })
  if (!vpUser) throw new Error(`VP user not found: ${VP_USERNAME}`)

  await prisma.educationalRoutingSettings.upsert({
    where: { branchId: branch.id },
    update: { vpEducationalUserId: vpUser.id },
    create: { branchId: branch.id, vpEducationalUserId: vpUser.id },
  })

  console.log(JSON.stringify({ ok: true, branch, vpUser }, null, 2))
}

main()
  .catch((e) => {
    console.error('setup-branch-vp-ahliya-girls failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
