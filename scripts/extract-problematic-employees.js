const XLSX = require('xlsx');
const fs = require('fs');

const filePath = '/data/.openclaw/workspace/albassam-tasks/data/employees_data.xlsx';

console.log('\n🔍 استخراج الموظفين الذين لديهم مشاكل...\n');

const problematicEmployees = [];
const problemCategories = {
  'لغات أجنبية أخرى': [],
  'أقسام تعليمية في شركات': [],
  'مشاكل في المعاهد': [],
  'مواقع غريبة': []
};

try {
  const workbook = XLSX.readFile(filePath);
  
  workbook.SheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    if (data.length === 0) return;
    
    const firstRow = data[0];
    const branchCol = Object.keys(firstRow).find(col => 
      col.includes('مجمع') || col.includes('فرع') || col.includes('شركة')
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
      
      // Problem 1: "لغات أجنبية أخرى"
      if (dept.includes('لغات أجنبية أخرى')) {
        hasProblem = true;
        problemType = 'لغات أجنبية أخرى';
        problemDescription = 'قسم "لغات أجنبية أخرى" - يحتاج إعادة تصنيف حسب التخصص الفعلي';
      }
      
      // Problem 2: Educational departments in corporate branches
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
        problemDescription = `قسم تعليمي "${dept}" في فرع شركة "${branch}" - غير منطقي`;
      }
      
      // Problem 3: Institute gender mismatch
      if (branch.includes('معهد')) {
        const isMaleInstitute = branch.includes('رجالي');
        const isFemaleInstitute = branch.includes('النسائي');
        const isMaleSchool = school.includes('رجالي');
        const isFemaleSchool = school.includes('النسائي');
        
        if ((isMaleInstitute && isFemaleSchool) || (isFemaleInstitute && isMaleSchool)) {
          hasProblem = true;
          problemType = 'مشاكل في المعاهد';
          problemDescription = `خلط بين رجالي/نسائي - الفرع: "${branch}" والمرحلة: "${school}"`;
        }
      }
      
      // Problem 4: Strange locations (e.g., "الثانوية بنات" in boys branch)
      if (branch.includes('بنين') && school.includes('بنات')) {
        hasProblem = true;
        problemType = 'مواقع غريبة';
        problemDescription = `موظف في مرحلة بنات "${school}" ضمن فرع بنين "${branch}"`;
      }
      
      if (branch.includes('بنات') && school.includes('بنين')) {
        hasProblem = true;
        problemType = 'مواقع غريبة';
        problemDescription = `موظف في مرحلة بنين "${school}" ضمن فرع بنات "${branch}"`;
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
          'رقم الصف في الملف الأصلي': idx + 2 // +2 because Excel is 1-indexed and has header
        };
        
        problematicEmployees.push(employeeData);
        problemCategories[problemType].push(employeeData);
      }
    });
  });
  
  // Create summary sheet
  const summary = [
    { 'الفئة': 'لغات أجنبية أخرى', 'العدد': problemCategories['لغات أجنبية أخرى'].length },
    { 'الفئة': 'أقسام تعليمية في شركات', 'العدد': problemCategories['أقسام تعليمية في شركات'].length },
    { 'الفئة': 'مشاكل في المعاهد', 'العدد': problemCategories['مشاكل في المعاهد'].length },
    { 'الفئة': 'مواقع غريبة', 'العدد': problemCategories['مواقع غريبة'].length },
    { 'الفئة': '─────────────────', 'العدد': '──────' },
    { 'الفئة': 'إجمالي المشاكل', 'العدد': problematicEmployees.length }
  ];
  
  // Create new workbook with multiple sheets
  const newWorkbook = XLSX.utils.book_new();
  
  // Sheet 1: Summary
  const summarySheet = XLSX.utils.json_to_sheet(summary);
  XLSX.utils.book_append_sheet(newWorkbook, summarySheet, 'الملخص');
  
  // Sheet 2: All problematic employees
  const allSheet = XLSX.utils.json_to_sheet(problematicEmployees);
  XLSX.utils.book_append_sheet(newWorkbook, allSheet, 'جميع المشاكل');
  
  // Sheets 3-6: By problem type
  Object.entries(problemCategories).forEach(([category, employees]) => {
    if (employees.length > 0) {
      const categorySheet = XLSX.utils.json_to_sheet(employees);
      // Truncate sheet name to 31 characters (Excel limit)
      const sheetName = category.substring(0, 31);
      XLSX.utils.book_append_sheet(newWorkbook, categorySheet, sheetName);
    }
  });
  
  // Save file
  const outputPath = '/data/.openclaw/workspace/albassam-tasks/data/problematic_employees.xlsx';
  XLSX.writeFile(newWorkbook, outputPath);
  
  console.log('✅ تم إنشاء ملف المشاكل بنجاح!\n');
  console.log(`📁 الموقع: ${outputPath}\n`);
  console.log('📊 الإحصائيات:\n');
  console.log(`   • لغات أجنبية أخرى: ${problemCategories['لغات أجنبية أخرى'].length} موظف`);
  console.log(`   • أقسام تعليمية في شركات: ${problemCategories['أقسام تعليمية في شركات'].length} موظف`);
  console.log(`   • مشاكل في المعاهد: ${problemCategories['مشاكل في المعاهد'].length} موظف`);
  console.log(`   • مواقع غريبة: ${problemCategories['مواقع غريبة'].length} موظف`);
  console.log(`   ────────────────────────────────`);
  console.log(`   • إجمالي: ${problematicEmployees.length} موظف\n`);
  
  console.log('📋 محتويات الملف:\n');
  console.log('   Sheet 1: الملخص - إحصائيات المشاكل');
  console.log('   Sheet 2: جميع المشاكل - كل الموظفين');
  console.log('   Sheet 3: لغات أجنبية أخرى');
  console.log('   Sheet 4: أقسام تعليمية في شركات');
  console.log('   Sheet 5: مشاكل في المعاهد');
  console.log('   Sheet 6: مواقع غريبة\n');
  
  console.log('✍️  الخطوات التالية:\n');
  console.log('   1. افتح الملف: problematic_employees.xlsx');
  console.log('   2. راجع كل موظف وعدل القسم/الفرع/المرحلة');
  console.log('   3. احفظ الملف بعد التعديل');
  console.log('   4. أرسله لي لدمجه مع البيانات الصحيحة ✅\n');
  
  // Also save detailed JSON for reference
  fs.writeFileSync(
    '/data/.openclaw/workspace/albassam-tasks/data/problematic_employees.json',
    JSON.stringify({
      summary: summary,
      byCategory: problemCategories,
      all: problematicEmployees
    }, null, 2)
  );
  
} catch (error) {
  console.error('\n❌ خطأ:', error.message);
  console.error(error.stack);
}
