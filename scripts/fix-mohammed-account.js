const { PrismaClient } = require('@prisma/client');

async function fixMohammedAccount() {
  const prisma = new PrismaClient();
  
  console.log('\n🔧 تصحيح حساب mohammed:\n');
  console.log('─'.repeat(60));
  
  try {
    // 1. Find mohammed user
    const user = await prisma.user.findUnique({
      where: { username: 'mohammed' },
      select: { id: true, username: true, displayName: true }
    });
    
    if (!user) {
      console.log('❌ المستخدم mohammed غير موجود!\n');
      await prisma.$disconnect();
      return;
    }
    
    console.log(`✅ المستخدم: ${user.username} (${user.displayName})\n`);
    
    // 2. Find correct employee (1075380111)
    const correctEmployee = await prisma.employee.findFirst({
      where: { employeeNumber: '1075380111' },
      select: {
        id: true,
        fullNameAr: true,
        fullNameEn: true,
        employeeNumber: true,
        position: true,
        userId: true
      }
    });
    
    if (!correctEmployee) {
      console.log('❌ الموظف 1075380111 غير موجود في النظام!\n');
      await prisma.$disconnect();
      return;
    }
    
    console.log('📋 الموظف المطلوب:');
    console.log(`   الاسم: ${correctEmployee.fullNameAr || correctEmployee.fullNameEn}`);
    console.log(`   رقم الموظف: ${correctEmployee.employeeNumber}`);
    console.log(`   الوظيفة: ${correctEmployee.position || 'غير محدد'}`);
    console.log('');
    
    // 3. Find SUPER_ADMIN role
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
    
    // 4. Update user
    console.log('🔄 تحديث المستخدم...\n');
    
    // Update user's roleId
    await prisma.user.update({
      where: { id: user.id },
      data: { roleId: superAdminRole.id }
    });
    console.log('   ✅ تم تحديث الدور → SUPER_ADMIN');
    
    // Check if employee already linked to another user
    if (correctEmployee.userId && correctEmployee.userId !== user.id) {
      console.log(`   ⚠️  الموظف مربوط بمستخدم آخر: ${correctEmployee.userId}`);
      console.log('   سيتم فك الربط وإعادة الربط...');
    }
    
    // Update employee's userId
    await prisma.employee.update({
      where: { id: correctEmployee.id },
      data: { userId: user.id }
    });
    console.log('   ✅ تم ربط الموظف → 1075380111');
    
    // Also update employee's systemRoleId
    await prisma.employee.update({
      where: { id: correctEmployee.id },
      data: { systemRoleId: superAdminRole.id }
    });
    console.log('   ✅ تم تحديث systemRoleId للموظف');
    
    console.log('');
    console.log('─'.repeat(60));
    console.log('\n✅ تم التصحيح بنجاح!\n');
    console.log('⚠️  مهم: يجب تسجيل الخروج وإعادة الدخول لتحديث الصلاحيات!\n');
    
    // Verify
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        systemRole: {
          select: { name: true, nameAr: true }
        },
        employee: {
          select: {
            fullNameAr: true,
            employeeNumber: true,
            position: true
          }
        }
      }
    });
    
    console.log('📊 التحقق من التحديث:');
    console.log(`   المستخدم: ${updatedUser.username}`);
    console.log(`   الدور: ${updatedUser.systemRole?.nameAr || 'لا يوجد'}`);
    console.log(`   الموظف: ${updatedUser.employee?.fullNameAr || 'لا يوجد'}`);
    console.log(`   رقم الموظف: ${updatedUser.employee?.employeeNumber || 'لا يوجد'}`);
    console.log('');
    
  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixMohammedAccount().catch(console.error);
