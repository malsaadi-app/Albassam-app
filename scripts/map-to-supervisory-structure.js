const XLSX = require('xlsx');
const fs = require('fs');

const filePath = '/data/.openclaw/workspace/albassam-tasks/data/employees_data.xlsx';

console.log('\n🔍 تحليل الأقسام ومطابقتها مع الهيكل الإشرافي:\n');
console.log('='.repeat(80));

// الهيكل الإشرافي المستهدف
const supervisoryStructure = {
  'وحدة ضمان الجودة': {
    'قسم الصفوف الأولية': {
      subjects: ['الصفوف الأولية', 'صفوف أولية'],
      stages: ['ابتدائي', 'ابتدائية'],
      supervisor: 'مشرف الصفوف الأولية'
    },
    'قسم المواد الإنسانية - ابتدائي': {
      subjects: ['اللغة العربية', 'لغة عربية', 'التربية الإسلامية', 'تربية إسلامية', 'الاجتماعيات', 'اجتماعيات', 'التربية الوطنية', 'تربية وطنية', 'التاريخ', 'تاريخ', 'الجغرافيا', 'جغرافيا'],
      stages: ['ابتدائي', 'ابتدائية'],
      supervisor: 'منسق المواد الإنسانية - ابتدائي'
    },
    'قسم العلوم والرياضيات - ابتدائي': {
      subjects: ['العلوم', 'علوم', 'الرياضيات', 'رياضيات', 'الفيزياء', 'فيزياء', 'الكيمياء', 'كيمياء', 'الأحياء', 'أحياء', 'علوم الأرض', 'علوم الفضاء'],
      stages: ['ابتدائي', 'ابتدائية'],
      supervisor: 'منسق العلوم والرياضيات - ابتدائي'
    },
    'قسم اللغة الإنجليزية - ابتدائي': {
      subjects: ['اللغة الإنجليزية', 'لغة إنجليزية', 'english'],
      stages: ['ابتدائي', 'ابتدائية'],
      supervisor: 'منسق اللغة الإنجليزية - ابتدائي'
    },
    'قسم المواد الإنسانية - متوسط وثانوي': {
      subjects: ['اللغة العربية', 'لغة عربية', 'التربية الإسلامية', 'تربية إسلامية', 'الاجتماعيات', 'اجتماعيات', 'التربية الوطنية', 'تربية وطنية', 'التاريخ', 'تاريخ', 'الجغرافيا', 'جغرافيا'],
      stages: ['متوسط', 'متوسطة', 'ثانوي', 'ثانوية'],
      supervisor: 'مشرف المواد الإنسانية'
    },
    'قسم المواد العلمية - متوسط وثانوي': {
      subjects: ['العلوم', 'علوم', 'الرياضيات', 'رياضيات', 'الفيزياء', 'فيزياء', 'الكيمياء', 'كيمياء', 'الأحياء', 'أحياء', 'علوم الأرض', 'علوم الفضاء'],
      stages: ['متوسط', 'متوسطة', 'ثانوي', 'ثانوية'],
      supervisor: 'مشرف المواد العلمية'
    },
    'قسم البرنامج الدولي': {
      subjects: ['برنامج دولي', 'البرنامج الدولي', 'international'],
      stages: ['*'],
      supervisor: 'منسق البرنامج الدولي'
    }
  }
};

// الأقسام التي لا تنتمي للهيكل الإشرافي (أقسام إدارية ودعم)
const nonAcademicDepts = [
  'قسم الخدمات المساندة',
  'قسم السكرتارية والاستقبال',
  'الحاسب الآلي',
  'قسم تقنية المعلومات',
  'قسم الشئون الإدارية',
  'قسم رياض الأطفال',
  'الإرشاد الطلابي',
  'القسم الأعلامي',
  'المركز الإعلامي',
  'قسم الموارد البشرية',
  'قسم خاص المشرف العام',
  'النشاط الطلابي',
  'قسم النشاط',
  'قسم الشئون المالية',
  'الإدارة المالية',
  'التربية البدنية',
  'التربية الفنية',
  'القسم الصحي',
  'العيادة',
  'المكتبة',
  'قسم الرقابة والجودة',
  'وحدة ضمان الجودة'
];

try {
  const workbook = XLSX.readFile(filePath);
  
  const mapping = {};
  const unmapped = [];
  const nonAcademic = [];
  
  workbook.SheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    const branchCol = Object.keys(data[0] || {}).find(col => 
      col.includes('مجمع') || col.includes('فرع')
    );
    
    const schoolCol = Object.keys(data[0] || {}).find(col => 
      col.includes('مدرسة') || col.includes('مرحلة')
    );
    
    const deptCol = Object.keys(data[0] || {}).find(col => 
      col.includes('قسم') || col.toLowerCase().includes('department')
    );
    
    if (deptCol) {
      data.forEach(row => {
        const dept = row[deptCol] ? String(row[deptCol]).trim() : '';
        const school = row[schoolCol] ? String(row[schoolCol]).trim() : '';
        const branch = row[branchCol] ? String(row[branchCol]).trim() : '';
        
        if (!dept || dept === 'NULL') return;
        
        // تحقق إذا كان قسم إداري
        const isNonAcademic = nonAcademicDepts.some(nad => 
          dept.includes(nad) || nad.includes(dept)
        );
        
        if (isNonAcademic) {
          if (!nonAcademic.find(na => na.original === dept)) {
            nonAcademic.push({
              original: dept,
              count: 1,
              type: 'إداري/دعم'
            });
          } else {
            const idx = nonAcademic.findIndex(na => na.original === dept);
            nonAcademic[idx].count++;
          }
          return;
        }
        
        // محاولة المطابقة مع الهيكل الإشرافي
        let matched = false;
        
        // استخراج المرحلة من اسم المدرسة
        let stage = '';
        if (school.includes('ابتدائي')) stage = 'ابتدائي';
        else if (school.includes('متوسط')) stage = 'متوسط';
        else if (school.includes('ثانوي')) stage = 'ثانوي';
        else if (school.includes('رياض')) stage = 'رياض';
        
        // البحث في الهيكل الإشرافي
        for (const [unit, depts] of Object.entries(supervisoryStructure)) {
          for (const [supervisoryDept, config] of Object.entries(depts)) {
            // تحقق من المادة
            const subjectMatch = config.subjects.some(subj => 
              dept.toLowerCase().includes(subj.toLowerCase()) || 
              subj.toLowerCase().includes(dept.toLowerCase())
            );
            
            // تحقق من المرحلة
            const stageMatch = config.stages.includes('*') || 
              config.stages.some(s => stage.includes(s) || s.includes(stage));
            
            if (subjectMatch && (stageMatch || !stage)) {
              matched = true;
              
              const key = `${supervisoryDept}`;
              if (!mapping[key]) {
                mapping[key] = {
                  supervisoryDept: supervisoryDept,
                  supervisor: config.supervisor,
                  originalDepts: {},
                  totalEmployees: 0
                };
              }
              
              if (!mapping[key].originalDepts[dept]) {
                mapping[key].originalDepts[dept] = 0;
              }
              mapping[key].originalDepts[dept]++;
              mapping[key].totalEmployees++;
              break;
            }
          }
          if (matched) break;
        }
        
        // إذا لم تتم المطابقة
        if (!matched) {
          if (!unmapped.find(u => u.original === dept)) {
            unmapped.push({
              original: dept,
              school: school,
              stage: stage,
              count: 1
            });
          } else {
            const idx = unmapped.findIndex(u => u.original === dept);
            unmapped[idx].count++;
          }
        }
      });
    }
  });
  
  console.log('\n📊 نتائج المطابقة:\n');
  
  // عرض المطابقات الناجحة
  console.log('✅ الأقسام المطابقة للهيكل الإشرافي:\n');
  Object.values(mapping).forEach((item, i) => {
    console.log(`${i + 1}. ${item.supervisoryDept}`);
    console.log(`   المشرف: ${item.supervisor}`);
    console.log(`   إجمالي الموظفين: ${item.totalEmployees}`);
    console.log(`   الأقسام الأصلية:`);
    Object.entries(item.originalDepts).forEach(([dept, count]) => {
      console.log(`      - ${dept} (${count} موظف)`);
    });
    console.log('');
  });
  
  // عرض الأقسام الإدارية
  console.log('\n' + '='.repeat(80));
  console.log('\n🏢 الأقسام الإدارية والدعم (لا تنتمي للهيكل الإشرافي):\n');
  nonAcademic.forEach((item, i) => {
    console.log(`${i + 1}. ${item.original} (${item.count} موظف) - ${item.type}`);
  });
  
  // عرض الأقسام غير المطابقة
  if (unmapped.length > 0) {
    console.log('\n' + '='.repeat(80));
    console.log('\n⚠️ الأقسام التي لم تتم مطابقتها:\n');
    unmapped.forEach((item, i) => {
      console.log(`${i + 1}. ${item.original} (${item.count} موظف)`);
      console.log(`   المرحلة: ${item.stage || 'غير محدد'}`);
      console.log(`   المدرسة: ${item.school || 'غير محدد'}`);
      console.log('');
    });
    
    console.log('💡 اقتراحات للأقسام غير المطابقة:\n');
    unmapped.forEach((item) => {
      const dept = item.original.toLowerCase();
      
      if (dept.includes('مهارات بحث') || dept.includes('مهارات تفكير')) {
        console.log(`   "${item.original}" → قسم المواد الإنسانية (${item.stage || 'حسب المرحلة'})`);
      } else if (dept.includes('وطنية')) {
        console.log(`   "${item.original}" → قسم المواد الإنسانية (${item.stage || 'حسب المرحلة'})`);
      } else if (dept.includes('مهارات تطبيقية')) {
        console.log(`   "${item.original}" → قسم المواد العلمية (${item.stage || 'حسب المرحلة'})`);
      } else {
        console.log(`   "${item.original}" → يحتاج مراجعة يدوية`);
      }
    });
  }
  
  // حفظ النتائج
  const results = {
    mapped: mapping,
    nonAcademic: nonAcademic,
    unmapped: unmapped,
    summary: {
      totalMappedDepts: Object.keys(mapping).length,
      totalMappedEmployees: Object.values(mapping).reduce((sum, m) => sum + m.totalEmployees, 0),
      totalNonAcademicEmployees: nonAcademic.reduce((sum, na) => sum + na.count, 0),
      totalUnmappedEmployees: unmapped.reduce((sum, u) => sum + u.count, 0)
    }
  };
  
  fs.writeFileSync(
    '/data/.openclaw/workspace/albassam-tasks/data/supervisory_mapping.json',
    JSON.stringify(results, null, 2)
  );
  
  console.log('\n' + '='.repeat(80));
  console.log('\n📈 الملخص:\n');
  console.log(`   ✅ أقسام إشرافية مطابقة: ${results.summary.totalMappedDepts}`);
  console.log(`   👥 موظفين تحت الهيكل الإشرافي: ${results.summary.totalMappedEmployees}`);
  console.log(`   🏢 موظفين في أقسام إدارية/دعم: ${results.summary.totalNonAcademicEmployees}`);
  console.log(`   ⚠️ موظفين غير مطابقين: ${results.summary.totalUnmappedEmployees}`);
  console.log('');
  console.log('✅ تم حفظ النتائج في: data/supervisory_mapping.json\n');
  
} catch (error) {
  console.error('\n❌ خطأ:', error.message);
  console.error(error.stack);
}
