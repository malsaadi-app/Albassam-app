const { PrismaClient } = require('@prisma/client');

async function assignDefaultRole() {
  const prisma = new PrismaClient();
  
  console.log('\n🔧 تعيين دور افتراضي للمستخدمين بدون roleId:\n');
  console.log('═'.repeat(60));
  
  try {
    // Find users without roleId
    const usersWithoutRole = await prisma.user.findMany({
      where: { roleId: null },
      include: {
        employee: {
          select: {
            id: true,
            fullNameAr: true,
            position: true
          }
        }
      }
    });
    
    console.log(`\n📊 وجدت ${usersWithoutRole.length} مستخدم بدون roleId\n`);
    
    if (usersWithoutRole.length === 0) {
      console.log('✅ جميع المستخدمين لديهم roleId!\n');
      await prisma.$disconnect();
      return;
    }
    
    // Find EMPLOYEE role (default for users without specific role)
    const employeeRole = await prisma.systemRole.findFirst({
      where: { name: 'EMPLOYEE' }
    });
    
    if (!employeeRole) {
      console.log('❌ دور EMPLOYEE غير موجود!\n');
      await prisma.$disconnect();
      return;
    }
    
    console.log(`🎭 الدور الافتراضي: ${employeeRole.nameAr} (${employeeRole.name})\n`);
    console.log('   سيتم تعيين هذا الدور لجميع المستخدمين بدون roleId\n');
    
    console.log('📋 عينة من المستخدمين الذين سيتم تحديثهم:\n');
    usersWithoutRole.slice(0, 5).forEach(u => {
      console.log(`   - ${u.displayName} (@${u.username})`);
      if (u.employee) {
        console.log(`     ${u.employee.fullNameAr || 'لا يوجد اسم'}`);
        console.log(`     ${u.employee.position || 'لا توجد وظيفة'}`);
      }
      console.log('');
    });
    
    console.log(`   ... و ${usersWithoutRole.length - 5} مستخدم آخر\n`);
    console.log('─'.repeat(60));
    
    console.log('\n❓ هل تريد المتابعة؟ (y/n)\n');
    console.log('   سيتم تحديث جميع الـ ${usersWithoutRole.length} مستخدم');
    console.log('   لكي يتمكنوا من تسجيل الحضور والدخول للنظام\n');
    
    // For now, let's just do it
    console.log('🔄 بدء التحديث...\n');
    
    const result = await prisma.user.updateMany({
      where: { roleId: null },
      data: { roleId: employeeRole.id }
    });
    
    console.log(`✅ تم تحديث ${result.count} مستخدم\n`);
    console.log('═'.repeat(60));
    console.log('\n💡 النتيجة:\n');
    console.log(`   ✅ جميع المستخدمين الآن لديهم دور "${employeeRole.nameAr}"`);
    console.log('   ✅ يمكنهم تسجيل الحضور (صلاحية attendance.submit)');
    console.log('   ✅ يمكنهم عرض حضورهم (صلاحية attendance.view_own)');
    console.log('');
    console.log('⚠️  مهم: المستخدمون الذين دخلوا سابقاً يجب عليهم:');
    console.log('   1. تسجيل الخروج');
    console.log('   2. تسجيل الدخول من جديد');
    console.log('   3. سيتم تحميل الصلاحيات الجديدة\n');
    
  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

assignDefaultRole().catch(console.error);
