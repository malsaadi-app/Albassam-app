const XLSX = require('xlsx');
const fs = require('fs');

const filePath = '/data/.openclaw/workspace/albassam-tasks/data/employees_data.xlsx';

console.log('\n📊 تحليل جميع صفحات ملف الموظفين:');
console.log('='.repeat(80));

try {
  const workbook = XLSX.readFile(filePath);
  
  console.log(`\n✅ تم قراءة الملف بنجاح!`);
  console.log(`📋 عدد الصفحات (الفروع): ${workbook.SheetNames.length}\n`);
  
  console.log('📑 أسماء الصفحات:');
  workbook.SheetNames.forEach((name, i) => {
    console.log(`   ${i + 1}. ${name}`);
  });
  
  // تجميع البيانات من جميع الصفحات
  let allEmployees = [];
  let allDepartments = {};
  let allBranches = {};
  let allJobs = {};
  
  workbook.SheetNames.forEach((sheetName, index) => {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`\n📄 تحليل الصفحة ${index + 1}: ${sheetName}`);
    
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`   عدد الموظفين: ${data.length}`);
    
    // تحليل الأقسام في هذه الصفحة
    const deptCol = Object.keys(data[0] || {}).find(col => 
      col.includes('قسم') || col.toLowerCase().includes('department')
    );
    
    if (deptCol) {
      const sheetDepts = {};
      data.forEach(row => {
        const dept = row[deptCol];
        if (dept) {
          const deptStr = String(dept).trim();
          sheetDepts[deptStr] = (sheetDepts[deptStr] || 0) + 1;
          allDepartments[deptStr] = (allDepartments[deptStr] || 0) + 1;
        }
      });
      
      console.log(`\n   🏢 الأقسام في هذه الصفحة: ${Object.keys(sheetDepts).length}`);
      const topDepts = Object.entries(sheetDepts).sort((a, b) => b[1] - a[1]).slice(0, 10);
      console.log('   أكثر 10 أقسام:');
      topDepts.forEach(([dept, count]) => {
        console.log(`      ${String(count).padStart(3)}x - ${dept}`);
      });
    }
    
    // تحليل الفروع
    const branchCol = Object.keys(data[0] || {}).find(col => 
      col.includes('فرع') || col.includes('مجمع') || col.toLowerCase().includes('branch')
    );
    
    if (branchCol) {
      data.forEach(row => {
        const branch = row[branchCol];
        if (branch) {
          const branchStr = String(branch).trim();
          allBranches[branchStr] = (allBranches[branchStr] || 0) + 1;
        }
      });
    }
    
    // تحليل المسميات الوظيفية
    const jobCol = Object.keys(data[0] || {}).find(col => 
      col.includes('وظيف') || col.includes('مسمى') || col.toLowerCase().includes('position') || col.includes('صلاحية')
    );
    
    if (jobCol) {
      data.forEach(row => {
        const job = row[jobCol];
        if (job) {
          const jobStr = String(job).trim();
          allJobs[jobStr] = (allJobs[jobStr] || 0) + 1;
        }
      });
    }
    
    allEmployees.push(...data);
  });
  
  // ملخص عام لكل الصفحات
  console.log(`\n${'='.repeat(80)}`);
  console.log('\n📊 الملخص الإجمالي:\n');
  console.log(`   إجمالي الموظفين في جميع الفروع: ${allEmployees.length}`);
  console.log(`   إجمالي الأقسام المختلفة: ${Object.keys(allDepartments).length}`);
  console.log(`   إجمالي الفروع: ${Object.keys(allBranches).length}`);
  
  // عرض جميع الأقسام
  console.log(`\n${'='.repeat(80)}`);
  console.log('\n🏢 جميع الأقسام في كل الفروع:\n');
  const deptsSorted = Object.entries(allDepartments).sort((a, b) => b[1] - a[1]);
  deptsSorted.forEach(([dept, count]) => {
    console.log(`   ${String(count).padStart(4)}x - ${dept}`);
  });
  
  // عرض جميع الفروع
  console.log(`\n${'='.repeat(80)}`);
  console.log('\n🏭 جميع الفروع:\n');
  const branchesSorted = Object.entries(allBranches).sort((a, b) => b[1] - a[1]);
  branchesSorted.forEach(([branch, count]) => {
    console.log(`   ${String(count).padStart(4)}x - ${branch}`);
  });
  
  // عرض المسميات الوظيفية إن وجدت
  if (Object.keys(allJobs).length > 0) {
    console.log(`\n${'='.repeat(80)}`);
    console.log('\n💼 المسميات الوظيفية:\n');
    const jobsSorted = Object.entries(allJobs).sort((a, b) => b[1] - a[1]);
    jobsSorted.forEach(([job, count]) => {
      console.log(`   ${String(count).padStart(4)}x - ${job}`);
    });
  }
  
  // حفظ الملخصات
  fs.writeFileSync(
    '/data/.openclaw/workspace/albassam-tasks/data/all_departments.json',
    JSON.stringify(allDepartments, null, 2)
  );
  
  fs.writeFileSync(
    '/data/.openclaw/workspace/albassam-tasks/data/all_branches.json',
    JSON.stringify(allBranches, null, 2)
  );
  
  if (Object.keys(allJobs).length > 0) {
    fs.writeFileSync(
      '/data/.openclaw/workspace/albassam-tasks/data/all_jobs.json',
      JSON.stringify(allJobs, null, 2)
    );
  }
  
  const summary = {
    total_employees: allEmployees.length,
    total_sheets: workbook.SheetNames.length,
    sheet_names: workbook.SheetNames,
    total_departments: Object.keys(allDepartments).length,
    total_branches: Object.keys(allBranches).length,
    total_jobs: Object.keys(allJobs).length
  };
  
  fs.writeFileSync(
    '/data/.openclaw/workspace/albassam-tasks/data/complete_summary.json',
    JSON.stringify(summary, null, 2)
  );
  
  console.log(`\n${'='.repeat(80)}`);
  console.log('\n✅ تم حفظ الملخصات:');
  console.log('   - data/all_departments.json');
  console.log('   - data/all_branches.json');
  if (Object.keys(allJobs).length > 0) {
    console.log('   - data/all_jobs.json');
  }
  console.log('   - data/complete_summary.json\n');
  
} catch (error) {
  console.error('\n❌ خطأ:', error.message);
  console.error(error.stack);
}
