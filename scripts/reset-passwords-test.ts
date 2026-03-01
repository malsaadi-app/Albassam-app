import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'

const NEW_PASSWORD = process.env.NEW_PASSWORD || 'Test1234'

const USERNAMES = ['asma', 'mq', 'abdullahsh']

async function main() {
  const passwordHash = await bcrypt.hash(NEW_PASSWORD, 10)

  const results: any[] = []
  for (const username of USERNAMES) {
    const existing = await prisma.user.findUnique({ where: { username }, select: { id: true, username: true, displayName: true } })
    if (!existing) {
      results.push({ username, status: 'NOT_FOUND' })
      continue
    }

    await prisma.user.update({
      where: { username },
      data: { passwordHash },
    })

    results.push({ username, status: 'UPDATED', id: existing.id, displayName: existing.displayName })
  }

  console.log(JSON.stringify({ ok: true, newPassword: NEW_PASSWORD, results }, null, 2))
}

main()
  .catch((e) => {
    console.error('reset-passwords-test failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
