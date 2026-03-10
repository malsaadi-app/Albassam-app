const { PrismaClient } = require('@prisma/client');

async function migrateRoles() {
  const prisma = new PrismaClient();
  
  console.log('\n🔄 نقل أدوار الموظفين إلى حسابات المستخدمين\n');
  console.log('─'.repeat(60));
  
  try {
    // 1. Find all employees with systemRoleId but user doesn't have roleId
    const employeesWithRole = await prisma.employee.findMany({
      where: {
        systemRoleId: { not: null },
        userId: { not: null }
      },
      include: {
        systemRole: {
          select: {
            id: true,
            name: true,
            nameAr: true
          }
        },
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            roleId: true
          }
        }
      }
    });
    
    console.log(`📊 إجمالي الموظفين بأدوار: ${employeesWithRole.length}\n`);
    
    if (employeesWithRole.length === 0) {
      console.log('✅ لا توجد بيانات تحتاج نقل\n');
      await prisma.$disconnect();
      return;
    }
    
    // 2. Categorize
    const needsMigration = [];
    const alreadyMigrated = [];
    const conflicts = [];
    
    employeesWithRole.forEach(emp => {
      if (!emp.user) {
        // Employee has role but no user account - skip
        return;
      }
      
      if (!emp.user.roleId) {
        // User has no role - needs migration
        needsMigration.push(emp);
      } else if (emp.user.roleId === emp.systemRoleId) {
        // Already synced
        alreadyMigrated.push(emp);
      } else {
        // Conflict: User has different role than Employee
        conflicts.push(emp);
      }
    });
    
    console.log('📈 التحليل:');
    console.log(`   ✅ متزامن: ${alreadyMigrated.length}`);
    console.log(`   🔄 يحتاج نقل: ${needsMigration.length}`);
    console.log(`   ⚠️  تعارض: ${conflicts.length}`);
    console.log('');
    
    // 3. Show conflicts
    if (conflicts.length > 0) {
      console.log('⚠️  تعارضات (Employee role ≠ User role):');
      conflicts.forEach(emp => {
        console.log(`   ${emp.fullNameAr || emp.fullNameEn}`);
        console.log(`      Employee: ${emp.systemRole.nameAr}`);
        console.log(`      User: (roleId: ${emp.user.roleId})`);
      });
      console.log('');
    }
    
    // 4. Migrate
    if (needsMigration.length > 0) {
      console.log('🔄 بدء النقل...\n');
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const emp of needsMigration) {
        try {
          await prisma.user.update({
            where: { id: emp.user.id },
            data: { roleId: emp.systemRoleId }
          });
          
          console.log(`   ✅ ${emp.fullNameAr || emp.fullNameEn} (@${emp.user.username})`);
          console.log(`      الدور: ${emp.systemRole.nameAr}`);
          
          successCount++;
        } catch (error) {
          console.log(`   ❌ فشل: ${emp.fullNameAr} - ${error.message}`);
          errorCount++;
        }
      }
      
      console.log('');
      console.log('─'.repeat(60));
      console.log(`✅ تم نقل ${successCount} مستخدم`);
      if (errorCount > 0) {
        console.log(`❌ فشل ${errorCount} مستخدم`);
      }
    } else {
      console.log('✅ جميع البيانات متزامنة!\n');
    }
    
    // 5. Summary
    console.log('');
    console.log('📊 الملخص النهائي:');
    const finalUsers = await prisma.user.count({
      where: { roleId: { not: null } }
    });
    console.log(`   المستخدمون بأدوار: ${finalUsers}`);
    console.log('');
    
  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateRoles().catch(console.error);
