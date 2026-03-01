import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'

const PASSWORD = process.env.PASSWORD || 'Test1234'

const USERS = [
  { nationalId: '1003907209', username: 'basmah', role: 'ADMIN' as const }, // باسمه
]

async function main() {
  const hash = await bcrypt.hash(PASSWORD, 10)
  const results: any[] = []

  for (const u of USERS) {
    const emp = await prisma.employee.findFirst({ where: { nationalId: u.nationalId }, select: { id: true, fullNameAr: true, userId: true } })
    if (!emp) throw new Error(`Employee not found: ${u.nationalId}`)

    const user = await prisma.user.upsert({
      where: { username: u.username },
      update: { displayName: emp.fullNameAr, role: u.role, passwordHash: hash, notificationsEnabled: false },
      create: { username: u.username, displayName: emp.fullNameAr, role: u.role, passwordHash: hash, notificationsEnabled: false },
      select: { id: true, username: true },
    })

    await prisma.employee.update({ where: { id: emp.id }, data: { userId: user.id } })

    results.push({ nationalId: u.nationalId, name: emp.fullNameAr, username: user.username, password: PASSWORD })
  }

  console.log(JSON.stringify({ ok: true, results }, null, 2))
}

main()
  .catch((e) => {
    console.error('link-branch-vp-users failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
