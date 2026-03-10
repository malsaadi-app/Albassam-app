const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function createTestTeacher() {
  console.log('\n🔧 إنشاء حساب معلم اختباري:\n');
  console.log('═'.repeat(60));
  
  try {
    // Get TEACHER role
    const prisma1 = new PrismaClient();
    const teacherRole = await prisma1.systemRole.findFirst({
      where: { name: 'TEACHER' }
    });
    await prisma1.$disconnect();
    
    if (!teacherRole) {
      console.log('❌ دور TEACHER غير موجود!\n');
      return;
    }
    
    console.log(`✅ دور TEACHER موجود: ${teacherRole.nameAr}\n`);
    
    // Check if test teacher already exists
    const prisma2 = new PrismaClient();
    const existingUser = await prisma2.user.findUnique({
      where: { username: 'test-teacher' }
    });
    await prisma2.$disconnect();
    
    if (existingUser) {
      console.log('⚠️  حساب test-teacher موجود بالفعل!\n');
      console.log('سيتم تحديث كلمة المرور...\n');
      
      // Update password
      const hashedPassword = await bcrypt.hash('teacher123', 10);
      
      const prisma3 = new PrismaClient();
      await prisma3.user.update({
        where: { username: 'test-teacher' },
        data: {
          passwordHash: hashedPassword,
          roleId: teacherRole.id
        }
      });
      await prisma3.$disconnect();
      
      console.log('✅ تم تحديث الحساب!\n');
    } else {
      // Create new test teacher
      const hashedPassword = await bcrypt.hash('teacher123', 10);
      
      const prisma4 = new PrismaClient();
      await prisma4.user.create({
        data: {
          username: 'test-teacher',
          displayName: 'معلم تجريبي',
          passwordHash: hashedPassword,
          role: 'USER',
          roleId: teacherRole.id
        }
      });
      await prisma4.$disconnect();
      
      console.log('✅ تم إنشاء الحساب!\n');
    }
    
    console.log('═'.repeat(60));
    console.log('\n📋 بيانات الدخول:\n');
    console.log('   Username: test-teacher');
    console.log('   Password: teacher123');
    console.log('   Role: معلم (TEACHER)');
    console.log('   الصلاحيات: 5 صلاحيات فقط\n');
    
    console.log('🎯 للاختبار:');
    console.log('   1. سجل خروج من حساب mohammed');
    console.log('   2. سجل دخول بـ test-teacher / teacher123');
    console.log('   3. افتح /debug-permissions');
    console.log('   4. افتح /attendance\n');
    
  } catch (error) {
    console.error('❌ خطأ:', error);
  }
}

createTestTeacher().catch(console.error);
