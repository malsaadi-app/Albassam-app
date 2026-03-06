const { PrismaClient } = require('@prisma/client');
(async () => {
  const p = new PrismaClient();
  try {
    const emp = await p.employee.findFirst({ where: { email: 'mohammed.q@bassamgroup.com' } });
    console.log('before branch', emp.branchId);
    await p.employee.update({ where: { id: emp.id }, data: { branchId: 'cmm4mq801000gnmr3kl2d6gci' } });
    const emp2 = await p.employee.findUnique({ where: { id: emp.id } });
    console.log('after branch', emp2.branchId);
  } catch (e) {
    console.error(e);
  } finally {
    await p.$disconnect();
  }
})();