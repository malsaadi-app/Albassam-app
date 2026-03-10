const { PrismaClient } = require('@prisma/client');

async function forceLogoutAll() {
  const prisma = new PrismaClient();
  
  console.log('\n⚠️  تسجيل خروج إجباري لجميع المستخدمين:\n');
  console.log('─'.repeat(60));
  
  try {
    // Count sessions
    const sessionCount = await prisma.session.count();
    
    console.log(`📊 Sessions الحالية: ${sessionCount}\n`);
    
    if (sessionCount === 0) {
      console.log('✅ لا توجد sessions نشطة!\n');
      await prisma.$disconnect();
      return;
    }
    
    console.log('🗑️  حذف جميع Sessions...\n');
    
    // Delete all sessions
    const deleted = await prisma.session.deleteMany({});
    
    console.log(`✅ تم حذف ${deleted.count} session\n`);
    console.log('─'.repeat(60));
    console.log('\n💡 النتيجة:\n');
    console.log('   ✅ جميع المستخدمين سيطلب منهم تسجيل الدخول');
    console.log('   ✅ Sessions الجديدة ستحمل الصلاحيات المحدثة');
    console.log('   ✅ مشكلة الصلاحيات ستُحل تلقائياً\n');
    
  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Show warning first
console.log('\n⚠️⚠️⚠️  تحذير  ⚠️⚠️⚠️\n');
console.log('هذا السكريبت سيقوم بـ:');
console.log('1. حذف جميع Sessions النشطة');
console.log('2. تسجيل خروج جميع المستخدمين');
console.log('3. الجميع سيطلب منهم تسجيل الدخول من جديد\n');
console.log('─'.repeat(60));
console.log('');

// Uncomment to run:
// forceLogoutAll().catch(console.error);

console.log('❌ السكريبت معطل (لحماية المستخدمين)\n');
console.log('لتفعيله: احذف السطر الأخير وأزل التعليق عن forceLogoutAll()\n');
