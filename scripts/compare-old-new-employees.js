const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');

const prisma = new PrismaClient();
const filePath = '/data/.openclaw/workspace/albassam-tasks/data/employees_data_final_clean.xlsx';

console.log('\n🔍 مقارنة الموظفين القدامى والجدد\n');
console.log('='.repeat(80));

async function main() {
  try {
    // 1. Get all old employees
    console.log('\n⏳ جاري قراءة الموظفين القدامى من قاعدة البيانات...\n');
    const oldEmployees = await prisma.employee.findMany({
      select: {
        nationalId: true,
        fullNameAr: true,
        fullNameEn: true,
        branchId: true,
        branch: {
          select: {
            name: true
          }
        },
        department: true,
        position: true
      }
    });
    
    console.log(`✅ تم العثور على ${oldEmployees.length} موظف قديم\n`);
    
    // 2. Read new employees from Excel
    console.log('⏳ جاري قراءة الموظفين الجدد من Excel...\n');
    const workbook = XLSX.readFile(filePath);
    const newEmployees = [];
    
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);
      
      const firstRow = data[0];
      const branchCol = Object.keys(firstRow).find(col => 
        col.includes('مجمع') || col.includes('فرع') || col.includes('شركة') || col.includes('معهد')
      );
      const nameArCol = Object.keys(firstRow).find(col => 
        col.includes('الاسم') && !col.includes('Name')
      );
      const nameEnCol = Object.keys(firstRow).find(col => 
        col === 'Name' || col.includes('name')
      );
      const nationalIdCol = Object.keys(firstRow).find(col => 
        col.includes('رقم الهوية')
      );
      const deptCol = Object.keys(firstRow).find(col => 
        col.includes('قسم')
      );
      const jobCol = Object.keys(firstRow).find(col => 
        col.includes('الصلاحية') || col.includes('المسمى')
      );
      
      data.forEach(row => {
        const nameAr = row[nameArCol] ? String(row[nameArCol]).trim() : '';
        if (!nameAr || nameAr === 'NULL') return;
        
        newEmployees.push({
          nationalId: row[nationalIdCol] ? String(row[nationalIdCol]).trim() : '',
          fullNameAr: nameAr,
          fullNameEn: row[nameEnCol] ? String(row[nameEnCol]).trim() : '',
          branch: row[branchCol] ? String(row[branchCol]).trim() + ' - New' : '',
          department: row[deptCol] ? String(row[deptCol]).trim() : '',
          position: row[jobCol] ? String(row[jobCol]).trim() : ''
        });
      });
    });
    
    console.log(`✅ تم العثور على ${newEmployees.length} موظف جديد\n`);
    
    // 3. Compare
    console.log('='.repeat(80));
    console.log('\n📊 نتائج المقارنة:\n');
    
    // Create maps
    const oldMap = new Map();
    oldEmployees.forEach(emp => {
      if (emp.nationalId) {
        oldMap.set(emp.nationalId, emp);
      }
    });
    
    const newMap = new Map();
    newEmployees.forEach(emp => {
      if (emp.nationalId) {
        newMap.set(emp.nationalId, emp);
      }
    });
    
    // Find matches and differences
    const matches = [];
    const onlyInOld = [];
    const onlyInNew = [];
    
    oldEmployees.forEach(oldEmp => {
      if (!oldEmp.nationalId) return;
      
      if (newMap.has(oldEmp.nationalId)) {
        matches.push({
          old: oldEmp,
          new: newMap.get(oldEmp.nationalId)
        });
      } else {
        onlyInOld.push(oldEmp);
      }
    });
    
    newEmployees.forEach(newEmp => {
      if (!newEmp.nationalId) return;
      
      if (!oldMap.has(newEmp.nationalId)) {
        onlyInNew.push(newEmp);
      }
    });
    
    // Summary
    console.log(`📋 الإحصائيات:\n`);
    console.log(`   • إجمالي القدامى: ${oldEmployees.length}`);
    console.log(`   • إجمالي الجدد: ${newEmployees.length}`);
    console.log(`   • موجودون في الاثنين: ${matches.length}`);
    console.log(`   • موجودون في القدامى فقط: ${onlyInOld.length}`);
    console.log(`   • موجودون في الجدد فقط: ${onlyInNew.length}`);
    console.log('');
    
    // Show samples
    if (onlyInOld.length > 0) {
      console.log('='.repeat(80));
      console.log(`\n❌ موجودون في القدامى فقط (${onlyInOld.length} موظف):\n`);
      console.log('   عينة (أول 10):\n');
      onlyInOld.slice(0, 10).forEach((emp, i) => {
        console.log(`   ${i + 1}. ${emp.fullNameAr}`);
        console.log(`      رقم الهوية: ${emp.nationalId}`);
        console.log(`      الفرع: ${emp.branch?.name || 'غير محدد'}`);
        console.log(`      القسم: ${emp.department || 'غير محدد'}`);
        console.log('');
      });
      if (onlyInOld.length > 10) {
        console.log(`   ... و ${onlyInOld.length - 10} موظف آخر\n`);
      }
    }
    
    if (onlyInNew.length > 0) {
      console.log('='.repeat(80));
      console.log(`\n✅ موجودون في الجدد فقط (${onlyInNew.length} موظف):\n`);
      console.log('   عينة (أول 10):\n');
      onlyInNew.slice(0, 10).forEach((emp, i) => {
        console.log(`   ${i + 1}. ${emp.fullNameAr}`);
        console.log(`      رقم الهوية: ${emp.nationalId}`);
        console.log(`      الفرع: ${emp.branch}`);
        console.log(`      القسم: ${emp.department}`);
        console.log('');
      });
      if (onlyInNew.length > 10) {
        console.log(`   ... و ${onlyInNew.length - 10} موظف آخر\n`);
      }
    }
    
    if (matches.length > 0) {
      console.log('='.repeat(80));
      console.log(`\n🔄 موجودون في الاثنين (${matches.length} موظف):\n`);
      console.log('   عينة (أول 5 مع الفروقات):\n');
      
      let differencesCount = 0;
      matches.slice(0, 10).forEach((match, i) => {
        const diffs = [];
        
        if (match.old.fullNameAr !== match.new.fullNameAr) {
          diffs.push(`الاسم: "${match.old.fullNameAr}" → "${match.new.fullNameAr}"`);
        }
        if (match.old.branch?.name !== match.new.branch) {
          diffs.push(`الفرع: "${match.old.branch?.name || 'غير محدد'}" → "${match.new.branch}"`);
        }
        if (match.old.department !== match.new.department) {
          diffs.push(`القسم: "${match.old.department}" → "${match.new.department}"`);
        }
        
        if (diffs.length > 0) {
          differencesCount++;
          if (differencesCount <= 5) {
            console.log(`   ${i + 1}. ${match.old.fullNameAr}`);
            console.log(`      رقم الهوية: ${match.old.nationalId}`);
            console.log(`      الفروقات:`);
            diffs.forEach(diff => {
              console.log(`         • ${diff}`);
            });
            console.log('');
          }
        }
      });
      
      if (differencesCount === 0) {
        console.log('   ✅ لا توجد فروقات في البيانات الأساسية!\n');
      } else {
        console.log(`   📊 إجمالي الموظفين الذين لديهم فروقات: ${differencesCount}\n`);
      }
    }
    
    // Old branches
    console.log('='.repeat(80));
    console.log('\n🏢 الفروع القديمة:\n');
    const oldBranches = new Set();
    oldEmployees.forEach(emp => {
      if (emp.branch?.name) {
        oldBranches.add(emp.branch.name);
      }
    });
    oldBranches.forEach((branch, i) => {
      const count = oldEmployees.filter(e => e.branch?.name === branch).length;
      console.log(`   ${i + 1}. ${branch}: ${count} موظف`);
    });
    
    console.log('\n🏢 الفروع الجديدة:\n');
    const newBranches = new Set();
    newEmployees.forEach(emp => {
      if (emp.branch) {
        newBranches.add(emp.branch);
      }
    });
    newBranches.forEach((branch, i) => {
      const count = newEmployees.filter(e => e.branch === branch).length;
      console.log(`   ${i + 1}. ${branch}: ${count} موظف`);
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('\n💡 الخلاصة:\n');
    console.log(`   • الموظفون المشتركون: ${matches.length}`);
    console.log(`   • الموظفون القدامى الزائدون: ${onlyInOld.length}`);
    console.log(`   • الموظفون الجدد الزائدون: ${onlyInNew.length}`);
    console.log(`   • الفرق: ${oldEmployees.length} قديم - ${newEmployees.length} جديد = ${oldEmployees.length - newEmployees.length}`);
    console.log('');
    
  } catch (error) {
    console.error('\n❌ خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
