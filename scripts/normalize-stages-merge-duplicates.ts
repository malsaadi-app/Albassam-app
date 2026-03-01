import prisma from '@/lib/prisma'

function canonicalStageName(name: string) {
  // Preserve suffix (عام)/(دولي) if present
  const suffixMatch = name.match(/\((عام|دولي)\)\s*$/)
  const suffix = suffixMatch ? ` (${suffixMatch[1]})` : ''
  const base = name.replace(/\s*\((عام|دولي)\)\s*$/, '').trim()

  const map: Record<string, string> = {
    'ابتدائي': 'ابتدائية',
    'ابتدائيه': 'ابتدائية',
    'ابتدائية': 'ابتدائية',
    'متوسط': 'متوسطة',
    'متوسطه': 'متوسطة',
    'متوسطة': 'متوسطة',
    'ثانوي': 'ثانوية',
    'ثانويه': 'ثانوية',
    'ثانوية': 'ثانوية',
  }

  const canonBase = map[base] || base
  return `${canonBase}${suffix}`.trim()
}

async function mergeWithinBranch(branchId: string) {
  const stages = await prisma.stage.findMany({ where: { branchId }, select: { id: true, name: true, managerId: true, deputyId: true } })

  // Group by canonical name
  const groups = new Map<string, typeof stages>()
  for (const st of stages) {
    const canon = canonicalStageName(st.name)
    const arr = groups.get(canon) || []
    arr.push(st)
    groups.set(canon, arr)
  }

  const actions: any[] = []

  for (const [canon, arr] of groups.entries()) {
    if (arr.length <= 1) {
      // Ensure name is canonical
      const only = arr[0]
      if (only && only.name !== canon) {
        await prisma.stage.update({ where: { id: only.id }, data: { name: canon } })
        actions.push({ type: 'rename', from: only.name, to: canon, stageId: only.id })
      }
      continue
    }

    // Choose keeper: prefer already-canonical name, else first
    let keeper = arr.find((s) => s.name === canon) || arr[0]

    // Ensure keeper has canonical name
    if (keeper.name !== canon) {
      await prisma.stage.update({ where: { id: keeper.id }, data: { name: canon } })
      actions.push({ type: 'rename', from: keeper.name, to: canon, stageId: keeper.id })
    }

    // Merge others into keeper
    for (const st of arr) {
      if (st.id === keeper.id) continue

      // Move employees
      const moved = await prisma.employee.updateMany({ where: { stageId: st.id }, data: { stageId: keeper.id } })

      // Keep manager/deputy if keeper empty
      if (!keeper.managerId && st.managerId) {
        await prisma.stage.update({ where: { id: keeper.id }, data: { managerId: st.managerId } })
        keeper = { ...keeper, managerId: st.managerId }
      }
      if (!keeper.deputyId && st.deputyId) {
        await prisma.stage.update({ where: { id: keeper.id }, data: { deputyId: st.deputyId } })
        keeper = { ...keeper, deputyId: st.deputyId }
      }

      // Delete duplicate stage if no employees remain
      const count = await prisma.employee.count({ where: { stageId: st.id } })
      if (count === 0) {
        await prisma.stage.delete({ where: { id: st.id } })
        actions.push({ type: 'merge_delete', fromStage: st.name, into: canon, movedEmployees: moved.count })
      } else {
        actions.push({ type: 'merge_left', fromStage: st.name, into: canon, movedEmployees: moved.count, remainingEmployees: count })
      }
    }
  }

  return actions
}

async function main() {
  const branches = await prisma.branch.findMany({ select: { id: true, name: true } })
  const results: any[] = []

  for (const b of branches) {
    const actions = await mergeWithinBranch(b.id)
    if (actions.length) results.push({ branch: b.name, actions })
  }

  console.log(JSON.stringify({ ok: true, branchesTouched: results.length, results }, null, 2))
}

main()
  .catch((e) => {
    console.error('normalize-stages-merge-duplicates failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
