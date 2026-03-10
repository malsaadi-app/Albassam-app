const XLSX = require('xlsx');
const fs = require('fs');

const filePath = '/data/.openclaw/workspace/albassam-tasks/data/employees_data.xlsx';

console.log('\n🏢 تحليل الهيكل التنظيمي المزدوج - فرع فرع\n');
console.log('='.repeat(100));
console.log('\n📌 ملاحظة: كل موظف في المدارس له مرجعيتين:');
console.log('   1️⃣ مرجعية إدارية → المرحلة (ابتدائي/متوسط/ثانوي/رياض)');
console.log('   2️⃣ مرجعية أكاديمية → القسم/المادة (إنجليزي/رياضيات/عربي/إلخ)\n');
console.log('='.repeat(100));

try {
  const workbook = XLSX.readFile(filePath);
  const branchesData = {};
  
  workbook.SheetNames.forEach((sheetName, idx) => {
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    if (data.length === 0) return;
    
    // Find column names (they vary between sheets)
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
    const nameCol = Object.keys(firstRow).find(col => 
      col.includes('الاسم') && !col.includes('Name')
    );
    
    // Get branch name (first employee's branch)
    const branchName = data[0][branchCol] ? String(data[0][branchCol]).trim() : `Sheet ${idx + 1}`;
    
    // Initialize branch data
    if (!branchesData[branchName]) {
      branchesData[branchName] = {
        name: branchName,
        totalEmployees: 0,
        stages: {},          // المراحل
        departments: {},     // الأقسام
        matrix: {},          // تقاطع: مرحلة × قسم
        isEducational: false // مدرسة أم شركة؟
      };
    }
    
    // Process each employee
    data.forEach(row => {
      const stage = row[schoolCol] ? String(row[schoolCol]).trim() : 'غير محدد';
      const dept = row[deptCol] ? String(row[deptCol]).trim() : 'غير محدد';
      const empName = row[nameCol] ? String(row[nameCol]).trim() : 'غير محدد';
      
      if (!empName || empName === 'NULL') return;
      
      branchesData[branchName].totalEmployees++;
      
      // تحديد إذا كان فرع تعليمي (له مراحل) أو شركة (بدون مراحل)
      const hasStages = stage && 
                        stage !== 'غير محدد' && 
                        stage !== 'NULL' &&
                        !stage.includes('شركة');
      
      if (hasStages) {
        branchesData[branchName].isEducational = true;
        
        // Count by Stage (المرجعية الإدارية)
        if (!branchesData[branchName].stages[stage]) {
          branchesData[branchName].stages[stage] = {
            count: 0,
            departments: {}
          };
        }
        branchesData[branchName].stages[stage].count++;
        
        // Count by Department within Stage
        if (!branchesData[branchName].stages[stage].departments[dept]) {
          branchesData[branchName].stages[stage].departments[dept] = 0;
        }
        branchesData[branchName].stages[stage].departments[dept]++;
        
        // Matrix: Stage × Department
        const matrixKey = `${stage}___${dept}`;
        if (!branchesData[branchName].matrix[matrixKey]) {
          branchesData[branchName].matrix[matrixKey] = 0;
        }
        branchesData[branchName].matrix[matrixKey]++;
      }
      
      // Count by Department (المرجعية الأكاديمية)
      if (!branchesData[branchName].departments[dept]) {
        branchesData[branchName].departments[dept] = 0;
      }
      branchesData[branchName].departments[dept]++;
    });
  });
  
  // Print results for each branch
  Object.values(branchesData).forEach((branch, idx) => {
    console.log(`\n${'═'.repeat(100)}`);
    console.log(`\n${idx + 1}. 🏢 ${branch.name}`);
    console.log(`   📊 إجمالي الموظفين: ${branch.totalEmployees}`);
    console.log(`   🏫 النوع: ${branch.isEducational ? 'مدرسة (له مراحل)' : 'شركة (بدون مراحل)'}`);
    
    if (branch.isEducational) {
      // Educational branch: show stages and departments
      console.log(`\n   📚 المراحل (${Object.keys(branch.stages).length} مراحل):`);
      
      Object.entries(branch.stages)
        .sort((a, b) => b[1].count - a[1].count)
        .forEach(([stage, stageData]) => {
          console.log(`\n      ▸ ${stage} (${stageData.count} موظف)`);
          
          // Show departments within this stage
          const sortedDepts = Object.entries(stageData.departments)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10); // Top 10 departments per stage
          
          sortedDepts.forEach(([dept, count]) => {
            console.log(`         • ${dept}: ${count} موظف`);
          });
          
          if (Object.keys(stageData.departments).length > 10) {
            console.log(`         ... و ${Object.keys(stageData.departments).length - 10} قسم آخر`);
          }
        });
      
      // Show all departments (academic grouping)
      console.log(`\n   📖 الأقسام الأكاديمية (${Object.keys(branch.departments).length} قسم):`);
      const topDepts = Object.entries(branch.departments)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15);
      
      topDepts.forEach(([dept, count]) => {
        console.log(`      • ${dept}: ${count} موظف`);
      });
      
      if (Object.keys(branch.departments).length > 15) {
        console.log(`      ... و ${Object.keys(branch.departments).length - 15} قسم آخر`);
      }
      
    } else {
      // Corporate branch: show only departments (no stages)
      console.log(`\n   📁 الأقسام (${Object.keys(branch.departments).length} قسم):`);
      
      Object.entries(branch.departments)
        .sort((a, b) => b[1] - a[1])
        .forEach(([dept, count]) => {
          console.log(`      • ${dept}: ${count} موظف`);
        });
    }
  });
  
  // Summary
  console.log(`\n${'═'.repeat(100)}`);
  console.log(`\n📊 الملخص العام:\n`);
  
  const educational = Object.values(branchesData).filter(b => b.isEducational);
  const corporate = Object.values(branchesData).filter(b => !b.isEducational);
  
  console.log(`   🏫 فروع تعليمية (مدارس): ${educational.length}`);
  educational.forEach(b => {
    console.log(`      • ${b.name}: ${b.totalEmployees} موظف، ${Object.keys(b.stages).length} مراحل، ${Object.keys(b.departments).length} قسم`);
  });
  
  console.log(`\n   🏢 فروع إدارية/شركات: ${corporate.length}`);
  corporate.forEach(b => {
    console.log(`      • ${b.name}: ${b.totalEmployees} موظف، ${Object.keys(b.departments).length} قسم`);
  });
  
  const totalEmployees = Object.values(branchesData).reduce((sum, b) => sum + b.totalEmployees, 0);
  console.log(`\n   👥 إجمالي الموظفين: ${totalEmployees}`);
  
  // Save detailed JSON
  fs.writeFileSync(
    '/data/.openclaw/workspace/albassam-tasks/data/hierarchical_structure.json',
    JSON.stringify(branchesData, null, 2)
  );
  
  console.log(`\n✅ تم حفظ البيانات التفصيلية في: data/hierarchical_structure.json\n`);
  
} catch (error) {
  console.error('\n❌ خطأ:', error.message);
  console.error(error.stack);
}
