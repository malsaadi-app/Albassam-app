import prisma from '@/lib/prisma'

const SUBJECTS = [
  'اللغة العربية',
  'اللغة الإنجليزية',
  'الرياضيات',
  'العلوم',
  'الاجتماعيات',
  'الحاسب الآلي',
  'التربية الإسلامية',
  'التربية البدنية',
  'التربية الفنية',
  'الصفوف الأولية',
]

function normalizeName(name: string) {
  // Ensure subject sub-departments are prefixed with "قسم "
  if (name.startsWith('قسم ')) return name
  if (SUBJECTS.includes(name)) return `قسم ${name}`
  return name
}

async function main() {
  const units = await prisma.orgUnit.findMany({
    where: { type: 'SUB_DEPARTMENT' },
    select: { id: true, name: true },
  })

  let renamed = 0
  for (const u of units) {
    const next = normalizeName(u.name)
    if (next !== u.name) {
      await prisma.orgUnit.update({ where: { id: u.id }, data: { name: next } })
      renamed++
    }
  }

  console.log(JSON.stringify({ ok: true, total: units.length, renamed }, null, 2))
}

main()
  .catch((e) => {
    console.error('normalize-quality-orgunit-names failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
