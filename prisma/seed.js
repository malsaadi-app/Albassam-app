const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Get default password from env or use fallback
  const defaultPassword = process.env.SEED_DEFAULT_PASSWORD || 'AbS0MqAwLAHo!';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  // Create admin user (Mohammed)
  const mohammed = await prisma.user.upsert({
    where: { username: 'Mohammed' },
    update: {},
    create: {
      username: 'Mohammed',
      displayName: 'محمد',
      role: 'ADMIN',
      passwordHash: hashedPassword,
      telegramId: '845495401',
      notificationsEnabled: true,
    },
  });
  console.log('✅ Created admin user: Mohammed');

  // Create test users
  for (let i = 1; i <= 6; i++) {
    await prisma.user.upsert({
      where: { username: `user${i}` },
      update: {},
      create: {
        username: `user${i}`,
        displayName: `موظف ${i}`,
        role: 'USER',
        passwordHash: hashedPassword,
      },
    });
  }
  console.log('✅ Created 6 test users (user1-user6)');

  console.log('🎉 Seeding completed!');
  console.log(`📝 Default password: ${defaultPassword}`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
