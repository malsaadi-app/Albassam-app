import prisma from '@/lib/prisma'

const NATIONAL_ID = process.env.NATIONAL_ID || '1003907209'

async function main() {
  const emp = await prisma.employee.findFirst({
    where: { nationalId: NATIONAL_ID },
    select: { id: true, fullNameAr: true, userId: true, branch: { select: { name: true } }, stage: { select: { name: true } } },
  })
  console.log(JSON.stringify(emp, null, 2))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
