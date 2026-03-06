const { PrismaClient } = require('@prisma/client');
(async () => {
  const p = new PrismaClient();
  try {
    const emp = await p.employee.findFirst({ where: { email: 'mohammed.q@bassamgroup.com' } });
    if (!emp) { console.log('employee not found'); return; }
    const branchId = emp.branchId;
    const stages = ['ابتدائي', 'متوسط', 'ثانوي'];
    for (const name of stages) {
      const existing = await p.orgUnit.findFirst({ where: { branchId, name } });
      if (!existing) {
        await p.orgUnit.create({ data: { branchId, name, type: 'STAGE', isActive: true } });
        console.log('created stage', name);
      } else console.log('stage exists', name);
    }
    const firstStage = await p.orgUnit.findFirst({ where: { branchId, type: 'STAGE' } });
    if (firstStage) {
      const assign = await p.orgUnitAssignment.create({ data: { employeeId: emp.id, orgUnitId: firstStage.id, assignmentType: 'ADMIN', role: 'MEMBER', coverageScope: 'BRANCH', active: true, isPrimary: true } });
      console.log('created assignment', assign.id);
    }
    const assigns = await p.orgUnitAssignment.findMany({ where: { employeeId: emp.id } });
    console.log('assignments now', assigns);
  } catch (e) {
    console.error(e);
  } finally {
    await p.$disconnect();
  }
})();