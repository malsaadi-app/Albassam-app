const XLSX = require('xlsx');
const fs = require('fs');

const filePath = '/data/.openclaw/workspace/albassam-tasks/data/employees_data.xlsx';

console.log('\n📊 تحليل ملف بيانات الموظفين:');
console.log('='.repeat(80));

try {
  // قراءة الملف
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // تحويل إلى JSON
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  console.log(`\n✅ تم قراءة الملف بنجاح!`);
  console.log(`📋 عدد الموظفين: ${data.length}`);
  console.log(`📋 عدد الأعمدة: ${Object.keys(data[0] || {}).length}`);
  
  // عرض أسماء الأعمدة
  console.log('\n📑 أسماء الأعمدة:');
  Object.keys(data[0] || {}).forEach((col, i) => {
    console.log(`   ${i + 1}. ${col}`);
  });
  
  // عرض عينة من البيانات
  console.log('\n' + '='.repeat(80));
  console.log('\n🔍 عينة من البيانات (أول 3 موظفين):\n');
  data.slice(0, 3).forEach((row, i) => {
    console.log(`   موظف ${i + 1}:`);
    Object.entries(row).forEach(([key, value]) => {
      if (value) console.log(`      ${key}: ${value}`);
    });
    console.log('');
  });
  
  // تحليل المسميات الوظيفية
  const jobCol = Object.keys(data[0] || {}).find(col => 
    col.includes('وظيف') || col.includes('مسمى') || col.toLowerCase().includes('position')
  );
  
  if (jobCol) {
    console.log('='.repeat(80));
    console.log(`\n💼 المسميات الوظيفية (العمود: ${jobCol}):`);
    
    const jobs = {};
    data.forEach(row => {
      const job = row[jobCol];
      if (job) {
        const jobStr = String(job).trim();
        jobs[jobStr] = (jobs[jobStr] || 0) + 1;
      }
    });
    
    const jobsSorted = Object.entries(jobs).sort((a, b) => b[1] - a[1]);
    
    console.log(`\n   إجمالي المسميات المختلفة: ${jobsSorted.length}`);
    console.log('\n   أكثر 30 مسمى تكراراً:');
    jobsSorted.slice(0, 30).forEach(([job, count]) => {
      console.log(`      ${String(count).padStart(3)}x - ${job}`);
    });
    
    // حفظ كل المسميات
    fs.writeFileSync(
      '/data/.openclaw/workspace/albassam-tasks/data/job_titles.json',
      JSON.stringify(jobs, null, 2)
    );
    console.log('\n   ✅ تم حفظ كل المسميات في: data/job_titles.json');
  }
  
  // تحليل الأقسام
  const deptCol = Object.keys(data[0] || {}).find(col => 
    col.includes('قسم') || col.toLowerCase().includes('department')
  );
  
  if (deptCol) {
    console.log('\n' + '='.repeat(80));
    console.log(`\n🏢 الأقسام (العمود: ${deptCol}):`);
    
    const depts = {};
    data.forEach(row => {
      const dept = row[deptCol];
      if (dept) {
        const deptStr = String(dept).trim();
        depts[deptStr] = (depts[deptStr] || 0) + 1;
      }
    });
    
    const deptsSorted = Object.entries(depts).sort((a, b) => b[1] - a[1]);
    
    console.log(`\n   إجمالي الأقسام المختلفة: ${deptsSorted.length}`);
    console.log('\n   القائمة الكاملة:');
    deptsSorted.forEach(([dept, count]) => {
      console.log(`      ${String(count).padStart(3)}x - ${dept}`);
    });
    
    // حفظ الأقسام
    fs.writeFileSync(
      '/data/.openclaw/workspace/albassam-tasks/data/departments.json',
      JSON.stringify(depts, null, 2)
    );
    console.log('\n   ✅ تم حفظ الأقسام في: data/departments.json');
  }
  
  // تحليل الفروع
  const branchCol = Object.keys(data[0] || {}).find(col => 
    col.includes('فرع') || col.includes('مجمع') || col.toLowerCase().includes('branch')
  );
  
  if (branchCol) {
    console.log('\n' + '='.repeat(80));
    console.log(`\n🏭 الفروع (العمود: ${branchCol}):`);
    
    const branches = {};
    data.forEach(row => {
      const branch = row[branchCol];
      if (branch) {
        const branchStr = String(branch).trim();
        branches[branchStr] = (branches[branchStr] || 0) + 1;
      }
    });
    
    const branchesSorted = Object.entries(branches).sort((a, b) => b[1] - a[1]);
    
    console.log(`\n   إجمالي الفروع المختلفة: ${branchesSorted.length}`);
    console.log('\n   القائمة الكاملة:');
    branchesSorted.forEach(([branch, count]) => {
      console.log(`      ${String(count).padStart(3)}x - ${branch}`);
    });
    
    // حفظ الفروع
    fs.writeFileSync(
      '/data/.openclaw/workspace/albassam-tasks/data/branches.json',
      JSON.stringify(branches, null, 2)
    );
    console.log('\n   ✅ تم حفظ الفروع في: data/branches.json');
  }
  
  // حفظ ملخص عام
  const summary = {
    total_employees: data.length,
    total_columns: Object.keys(data[0] || {}).length,
    columns: Object.keys(data[0] || {}),
    job_titles_count: jobCol ? Object.keys(jobs).length : 0,
    departments_count: deptCol ? Object.keys(depts).length : 0,
    branches_count: branchCol ? Object.keys(branches).length : 0
  };
  
  fs.writeFileSync(
    '/data/.openclaw/workspace/albassam-tasks/data/summary.json',
    JSON.stringify(summary, null, 2)
  );
  
  console.log('\n' + '='.repeat(80));
  console.log('\n✅ تم الانتهاء من التحليل!');
  console.log('✅ الملفات المحفوظة:');
  console.log('   - data/summary.json (ملخص عام)');
  if (jobCol) console.log('   - data/job_titles.json (المسميات الوظيفية)');
  if (deptCol) console.log('   - data/departments.json (الأقسام)');
  if (branchCol) console.log('   - data/branches.json (الفروع)');
  console.log('');
  
} catch (error) {
  console.error('\n❌ خطأ:', error.message);
  console.error(error.stack);
}
