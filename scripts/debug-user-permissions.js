const { PrismaClient } = require('@prisma/client');

async function debugUser() {
  const prisma = new PrismaClient();
  
  console.log('\n🔍 فحص المستخدم الذي يواجه المشكلة:\n');
  console.log('═'.repeat(60));
  
  try {
    // Let's check a TEACHER role user who might have the issue
    // First, check if there are users with roleId = null
    const usersWithoutRole = await prisma.user.count({
      where: { roleId: null }
    });
    
    console.log(`\n📊 إحصائيات:\n`);
    console.log(`   مستخدمين بدون roleId: ${usersWithoutRole}`);
    
    // Check TEACHER role
    const teacherRole = await prisma.systemRole.findFirst({
      where: { name: 'TEACHER' },
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        users: {
          take: 3,
          select: {
            id: true,
            username: true,
            displayName: true,
            roleId: true
          }
        }
      }
    });
    
    if (!teacherRole) {
      console.log('\n❌ دور TEACHER غير موجود!\n');
      await prisma.$disconnect();
      return;
    }
    
    console.log(`\n🎭 دور TEACHER:\n`);
    console.log(`   ID: ${teacherRole.id}`);
    console.log(`   الاسم: ${teacherRole.nameAr}`);
    console.log(`   الصلاحيات المرتبطة: ${teacherRole.permissions.length}`);
    console.log(`   المستخدمين: ${teacherRole.users.length} (عينة من 3)`);
    
    // Check RolePermission table
    const rolePermissionCount = await prisma.rolePermission.count({
      where: { roleId: teacherRole.id }
    });
    
    console.log(`   RolePermission entries: ${rolePermissionCount}`);
    
    if (rolePermissionCount === 0) {
      console.log('\n❌ لا توجد روابط RolePermission لدور TEACHER!');
      console.log('   المشكلة: جدول RolePermission فارغ لهذا الدور!');
      console.log('   الحل: تشغيل seed-permissions.js\n');
    } else {
      console.log('\n✅ روابط RolePermission موجودة');
      
      // Show attendance permissions
      const attendancePerms = teacherRole.permissions.filter(rp =>
        rp.permission.module === 'attendance'
      );
      
      console.log(`\n📍 صلاحيات الحضور (${attendancePerms.length}):\n`);
      attendancePerms.forEach(rp => {
        console.log(`   ✅ ${rp.permission.nameAr || rp.permission.name}`);
        console.log(`      name: ${rp.permission.name}`);
        console.log(`      RolePermission ID: ${rp.id}`);
        console.log('');
      });
    }
    
    // Check sample users
    console.log('\n👥 عينة من المستخدمين:\n');
    for (const user of teacherRole.users) {
      console.log(`   - ${user.displayName} (@${user.username})`);
      console.log(`     roleId: ${user.roleId || 'NULL'}`);
      console.log(`     مطابق: ${user.roleId === teacherRole.id ? '✅' : '❌'}`);
      console.log('');
    }
    
    // Simulate login for one user
    if (teacherRole.users.length > 0) {
      const testUser = teacherRole.users[0];
      
      console.log('─'.repeat(60));
      console.log(`\n🧪 محاكاة تسجيل دخول: ${testUser.displayName}\n`);
      
      const fullUser = await prisma.user.findUnique({
        where: { id: testUser.id },
        include: {
          systemRole: {
            select: {
              id: true,
              name: true,
              nameAr: true,
              nameEn: true,
              permissions: {
                select: {
                  permission: {
                    select: {
                      name: true
                    }
                  }
                }
              }
            }
          }
        }
      });
      
      if (fullUser) {
        const permissions = fullUser.systemRole?.permissions.map(rp => rp.permission.name) || [];
        
        console.log('📋 البيانات التي ستُحفظ في Session:\n');
        console.log(`   user.id: ${fullUser.id}`);
        console.log(`   user.username: ${fullUser.username}`);
        console.log(`   user.displayName: ${fullUser.displayName}`);
        console.log(`   user.systemRole: ${fullUser.systemRole ? fullUser.systemRole.nameAr : 'NULL'}`);
        console.log(`   permissions: [${permissions.length} صلاحية]`);
        console.log('');
        
        if (permissions.length === 0) {
          console.log('   ❌ المشكلة: permissions array فارغة!');
          console.log('   السبب: RolePermission links مفقودة');
        } else {
          console.log('   ✅ Permissions موجودة:');
          permissions.forEach(p => {
            console.log(`      - ${p}`);
          });
          
          const hasSubmit = permissions.includes('attendance.submit');
          const hasViewOwn = permissions.includes('attendance.view_own');
          
          console.log('');
          console.log('   🎯 الصلاحيات المطلوبة:');
          console.log(`      attendance.submit: ${hasSubmit ? '✅' : '❌'}`);
          console.log(`      attendance.view_own: ${hasViewOwn ? '✅' : '❌'}`);
          
          if (!hasSubmit) {
            console.log('\n   ❌ المشكلة: attendance.submit غير موجودة في permissions!');
          } else {
            console.log('\n   ✅ الصلاحيات صحيحة في الـ Session!');
            console.log('   المشكلة قد تكون في Frontend أو usePermissions hook');
          }
        }
      }
    }
    
    console.log('\n═'.repeat(60));
    console.log('');
    
  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugUser().catch(console.error);
