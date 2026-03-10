const { PrismaClient } = require('@prisma/client');

async function checkAllUsers() {
  const prisma = new PrismaClient();
  
  console.log('\n🔍 التحقق من أدوار جميع المستخدمين:\n');
  
  const users = await prisma.user.findMany({
    include: {
      systemRole: {
        select: {
          name: true,
          nameAr: true
        }
      }
    },
    orderBy: { displayName: 'asc' }
  });
  
  console.log(`📊 إجمالي المستخدمين: ${users.length}\n`);
  
  const byRole = {};
  let noRole = 0;
  
  users.forEach(user => {
    if (user.systemRole) {
      const roleName = user.systemRole.nameAr || user.systemRole.name;
      if (!byRole[roleName]) {
        byRole[roleName] = [];
      }
      byRole[roleName].push(user);
    } else {
      noRole++;
    }
  });
  
  console.log('🎭 التوزيع حسب الدور:\n');
  
  Object.entries(byRole).forEach(([role, users]) => {
    console.log(`   ${role}: ${users.length} مستخدمين`);
    users.forEach(u => {
      console.log(`      - ${u.displayName} (@${u.username})`);
    });
    console.log('');
  });
  
  if (noRole > 0) {
    console.log(`   ⚠️ بدون دور: ${noRole} مستخدمين`);
    users.filter(u => !u.systemRole).forEach(u => {
      console.log(`      - ${u.displayName} (@${u.username})`);
    });
  }
  
  console.log('\n');
  
  await prisma.$disconnect();
}

checkAllUsers().catch(console.error);
