const { PrismaClient } = require('@prisma/client');

async function searchEmployee() {
  const prisma = new PrismaClient();
  
  console.log('\n🔍 البحث عن الموظف 1075380111:\n');
  console.log('─'.repeat(60));
  
  try {
    // Search by exact number
    const exact = await prisma.employee.findFirst({
      where: { employeeNumber: '1075380111' },
      select: {
        id: true,
        fullNameAr: true,
        employeeNumber: true,
        userId: true
      }
    });
    
    if (exact) {
      console.log('✅ موجود بالرقم الكامل:');
      console.log(`   الاسم: ${exact.fullNameAr}`);
      console.log(`   رقم الموظف: ${exact.employeeNumber}`);
      console.log(`   مربوط بمستخدم: ${exact.userId || 'لا'}`);
      console.log('');
    } else {
      console.log('❌ غير موجود بالرقم الكامل: 1075380111\n');
      
      // Search for similar
      console.log('🔍 البحث عن أرقام مشابهة:\n');
      
      // Search by partial match
      const similar = await prisma.employee.findMany({
        where: {
          OR: [
            { employeeNumber: { contains: '1075380111' } },
            { employeeNumber: { contains: '075380111' } },
            { employeeNumber: { contains: '75380111' } },
            { fullNameAr: { contains: 'محمد' } }
          ]
        },
        select: {
          id: true,
          fullNameAr: true,
          employeeNumber: true,
          position: true,
          department: true,
          userId: true
        },
        take: 10
      });
      
      if (similar.length > 0) {
        console.log(`   وجدت ${similar.length} نتائج مشابهة:\n`);
        similar.forEach((emp, i) => {
          console.log(`   ${i + 1}. ${emp.fullNameAr || 'بدون اسم'}`);
          console.log(`      رقم الموظف: ${emp.employeeNumber || 'لا يوجد'}`);
          console.log(`      الوظيفة: ${emp.position || 'غير محدد'}`);
          console.log(`      القسم: ${emp.department || 'غير محدد'}`);
          console.log(`      مربوط بمستخدم: ${emp.userId || 'لا'}`);
          console.log('');
        });
      } else {
        console.log('   ❌ لم يتم العثور على نتائج مشابهة\n');
      }
      
      // Search all mohammed employees
      console.log('🔍 البحث عن جميع الموظفين باسم محمد:\n');
      const mohammeds = await prisma.employee.findMany({
        where: {
          fullNameAr: { contains: 'محمد' }
        },
        select: {
          id: true,
          fullNameAr: true,
          employeeNumber: true,
          position: true,
          userId: true
        },
        take: 20,
        orderBy: { fullNameAr: 'asc' }
      });
      
      console.log(`   وجدت ${mohammeds.length} موظفين:\n`);
      mohammeds.forEach((emp, i) => {
        const linked = emp.userId ? '🔗' : '⚪';
        console.log(`   ${linked} ${emp.fullNameAr}`);
        console.log(`      رقم: ${emp.employeeNumber || 'لا يوجد'}`);
        console.log(`      وظيفة: ${emp.position || 'غير محدد'}`);
        if (emp.userId) {
          console.log(`      مربوط بمستخدم: ${emp.userId}`);
        }
        console.log('');
      });
    }
    
    console.log('─'.repeat(60));
    console.log('');
    
  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

searchEmployee().catch(console.error);
