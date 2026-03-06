const { PrismaClient } = require('@prisma/client');
(async () => {
  const p = new PrismaClient();
  try {
    const emp = await p.employee.findFirst({ where: { email: 'mohammed.q@bassamgroup.com' } });
    console.log('emp', emp.id);
    const units = await p.orgUnit.findMany({ where: { branchId: emp.branchId }, select: { id: true, name: true, type: true } });
    console.log('units', units);
  } catch (e) {
    console.error(e);
  } finally {
    await p.$disconnect();
  }
})();