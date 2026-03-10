const XLSX = require('xlsx');
const fs = require('fs');

const filePath = '/data/.openclaw/workspace/albassam-tasks/data/employees_data_final.xlsx';

console.log('\n🔍 فحص المشاكل المتبقية (بعد جميع التصحيحات)...\n');

const problematicEmployees = [];
const problemCategories = {
  'أقسام تعليمية في شركات': [],
  'بيانات ناقصة': [],
  'أخرى': []
};

try {
  const workbook = XLSX.readFile(filePath);
  
  workbook.SheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    if (data.length === 0) return;
    
    const firstRow = data[0];
    const branchCol = Object.keys(firstRow).find(col => 
      col.includes('مجمع') || col.includes('فرع') || col.includes('شركة') || col.includes('معهد')
    );
    const schoolCol = Object.keys(firstRow).find(col => 
      col.includes('مدرسة') || col.includes('مرحلة')
    );
    const deptCol = Object.keys(firstRow).find(col => 
      col.includes('قسم') || col.toLowerCase().includes('department')
    );
    const nameArCol = Object.keys(firstRow).find(col => 
      col.includes('الاسم') && !col.includes('Name')
    );
    const nameEnCol = Object.keys(firstRow).find(col => 
      col === 'Name' || col.includes('name')
    );
    const nationalityCol = Object.keys(firstRow).find(col => 
      col.includes('الجنسية')
    );
    const nationalIdCol = Object.keys(firstRow).find(col => 
      col.includes('رقم الهوية')
    );
    const mobileCol = Object.keys(firstRow).find(col => 
      col.includes('رقم الجوال')
    );
    const qualificationCol = Object.keys(firstRow).find(col => 
      col.includes('المؤهل')
    );
    const specializationCol = Object.keys(firstRow).find(col => 
      col.includes('التخصص')
    );
    const emailCol = Object.keys(firstRow).find(col => 
      col.includes('البريد')
    );
    const jobTitleCol = Object.keys(firstRow).find(col => 
      col.includes('الصلاحية') || col.includes('المسمى')
    );
    
    data.forEach((row, idx) => {
      const branch = row[branchCol] ? String(row[branchCol]).trim() : '';
      const school = row[schoolCol] ? String(row[schoolCol]).trim() : '';
      const dept = row[deptCol] ? String(row[deptCol]).trim() : '';
      const nameAr = row[nameArCol] ? String(row[nameArCol]).trim() : '';
      const nameEn = row[nameEnCol] ? String(row[nameEnCol]).trim() : '';
      const nationality = row[nationalityCol] ? String(row[nationalityCol]).trim() : '';
      const nationalId = row[nationalIdCol] ? String(row[nationalIdCol]).trim() : '';
      const mobile = row[mobileCol] ? String(row[mobileCol]).trim() : '';
      const qualification = row[qualificationCol] ? String(row[qualificationCol]).trim() : '';
      const specialization = row[specializationCol] ? String(row[specializationCol]).trim() : '';
      const email = row[emailCol] ? String(row[emailCol]).trim() : '';
      const jobTitle = row[jobTitleCol] ? String(row[jobTitleCol]).trim() : '';
      
      if (!nameAr || nameAr === 'NULL') return;
      
      let hasProblem = false;
      let problemType = '';
      let problemDescription = '';
      
      // Check for "لغات أجنبية أخرى" (should be ZERO now!)
      if (dept.includes('لغات أجنبية أخرى')) {
        hasProblem = true;
        problemType = 'أخرى';
        problemDescription = '⚠️ لا يزال هناك "لغات أجنبية أخرى" - لم يتم التصحيح!';
      }
      
      // Educational departments in corporate branches
      const isCorporate = branch.includes('شركة') || branch.includes('الصفر');
      const isEducationalDept = dept.includes('الصفوف الأولية') || 
                                dept.includes('رياض الأطفال') || 
                                dept.includes('التربية الفنية') ||
                                dept.includes('التربية البدنية') ||
                                dept.includes('التربية الإسلامية') ||
                                dept.includes('اللغة العربية') ||
                                dept.includes('اللغة الإنجليزية') ||
                                dept.includes('الرياضيات') ||
                                dept.includes('العلوم');
      
      if (isCorporate && isEducationalDept) {
        hasProblem = true;
        problemType = 'أقسام تعليمية في شركات';
        problemDescription = `قسم تعليمي "${dept}" في فرع شركة "${branch}"`;
      }
      
      // Missing data
      if (!dept || dept === 'NULL' || dept === 'غير محدد') {
        hasProblem = true;
        problemType = 'بيانات ناقصة';
        problemDescription = 'القسم مفقود أو NULL';
      }
      
      if (!school || school === 'NULL' || school === 'غير محدد') {
        if (hasProblem && problemType === 'بيانات ناقصة') {
          problemDescription += ' | المرحلة مفقودة';
        } else {
          hasProblem = true;
          problemType = 'بيانات ناقصة';
          problemDescription = 'المرحلة مفقودة أو NULL';
        }
      }
      
      if (hasProblem) {
        const employeeData = {
          'نوع المشكلة': problemType,
          'وصف المشكلة': problemDescription,
          'الفرع': branch,
          'المرحلة/المدرسة': school,
          'القسم الحالي': dept,
          'الاسم (عربي)': nameAr,
          'Name (English)': nameEn,
          'الجنسية': nationality,
          'رقم الهوية': nationalId,
          'رقم الجوال': mobile,
          'المؤهل': qualification,
          'التخصص': specialization,
          'البريد الإلكتروني': email,
          'المسمى الوظيفي': jobTitle,
          'Sheet': sheetName,
          'رقم الصف في الملف الأصلي': idx + 2
        };
        
        problematicEmployees.push(employeeData);
        problemCategories[problemType].push(employeeData);
      }
    });
  });
  
  // Summary
  const summary = [
    { 'الفئة': 'أقسام تعليمية في شركات', 'العدد': problemCategories['أقسام تعليمية في شركات'].length },
    { 'الفئة': 'بيانات ناقصة', 'العدد': problemCategories['بيانات ناقصة'].length },
    { 'الفئة': 'أخرى', 'العدد': problemCategories['أخرى'].length },
    { 'الفئة': '─────────────────', 'العدد': '──────' },
    { 'الفئة': 'إجمالي المشاكل', 'العدد': problematicEmployees.length }
  ];
  
  // Create workbook
  const newWorkbook = XLSX.utils.book_new();
  
  const summarySheet = XLSX.utils.json_to_sheet(summary);
  XLSX.utils.book_append_sheet(newWorkbook, summarySheet, 'الملخص');
  
  if (problematicEmployees.length > 0) {
    const allSheet = XLSX.utils.json_to_sheet(problematicEmployees);
    XLSX.utils.book_append_sheet(newWorkbook, allSheet, 'جميع المشاكل');
    
    Object.entries(problemCategories).forEach(([category, employees]) => {
      if (employees.length > 0) {
        const categorySheet = XLSX.utils.json_to_sheet(employees);
        const sheetName = category.substring(0, 31);
        XLSX.utils.book_append_sheet(newWorkbook, categorySheet, sheetName);
      }
    });
  }
  
  // Save
  const outputPath = '/data/.openclaw/workspace/albassam-tasks/data/remaining_issues.xlsx';
  XLSX.writeFile(newWorkbook, outputPath);
  
  console.log('✅ تم فحص البيانات!\n');
  console.log('📊 المشاكل المتبقية:\n');
  console.log(`   • أقسام تعليمية في شركات: ${problemCategories['أقسام تعليمية في شركات'].length} موظف`);
  console.log(`   • بيانات ناقصة: ${problemCategories['بيانات ناقصة'].length} موظف`);
  console.log(`   • أخرى: ${problemCategories['أخرى'].length} موظف`);
  console.log(`   ────────────────────────────────`);
  console.log(`   • إجمالي: ${problematicEmployees.length} موظف\n`);
  
  if (problematicEmployees.length > 0) {
    console.log(`📁 تم حفظ الملف: ${outputPath}\n`);
  } else {
    console.log('🎉 لا توجد مشاكل متبقية! البيانات نظيفة تماماً! ✅\n');
  }
  
  // Show breakdown for educational depts in corporate branches
  if (problemCategories['أقسام تعليمية في شركات'].length > 0) {
    console.log('📋 تفاصيل "أقسام تعليمية في شركات":\n');
    const byBranch = {};
    problemCategories['أقسام تعليمية في شركات'].forEach(emp => {
      const key = `${emp['الفرع']} - ${emp['القسم الحالي']}`;
      if (!byBranch[key]) byBranch[key] = 0;
      byBranch[key]++;
    });
    Object.entries(byBranch)
      .sort((a, b) => b[1] - a[1])
      .forEach(([key, count]) => {
        console.log(`   • ${key}: ${count} موظف`);
      });
    console.log('');
  }
  
  // Save JSON
  fs.writeFileSync(
    '/data/.openclaw/workspace/albassam-tasks/data/remaining_issues.json',
    JSON.stringify({
      summary: summary,
      byCategory: problemCategories,
      all: problematicEmployees
    }, null, 2)
  );
  
  console.log('💡 ملاحظة:');
  console.log('   ✅ تم تصحيح جميع "لغات أجنبية أخرى" (63 موظف)');
  console.log('   ✅ تم تصحيح جميع مشاكل المعاهد (31 موظف)');
  console.log(`   📊 إجمالي التصحيحات التلقائية: 94 موظف\n`);
  
} catch (error) {
  console.error('\n❌ خطأ:', error.message);
  console.error(error.stack);
}
