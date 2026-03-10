const { PrismaClient } = require('@prisma/client');

async function updatePassword() {
  const prisma = new PrismaClient();
  
  console.log('\n🔧 تحديث كلمة المرور مباشرة:\n');
  console.log('═'.repeat(60));
  
  try {
    const passwordHash = '$2a$10$uCC6jt03.HYd9U6MFDJuUe.iDzh7jJZhT/EufTavPAElCP7u6y.u2';
    const username = '1113256885';
    
    // Use executeRawUnsafe to avoid prepared statement caching
    const result = await prisma.$executeRawUnsafe(`
      UPDATE "User"
      SET "passwordHash" = $1
      WHERE username = $2
    `, passwordHash, username);
    
    console.log(`✅ تم تحديث ${result} مستخدم\n`);
    console.log('═'.repeat(60));
    console.log('\n📋 بيانات الدخول:\n');
    console.log('   Username: 1113256885');
    console.log('   Password: teacher123');
    console.log('   Role: معلم (TEACHER)');
    console.log('   الاسم: طيبه عبدالعزيز خليفة الدوسري\n');
    
    console.log('🎯 للاختبار:');
    console.log('   1. سجل خروج من حساب mohammed');
    console.log('   2. سجل دخول بـ 1113256885 / teacher123');
    console.log('   3. افتح https://p.albassam-app.com/debug-permissions');
    console.log('   4. افتح https://p.albassam-app.com/attendance\n');
    
  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updatePassword().catch(console.error);
