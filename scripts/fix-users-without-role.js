const { PrismaClient } = require('@prisma/client');

async function fixUsersWithoutRole() {
  const prisma = new PrismaClient();
  
  console.log('\n🔧 إصلاح المستخدمين بدون roleId:\n');
  console.log('═'.repeat(60));
  
  try {
    // Find users without roleId but with employee.systemRoleId
    const usersWithoutRole = await prisma.user.findMany({
      where: { roleId: null },
      include: {
        employee: {
          select: {
            id: true,
            fullNameAr: true,
            employeeNumber: true,
            systemRoleId: true,
            systemRole: {
              select: {
                id: true,
                name: true,
                nameAr: true
              }
            }
          }
        }
      },
      take: 300 // Process in batches
    });
    
    console.log(`\n📊 وجدت ${usersWithoutRole.length} مستخدم بدون roleId\n`);
    
    if (usersWithoutRole.length === 0) {
      console.log('✅ جميع المستخدمين لديهم roleId!\n');
      await prisma.$disconnect();
      return;
    }
    
    // Count how many have employee with systemRoleId
    const withEmployeeRole = usersWithoutRole.filter(u =>
      u.employee && u.employee.systemRoleId
    );
    
    console.log(`   منهم ${withEmployeeRole.length} لديهم employee.systemRoleId`);
    console.log(`   و ${usersWithoutRole.length - withEmployeeRole.length} بدون أي دور\n`);
    
    if (withEmployeeRole.length === 0) {
      console.log('❌ لا يوجد مستخدمين يمكن إصلاحهم تلقائياً!\n');
      await prisma.$disconnect();
      return;
    }
    
    console.log('🔄 بدء التحديث...\n');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const user of withEmployeeRole) {
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { roleId: user.employee.systemRoleId }
        });
        
        console.log(`   ✅ ${user.displayName}`);
        console.log(`      → ${user.employee.systemRole?.nameAr || 'دور غير معروف'}`);
        
        successCount++;
        
        if (successCount % 10 === 0) {
          console.log(`\n   ... تم تحديث ${successCount} مستخدم حتى الآن ...\n`);
        }
      } catch (error) {
        console.log(`   ❌ فشل: ${user.displayName}`);
        errorCount++;
      }
    }
    
    console.log('\n═'.repeat(60));
    console.log(`\n✅ تم تحديث ${successCount} مستخدم`);
    if (errorCount > 0) {
      console.log(`❌ فشل ${errorCount} مستخدم`);
    }
    
    // Check remaining users without role
    const remaining = await prisma.user.count({
      where: { roleId: null }
    });
    
    console.log(`\n📊 الباقي بدون roleId: ${remaining}\n`);
    
    if (remaining > 0) {
      console.log('⚠️  ملاحظة: المستخدمين المتبقين لا يوجد لهم employee.systemRoleId');
      console.log('   يجب ربطهم يدوياً بدور مناسب\n');
    }
    
  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUsersWithoutRole().catch(console.error);
