const XLSX = require('xlsx');
const fs = require('fs');

const filePath = '/data/.openclaw/workspace/albassam-tasks/data/employees_data_final.xlsx';

console.log('\n🔧 تصحيح الأقسام التعليمية في الشركات\n');
console.log('='.repeat(80));
console.log('\n📋 هؤلاء موظفون خاصون تحت مدير الفرع مباشرة\n');

let stats = {
  totalChanged: 0,
  byDept: {}
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
    const nameCol = Object.keys(firstRow).find(col => 
      col.includes('الاسم') && !col.includes('Name')
    );
    
    const firstBranch = data[0][branchCol] ? String(data[0][branchCol]).trim() : '';
    
    console.log(`${idx + 1}. ${sheetName}:`);
    console.log(`   الفرع: ${firstBranch}`);
    
    let changedInSheet = 0;
    
    // Check if this is a corporate branch
    const isCorporate = firstBranch.includes('شركة') || firstBranch.includes('الصفر');
    
    if (isCorporate) {
      data.forEach(row => {
        const dept = row[deptCol] ? String(row[deptCol]).trim() : '';
        const name = row[nameCol] ? String(row[nameCol]).trim() : '';
        
        // List of educational departments
        const educationalDepts = [
          'الصفوف الأولية',
          'رياض الأطفال',
          'قسم رياض الأطفال',
          'التربية الفنية',
          'التربية البدنية',
          'التربية الإسلامية',
          'اللغة العربية',
          'اللغة الإنجليزية',
          'الرياضيات',
          'العلوم'
        ];
        
        // Check if employee is in educational department
        const isEducational = educationalDepts.some(ed => dept.includes(ed));
        
        if (isEducational) {
          const oldDept = dept;
          
          // Change to "مكتب مدير الفرع" (Director's Office)
          row[deptCol] = 'مكتب مدير الفرع';
          
          changedInSheet++;
          stats.totalChanged++;
          
          if (!stats.byDept[oldDept]) {
            stats.byDept[oldDept] = 0;
          }
          stats.byDept[oldDept]++;
          
          console.log(`   ✅ ${name}: "${oldDept}" → "مكتب مدير الفرع"`);
        }
      });
      
      if (changedInSheet > 0) {
        console.log(`   📊 تم تصحيح: ${changedInSheet} موظف\n`);
      } else {
        console.log(`   ⚪ لا توجد أقسام تعليمية\n`);
      }
    } else {
      console.log(`   ⚪ ليس فرع شركة\n`);
    }
    
    // Create new sheet
    const newSheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(newWorkbook, newSheet, sheetName);
  });
  
  // Save
  const outputPath = '/data/.openclaw/workspace/albassam-tasks/data/employees_data_clean.xlsx';
  XLSX.writeFile(newWorkbook, outputPath);
  
  console.log('='.repeat(80));
  console.log('\n📊 ملخص التصحيحات:\n');
  
  if (stats.totalChanged > 0) {
    console.log('   الأقسام التي تم نقلها:\n');
    Object.entries(stats.byDept)
      .sort((a, b) => b[1] - a[1])
      .forEach(([dept, count]) => {
        console.log(`   • "${dept}" → "مكتب مدير الفرع": ${count} موظف`);
      });
    
    console.log('');
    console.log(`   ─────────────────────────────`);
    console.log(`   📊 إجمالي: ${stats.totalChanged} موظف`);
    console.log(`   ✅ جميعهم الآن تحت "مكتب مدير الفرع"\n`);
  } else {
    console.log('   ⚪ لم يتم العثور على موظفين يحتاجون تصحيح\n');
  }
  
  console.log('✅ تم حفظ الملف النظيف في:');
  console.log(`   ${outputPath}\n`);
  
  // Save stats
  fs.writeFileSync(
    '/data/.openclaw/workspace/albassam-tasks/data/corporate_correction_stats.json',
    JSON.stringify(stats, null, 2)
  );
  
  console.log('💡 ملاحظة:');
  console.log('   هؤلاء الموظفون حالات خاصة تحت إشراف مدير الفرع مباشرة');
  console.log('   لا يتبعون للأقسام الإدارية العادية ✅\n');
  
} catch (error) {
  console.error('\n❌ خطأ:', error.message);
  console.error(error.stack);
}
