#!/usr/bin/env node
/*
  Fix employee.stageId based on Employee.schoolName and department.

  This uses the same heuristics as import, but applies as a cleanup pass.

  Safe rules:
  - Only update employees that have branchId.
  - Determine target stage name from schoolName/department:
      'ابتدائية' | 'متوسطة' | 'ثانوية' | 'رياض أطفال' | 'إدارة'
    else leave unchanged.
  - Update when:
      * stageId is null, OR
      * current stage is null, OR
      * current stage name is 'عام', OR
      * current stage name differs from detected target.

  Use --dry-run to preview changes.

  It will ensure the stage exists under the employee's branch.

  Usage:
    node scripts/fix-employee-stages-from-schoolname.js
*/

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

function detectStageName(schoolName, dept) {
  const t = `${schoolName || ''} ${dept || ''}`.replace(/\s+/g, ' ').trim()
  if (!t) return null
  if (/إدارة عليا/.test(t)) return 'إدارة'
  if (/(رياض\s*أطفال|رياض الأطفال|روضة|تمهيدي)/.test(t)) return 'رياض أطفال'
  if (/ابتدائ|الصفوف الأولية|الأولية/.test(t)) return 'ابتدائية'
  if (/متوسط/.test(t)) return 'متوسطة'
  if (/ثانوي|الثانوية/.test(t)) return 'ثانوية'
  return null
}

async function ensureStage(branchId, name) {
  const existing = await prisma.stage.findFirst({ where: { branchId, name } })
  if (existing) return existing
  return prisma.stage.create({ data: { branchId, name, status: 'ACTIVE' } })
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')

  const candidates = await prisma.employee.findMany({
    where: {
      branchId: { not: null },
    },
    select: {
      id: true,
      fullNameAr: true,
      branchId: true,
      branch: { select: { name: true } },
      schoolName: true,
      department: true,
      stageId: true,
      stage: { select: { name: true } },
    },
  })

  let updated = 0
  let skipped = 0
  const sampleChanges = []

  for (const e of candidates) {
    if (!e.schoolName && !e.department) {
      skipped++
      continue
    }

    const target = detectStageName(e.schoolName, e.department)
    if (!target) {
      skipped++
      continue
    }

    const currentName = e.stage?.name || null
    const shouldUpdate = !currentName || currentName === 'عام' || currentName !== target

    if (!shouldUpdate) {
      skipped++
      continue
    }

    const stage = await ensureStage(e.branchId, target)

    if (!dryRun) {
      await prisma.employee.update({
        where: { id: e.id },
        data: { stageId: stage.id },
      })
    }

    updated++
    if (sampleChanges.length < 15) {
      sampleChanges.push({
        employee: e.fullNameAr,
        branch: e.branch?.name,
        schoolName: e.schoolName,
        from: currentName,
        to: target,
      })
    }
  }

  console.log(
    JSON.stringify({ ok: true, dryRun, candidates: candidates.length, updated, skipped, sampleChanges }, null, 2)
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
