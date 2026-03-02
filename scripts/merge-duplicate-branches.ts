import prisma from '@/lib/prisma'

async function moveEmployees(fromBranchId: string, toBranchId: string) {
  const res = await prisma.employee.updateMany({
    where: { branchId: fromBranchId },
    data: { branchId: toBranchId },
  })
  return res.count
}

async function mergeStages(fromBranchId: string, toBranchId: string) {
  const fromStages = await prisma.stage.findMany({ where: { branchId: fromBranchId }, select: { id: true, name: true } })
  const toStages = await prisma.stage.findMany({ where: { branchId: toBranchId }, select: { id: true, name: true } })
  const toByName = new Map(toStages.map((s) => [s.name, s.id]))

  let movedEmployees = 0
  let deletedStages = 0
  let movedStages = 0

  for (const st of fromStages) {
    const targetStageId = toByName.get(st.name)

    if (targetStageId) {
      const moved = await prisma.employee.updateMany({ where: { stageId: st.id }, data: { stageId: targetStageId } })
      movedEmployees += moved.count

      // delete from-stage if now empty
      const remaining = await prisma.employee.count({ where: { stageId: st.id } })
      if (remaining === 0) {
        await prisma.stage.delete({ where: { id: st.id } })
        deletedStages++
      }
    } else {
      await prisma.stage.update({ where: { id: st.id }, data: { branchId: toBranchId } })
      movedStages++
    }
  }

  return { movedEmployees, deletedStages, movedStages }
}

async function inactivateBranch(branchId: string) {
  await prisma.branch.update({ where: { id: branchId }, data: { status: 'INACTIVE' } })
}

async function main() {
  const map: Array<{ fromName: string; toName: string }> = [
    {
      fromName: 'مجمع البسام الأهلية بنات',
      toName: 'مجمع البسام الأهلية للبنات',
    },
    {
      fromName: 'معهد البسام العالي للتدريب (رجالي)',
      toName: 'معهد البسام العالي للتدريب (رجالي )',
    },
  ]

  const report: any[] = []

  for (const m of map) {
    const from = await prisma.branch.findFirst({ where: { name: m.fromName }, select: { id: true, name: true, status: true } })
    const to = await prisma.branch.findFirst({ where: { name: m.toName }, select: { id: true, name: true, status: true } })

    if (!from) {
      report.push({ from: m.fromName, to: m.toName, status: 'SKIP_FROM_NOT_FOUND' })
      continue
    }
    if (!to) {
      report.push({ from: m.fromName, to: m.toName, status: 'SKIP_TO_NOT_FOUND' })
      continue
    }

    const movedEmployees = await moveEmployees(from.id, to.id)
    const stageMerge = await mergeStages(from.id, to.id)

    await inactivateBranch(from.id)

    report.push({
      from: from.name,
      to: to.name,
      movedEmployees,
      stageMerge,
      inactivated: true,
    })
  }

  console.log(JSON.stringify({ ok: true, report }, null, 2))
}

main()
  .catch((e) => {
    console.error('merge-duplicate-branches failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
