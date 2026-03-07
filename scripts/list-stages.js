const { PrismaClient } = require('@prisma/client');
(async () => {
  const p = new PrismaClient();
  try {
    const emp = await p.employee.findFirst({ where: { email: 'mohammed.q@bassamgroup.com' } });
    const stages = await p.orgUnit.findMany({ where: { branchId: emp.branchId, type: 'STAGE' }, select: { id: true, name: true } });
    console.log('stages', stages);
  } catch (e) {
    console.error(e);
  } finally {
    await p.$disconnect();
  }
})();