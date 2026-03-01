import prisma from '@/lib/prisma'

const BRANCH_NAME = 'مجمع البسام العالمية بنات'

const VP_NATIONAL_ID = '1003907209' // باسمه
const ALL_STAGES_MANAGER_NATIONAL_ID = '1003865704' // لطيفة

async function main() {
  const branch = await prisma.branch.findFirst({ where: { name: BRANCH_NAME }, select: { id: true, name: true } })
  if (!branch) throw new Error(`Branch not found: ${BRANCH_NAME}`)

  // VP educational
  const vpEmp = await prisma.employee.findFirst({ where: { nationalId: VP_NATIONAL_ID }, select: { id: true, userId: true, fullNameAr: true } })
  if (!vpEmp?.userId) throw new Error(`VP employee/user not found or not linked: nationalId=${VP_NATIONAL_ID}`)

  await prisma.educationalRoutingSettings.upsert({
    where: { branchId: branch.id },
    update: { vpEducationalUserId: vpEmp.userId },
    create: { branchId: branch.id, vpEducationalUserId: vpEmp.userId },
  })

  // Stage manager (all stages)
  const mgrEmp = await prisma.employee.findFirst({ where: { nationalId: ALL_STAGES_MANAGER_NATIONAL_ID }, select: { id: true, fullNameAr: true } })
  if (!mgrEmp) throw new Error(`Stage manager employee not found: nationalId=${ALL_STAGES_MANAGER_NATIONAL_ID}`)

  const stages = await prisma.stage.findMany({ where: { branchId: branch.id }, select: { id: true, name: true } })

  const updates: any[] = []
  for (const st of stages) {
    // Only assign for educational stages; keep 'إدارة عليا' optionally unassigned (per later changes)
    if (st.name.includes('إدارة عليا')) continue
    await prisma.stage.update({ where: { id: st.id }, data: { managerId: mgrEmp.id } })
    updates.push({ stage: st.name, manager: mgrEmp.fullNameAr })
  }

  console.log(JSON.stringify({ ok: true, branch, vp: { nationalId: VP_NATIONAL_ID, name: vpEmp.fullNameAr }, manager: { nationalId: ALL_STAGES_MANAGER_NATIONAL_ID, name: mgrEmp.fullNameAr }, updates }, null, 2))
}

main()
  .catch((e) => {
    console.error('setup-branch-management-intl-girls failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
