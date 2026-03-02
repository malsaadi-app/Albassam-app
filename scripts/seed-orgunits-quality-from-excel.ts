import prisma from '@/lib/prisma'
import xlsx from 'xlsx'

const EXCEL_PATH = '/data/.openclaw/workspace/imports/employees_8branches.xlsx'

const QUALITY_DEPT_NAME = 'قسم الجودة'

// Treat these as subject sub-departments under Quality for schools
const SUBJECT_NAMES = new Set([
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
])

function norm(v: any): string | null {
  if (v === null || v === undefined) return null
  const s = String(v).trim()
  if (!s || s.toUpperCase() === 'NULL') return null
  return s
}

async function ensureOrgUnit(data: {
  branchId?: string | null
  parentId?: string | null
  name: string
  type: any
}) {
  const existing = await prisma.orgUnit.findFirst({
    where: {
      branchId: data.branchId ?? null,
      parentId: data.parentId ?? null,
      name: data.name,
      // @ts-ignore
      type: data.type,
    },
    select: { id: true },
  })
  if (existing) return existing.id

  const created = await prisma.orgUnit.create({
    data: {
      branchId: data.branchId ?? null,
      parentId: data.parentId ?? null,
      name: data.name,
      // @ts-ignore
      type: data.type,
    },
    select: { id: true },
  })
  return created.id
}

async function main() {
  const wb = xlsx.readFile(EXCEL_PATH)
  let rows: any[] = []
  for (const sh of wb.SheetNames) {
    rows = rows.concat(xlsx.utils.sheet_to_json(wb.Sheets[sh], { defval: null }))
  }

  const schoolBranches = await prisma.branch.findMany({
    where: { type: 'SCHOOL', status: 'ACTIVE' },
    select: { id: true, name: true },
  })
  const schoolByName = new Map(schoolBranches.map((b) => [b.name, b]))

  // Determine which subject departments are used per branch
  const byBranch = new Map<string, Set<string>>()

  for (const r of rows) {
    const branchName = norm(r['المجمع'])
    const dept = norm(r['القسم'])
    if (!branchName || !dept) continue

    const b = schoolByName.get(branchName)
    if (!b) continue // only schools

    if (SUBJECT_NAMES.has(dept)) {
      const set = byBranch.get(b.id) || new Set<string>()
      set.add(dept)
      byBranch.set(b.id, set)
    }
  }

  const results: any[] = []

  for (const b of schoolBranches) {
    // Branch root (optional) if we want a single root per branch
    const rootId = await ensureOrgUnit({ branchId: b.id, parentId: null, name: b.name, type: 'SCHOOL' })

    const qualityId = await ensureOrgUnit({ branchId: b.id, parentId: rootId, name: QUALITY_DEPT_NAME, type: 'DEPARTMENT' })

    const subs = [...(byBranch.get(b.id) || new Set())]
    subs.sort((a, b) => a.localeCompare(b, 'ar'))

    for (const sName of subs) {
      await ensureOrgUnit({ branchId: b.id, parentId: qualityId, name: sName, type: 'SUB_DEPARTMENT' })
    }

    results.push({ branch: b.name, subjectSubDepartments: subs.length })
  }

  console.log(JSON.stringify({ ok: true, branches: results }, null, 2))
}

main()
  .catch((e) => {
    console.error('seed-orgunits-quality-from-excel failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
