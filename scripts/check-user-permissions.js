const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUserPermissions(username) {
  console.log(`\n🔍 التحقق من صلاحيات المستخدم: ${username}\n`);
  
  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      systemRole: {
        include: {
          permissions: {
            include: {
              permission: true
            }
          }
        }
      }
    }
  });

  if (!user) {
    console.log('❌ المستخدم غير موجود!');
    return;
  }

  console.log('📊 معلومات المستخدم:');
  console.log(`   الاسم: ${user.displayName}`);
  console.log(`   Username: ${user.username}`);
  console.log(`   Role (legacy): ${user.role}`);
  
  if (user.systemRole) {
    console.log(`\n🎭 الدور النظامي:`);
    console.log(`   ID: ${user.systemRole.id}`);
    console.log(`   الاسم: ${user.systemRole.nameAr} (${user.systemRole.name})`);
    console.log(`\n🔐 الصلاحيات (${user.systemRole.permissions.length}):`);
    
    const permissionsByModule = {};
    user.systemRole.permissions.forEach(rp => {
      const permName = rp.permission.name;
      const module = permName.split('.')[0];
      if (!permissionsByModule[module]) {
        permissionsByModule[module] = [];
      }
      permissionsByModule[module].push({
        name: permName,
        nameAr: rp.permission.nameAr
      });
    });
    
    Object.entries(permissionsByModule).forEach(([module, perms]) => {
      console.log(`\n   📦 ${module.toUpperCase()} (${perms.length}):`);
      perms.forEach(p => {
        console.log(`      ✅ ${p.nameAr} (${p.name})`);
      });
    });
    
    // Extract permission names
    const permNames = user.systemRole.permissions.map(rp => rp.permission.name);
    
    // Check specific permissions
    console.log('\n🎯 فحص صلاحيات محددة:');
    console.log(`   attendance.submit: ${permNames.includes('attendance.submit') ? '✅ موجودة' : '❌ غير موجودة'}`);
    console.log(`   employees.view: ${permNames.includes('employees.view') ? '✅ موجودة' : '❌ غير موجودة'}`);
    console.log(`   hr.view_requests: ${permNames.includes('hr.view_requests') ? '✅ موجودة' : '❌ غير موجودة'}`);
    
  } else {
    console.log('\n❌ لا يوجد دور نظامي مربوط!');
    console.log('   يرجى تعيين دور نظامي للمستخدم');
  }

  console.log('\n');
}

const username = process.argv[2] || 'mohammed';
checkUserPermissions(username)
  .catch(console.error)
  .finally(() => prisma.$disconnect());
