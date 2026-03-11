const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
  const user = await prisma.user.findUnique({
    where: { username: 'mohammed' },
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
    console.log('User not found');
    return;
  }

  console.log('=== USER INFO ===');
  console.log('Username:', user.username);
  console.log('Display Name:', user.displayName);
  console.log('Role:', user.role);
  console.log('System Role ID:', user.systemRoleId);
  
  if (user.systemRole) {
    console.log('\n=== SYSTEM ROLE ===');
    console.log('Name:', user.systemRole.name);
    console.log('Name AR:', user.systemRole.nameAr);
    console.log('Is Super Admin:', user.systemRole.isSuperAdmin);
    
    console.log('\n=== PERMISSIONS ===');
    console.log('Count:', user.systemRole.permissions.length);
    
    if (user.systemRole.isSuperAdmin) {
      console.log('✅ SUPER ADMIN - Has ALL permissions');
    } else {
      console.log('Permissions:');
      user.systemRole.permissions.forEach(rp => {
        console.log('  -', rp.permission.name);
      });
    }
  } else {
    console.log('\n❌ NO SYSTEM ROLE ASSIGNED!');
  }

  await prisma.$disconnect();
}

checkUser().catch(console.error);
