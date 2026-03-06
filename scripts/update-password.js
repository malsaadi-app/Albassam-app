const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
(async () => {
  try {
    const prisma = new PrismaClient();
    const username = 'mohammed';
    const plain = 'albassam2024';
    const saltRounds = 10;
    const hash = await bcrypt.hash(plain, saltRounds);
    const result = await prisma.user.updateMany({
      where: { username },
      data: { passwordHash: hash }
    });
    console.log('Updated rows:', result.count);
    await prisma.$disconnect();
  } catch (err) {
    console.error('Error updating password:', err);
    process.exit(1);
  }
})();