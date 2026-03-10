const XLSX = require('xlsx');
const fs = require('fs');

const filePath = '/data/.openclaw/workspace/albassam-tasks/data/employees_data_corrected.xlsx';

console.log('\n🔧 تصحيح جميع "لغات أجنبية أخرى" → "المواد الأدبية"\n');
console.log('='.repeat(80));

let stats = {
  totalChanged: 0,
  byBranch: {}
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
    const deptCol = Object.keys(firstRow).find(col => 
      col.includes('قسم') || col.toLowerCase().includes('department')
    );
    
    const firstBranch = data[0][branchCol] ? String(data[0][branchCol]).trim() : '';
    
    console.log(`\n${idx + 1}. ${sheetName}:`);
    console.log(`   الفرع: ${firstBranch}`);
    console.log(`   الموظفين: ${data.length}`);
    
    let changedInSheet = 0;
    
    // Apply correction: ALL "لغات أجنبية أخرى" → "المواد الأدبية"
    data.forEach(row => {
      const dept = row[deptCol] ? String(row[deptCol]).trim() : '';
      
      if (dept === 'لغات أجنبية أخرى') {
        row[deptCol] = 'المواد الأدبية';
        changedInSheet++;
      }
    });
    
    if (changedInSheet > 0) {
      stats.totalChanged += changedInSheet;
      stats.byBranch[firstBranch] = changedInSheet;
      console.log(`   ✅ تم تصحيح: ${changedInSheet} موظف`);
    } else {
      console.log(`   ⚪ لا توجد تصحيحات`);
    }
    
    // Create new sheet
    const newSheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(newWorkbook, newSheet, sheetName);
  });
  
  // Save
  const outputPath = '/data/.openclaw/workspace/albassam-tasks/data/employees_data_final.xlsx';
  XLSX.writeFile(newWorkbook, outputPath);
  
  console.log('\n' + '='.repeat(80));
  console.log('\n📊 ملخص التصحيحات:\n');
  
  Object.entries(stats.byBranch)
    .sort((a, b) => b[1] - a[1])
    .forEach(([branch, count]) => {
      console.log(`   ✅ ${branch}: ${count} موظف`);
    });
  
  console.log('');
  console.log(`   ─────────────────────────────`);
  console.log(`   📊 إجمالي التصحيحات: ${stats.totalChanged} موظف`);
  console.log(`   ✅ جميع "لغات أجنبية أخرى" → "المواد الأدبية"\n`);
  
  console.log('✅ تم حفظ الملف النهائي في:');
  console.log(`   ${outputPath}\n`);
  
  // Save stats
  fs.writeFileSync(
    '/data/.openclaw/workspace/albassam-tasks/data/final_correction_stats.json',
    JSON.stringify(stats, null, 2)
  );
  
} catch (error) {
  console.error('\n❌ خطأ:', error.message);
  console.error(error.stack);
}
