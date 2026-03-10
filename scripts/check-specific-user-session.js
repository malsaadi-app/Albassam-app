const { PrismaClient } = require('@prisma/client');

async function checkUserSession() {
  const prisma = new PrismaClient();
  
  console.log('\n🔍 فحص مستخدم معلم عشوائي:\n');
  console.log('─'.repeat(60));
  
  try {
    // Find a TEACHER role user
    const teacherRole = await prisma.systemRole.findFirst({
      where: { name: 'TEACHER' }
    });
    
    if (!teacherRole) {
      console.log('❌ دور TEACHER غير موجود!\n');
      await prisma.$disconnect();
      return;
    }
    
    // Find first user with TEACHER role
    const user = await prisma.user.findFirst({
      where: { roleId: teacherRole.id },
      include: {
        systemRole: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
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
    
    if (!user) {
      console.log('❌ لا يوجد مستخدمين بدور TEACHER!\n');
      await prisma.$disconnect();
      return;
    }
    
    console.log('👤 مستخدم معلم:\n');
    console.log(`   Username: ${user.username}`);
    console.log(`   Display Name: ${user.displayName}`);
    if (user.employee) {
      console.log(`   الاسم: ${user.employee.fullNameAr}`);
      console.log(`   رقم الموظف: ${user.employee.employeeNumber}`);
      console.log(`   الوظيفة: ${user.employee.position}`);
    }
    console.log('');
    
    console.log('🎭 الدور:\n');
    console.log(`   ${user.systemRole.nameAr || user.systemRole.name}`);
    console.log(`   الصلاحيات: ${user.systemRole.permissions.length}`);
    console.log('');
    
    // Check attendance permissions
    const attendancePerms = user.systemRole.permissions.filter(rp =>
      rp.permission.module === 'attendance'
    );
    
    console.log('📍 صلاحيات الحضور في قاعدة البيانات:\n');
    attendancePerms.forEach(rp => {
      console.log(`   ✅ ${rp.permission.nameAr || rp.permission.name}`);
      console.log(`      الكود: ${rp.permission.name}`);
      console.log('');
    });
    
    const hasSubmit = user.systemRole.permissions.some(rp =>
      rp.permission.name === 'attendance.submit'
    );
    
    console.log('─'.repeat(60));
    console.log('\n💡 التشخيص:\n');
    console.log(`   صلاحية attendance.submit في قاعدة البيانات: ${hasSubmit ? '✅ موجودة' : '❌ غير موجودة'}`);
    console.log('');
    
    if (hasSubmit) {
      console.log('   ✅ الصلاحيات موجودة في قاعدة البيانات');
      console.log('   ❌ لكن Session القديم لا يحتوي عليها!');
      console.log('');
      console.log('   🔧 الحل:');
      console.log('      1. المستخدم يسجل خروج (Logout)');
      console.log('      2. يسجل دخول من جديد (Login)');
      console.log('      3. Session الجديد سيحمل الصلاحيات ✅');
    } else {
      console.log('   ❌ الصلاحيات غير موجودة في قاعدة البيانات!');
      console.log('   يجب تشغيل: node scripts/seed-permissions.js');
    }
    
    console.log('');
    
  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserSession().catch(console.error);
