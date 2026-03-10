const { PrismaClient } = require('@prisma/client');

async function testLoginFlow() {
  const prisma = new PrismaClient();
  
  console.log('\n🔍 محاكاة تسجيل الدخول لمستخدم معلم:\n');
  console.log('═'.repeat(80));
  
  try {
    // Get a TEACHER user
    const teacherRole = await prisma.systemRole.findFirst({
      where: { name: 'TEACHER' }
    });
    
    const user = await prisma.user.findFirst({
      where: { roleId: teacherRole.id },
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
        },
        employee: {
          select: {
            id: true,
            fullNameAr: true,
            orgAssignments: {
              where: { active: true },
              select: {
                id: true,
                orgUnitId: true,
                role: true,
                assignmentType: true
              }
            }
          }
        }
      }
    });
    
    if (!user) {
      console.log('❌ لا يوجد مستخدمين بدور TEACHER!\n');
      await prisma.$disconnect();
      return;
    }
    
    console.log('👤 المستخدم:\n');
    console.log(`   Username: ${user.username}`);
    console.log(`   Display Name: ${user.displayName}`);
    console.log(`   Employee: ${user.employee?.fullNameAr || 'N/A'}\n`);
    
    console.log('─'.repeat(80));
    console.log('\n📋 ما يحدث في Login API (/api/auth/login):\n');
    
    // This is EXACTLY what login API does
    const permissions = user.systemRole?.permissions.map(rp => rp.permission.name) || [];
    const orgAssignments = user.employee?.orgAssignments || [];
    
    const sessionUser = {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      systemRole: user.systemRole ? {
        id: user.systemRole.id,
        name: user.systemRole.name,
        nameAr: user.systemRole.nameAr,
        nameEn: user.systemRole.nameEn
      } : undefined,
      permissions,
      orgAssignments
    };
    
    console.log('   Session Object:');
    console.log(JSON.stringify(sessionUser, null, 2));
    console.log('');
    
    console.log('─'.repeat(80));
    console.log('\n🎯 الصلاحيات في Session:\n');
    
    console.log(`   permissions.length: ${permissions.length}`);
    console.log(`   permissions array: ${JSON.stringify(permissions)}\n`);
    
    const hasSubmit = permissions.includes('attendance.submit');
    const hasViewOwn = permissions.includes('attendance.view_own');
    
    console.log('   التحقق:');
    console.log(`   permissions.includes('attendance.submit'): ${hasSubmit}`);
    console.log(`   permissions.includes('attendance.view_own'): ${hasViewOwn}\n`);
    
    console.log('─'.repeat(80));
    console.log('\n🖥️  ما يحدث في usePermissions hook:\n');
    
    console.log('   const userPermissions = session?.user?.permissions || []');
    console.log(`   → userPermissions = ${JSON.stringify(permissions)}\n`);
    
    console.log('   const hasPermission = (permission: string) => {');
    console.log('     if (!permission) return true;');
    console.log('     if (userPermissions.includes("*")) return true;');
    console.log('     return userPermissions.includes(permission);');
    console.log('   }\n');
    
    console.log(`   hasPermission('attendance.submit'):  ${hasSubmit}`);
    console.log(`   hasPermission('attendance.view_own'): ${hasViewOwn}\n`);
    
    console.log('─'.repeat(80));
    console.log('\n📱 ما يحدث في صفحة الحضور:\n');
    
    console.log('   const { hasPermission } = usePermissions()\n');
    
    console.log('   const canSubmit = hasPermission("attendance.submit")');
    console.log(`   → canSubmit = ${hasSubmit}\n`);
    
    console.log('   const canViewOwn = hasPermission("attendance.view_own")');
    console.log(`   → canViewOwn = ${hasViewOwn}\n`);
    
    console.log('   if (!canSubmit) {');
    console.log('     // Show error message');
    console.log('     return "⚠️ ليس لديك صلاحية تسجيل الحضور"');
    console.log('   }\n');
    
    console.log('═'.repeat(80));
    console.log('\n💡 النتيجة:\n');
    
    if (hasSubmit && hasViewOwn) {
      console.log('   ✅ Login flow صحيح تماماً!');
      console.log('   ✅ Session يحتوي على الصلاحيات الصحيحة');
      console.log('   ✅ usePermissions سيعمل بشكل صحيح\n');
      console.log('   ⚠️  المشكلة: المستخدم الذي تختبره لديه Session قديم!');
      console.log('   الحل: يجب تسجيل خروج/دخول لهذا المستخدم المحدد\n');
    } else {
      console.log('   ❌ هناك مشكلة في Login flow!');
      console.log('   يجب فحص /api/auth/login/route.ts\n');
    }
    
  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLoginFlow().catch(console.error);
