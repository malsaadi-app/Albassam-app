const { PrismaClient } = require('@prisma/client');
(async () => {
  const p = new PrismaClient();
  try {
    const b = await p.branch.findFirst({ where: { name: { contains: 'يوسف' } }, select: { id: true, name: true } });
    console.log('branch', b);
    if (b) {
      const units = await p.orgUnit.findMany({ where: { branchId: b.id }, select: { id: true, name: true, type: true, isActive: true } });
      console.log('units', units);
    }
  } catch (e) {
    console.error(e);
  } finally {
    await p.$disconnect();
  }
})();