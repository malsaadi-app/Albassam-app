const { PrismaClient } = require('@prisma/client');
(async () => {
  const p = new PrismaClient();
  try {
    const emp = await p.employee.findFirst({ where: { email: 'mohammed.q@bassamgroup.com' } });
    const unit = await p.orgUnit.findFirst({ where: { branchId: emp.branchId, type: 'DEPARTMENT' } });
    console.log('emp', emp.id, 'unit', unit.id);
    const a = await p.orgUnitAssignment.create({ data: { employeeId: emp.id, orgUnitId: unit.id, assignmentType: 'FUNCTIONAL', role: 'MEMBER', coverageScope: 'BRANCH', active: true } });
    console.log('created', a.id);
    const assigns = await p.orgUnitAssignment.findMany({ where: { employeeId: emp.id } });
    console.log('assignments', assigns.map((x) => ({ id: x.id, orgUnitId: x.orgUnitId, assignmentType: x.assignmentType })));
  } catch (e) {
    console.error(e);
  } finally {
    await p.$disconnect();
  }
})();