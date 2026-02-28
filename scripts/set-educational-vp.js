#!/usr/bin/env node
/*
  Set branch VP educational affairs user.

  Usage:
    node scripts/set-educational-vp.js --branch "مجمع البسام الأهلية بنين" --username 1002638862
*/

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

function arg(name) {
  const i = process.argv.indexOf(`--${name}`)
  if (i === -1) return null
  return process.argv[i + 1] ?? null
}

async function main() {
  const branchName = arg('branch')
  const username = arg('username')
  if (!branchName || !username) {
    console.error('Missing required args: --branch --username')
    process.exit(1)
  }

  const branch = await prisma.branch.findFirst({ where: { name: branchName } })
  if (!branch) {
    console.error('Branch not found:', branchName)
    process.exit(1)
  }

  const user = await prisma.user.findUnique({ where: { username } })
  if (!user) {
    console.error('User not found:', username)
    process.exit(1)
  }

  const row = await prisma.educationalRoutingSettings.upsert({
    where: { branchId: branch.id },
    create: { branchId: branch.id, vpEducationalUserId: user.id },
    update: { vpEducationalUserId: user.id },
  })

  console.log(JSON.stringify({ ok: true, branch: branch.name, vpUsername: user.username, row }, null, 2))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
