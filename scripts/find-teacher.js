const { PrismaClient } = require('@prisma/client');
const directUrl = 'postgresql://postgres.uvizfidyfhxwekqbtkma:hazGyk-6wecqo-rokxij@aws-1-eu-west-1.pooler.supabase.com:5432/postgres?pgbouncer=false';
const prisma = new PrismaClient({ datasources: { db: { url: directUrl } } });

async function findTeacher() {
  try {
    console.log('🔍 البحث عن معلم في الأهلية بنين - الابتدائية...\n');
    
    // Find the branch first
    const branch = await prisma.branch.findFirst({
      where: {
        name: { contains: 'الأهلية' },
        type: 'SCHOOL'
      }
    });
    
    if (!branch) {
      console.log('❌ لم يتم العثور على فرع الأهلية');
      return;
    }
    
    console.log(`✅ Branch found: ${branch.name} (${branch.id})`);
    console.log('');
    
    // Find teachers in this branch with "ابتدائي" in department
    const teachers = await prisma.employee.findMany({
      where: {
        branchId: branch.id,
        department: { contains: 'ابتدائي' },
        userId: { not: null } // Has user account
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            role: true
          }
        }
      },
      take: 5
    });
    
    console.log(`📋 Found ${teachers.length} teacher(s):\n`);
    
    teachers.forEach((teacher, i) => {
      console.log(`${i + 1}. ${teacher.fullNameAr}`);
      console.log(`   Employee #: ${teacher.employeeNumber}`);
      console.log(`   Department: ${teacher.department}`);
      console.log(`   Username: ${teacher.user?.username || 'N/A'}`);
      console.log(`   User ID: ${teacher.user?.id || 'N/A'}`);
      console.log(`   Role: ${teacher.user?.role || 'N/A'}`);
      console.log('');
    });
    
    // Try to find the test teacher account we used before
    const testTeacher = await prisma.user.findFirst({
      where: {
        username: '1113256885' // طيبه عبدالعزيز
      },
      include: {
        employee: {
          include: {
            branch: true
          }
        }
      }
    });
    
    if (testTeacher) {
      console.log('✅ Test teacher account found:');
      console.log(`   Name: ${testTeacher.displayName}`);
      console.log(`   Username: ${testTeacher.username}`);
      console.log(`   Password: teacher123`);
      console.log(`   Branch: ${testTeacher.employee?.branch?.name || 'N/A'}`);
      console.log(`   Department: ${testTeacher.employee?.department || 'N/A'}`);
      console.log('');
      console.log('🎯 Use this account for testing!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

findTeacher();
