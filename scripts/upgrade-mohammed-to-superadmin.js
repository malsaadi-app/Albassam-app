const { PrismaClient } = require('@prisma/client');

async function upgradeMohammed() {
  const prisma = new PrismaClient();
  
  console.log('\n⬆️  ترقية mohammed إلى SUPER_ADMIN:\n');
  console.log('─'.repeat(60));
  
  try {
    // Find mohammed user
    const user = await prisma.user.findUnique({
      where: { username: 'mohammed' },
      select: { 
        id: true, 
        username: true, 
        displayName: true,
        roleId: true
      }
    });
    
    if (!user) {
      console.log('❌ المستخدم mohammed غير موجود!\n');
      await prisma.$disconnect();
      return;
    }
    
    console.log(`✅ المستخدم: ${user.username}\n`);
    
    // Find SUPER_ADMIN role
    const superAdminRole = await prisma.systemRole.findFirst({
      where: { name: 'SUPER_ADMIN' },
      select: { 
        id: true, 
        name: true, 
        nameAr: true,
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });
    
    if (!superAdminRole) {
      console.log('❌ دور SUPER_ADMIN غير موجود!\n');
      await prisma.$disconnect();
      return;
    }
    
    console.log('🎭 دور SUPER_ADMIN:');
    console.log(`   الاسم: ${superAdminRole.nameAr}`);
    console.log(`   الصلاحيات: ${superAdminRole.permissions.length}`);
    console.log('');
    
    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: { roleId: superAdminRole.id }
    });
    
    console.log('✅ تم تحديث الدور بنجاح!\n');
    console.log('─'.repeat(60));
    console.log('\n📋 النتيجة:\n');
    console.log(`   المستخدم: ${user.username}`);
    console.log(`   الدور الجديد: ${superAdminRole.nameAr}`);
    console.log(`   الصلاحيات: ${superAdminRole.permissions.length} (كاملة)`);
    console.log('');
    console.log('⚠️  مهم: سجل خروج وأعد الدخول لتفعيل الصلاحيات!\n');
    
  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

upgradeMohammed().catch(console.error);
