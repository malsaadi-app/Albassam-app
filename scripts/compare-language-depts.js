const XLSX = require('xlsx');
const fs = require('fs');

const filePath = '/data/.openclaw/workspace/albassam-tasks/data/employees_data.xlsx';

console.log('\n🔧 تطبيق التصحيحات على البيانات...\n');
console.log('='.repeat(80));

console.log('\n📋 التصحيحات المطلوبة:\n');
console.log('1. مجمع البسام الأهلية بنين:');
console.log('   "لغات أجنبية أخرى" → "المواد الأدبية"\n');
console.log('2. معهد رجالي:');
console.log('   تصحيح المرحلة من "نسائي" إلى "رجالي"\n');
console.log('3. معهد نسائي:');
console.log('   تصحيح المراحل من "رجالي" إلى "نسائي"\n');
console.log('='.repeat(80));

let stats = {
  totalChanged: 0,
  boysSchoolChanged: 0,
  maleInstituteChanged: 0,
  femaleInstituteChanged: 0
};

try {
  const workbook = XLSX.readFile(filePath);
  const newWorkbook = XLSX.utils.book_new();
  
  workbook.SheetNames.forEach((sheetName, idx) => {
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    if (data.length === 0) {
      XLSX.utils.book_append_sheet(newWorkbook, worksheet, sheetName);
      return;
    }
    
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
    
    const firstBranch = data[0][branchCol] ? String(data[0][branchCol]).trim() : '';
    
    console.log(`\n${idx + 1}. ${sheetName}:`);
    console.log(`   الفرع: ${firstBranch}`);
    console.log(`   الموظفين: ${data.length}`);
    
    let changedInSheet = 0;
    
    // Apply corrections
    data.forEach(row => {
      const branch = row[branchCol] ? String(row[branchCol]).trim() : '';
      const school = row[schoolCol] ? String(row[schoolCol]).trim() : '';
      const dept = row[deptCol] ? String(row[deptCol]).trim() : '';
      
      // Correction 1: Boys school - change "لغات أجنبية أخرى" to "المواد الأدبية"
      if (branch.includes('البسام الأهلية بنين') && dept === 'لغات أجنبية أخرى') {
        row[deptCol] = 'المواد الأدبية';
        stats.boysSchoolChanged++;
        changedInSheet++;
      }
      
      // Correction 2: Male institute - fix stage from "نسائي" to "رجالي"
      if (branch.includes('معهد البسام العالي للتدريب (رجالي )')) {
        if (school.includes('النسائي')) {
          row[schoolCol] = 'معهد البسام العالي للتدريب (رجالي )';
          stats.maleInstituteChanged++;
          changedInSheet++;
        }
      }
      
      // Correction 3: Female institute - fix stage from "رجالي" to "نسائي"
      if (branch.includes('معهد البسام العالي للتدريب (النسائي)')) {
        if (school.includes('رجالي')) {
          row[schoolCol] = 'معهد البسام العالي للتدريب (النسائي)';
          stats.femaleInstituteChanged++;
          changedInSheet++;
        }
      }
    });
    
    stats.totalChanged += changedInSheet;
    console.log(`   ✅ تم تصحيح: ${changedInSheet} موظف`);
    
    // Create new sheet from modified data
    const newSheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(newWorkbook, newSheet, sheetName);
  });
  
  // Save corrected file
  const outputPath = '/data/.openclaw/workspace/albassam-tasks/data/employees_data_corrected.xlsx';
  XLSX.writeFile(newWorkbook, outputPath);
  
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 ملخص التصحيحات:\n');
  console.log(`   ✅ مجمع البسام الأهلية بنين: ${stats.boysSchoolChanged} موظف`);
  console.log(`      "لغات أجنبية أخرى" → "المواد الأدبية"`);
  console.log('');
  console.log(`   ✅ معهد رجالي: ${stats.maleInstituteChanged} موظف`);
  console.log(`      المرحلة: "نسائي" → "رجالي"`);
  console.log('');
  console.log(`   ✅ معهد نسائي: ${stats.femaleInstituteChanged} موظف`);
  console.log(`      المرحلة: "رجالي" → "نسائي"`);
  console.log('');
  console.log(`   ─────────────────────────────`);
  console.log(`   📊 إجمالي التصحيحات: ${stats.totalChanged} موظف\n`);
  
  console.log('✅ تم حفظ الملف المصحح في:');
  console.log(`   ${outputPath}\n`);
  
  // Save stats as JSON
  fs.writeFileSync(
    '/data/.openclaw/workspace/albassam-tasks/data/correction_stats.json',
    JSON.stringify(stats, null, 2)
  );
  
} catch (error) {
  console.error('\n❌ خطأ:', error.message);
  console.error(error.stack);
}
