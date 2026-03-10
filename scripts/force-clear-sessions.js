const { PrismaClient } = require('@prisma/client');

async function clearAllSessions() {
  const prisma = new PrismaClient();
  
  console.log('\n🔧 حذف جميع Sessions النشطة:\n');
  console.log('═'.repeat(60));
  
  try {
    // Count current sessions
    const sessionCount = await prisma.session.count();
    
    console.log(`\n📊 Sessions الحالية: ${sessionCount}\n`);
    
    if (sessionCount === 0) {
      console.log('✅ لا توجد sessions نشطة!\n');
      await prisma.$disconnect();
      return;
    }
    
    console.log('🗑️  حذف جميع Sessions...\n');
    
    // Delete all sessions
    const result = await prisma.session.deleteMany({});
    
    console.log(`✅ تم حذف ${result.count} session\n`);
    console.log('═'.repeat(60));
    console.log('\n💡 النتيجة:\n');
    console.log('   ✅ جميع المستخدمين سيطلب منهم تسجيل الدخول');
    console.log('   ✅ Sessions الجديدة ستحمل الصلاحيات المحدثة');
    console.log('   ✅ مشكلة "ليس لديك صلاحية" ستُحل تلقائياً');
    console.log('');
    console.log('🔄 ماذا يحدث الآن:');
    console.log('   1. المستخدم يحدث الصفحة (F5)');
    console.log('   2. يُعاد توجيهه تلقائياً إلى صفحة تسجيل الدخول');
    console.log('   3. يسجل دخول بنفس الحساب');
    console.log('   4. Session جديد = صلاحيات جديدة ✅\n');
    
  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearAllSessions().catch(console.error);
