const { PrismaClient } = require('@prisma/client');

async function searchByNationalId() {
  const prisma = new PrismaClient();
  
  console.log('\n🔍 البحث برقم الهوية 1075380111:\n');
  console.log('─'.repeat(60));
  
  try {
    // Search by nationalId
    const employee = await prisma.employee.findFirst({
      where: { nationalId: '1075380111' },
      select: {
        id: true,
        fullNameAr: true,
        fullNameEn: true,
        employeeNumber: true,
        nationalId: true,
        position: true,
        department: true,
        email: true,
        phone: true,
        status: true,
        userId: true,
        systemRoleId: true,
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            roleId: true,
            systemRole: {
              select: {
                name: true,
                nameAr: true
              }
            }
          }
        },
        systemRole: {
          select: {
            name: true,
            nameAr: true
          }
        }
      }
    });
    
    if (employee) {
      console.log('✅ تم العثور على الموظف:\n');
      console.log('📋 بيانات الموظف:');
      console.log(`   الاسم: ${employee.fullNameAr || employee.fullNameEn}`);
      console.log(`   رقم الموظف: ${employee.employeeNumber || 'غير محدد'}`);
      console.log(`   رقم الهوية: ${employee.nationalId}`);
      console.log(`   الوظيفة: ${employee.position || 'غير محدد'}`);
      console.log(`   القسم: ${employee.department || 'غير محدد'}`);
      console.log(`   الحالة: ${employee.status}`);
      console.log('');
      
      // Check user link
      console.log('🔗 ربط المستخدم:');
      if (employee.user) {
        console.log(`   ✅ مربوط بمستخدم:`);
        console.log(`      Username: ${employee.user.username}`);
        console.log(`      Display Name: ${employee.user.displayName}`);
        if (employee.user.systemRole) {
          console.log(`      الدور: ${employee.user.systemRole.nameAr || employee.user.systemRole.name}`);
        } else {
          console.log(`      الدور: غير محدد`);
        }
      } else if (employee.userId) {
        console.log(`   ⚠️  مربوط بمستخدم (ID: ${employee.userId}) لكن لم يتم تحميل البيانات`);
      } else {
        console.log(`   ❌ غير مربوط بأي مستخدم`);
      }
      console.log('');
      
      // Check if needs linking to mohammed
      const mohammedUser = await prisma.user.findUnique({
        where: { username: 'mohammed' },
        select: { 
          id: true, 
          username: true,
          employee: {
            select: {
              id: true,
              fullNameAr: true,
              employeeNumber: true
            }
          }
        }
      });
      
      if (mohammedUser) {
        console.log('👤 مستخدم mohammed:');
        console.log(`   ID: ${mohammedUser.id}`);
        if (mohammedUser.employee) {
          console.log(`   مربوط بموظف: ${mohammedUser.employee.fullNameAr}`);
          console.log(`   رقم الموظف: ${mohammedUser.employee.employeeNumber}`);
          
          if (mohammedUser.employee.id !== employee.id) {
            console.log('');
            console.log('   ⚠️  mohammed مربوط بموظف مختلف!');
            console.log('   يجب فك الربط وإعادة الربط بالموظف الصحيح');
          } else {
            console.log('');
            console.log('   ✅ mohammed مربوط بالموظف الصحيح!');
          }
        } else {
          console.log(`   ❌ غير مربوط بأي موظف`);
        }
        console.log('');
      }
      
    } else {
      console.log('❌ لم يتم العثور على موظف برقم الهوية: 1075380111\n');
      
      // Search similar
      console.log('🔍 البحث عن أرقام مشابهة:\n');
      const similar = await prisma.employee.findMany({
        where: {
          OR: [
            { nationalId: { contains: '1075380111' } },
            { nationalId: { contains: '075380111' } },
            { employeeNumber: { contains: '1075380111' } }
          ]
        },
        select: {
          fullNameAr: true,
          employeeNumber: true,
          nationalId: true
        },
        take: 10
      });
      
      if (similar.length > 0) {
        console.log(`   وجدت ${similar.length} نتائج:\n`);
        similar.forEach((emp, i) => {
          console.log(`   ${i + 1}. ${emp.fullNameAr}`);
          console.log(`      رقم الموظف: ${emp.employeeNumber || 'لا يوجد'}`);
          console.log(`      رقم الهوية: ${emp.nationalId || 'لا يوجد'}`);
          console.log('');
        });
      } else {
        console.log('   لا توجد نتائج مشابهة\n');
      }
    }
    
    console.log('─'.repeat(60));
    console.log('');
    
  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

searchByNationalId().catch(console.error);
