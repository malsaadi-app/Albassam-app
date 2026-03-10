const XLSX = require('xlsx');

const filePath = '/data/.openclaw/workspace/albassam-tasks/data/employees_data.xlsx';

console.log('\n🔍 فحص بيانات المعاهد...\n');
console.log('='.repeat(80));

try {
  const workbook = XLSX.readFile(filePath);
  
  console.log(`\n📋 عدد الشيتات في الملف: ${workbook.SheetNames.length}\n`);
  
  workbook.SheetNames.forEach((sheetName, idx) => {
    console.log(`${idx + 1}. ${sheetName}`);
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('\n🔍 تفاصيل شيتات المعاهد:\n');
  
  workbook.SheetNames.forEach((sheetName, idx) => {
    if (sheetName.includes('معهد')) {
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);
      
      console.log(`\n${'─'.repeat(80)}`);
      console.log(`\nSheet ${idx + 1}: ${sheetName}`);
      console.log(`عدد الصفوف: ${data.length}`);
      
      if (data.length > 0) {
        console.log('\n📋 الأعمدة الموجودة:');
        Object.keys(data[0]).forEach((col, i) => {
          console.log(`   ${i + 1}. ${col}`);
        });
        
        // Find relevant columns
        const firstRow = data[0];
        const branchCol = Object.keys(firstRow).find(col => 
          col.includes('مجمع') || col.includes('فرع') || col.includes('معهد')
        );
        const schoolCol = Object.keys(firstRow).find(col => 
          col.includes('مدرسة') || col.includes('مرحلة')
        );
        const deptCol = Object.keys(firstRow).find(col => 
          col.includes('قسم') || col.toLowerCase().includes('department')
        );
        const nameCol = Object.keys(firstRow).find(col => 
          col.includes('الاسم') && !col.includes('Name')
        );
        
        // Show first 5 employees
        console.log('\n👥 أول 5 موظفين:');
        data.slice(0, 5).forEach((row, i) => {
          const branch = row[branchCol] ? String(row[branchCol]).trim() : 'غير محدد';
          const school = row[schoolCol] ? String(row[schoolCol]).trim() : 'غير محدد';
          const dept = row[deptCol] ? String(row[deptCol]).trim() : 'غير محدد';
          const name = row[nameCol] ? String(row[nameCol]).trim() : 'غير محدد';
          
          console.log(`\n   ${i + 1}. ${name}`);
          console.log(`      الفرع: ${branch}`);
          console.log(`      المرحلة: ${school}`);
          console.log(`      القسم: ${dept}`);
        });
        
        // Group by branch and school
        console.log('\n📊 التوزيع حسب الفرع والمرحلة:');
        const distribution = {};
        
        data.forEach(row => {
          const branch = row[branchCol] ? String(row[branchCol]).trim() : 'غير محدد';
          const school = row[schoolCol] ? String(row[schoolCol]).trim() : 'غير محدد';
          
          const key = `${branch} → ${school}`;
          if (!distribution[key]) {
            distribution[key] = 0;
          }
          distribution[key]++;
        });
        
        Object.entries(distribution)
          .sort((a, b) => b[1] - a[1])
          .forEach(([key, count]) => {
            console.log(`   • ${key}: ${count} موظف`);
          });
      }
    }
  });
  
  console.log('\n' + '='.repeat(80));
  
} catch (error) {
  console.error('\n❌ خطأ:', error.message);
  console.error(error.stack);
}
