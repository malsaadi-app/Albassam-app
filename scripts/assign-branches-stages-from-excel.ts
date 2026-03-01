import prisma from '@/lib/prisma'
import xlsx from 'xlsx'

const EXCEL_PATH = '/data/.openclaw/workspace/imports/employees_8branches.xlsx'

function norm(v: any): string | null {
  if (v === null || v === undefined) return null
  const s = String(v).trim()
  if (!s || s.toUpperCase() === 'NULL') return null
  return s
}

function digits(v: any): string | null {
  const s = norm(v)
  if (!s) return null
  const d = s.replace(/\D/g, '')
  return d || null
}

function stageBaseFromSchool(school: string | null): string | null {
  if (!school) return null
  if (school.includes('رياض')) return 'رياض أطفال'
  if (school.includes('ابتد')) return 'ابتدائي'
  if (school.includes('متوسط') || school.includes('المتوسطة')) return 'متوسط'
  if (school.includes('ثان')) return 'ثانوي'
  if (school.includes('الإدارة العليا')) return 'إدارة عليا'
  return null
}

function isInternationalSchool(school: string | null): boolean {
  if (!school) return false
  return school.includes('الدولية') || school.includes('دولية')
}

function stageNameFor(opts: { branchName: string; base: string; international: boolean }): string {
  const { branchName, base, international } = opts

  // Note (per محمد): العالمية بنات ما لها تقسيم محلي/دولي عادة.
  // For girls Ahlia branch, we name local as (عام) and international as (دولي).
  if (branchName === 'مجمع البسام الأهلية للبنات') {
    return `${base} (${international ? 'دولي' : 'عام'})`
  }

  // Default: keep base stage name, unless explicitly international appears.
  if (international) return `${base} (دولي)`
  return base
}

async function ensureStage(branchId: string, name: string) {
  const existing = await prisma.stage.findFirst({ where: { branchId, name }, select: { id: true } })
  if (existing) return existing.id
  const created = await prisma.stage.create({ data: { branchId, name }, select: { id: true } })
  return created.id
}

async function main() {
  const wb = xlsx.readFile(EXCEL_PATH)
  const allRows: any[] = []
  for (const sh of wb.SheetNames) {
    const rows = xlsx.utils.sheet_to_json(wb.Sheets[sh], { defval: null })
    for (const r of rows) allRows.push(r)
  }

  // Load branches by exact name present in Excel
  const branchNames = [...new Set(allRows.map((r) => norm(r['المجمع'])).filter(Boolean) as string[])]
  const branches = await prisma.branch.findMany({ where: { name: { in: branchNames } }, select: { id: true, name: true } })
  const branchByName = new Map(branches.map((b) => [b.name, b]))

  const missingBranches = branchNames.filter((n) => !branchByName.has(n))
  if (missingBranches.length) {
    throw new Error(`Missing branches in DB (create them first): ${missingBranches.join(' | ')}`)
  }

  // Pre-create stages discovered in the Excel
  const stageCache = new Map<string, string>()
  let stagesCreated = 0

  for (const r of allRows) {
    const branchName = norm(r['المجمع'])
    const school = norm(r['المدرسة'])
    if (!branchName || !school) continue

    const base = stageBaseFromSchool(school)
    if (!base) continue

    const intl = isInternationalSchool(school)
    const stageName = stageNameFor({ branchName, base, international: intl })

    const branch = branchByName.get(branchName)!
    const key = `${branch.id}::${stageName}`
    if (!stageCache.has(key)) {
      const id = await ensureStage(branch.id, stageName)
      stageCache.set(key, id)
      // best-effort count (cannot detect create vs existing without extra query)
      stagesCreated++
    }
  }

  // Assign employees
  let updated = 0
  let skippedNoId = 0
  let skippedNoStage = 0
  let missingEmployees = 0

  for (const r of allRows) {
    const branchName = norm(r['المجمع'])
    const school = norm(r['المدرسة'])
    const nationalId = digits(r['رقم الهوية'])

    if (!nationalId) {
      skippedNoId++
      continue
    }

    if (!branchName) continue
    const branch = branchByName.get(branchName)!

    let stageId: string | null = null
    const base = stageBaseFromSchool(school)
    if (base && school) {
      const intl = isInternationalSchool(school)
      const stageName = stageNameFor({ branchName, base, international: intl })
      const key = `${branch.id}::${stageName}`
      stageId = stageCache.get(key) || null
    } else {
      // As requested: leave stage empty for NULL/unmapped schools
      skippedNoStage++
    }

    const emp = await prisma.employee.findFirst({ where: { nationalId }, select: { id: true } })
    if (!emp) {
      missingEmployees++
      continue
    }

    await prisma.employee.update({
      where: { id: emp.id },
      data: {
        branchId: branch.id,
        stageId,
      },
    })
    updated++
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        excel: EXCEL_PATH,
        totalRows: allRows.length,
        branches: branchNames.length,
        stageCache: stageCache.size,
        stagesTouchedApprox: stagesCreated,
        employeesUpdated: updated,
        skippedNoNationalId: skippedNoId,
        skippedNoStage: skippedNoStage,
        missingEmployees,
      },
      null,
      2
    )
  )
}

main()
  .catch((e) => {
    console.error('assign-branches-stages-from-excel failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
