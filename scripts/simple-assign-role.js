// Simple script to assign role - works around pgbouncer prepared statement issues
const { PrismaClient } = require('@prisma/client');

async function assignRole() {
  // Create new client instance for each operation to avoid prepared statement caching
  const prisma1 = new PrismaClient();
  
  console.log('\n🔍 البحث عن المستخدم mohammed...');
  
  const user = await prisma1.user.findFirst({
    where: { username: 'mohammed' }
  });
  
  await prisma1.$disconnect();
  
  if (!user) {
    console.log('❌ المستخدم غير موجود!');
    return;
  }
  
  console.log(`✅ تم العثور على المستخدم: ${user.displayName}`);
  console.log(`   Current roleId: ${user.roleId || 'NULL'}`);
  
  const prisma2 = new PrismaClient();
  
  console.log('\n🔍 البحث عن دور HR_MANAGER...');
  
  const role = await prisma2.systemRole.findFirst({
    where: { name: 'HR_MANAGER' }
  });
  
  await prisma2.$disconnect();
  
  if (!role) {
    console.log('❌ الدور غير موجود!');
    return;
  }
  
  console.log(`✅ تم العثور على الدور: ${role.nameAr} (${role.name})`);
  console.log(`   Role ID: ${role.id}`);
  
  const prisma3 = new PrismaClient();
  
  console.log('\n🔗 ربط المستخدم بالدور...');
  
  await prisma3.user.update({
    where: { id: user.id },
    data: { roleId: role.id }
  });
  
  await prisma3.$disconnect();
  
  console.log('✅ تم الربط بنجاح!');
  
  // Verify
  const prisma4 = new PrismaClient();
  
  const updated = await prisma4.user.findFirst({
    where: { id: user.id },
    include: { systemRole: true }
  });
  
  await prisma4.$disconnect();
  
  console.log('\n✅ التحقق:');
  console.log(`   المستخدم: ${updated.displayName}`);
  console.log(`   الدور: ${updated.systemRole?.nameAr || 'NULL'}`);
  console.log('\n⚠️ يجب تسجيل خروج ودخول لتحديث الـ session!\n');
}

assignRole().catch(console.error);
