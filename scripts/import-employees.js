const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const fs = require('fs');

const prisma = new PrismaClient();
const filePath = '/data/.openclaw/workspace/albassam-tasks/data/employees_data_final_clean.xlsx';

console.log('\n🚀 استيراد بيانات الموظفين إلى النظام\n');
console.log('='.repeat(80));

const stats = {
  branches: { created: 0, skipped: 0 },
  stages: { created: 0, skipped: 0 },
  departments: { created: 0, skipped: 0 },
  employees: { created: 0, skipped: 0, errors: 0 },
  errors: []
};

// Map to store created entities
const branchMap = new Map();
const stageMap = new Map();
const departmentMap = new Map();

async function main() {
  try {
    console.log('\n📊 قراءة ملف Excel...\n');
    
    const workbook = XLSX.readFile(filePath);
    
    // Process each sheet (branch)
    for (const sheetName of workbook.SheetNames) {
      console.log(`\n${'─'.repeat(80)}`);
      console.log(`\n📁 معالجة: ${sheetName}\n`);
      
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);
      
      if (data.length === 0) {
        console.log('   ⚪ شيت فارغ - تخطي\n');
        continue;
      }
      
      // Get column names
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
      
      // Get branch name
      const branchNameOriginal = data[0][branchCol] ? String(data[0][branchCol]).trim() : '';
      const branchName = `${branchNameOriginal} - New`;
      
      // Determine branch type
      const isCorporate = branchNameOriginal.includes('شركة') || branchNameOriginal.includes('الصفر');
      const branchType = isCorporate ? 'CORPORATE' : 'EDUCATIONAL';
      
      console.log(`   🏢 الفرع: ${branchName}`);
      console.log(`   📋 النوع: ${branchType === 'EDUCATIONAL' ? 'تعليمي' : 'إداري/شركة'}`);
      console.log(`   👥 الموظفين: ${data.length}\n`);
      
      // Create or get branch
      let branch = await prisma.branch.findFirst({
        where: { name: branchName }
      });
      
      if (!branch) {
        branch = await prisma.branch.create({
          data: {
            name: branchName,
            nameEn: branchNameOriginal,
            isActive: true
          }
        });
        branchMap.set(branchName, branch.id);
        stats.branches.created++;
        console.log(`   ✅ تم إنشاء الفرع: ${branchName}\n`);
      } else {
        branchMap.set(branchName, branch.id);
        stats.branches.skipped++;
        console.log(`   ⚪ الفرع موجود: ${branchName}\n`);
      }
      
      // Collect unique stages and departments
      const stagesSet = new Set();
      const deptsSet = new Set();
      
      data.forEach(row => {
        const school = row[schoolCol] ? String(row[schoolCol]).trim() : '';
        const dept = row[deptCol] ? String(row[deptCol]).trim() : '';
        
        if (school && school !== 'NULL' && branchType === 'EDUCATIONAL') {
          stagesSet.add(school);
        }
        if (dept && dept !== 'NULL') {
          deptsSet.add(dept);
        }
      });
      
      console.log(`   📚 المراحل: ${stagesSet.size}`);
      console.log(`   📁 الأقسام: ${deptsSet.size}\n`);
      
      // Create stages (educational branches only)
      if (branchType === 'EDUCATIONAL') {
        for (const stageName of stagesSet) {
          const stageKey = `${branchName}__${stageName}`;
          
          let stage = await prisma.stage.findFirst({
            where: {
              branchId: branch.id,
              name: stageName
            }
          });
          
          if (!stage) {
            stage = await prisma.stage.create({
              data: {
                name: stageName,
                nameEn: stageName,
                branchId: branch.id
              }
            });
            stageMap.set(stageKey, stage.id);
            stats.stages.created++;
            console.log(`      ✅ مرحلة: ${stageName}`);
          } else {
            stageMap.set(stageKey, stage.id);
            stats.stages.skipped++;
          }
        }
      }
      
      // Create departments (using Department master data table)
      for (const deptName of deptsSet) {
        const deptKey = `${branchName}__${deptName}`;
        
        let department = await prisma.department.findFirst({
          where: {
            nameAr: deptName
          }
        });
        
        if (!department) {
          department = await prisma.department.create({
            data: {
              nameAr: deptName,
              nameEn: deptName, // Can be updated later with proper English names
              isActive: true,
              sortOrder: 0
            }
          });
          departmentMap.set(deptKey, department.id);
          stats.departments.created++;
          console.log(`      ✅ قسم: ${deptName}`);
        } else {
          departmentMap.set(deptKey, department.id);
          stats.departments.skipped++;
        }
      }
      
      console.log('');
      
      // Import employees
      console.log(`   👥 استيراد الموظفين...\n`);
      
      for (const row of data) {
        const nameArCol = Object.keys(row).find(col => col.includes('الاسم') && !col.includes('Name'));
        const nameEnCol = Object.keys(row).find(col => col === 'Name' || col.includes('name'));
        const nationalityCol = Object.keys(row).find(col => col.includes('الجنسية'));
        const nationalIdCol = Object.keys(row).find(col => col.includes('رقم الهوية'));
        const mobileCol = Object.keys(row).find(col => col.includes('رقم الجوال'));
        const qualificationCol = Object.keys(row).find(col => col.includes('المؤهل'));
        const specializationCol = Object.keys(row).find(col => col.includes('التخصص'));
        const emailCol = Object.keys(row).find(col => col.includes('البريد'));
        const jobTitleCol = Object.keys(row).find(col => col.includes('الصلاحية') || col.includes('المسمى'));
        
        const nameAr = row[nameArCol] ? String(row[nameArCol]).trim() : '';
        const nameEn = row[nameEnCol] ? String(row[nameEnCol]).trim() : '';
        const nationality = row[nationalityCol] ? String(row[nationalityCol]).trim() : '';
        const nationalId = row[nationalIdCol] ? String(row[nationalIdCol]).trim() : '';
        const mobile = row[mobileCol] ? String(row[mobileCol]).trim() : '';
        const qualification = row[qualificationCol] ? String(row[qualificationCol]).trim() : '';
        const specialization = row[specializationCol] ? String(row[specializationCol]).trim() : '';
        const email = row[emailCol] ? String(row[emailCol]).trim() : '';
        const jobTitle = row[jobTitleCol] ? String(row[jobTitleCol]).trim() : '';
        
        const school = row[schoolCol] ? String(row[schoolCol]).trim() : '';
        const dept = row[deptCol] ? String(row[deptCol]).trim() : '';
        
        if (!nameAr || nameAr === 'NULL') continue;
        
        try {
          // Get stage ID (if educational)
          let stageId = null;
          if (branchType === 'EDUCATIONAL' && school && school !== 'NULL') {
            const stageKey = `${branchName}__${school}`;
            stageId = stageMap.get(stageKey);
          }
          
          // Get department ID (from Department master data table)
          let departmentId = null;
          if (dept && dept !== 'NULL') {
            const deptKey = `${branchName}__${dept}`;
            departmentId = departmentMap.get(deptKey);
          }
          
          if (!departmentId) {
            console.log(`      ⚠️ تخطي: ${nameAr} - القسم مفقود (${dept})`);
            stats.employees.skipped++;
            continue;
          }
          
          // Check if employee already exists (by national ID)
          const existing = await prisma.employee.findFirst({
            where: { nationalId: nationalId }
          });
          
          if (existing) {
            stats.employees.skipped++;
            continue;
          }
          
          // Generate unique employee number
          const employeeNumber = `EMP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          
          // Create employee
          await prisma.employee.create({
            data: {
              fullNameAr: nameAr,
              fullNameEn: nameEn || nameAr,
              nationalId: nationalId,
              employeeNumber: employeeNumber,
              nationality: nationality || 'غير محدد',
              phone: mobile || '',
              email: email || '',
              education: qualification || '',
              specialization: specialization || '',
              position: jobTitle || 'موظف',
              department: dept, // Keep legacy field for backward compatibility
              departmentId: departmentId, // ✅ Link to Department master data table
              branchId: branch.id,
              stageId: stageId,
              status: 'ACTIVE',
              basicSalary: 0, // Will be updated from salary file later
              housingAllowance: 0,
              transportAllowance: 0,
              otherAllowances: 0
            }
          });
          
          stats.employees.created++;
          
          if (stats.employees.created % 50 === 0) {
            console.log(`      ✅ تم استيراد: ${stats.employees.created} موظف...`);
          }
          
        } catch (error) {
          stats.employees.errors++;
          stats.errors.push({
            employee: nameAr,
            error: error.message
          });
          console.log(`      ❌ خطأ: ${nameAr} - ${error.message}`);
        }
      }
      
      console.log(`\n   ✅ اكتمل استيراد الموظفين: ${stats.employees.created}\n`);
    }
    
    // Final summary
    console.log('\n' + '='.repeat(80));
    console.log('\n🎉 اكتمل الاستيراد!\n');
    console.log('📊 الإحصائيات:\n');
    console.log(`   🏢 الفروع:`);
    console.log(`      ✅ تم إنشاء: ${stats.branches.created}`);
    console.log(`      ⚪ موجود: ${stats.branches.skipped}`);
    console.log('');
    console.log(`   📚 المراحل:`);
    console.log(`      ✅ تم إنشاء: ${stats.stages.created}`);
    console.log(`      ⚪ موجود: ${stats.stages.skipped}`);
    console.log('');
    console.log(`   📁 الأقسام:`);
    console.log(`      ✅ تم إنشاء: ${stats.departments.created}`);
    console.log(`      ⚪ موجود: ${stats.departments.skipped}`);
    console.log('');
    console.log(`   👥 الموظفين:`);
    console.log(`      ✅ تم إنشاء: ${stats.employees.created}`);
    console.log(`      ⚪ تم تخطي: ${stats.employees.skipped}`);
    console.log(`      ❌ أخطاء: ${stats.employees.errors}`);
    console.log('');
    
    if (stats.errors.length > 0) {
      console.log('⚠️ الأخطاء:\n');
      stats.errors.slice(0, 10).forEach(err => {
        console.log(`   • ${err.employee}: ${err.error}`);
      });
      if (stats.errors.length > 10) {
        console.log(`   ... و ${stats.errors.length - 10} خطأ آخر\n`);
      }
    }
    
    // Save stats
    fs.writeFileSync(
      '/data/.openclaw/workspace/albassam-tasks/data/import_stats.json',
      JSON.stringify(stats, null, 2)
    );
    
    console.log('✅ تم حفظ الإحصائيات في: data/import_stats.json\n');
    
  } catch (error) {
    console.error('\n❌ خطأ:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
