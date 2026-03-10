const { PrismaClient } = require('@prisma/client');

async function checkAllRoles() {
  const prisma = new PrismaClient();
  
  console.log('\n🔍 التحقق من صلاحيات جميع الأدوار:\n');
  console.log('═'.repeat(60));
  
  try {
    // Get all roles
    const roles = await prisma.systemRole.findMany({
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        _count: {
          select: {
            users: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });
    
    console.log(`📊 إجمالي الأدوار: ${roles.length}\n`);
    
    // Check each role
    for (const role of roles) {
      console.log('─'.repeat(60));
      console.log(`\n🎭 ${role.nameAr || role.name}`);
      console.log(`   الكود: ${role.name}`);
      console.log(`   المستخدمون: ${role._count.users}`);
      console.log(`   الصلاحيات: ${role.permissions.length}`);
      
      // Check attendance permissions
      const attendancePerms = role.permissions.filter(rp => 
        rp.permission.module === 'attendance'
      );
      
      if (attendancePerms.length > 0) {
        console.log('\n   📍 صلاحيات الحضور:');
        attendancePerms.forEach(rp => {
          console.log(`      ✅ ${rp.permission.nameAr || rp.permission.name} (${rp.permission.name})`);
        });
      } else {
        console.log('\n   ❌ لا توجد صلاحيات حضور');
      }
      
      // Check critical attendance permissions
      const hasSubmit = role.permissions.some(rp => rp.permission.name === 'attendance.submit');
      const hasViewOwn = role.permissions.some(rp => rp.permission.name === 'attendance.view_own');
      
      if (role.name !== 'SUPER_ADMIN') {
        console.log('\n   🎯 الصلاحيات الحرجة:');
        console.log(`      تسجيل الحضور (attendance.submit): ${hasSubmit ? '✅' : '❌'}`);
        console.log(`      عرض حضوري (attendance.view_own): ${hasViewOwn ? '✅' : '❌'}`);
        
        if (!hasSubmit && role._count.users > 0) {
          console.log(`\n      ⚠️  تحذير: ${role._count.users} مستخدمين بدون صلاحية تسجيل الحضور!`);
        }
      }
      
      console.log('');
    }
    
    console.log('═'.repeat(60));
    
    // Summary
    console.log('\n📋 الملخص:\n');
    
    const rolesWithoutSubmit = roles.filter(r => 
      r.name !== 'SUPER_ADMIN' && 
      !r.permissions.some(rp => rp.permission.name === 'attendance.submit') &&
      r._count.users > 0
    );
    
    if (rolesWithoutSubmit.length > 0) {
      console.log('⚠️  أدوار تحتاج صلاحية attendance.submit:\n');
      rolesWithoutSubmit.forEach(r => {
        console.log(`   - ${r.nameAr || r.name} (${r._count.users} مستخدمين)`);
      });
      console.log('');
    } else {
      console.log('✅ جميع الأدوار لديها الصلاحيات المطلوبة!\n');
    }
    
    console.log('💡 ملاحظة: المستخدمون الحاليون يحتاجون إلى تسجيل خروج وإعادة دخول');
    console.log('   لتحديث صلاحياتهم من Session\n');
    
  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllRoles().catch(console.error);
