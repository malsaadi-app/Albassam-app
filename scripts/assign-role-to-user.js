const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function assignRole(username, roleName) {
  console.log(`\n🔗 ربط المستخدم "${username}" بدور "${roleName}"\n`);
  
  // Find user
  const user = await prisma.user.findUnique({
    where: { username }
  });
  
  if (!user) {
    console.log(`❌ المستخدم "${username}" غير موجود!`);
    return;
  }
  
  // Find role
  const role = await prisma.systemRole.findUnique({
    where: { name: roleName },
    include: {
      permissions: {
        include: {
          permission: true
        }
      }
    }
  });
  
  if (!role) {
    console.log(`❌ الدور "${roleName}" غير موجود!`);
    return;
  }
  
  // Update user
  await prisma.user.update({
    where: { id: user.id },
    data: { roleId: role.id }
  });
  
  console.log(`✅ تم ربط المستخدم بنجاح!`);
  console.log(`   المستخدم: ${user.displayName} (${user.username})`);
  console.log(`   الدور: ${role.nameAr} (${role.name})`);
  console.log(`   الصلاحيات: ${role.permissions.length}`);
  
  console.log(`\n📋 بعض الصلاحيات:`);
  role.permissions.slice(0, 10).forEach(rp => {
    console.log(`   ✅ ${rp.permission.nameAr}`);
  });
  
  if (role.permissions.length > 10) {
    console.log(`   ... و ${role.permissions.length - 10} صلاحيات أخرى`);
  }
  
  console.log(`\n⚠️ مهم: يجب تسجيل خروج ودخول لتحديث الـ session!\n`);
}

const username = process.argv[2] || 'mohammed';
const roleName = process.argv[3] || 'HR_MANAGER';

assignRole(username, roleName)
  .catch(console.error)
  .finally(() => prisma.$disconnect());
