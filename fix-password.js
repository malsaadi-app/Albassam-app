const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    // Hash the password
    const password = '123456';
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    console.log('New hash:', hashedPassword);
    
    // Update mohammed user
    const updated = await prisma.user.update({
      where: { username: 'mohammed' },
      data: { 
        passwordHash: hashedPassword
      }
    });
    
    console.log('✅ Password updated for:', updated.username);
    console.log('✅ Username: mohammed');
    console.log('✅ Password: 123456');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
