const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding users...');

  const password = 'AbS0MqAwLAHo!';
  const passwordHash = await bcrypt.hash(password, 10);

  // Create admin user (Mohammed)
  const mohammed = await prisma.user.upsert({
    where: { username: 'mohammed' },
    update: {},
    create: {
      username: 'mohammed',
      displayName: 'محمد',
      role: 'ADMIN',
      passwordHash,
      telegramId: '845495401'
    }
  });
  console.log('✅ Created admin: mohammed');

  // Create test users
  const testUsers = [
    { username: 'hr1', displayName: 'موظف موارد بشرية 1', role: 'HR_EMPLOYEE' },
    { username: 'hr2', displayName: 'موظف موارد بشرية 2', role: 'HR_EMPLOYEE' },
    { username: 'user1', displayName: 'موظف 1', role: 'USER' },
    { username: 'user2', displayName: 'موظف 2', role: 'USER' },
    { username: 'user3', displayName: 'موظف 3', role: 'USER' },
    { username: 'user4', displayName: 'موظف 4', role: 'USER' }
  ];

  for (const userData of testUsers) {
    await prisma.user.upsert({
      where: { username: userData.username },
      update: {},
      create: {
        ...userData,
        passwordHash
      }
    });
    console.log(`✅ Created user: ${userData.username}`);
  }

  const userCount = await prisma.user.count();
  console.log(`\n✨ Seeding completed! Total users: ${userCount}`);
  console.log(`\n📝 Login credentials:`);
  console.log(`   Admin: mohammed / ${password}`);
  console.log(`   Test users: hr1, hr2, user1-4 / ${password}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
