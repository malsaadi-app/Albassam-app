import prisma from '@/lib/prisma'

const BRANCH_NAME = 'مجمع البسام الأهلية بنين'

const VP_NATIONAL_ID = '1002638862'
const MANAGERS: Record<string, string> = {
  'ابتدائي': '1003048657',
  'متوسط': '1043334430',
  'ثانوي': '1021041577',
}

async function main() {
  const branch = await prisma.branch.findFirst({ where: { name: BRANCH_NAME }, select: { id: true, name: true } })
  if (!branch) throw new Error(`Branch not found: ${BRANCH_NAME}`)

  // Ensure EducationalRoutingSettings exists and set VP
  const vpEmp = await prisma.employee.findFirst({ where: { nationalId: VP_NATIONAL_ID }, select: { userId: true, fullNameAr: true, id: true } })
  if (!vpEmp?.userId) throw new Error(`VP employee/user not found or not linked: nationalId=${VP_NATIONAL_ID}`)

  await prisma.educationalRoutingSettings.upsert({
    where: { branchId: branch.id },
    update: { vpEducationalUserId: vpEmp.userId },
    create: { branchId: branch.id, vpEducationalUserId: vpEmp.userId },
  })

  // Assign stage managers
  const stages = await prisma.stage.findMany({ where: { branchId: branch.id }, select: { id: true, name: true } })

  const updates: any[] = []
  for (const st of stages) {
    const key = Object.keys(MANAGERS).find((k) => st.name.includes(k))
    if (!key) continue

    const mgrNationalId = MANAGERS[key]
    const mgrEmp = await prisma.employee.findFirst({ where: { nationalId: mgrNationalId }, select: { id: true, fullNameAr: true } })
    if (!mgrEmp) throw new Error(`Manager employee not found: stage=${st.name} nationalId=${mgrNationalId}`)

    await prisma.stage.update({ where: { id: st.id }, data: { managerId: mgrEmp.id } })
    updates.push({ stage: st.name, managerNationalId: mgrNationalId, manager: mgrEmp.fullNameAr })
  }

  console.log(JSON.stringify({ ok: true, branch, vp: { nationalId: VP_NATIONAL_ID, employeeId: vpEmp.id, name: vpEmp.fullNameAr }, updates }, null, 2))
}

main()
  .catch((e) => {
    console.error('setup-branch-management-boys failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
