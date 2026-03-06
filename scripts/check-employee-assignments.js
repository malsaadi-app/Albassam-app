const { PrismaClient } = require('@prisma/client');
(async () => {
  const p = new PrismaClient();
  try {
    const emp = await p.employee.findFirst({ where: { email: 'mohammed.q@bassamgroup.com' }, select: { id: true, userId: true, fullNameAr: true } });
    console.log('employee:', emp);
    if (emp) {
      const assigns = await p.orgUnitAssignment.findMany({ where: { employeeId: emp.id } });
      console.log('assignments:', JSON.stringify(assigns, null, 2));
    }
  } catch (e) {
    console.error(e);
  } finally {
    await p.$disconnect();
  }
})();