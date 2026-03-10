const bcrypt = require('bcryptjs');

async function resetPassword() {
  console.log('\n🔧 تعيين كلمة مرور لمعلم موجود:\n');
  console.log('═'.repeat(60));
  
  try {
    const hashedPassword = await bcrypt.hash('teacher123', 10);
    
    console.log('\nPassword Hash Generated:');
    console.log(hashedPassword);
    console.log('\n');
    console.log('استخدم هذا SQL:');
    console.log('');
    console.log('UPDATE "User"');
    console.log(`SET "passwordHash" = '${hashedPassword}'`);
    console.log('WHERE username = \'1113256885\';');
    console.log('');
    console.log('═'.repeat(60));
    console.log('\n📋 بعد تشغيل SQL:\n');
    console.log('   Username: 1113256885');
    console.log('   Password: teacher123');
    console.log('   Role: معلم (TEACHER)');
    console.log('');
    
  } catch (error) {
    console.error('❌ خطأ:', error);
  }
}

resetPassword().catch(console.error);
