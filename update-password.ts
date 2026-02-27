import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('abcde12345', 10);
  
  await prisma.user.update({
    where: { username: 'Mohammed' },
    data: { passwordHash: hashedPassword }
  });
  
  console.log('✅ Password updated to: abcde12345');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
