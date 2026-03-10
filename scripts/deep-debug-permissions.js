const { PrismaClient } = require('@prisma/client');

async function deepDebug() {
  const prisma = new PrismaClient();
  
  console.log('\n🔍 فحص عميق لنظام الصلاحيات:\n');
  console.log('═'.repeat(80));
  
  try {
    // 1. Check TEACHER role configuration
    console.log('\n1️⃣ فحص دور TEACHER:\n');
    
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
    
    console.log(`   الاسم: ${teacherRole.nameAr}`);
    console.log(`   ID: ${teacherRole.id}`);
    console.log(`   عدد الصلاحيات: ${teacherRole.permissions.length}\n`);
    
    // Check for attendance permissions specifically
    const attendancePerms = teacherRole.permissions.filter(rp => 
      rp.permission.module === 'attendance'
    );
    
    console.log(`   صلاحيات الحضور (${attendancePerms.length}):`);
    if (attendancePerms.length === 0) {
      console.log('   ❌ لا توجد صلاحيات حضور! هذه هي المشكلة!\n');
    } else {
      attendancePerms.forEach(rp => {
        console.log(`      ✅ ${rp.permission.name} - ${rp.permission.nameAr}`);
      });
      console.log('');
    }
    
    // 2. Check RolePermission table directly
    console.log('─'.repeat(80));
    console.log('\n2️⃣ فحص جدول RolePermission مباشرة:\n');
    
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { roleId: teacherRole.id },
      include: {
        permission: true
      }
    });
    
    console.log(`   عدد السجلات: ${rolePermissions.length}\n`);
    
    if (rolePermissions.length === 0) {
      console.log('   ❌ جدول RolePermission فارغ لدور TEACHER!\n');
      console.log('   ⚠️  المشكلة: لا توجد روابط بين الدور والصلاحيات!\n');
      console.log('   الحل: تشغيل seed-permissions.js\n');
    } else {
      console.log('   الصلاحيات المرتبطة:');
      rolePermissions.forEach(rp => {
        const icon = rp.permission.module === 'attendance' ? '🎯' : '  ';
        console.log(`   ${icon} ${rp.permission.name}`);
      });
      console.log('');
    }
    
    // 3. Check a sample TEACHER user
    console.log('─'.repeat(80));
    console.log('\n3️⃣ فحص مستخدم معلم عشوائي:\n');
    
    const sampleUser = await prisma.user.findFirst({
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
            employeeNumber: true
          }
        }
      }
    });
    
    if (!sampleUser) {
      console.log('   ❌ لا يوجد مستخدمين بدور TEACHER!\n');
    } else {
      console.log(`   Username: ${sampleUser.username}`);
      console.log(`   Display Name: ${sampleUser.displayName}`);
      if (sampleUser.employee) {
        console.log(`   الاسم الكامل: ${sampleUser.employee.fullNameAr}`);
        console.log(`   رقم الموظف: ${sampleUser.employee.employeeNumber}`);
      }
      console.log(`   roleId: ${sampleUser.roleId}`);
      console.log(`   roleId مطابق: ${sampleUser.roleId === teacherRole.id ? '✅' : '❌'}\n`);
      
      // Simulate what login would return
      const permissions = sampleUser.systemRole?.permissions.map(rp => rp.permission.name) || [];
      
      console.log('   📋 الصلاحيات التي ستُحمل في Session:');
      console.log(`   عدد الصلاحيات: ${permissions.length}`);
      
      if (permissions.length === 0) {
        console.log('   ❌ permissions array فارغة!\n');
        console.log('   ⚠️  المشكلة: systemRole.permissions فارغة!\n');
      } else {
        console.log('   الصلاحيات:');
        permissions.forEach(p => {
          const icon = p.includes('attendance') ? '🎯' : '  ';
          console.log(`   ${icon} ${p}`);
        });
        console.log('');
        
        const hasSubmit = permissions.includes('attendance.submit');
        const hasViewOwn = permissions.includes('attendance.view_own');
        
        console.log('   🎯 الصلاحيات الحرجة:');
        console.log(`      attendance.submit: ${hasSubmit ? '✅' : '❌'}`);
        console.log(`      attendance.view_own: ${hasViewOwn ? '✅' : '❌'}\n`);
        
        if (!hasSubmit) {
          console.log('   ❌ المشكلة مؤكدة: attendance.submit غير موجودة!\n');
        }
      }
    }
    
    // 4. Check Permission table
    console.log('─'.repeat(80));
    console.log('\n4️⃣ فحص جدول Permission (التأكد من وجود الصلاحيات):\n');
    
    const attendanceSubmitPerm = await prisma.permission.findFirst({
      where: { name: 'attendance.submit' }
    });
    
    if (!attendanceSubmitPerm) {
      console.log('   ❌ صلاحية attendance.submit غير موجودة في جدول Permission!\n');
      console.log('   ⚠️  المشكلة الجذرية: الصلاحية نفسها غير موجودة!\n');
      console.log('   الحل: تشغيل seed-permissions.js\n');
    } else {
      console.log(`   ✅ attendance.submit موجودة:`);
      console.log(`      ID: ${attendanceSubmitPerm.id}`);
      console.log(`      الاسم: ${attendanceSubmitPerm.nameAr}`);
      console.log(`      الوحدة: ${attendanceSubmitPerm.module}\n`);
    }
    
    // 5. Final diagnosis
    console.log('═'.repeat(80));
    console.log('\n📊 التشخيص النهائي:\n');
    
    const hasPermissionInDb = !!attendanceSubmitPerm;
    const hasRolePermissionLink = rolePermissions.length > 0;
    const teacherHasAttendancePerm = attendancePerms.length > 0;
    
    console.log(`   1. صلاحية attendance.submit في DB: ${hasPermissionInDb ? '✅' : '❌'}`);
    console.log(`   2. روابط RolePermission موجودة: ${hasRolePermissionLink ? '✅' : '❌'}`);
    console.log(`   3. دور TEACHER له صلاحيات حضور: ${teacherHasAttendancePerm ? '✅' : '❌'}\n`);
    
    if (!hasPermissionInDb) {
      console.log('   🔴 المشكلة الرئيسية: جدول Permission فارغ أو ناقص!');
      console.log('   الحل: تشغيل seed-permissions.js لإنشاء جميع الصلاحيات\n');
    } else if (!hasRolePermissionLink) {
      console.log('   🔴 المشكلة الرئيسية: جدول RolePermission فارغ!');
      console.log('   الحل: تشغيل seed-permissions.js لربط الأدوار بالصلاحيات\n');
    } else if (!teacherHasAttendancePerm) {
      console.log('   🔴 المشكلة الرئيسية: دور TEACHER غير مربوط بصلاحيات الحضور!');
      console.log('   الحل: تشغيل seed-permissions.js لتحديث الروابط\n');
    } else {
      console.log('   🟢 كل شيء صحيح في قاعدة البيانات!');
      console.log('   المشكلة: Session قديم أو المستخدم لم يسجل خروج/دخول\n');
    }
    
  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deepDebug().catch(console.error);
