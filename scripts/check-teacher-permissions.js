const { PrismaClient } = require('@prisma/client');

async function checkTeacherPermissions() {
  const prisma = new PrismaClient();
  
  console.log('\n🔍 التحقق من صلاحيات دور "معلم":\n');
  console.log('─'.repeat(60));
  
  try {
    // Find TEACHER role
    const teacherRole = await prisma.systemRole.findFirst({
      where: { name: 'TEACHER' },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });
    
    if (!teacherRole) {
      console.log('❌ دور TEACHER غير موجود!\n');
      await prisma.$disconnect();
      return;
    }
    
    console.log('✅ دور TEACHER موجود:\n');
    console.log(`   الاسم: ${teacherRole.nameAr}`);
    console.log(`   الكود: ${teacherRole.name}`);
    console.log(`   إجمالي الصلاحيات: ${teacherRole.permissions.length}`);
    console.log('');
    
    // Check attendance permissions
    const attendancePerms = teacherRole.permissions.filter(rp => 
      rp.permission.module === 'attendance'
    );
    
    console.log('📊 صلاحيات الحضور والانصراف:\n');
    if (attendancePerms.length > 0) {
      attendancePerms.forEach(rp => {
        console.log(`   ✅ ${rp.permission.nameAr || rp.permission.name}`);
        console.log(`      الكود: ${rp.permission.name}`);
        console.log('');
      });
    } else {
      console.log('   ❌ لا توجد صلاحيات حضور وانصراف!\n');
    }
    
    // Check specifically for attendance.submit
    const hasSubmit = teacherRole.permissions.some(rp => 
      rp.permission.name === 'attendance.submit'
    );
    
    const hasViewOwn = teacherRole.permissions.some(rp => 
      rp.permission.name === 'attendance.view_own'
    );
    
    console.log('🎯 الصلاحيات المطلوبة:\n');
    console.log(`   attendance.submit (تسجيل الحضور): ${hasSubmit ? '✅' : '❌'}`);
    console.log(`   attendance.view_own (عرض السجل الخاص): ${hasViewOwn ? '✅' : '❌'}`);
    console.log('');
    
    // List all permissions by module
    console.log('📜 جميع الصلاحيات حسب الوحدة:\n');
    const byModule = {};
    teacherRole.permissions.forEach(rp => {
      const module = rp.permission.module;
      if (!byModule[module]) {
        byModule[module] = [];
      }
      byModule[module].push(rp.permission);
    });
    
    Object.entries(byModule).forEach(([module, perms]) => {
      console.log(`   ${module}: ${perms.length} صلاحية`);
      perms.forEach(p => {
        console.log(`      - ${p.nameAr || p.name} (${p.name})`);
      });
      console.log('');
    });
    
    // Check if needs fixing
    if (!hasSubmit || !hasViewOwn) {
      console.log('─'.repeat(60));
      console.log('\n⚠️  ناقص صلاحيات! يجب إضافة:\n');
      if (!hasSubmit) {
        console.log('   ❌ attendance.submit (تسجيل الحضور)');
      }
      if (!hasViewOwn) {
        console.log('   ❌ attendance.view_own (عرض السجل الخاص)');
      }
      console.log('');
    } else {
      console.log('─'.repeat(60));
      console.log('\n✅ جميع الصلاحيات المطلوبة موجودة!\n');
    }
    
  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTeacherPermissions().catch(console.error);
