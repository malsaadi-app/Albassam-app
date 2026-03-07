const { PrismaClient } = require('@prisma/client');
(async () => {
  const p = new PrismaClient();
  try {
    const b = await p.branch.findFirst({ select: { id: true, name: true } });
    console.log('branch', b);
  } catch (e) {
    console.error(e);
  } finally {
    await p.$disconnect();
  }
})();