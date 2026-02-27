const BASE_URL = 'http://localhost:3000';

// Users for testing
const users = {
  admin: { username: 'mohammed', password: 'AbS0MqAwLAHo!' },
  user1: { username: 'user1', password: 'AbS0MqAwLAHo!' },
  user2: { username: 'user2', password: 'AbS0MqAwLAHo!' },
  user3: { username: 'user3', password: 'AbS0MqAwLAHo!' },
};

// Login and get session
async function login(username, password) {
  const res = await fetch(`${BASE_URL}/api/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  
  const setCookieHeader = res.headers.get('set-cookie');
  if (!setCookieHeader) {
    throw new Error(`Login failed for ${username} - no cookies`);
  }
  
  // Handle multiple cookies in set-cookie header
  const cookies = setCookieHeader.split(',').map(c => c.trim());
  const sessionCookie = cookies.find(c => c.includes('next-auth.session-token'));
  
  if (!sessionCookie) {
    throw new Error(`Login failed for ${username} - no session cookie`);
  }
  
  return sessionCookie.split(';')[0];
}

// Create HR Leave Request
async function createLeaveRequest(cookie, data) {
  const res = await fetch(`${BASE_URL}/api/hr/requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie,
    },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to create leave request: ${error}`);
  }
  
  return await res.json();
}

// Create Attendance Request
async function createAttendanceRequest(cookie, data) {
  const res = await fetch(`${BASE_URL}/api/attendance/requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie,
    },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to create attendance request: ${error}`);
  }
  
  return await res.json();
}

// Create Procurement Request
async function createProcurementRequest(cookie, data) {
  const res = await fetch(`${BASE_URL}/api/procurement/requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie,
    },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to create procurement request: ${error}`);
  }
  
  return await res.json();
}

// Process workflow step
async function processStep(cookie, type, id, action, comment = '') {
  const endpoint = type === 'hr' 
    ? `/api/hr/requests/${id}/process-step`
    : `/api/procurement/requests/${id}/process-step`;
    
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie,
    },
    body: JSON.stringify({ action, comment }),
  });
  
  if (!res.ok) {
    const error = await res.text();
    console.log(`⚠️  Failed to process ${type} request ${id}: ${error}`);
    return null;
  }
  
  return await res.json();
}

// Process attendance request
async function processAttendanceRequest(cookie, id, action, comment = '') {
  const res = await fetch(`${BASE_URL}/api/attendance/requests/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookie,
    },
    body: JSON.stringify({ status: action, reviewComment: comment }),
  });
  
  if (!res.ok) {
    const error = await res.text();
    console.log(`⚠️  Failed to process attendance request ${id}: ${error}`);
    return null;
  }
  
  return await res.json();
}

async function main() {
  console.log('🚀 بدء اختبار الطلبات والمراحل...\n');
  
  try {
    // Login users
    console.log('🔐 تسجيل دخول المستخدمين...');
    const adminCookie = await login(users.admin.username, users.admin.password);
    const user1Cookie = await login(users.user1.username, users.user1.password);
    const user2Cookie = await login(users.user2.username, users.user2.password);
    const user3Cookie = await login(users.user3.username, users.user3.password);
    console.log('✅ تم تسجيل الدخول بنجاح\n');
    
    // ========================================
    // HR REQUESTS
    // ========================================
    console.log('📝 === طلبات الموارد البشرية ===\n');
    
    // 1. Annual Leave - في المرحلة الأولى (عند المراجع)
    console.log('1️⃣ إنشاء طلب إجازة سنوية (سيبقى في المرحلة الأولى)...');
    const leave1 = await createLeaveRequest(user1Cookie, {
      type: 'ANNUAL',
      startDate: '2026-02-20',
      endDate: '2026-02-24',
      reason: 'إجازة عائلية',
    });
    console.log(`   ✅ تم إنشاء الطلب #${leave1.id} - الحالة: ${leave1.status}\n`);
    
    // 2. Sick Leave - معالج ووصل للمرحلة الثانية
    console.log('2️⃣ إنشاء طلب إجازة مرضية (سيتم تحريكه للمرحلة الثانية)...');
    const leave2 = await createLeaveRequest(user2Cookie, {
      type: 'SICK',
      startDate: '2026-02-15',
      endDate: '2026-02-16',
      reason: 'إصابة بالإنفلونزا',
    });
    console.log(`   ✅ تم إنشاء الطلب #${leave2.id}`);
    
    // معالجة المرحلة الأولى
    await new Promise(resolve => setTimeout(resolve, 1000));
    const leave2Step1 = await processStep(adminCookie, 'hr', leave2.id, 'APPROVE', 'موافقة مبدئية');
    if (leave2Step1) {
      console.log(`   ✅ تمت المعالجة - انتقل للمرحلة التالية - الحالة: ${leave2Step1.status}\n`);
    }
    
    // 3. Emergency Leave - مكتمل
    console.log('3️⃣ إنشاء طلب إجازة طارئة (سيتم إكماله بالكامل)...');
    const leave3 = await createLeaveRequest(user3Cookie, {
      type: 'EMERGENCY',
      startDate: '2026-02-14',
      endDate: '2026-02-14',
      reason: 'ظروف عائلية طارئة',
    });
    console.log(`   ✅ تم إنشاء الطلب #${leave3.id}`);
    
    // معالجة جميع المراحل
    await new Promise(resolve => setTimeout(resolve, 1000));
    let currentLeave3 = leave3;
    let step = 1;
    while (currentLeave3.status !== 'APPROVED' && step < 5) {
      const processed = await processStep(adminCookie, 'hr', leave3.id, 'APPROVE', `موافقة المرحلة ${step}`);
      if (!processed) break;
      currentLeave3 = processed;
      console.log(`   ✅ تمت معالجة المرحلة ${step} - الحالة: ${currentLeave3.status}`);
      step++;
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    console.log(`   ✅ الطلب مكتمل - الحالة النهائية: ${currentLeave3.status}\n`);
    
    // 4. Casual Leave - مرفوض
    console.log('4️⃣ إنشاء طلب إجازة عارضة (سيتم رفضه)...');
    const leave4 = await createLeaveRequest(user1Cookie, {
      type: 'CASUAL',
      startDate: '2026-02-25',
      endDate: '2026-02-25',
      reason: 'أمور شخصية',
    });
    console.log(`   ✅ تم إنشاء الطلب #${leave4.id}`);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    const leave4Rejected = await processStep(adminCookie, 'hr', leave4.id, 'REJECT', 'لا يمكن الموافقة في هذا التوقيت');
    if (leave4Rejected) {
      console.log(`   ❌ تم رفض الطلب - الحالة: ${leave4Rejected.status}\n`);
    }
    
    // ========================================
    // ATTENDANCE REQUESTS
    // ========================================
    console.log('⏰ === طلبات الحضور ===\n');
    
    // 5. Excuse - في المرحلة الأولى
    console.log('5️⃣ إنشاء طلب تبرير غياب (سيبقى معلق)...');
    const attendance1 = await createAttendanceRequest(user2Cookie, {
      type: 'EXCUSE',
      date: '2026-02-10',
      reason: 'ظروف طارئة',
      details: 'تعطل السيارة في الطريق',
    });
    console.log(`   ✅ تم إنشاء الطلب #${attendance1.id} - الحالة: ${attendance1.status}\n`);
    
    // 6. Permission - موافق عليه
    console.log('6️⃣ إنشاء طلب استئذان (سيتم الموافقة عليه)...');
    const attendance2 = await createAttendanceRequest(user3Cookie, {
      type: 'PERMISSION',
      date: '2026-02-14',
      reason: 'موعد طبي',
      details: 'موعد في المستشفى',
    });
    console.log(`   ✅ تم إنشاء الطلب #${attendance2.id}`);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    const attendance2Approved = await processAttendanceRequest(adminCookie, attendance2.id, 'APPROVED', 'موافقة');
    if (attendance2Approved) {
      console.log(`   ✅ تمت الموافقة - الحالة: ${attendance2Approved.status}\n`);
    }
    
    // 7. Correction - مرفوض
    console.log('7️⃣ إنشاء طلب تصحيح سجل (سيتم رفضه)...');
    const attendance3 = await createAttendanceRequest(user1Cookie, {
      type: 'CORRECTION',
      date: '2026-02-12',
      reason: 'خطأ في السجل',
      details: 'البصمة لم تسجل',
      actualCheckIn: '08:00',
      actualCheckOut: '16:00',
    });
    console.log(`   ✅ تم إنشاء الطلب #${attendance3.id}`);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    const attendance3Rejected = await processAttendanceRequest(adminCookie, attendance3.id, 'REJECTED', 'البيانات غير مطابقة للسجلات');
    if (attendance3Rejected) {
      console.log(`   ❌ تم رفض الطلب - الحالة: ${attendance3Rejected.status}\n`);
    }
    
    // ========================================
    // PROCUREMENT REQUESTS
    // ========================================
    console.log('🛒 === طلبات الشراء ===\n');
    
    // 8. IT Equipment - في المرحلة الأولى
    console.log('8️⃣ إنشاء طلب شراء معدات IT (سيبقى في المرحلة الأولى)...');
    const procurement1 = await createProcurementRequest(user1Cookie, {
      category: 'IT',
      title: 'أجهزة كمبيوتر محمولة',
      description: 'شراء 5 أجهزة لاب توب للموظفين الجدد',
      estimatedCost: 25000,
      urgency: 'HIGH',
    });
    console.log(`   ✅ تم إنشاء الطلب #${procurement1.id} - الحالة: ${procurement1.status}\n`);
    
    // 9. Office Supplies - معالج ووصل للمرحلة الثانية
    console.log('9️⃣ إنشاء طلب شراء لوازم مكتبية (سيتم تحريكه للمرحلة الثانية)...');
    const procurement2 = await createProcurementRequest(user2Cookie, {
      category: 'OFFICE_SUPPLIES',
      title: 'أدوات كتابة ولوازم مكتبية',
      description: 'طلب ربع سنوي للوازم المكتبية',
      estimatedCost: 3500,
      urgency: 'MEDIUM',
    });
    console.log(`   ✅ تم إنشاء الطلب #${procurement2.id}`);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    const procurement2Step1 = await processStep(adminCookie, 'procurement', procurement2.id, 'APPROVE', 'موافقة المراجعة الأولية');
    if (procurement2Step1) {
      console.log(`   ✅ تمت المعالجة - انتقل للمرحلة التالية - الحالة: ${procurement2Step1.status}\n`);
    }
    
    // 10. Furniture - مكتمل
    console.log('🔟 إنشاء طلب شراء أثاث (سيتم إكماله بالكامل)...');
    const procurement3 = await createProcurementRequest(user3Cookie, {
      category: 'FURNITURE',
      title: 'مكاتب وكراسي',
      description: 'تجهيز المكاتب الجديدة',
      estimatedCost: 15000,
      urgency: 'MEDIUM',
    });
    console.log(`   ✅ تم إنشاء الطلب #${procurement3.id}`);
    
    // معالجة جميع المراحل
    await new Promise(resolve => setTimeout(resolve, 1000));
    let currentProcurement3 = procurement3;
    step = 1;
    while (currentProcurement3.status !== 'APPROVED' && step < 5) {
      const processed = await processStep(adminCookie, 'procurement', procurement3.id, 'APPROVE', `موافقة المرحلة ${step}`);
      if (!processed) break;
      currentProcurement3 = processed;
      console.log(`   ✅ تمت معالجة المرحلة ${step} - الحالة: ${currentProcurement3.status}`);
      step++;
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    console.log(`   ✅ الطلب مكتمل - الحالة النهائية: ${currentProcurement3.status}\n`);
    
    // 11. Maintenance - مرفوض
    console.log('1️⃣1️⃣ إنشاء طلب شراء صيانة (سيتم رفضه)...');
    const procurement4 = await createProcurementRequest(user1Cookie, {
      category: 'MAINTENANCE',
      title: 'صيانة أجهزة التكييف',
      description: 'عقد صيانة سنوي',
      estimatedCost: 8000,
      urgency: 'LOW',
    });
    console.log(`   ✅ تم إنشاء الطلب #${procurement4.id}`);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    const procurement4Rejected = await processStep(adminCookie, 'procurement', procurement4.id, 'REJECT', 'الميزانية غير متوفرة حالياً');
    if (procurement4Rejected) {
      console.log(`   ❌ تم رفض الطلب - الحالة: ${procurement4Rejected.status}\n`);
    }
    
    // ========================================
    // SUMMARY
    // ========================================
    console.log('\n═══════════════════════════════════════════════');
    console.log('📊 ملخص الطلبات المُنشأة:');
    console.log('═══════════════════════════════════════════════\n');
    
    console.log('✅ طلبات الموارد البشرية (4 طلبات):');
    console.log(`   - طلب #${leave1.id}: إجازة سنوية - في المرحلة الأولى (معلق)`);
    console.log(`   - طلب #${leave2.id}: إجازة مرضية - في المرحلة الثانية`);
    console.log(`   - طلب #${leave3.id}: إجازة طارئة - مكتمل ✓`);
    console.log(`   - طلب #${leave4.id}: إجازة عارضة - مرفوض ✗\n`);
    
    console.log('✅ طلبات الحضور (3 طلبات):');
    console.log(`   - طلب #${attendance1.id}: تبرير غياب - معلق`);
    console.log(`   - طلب #${attendance2.id}: استئذان - موافق عليه ✓`);
    console.log(`   - طلب #${attendance3.id}: تصحيح سجل - مرفوض ✗\n`);
    
    console.log('✅ طلبات الشراء (4 طلبات):');
    console.log(`   - طلب #${procurement1.id}: معدات IT - في المرحلة الأولى (معلق)`);
    console.log(`   - طلب #${procurement2.id}: لوازم مكتبية - في المرحلة الثانية`);
    console.log(`   - طلب #${procurement3.id}: أثاث - مكتمل ✓`);
    console.log(`   - طلب #${procurement4.id}: صيانة - مرفوض ✗\n`);
    
    console.log('═══════════════════════════════════════════════');
    console.log('🎉 تم الاختبار بنجاح! الآن راجع التطبيق لترى الطلبات');
    console.log('═══════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
    console.error(error.stack);
  }
}

main();
