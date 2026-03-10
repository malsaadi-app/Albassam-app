const XLSX = require('xlsx');

const filePath = '/data/.openclaw/workspace/albassam-tasks/data/employees_data.xlsx';

console.log('\n🔍 فحص جميع الشيتات بالتفصيل...\n');
console.log('='.repeat(100));

try {
  const workbook = XLSX.readFile(filePath);
  
  workbook.SheetNames.forEach((sheetName, idx) => {
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    if (data.length === 0) {
      console.log(`\n${idx + 1}. ${sheetName}: فارغ`);
      return;
    }
    
    const firstRow = data[0];
    const branchCol = Object.keys(firstRow).find(col => 
      col.includes('مجمع') || col.includes('فرع') || col.includes('شركة') || col.includes('معهد')
    );
    
    const firstBranch = data[0][branchCol] ? String(data[0][branchCol]).trim() : 'غير محدد';
    
    console.log(`\n${'═'.repeat(100)}`);
    console.log(`\n${idx + 1}. Sheet: ${sheetName}`);
    console.log(`   📋 عدد الموظفين: ${data.length}`);
    console.log(`   🏢 الفرع: ${firstBranch}`);
    
    // Check if it's institute
    if (firstBranch.includes('معهد')) {
      console.log(`\n   ⚠️ هذا معهد! دعني أفحص البيانات بالتفصيل...\n`);
      
      const schoolCol = Object.keys(firstRow).find(col => 
        col.includes('مدرسة') || col.includes('مرحلة')
      );
      const deptCol = Object.keys(firstRow).find(col => 
        col.includes('قسم') || col.toLowerCase().includes('department')
      );
      const nameCol = Object.keys(firstRow).find(col => 
        col.includes('الاسم') && !col.includes('Name')
      );
      
      // Show unique branches
      const branches = new Set();
      const schools = new Set();
      
      data.forEach(row => {
        const branch = row[branchCol] ? String(row[branchCol]).trim() : '';
        const school = row[schoolCol] ? String(row[schoolCol]).trim() : '';
        
        if (branch) branches.add(branch);
        if (school) schools.add(school);
      });
      
      console.log(`   📂 الفروع الموجودة في هذا الشيت:`);
      branches.forEach(b => console.log(`      • ${b}`));
      
      console.log(`\n   🏫 المراحل الموجودة في هذا الشيت:`);
      schools.forEach(s => console.log(`      • ${s}`));
      
      // Show first 3 employees
      console.log(`\n   👥 عينة من الموظفين (أول 3):`);
      data.slice(0, 3).forEach((row, i) => {
        const name = row[nameCol] ? String(row[nameCol]).trim() : 'غير محدد';
        const branch = row[branchCol] ? String(row[branchCol]).trim() : 'غير محدد';
        const school = row[schoolCol] ? String(row[schoolCol]).trim() : 'غير محدد';
        const dept = row[deptCol] ? String(row[deptCol]).trim() : 'غير محدد';
        
        console.log(`\n      ${i + 1}. ${name}`);
        console.log(`         الفرع: ${branch}`);
        console.log(`         المرحلة: ${school}`);
        console.log(`         القسم: ${dept}`);
      });
      
      // Check for mismatch
      const branchesArray = Array.from(branches);
      const schoolsArray = Array.from(schools);
      
      console.log(`\n   🔍 التحليل:`);
      
      if (branchesArray.length === 1 && schoolsArray.length === 1) {
        const branch = branchesArray[0];
        const school = schoolsArray[0];
        
        const branchIsMale = branch.includes('رجالي');
        const branchIsFemale = branch.includes('النسائي');
        const schoolIsMale = school.includes('رجالي');
        const schoolIsFemale = school.includes('النسائي');
        
        if ((branchIsMale && schoolIsFemale) || (branchIsFemale && schoolIsMale)) {
          console.log(`      ❌ مشكلة: خلط بين رجالي/نسائي!`);
          console.log(`         الفرع: ${branch} (${branchIsMale ? 'رجالي' : 'نسائي'})`);
          console.log(`         المرحلة: ${school} (${schoolIsMale ? 'رجالي' : 'نسائي'})`);
        } else if (branch === school) {
          console.log(`      ⚠️ الفرع والمرحلة نفس الشيء!`);
          console.log(`         ربما يجب أن يكون:`);
          console.log(`         الفرع: ${branch}`);
          console.log(`         المرحلة: [فارغ أو "المعهد"]`);
        } else {
          console.log(`      ✅ البيانات تبدو صحيحة`);
        }
      } else {
        console.log(`      ⚠️ المعهد يحتوي على أكثر من فرع أو مرحلة!`);
        console.log(`         الفروع: ${branchesArray.length}`);
        console.log(`         المراحل: ${schoolsArray.length}`);
      }
    }
  });
  
  console.log(`\n${'═'.repeat(100)}\n`);
  
} catch (error) {
  console.error('\n❌ خطأ:', error.message);
  console.error(error.stack);
}
