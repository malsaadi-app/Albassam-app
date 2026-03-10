const fs = require('fs');
const crypto = require('crypto');

function invalidateAllSessions() {
  console.log('\n🔒 إبطال جميع Sessions النشطة:\n');
  console.log('═'.repeat(80));
  
  const envPath = '/data/.openclaw/workspace/albassam-tasks/.env';
  
  try {
    // Read current .env
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Generate new random password (32+ characters)
    const newPassword = crypto.randomBytes(32).toString('hex');
    
    console.log('\n📋 الإجراءات:\n');
    console.log('   1. قراءة .env الحالي ✅');
    console.log('   2. توليد SESSION_PASSWORD جديد ✅');
    
    // Replace SESSION_PASSWORD
    const oldPasswordMatch = envContent.match(/SESSION_PASSWORD=([^\n]+)/);
    const oldPassword = oldPasswordMatch ? oldPasswordMatch[1] : 'NOT_FOUND';
    
    if (oldPasswordMatch) {
      envContent = envContent.replace(
        /SESSION_PASSWORD=([^\n]+)/,
        `SESSION_PASSWORD=${newPassword}`
      );
      
      // Write back to .env
      fs.writeFileSync(envPath, envContent, 'utf8');
      
      console.log('   3. تحديث .env ✅\n');
      console.log('─'.repeat(80));
      console.log('\n✅ تم تغيير SESSION_PASSWORD بنجاح!\n');
      console.log('📊 النتيجة:\n');
      console.log('   ✅ جميع Sessions القديمة أصبحت غير صالحة');
      console.log('   ✅ جميع المستخدمين سيطلب منهم تسجيل الدخول');
      console.log('   ✅ Sessions جديدة ستحمل الصلاحيات الصحيحة\n');
      console.log('⚠️  مهم: يجب إعادة تشغيل التطبيق!\n');
      console.log('   التنفيذ: pm2 restart albassam-app\n');
      console.log('═'.repeat(80));
      console.log('\n💡 ماذا حدث؟\n');
      console.log('   - SESSION_PASSWORD القديم: ' + oldPassword.substring(0, 20) + '...');
      console.log('   - SESSION_PASSWORD الجديد: ' + newPassword.substring(0, 20) + '...\n');
      console.log('   جميع cookies المشفرة بالمفتاح القديم أصبحت غير قابلة للفك!');
      console.log('   = إجبار تسجيل دخول جديد لجميع المستخدمين ✅\n');
    } else {
      console.log('   ❌ لم يتم العثور على SESSION_PASSWORD في .env\n');
      console.log('   الرجاء التحقق من ملف .env يدوياً\n');
    }
    
  } catch (error) {
    console.error('\n❌ خطأ:', error.message);
    console.log('\nالرجاء التأكد من:');
    console.log('  1. وجود ملف .env');
    console.log('  2. صلاحيات الكتابة على الملف\n');
  }
}

// Warning first
console.log('\n⚠️⚠️⚠️  تحذير  ⚠️⚠️⚠️\n');
console.log('هذا السكريبت سيقوم بـ:');
console.log('1. تغيير SESSION_PASSWORD في .env');
console.log('2. إبطال جميع Sessions النشطة فوراً');
console.log('3. إجبار جميع المستخدمين على تسجيل دخول جديد');
console.log('4. يحتاج إعادة تشغيل: pm2 restart albassam-app\n');
console.log('─'.repeat(80));
console.log('');

// Run
invalidateAllSessions();
