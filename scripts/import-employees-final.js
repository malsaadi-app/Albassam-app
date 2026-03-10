const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const fs = require('fs');

// استخدام direct connection بدلاً من pooler (port 5432 بدلاً من 6543)
const directConnectionUrl = process.env.DATABASE_URL
  ? process.env.DATABASE_URL.replace(':6543', ':5432').replace('?pgbouncer=true', '')
  : undefined;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: directConnectionUrl || process.env.DATABASE_URL
    }
  },
  log: ['error', 'warn']
});

const filePath = '/data/.openclaw/workspace/albassam-tasks/data/employees_data_final_clean.xlsx';

console.log('\n🚀 استيراد بيانات الموظفين مع الهيكل التنظيمي\n');
console.log('='.repeat(80));
console.log('\n🔧 استخدام اتصال مباشر (direct connection) لتجنب مشاكل pgbouncer\n');

const stats = {
  branches: { created: 0, existing: 0 },
  orgUnits: { created: 0, existing: 0 },
  employees: { created: 0, skipped: 0, errors: 0 },
  assignments: { created: 0, errors: 0 }
};

// Cache
const branchCache = new Map();
const orgUnitCache = new Map();
const processedNationalIds = new Set();

async function getOrCreateBranch(name, type) {
  const cacheKey = name;
  if (branchCache.has(cacheKey)) {
    return branchCache.get(cacheKey);
  }
  
  // Try to find first
  let branch = await prisma.branch.findFirst({
    where: { name: name }
  });
  
  if (branch) {
    stats.branches.existing++;
  } else {
    // Create new
    branch = await prisma.branch.create({
      data: {
        name: name,
        type: type,
        status: 'ACTIVE',
        workStartTime: '07:00',
        workEndTime: '14:00',
        workDays: '0,1,2,3,4'
      }
    });
    stats.branches.created++;
  }
  
  branchCache.set(cacheKey, branch);
  return branch;
}

async function getOrCreateOrgUnit(name, type, branchId, parentId = null) {
  const cacheKey = `${branchId}__${parentId || 'ROOT'}__${name}__${type}`;
  if (orgUnitCache.has(cacheKey)) {
    return orgUnitCache.get(cacheKey);
  }
  
  // Try to find first
  let orgUnit = await prisma.orgUnit.findFirst({
    where: {
      branchId: branchId,
      parentId: parentId,
      name: name,
      type: type
    }
  });
  
  if (orgUnit) {
    stats.orgUnits.existing++;
  } else {
    // Create new
    orgUnit = await prisma.orgUnit.create({
      data: {
        name: name,
        type: type,
        branchId: branchId,
        parentId: parentId,
        isActive: true,
        sortOrder: 0
      }
    });
    stats.orgUnits.created++;
  }
  
  orgUnitCache.set(cacheKey, orgUnit);
  return orgUnit;
}

async function main() {
  try {
    console.log('\n📊 قراءة ملف Excel...\n');
    
    const workbook = XLSX.readFile(filePath);
    
    // Process each sheet
    for (let sheetIndex = 0; sheetIndex < workbook.SheetNames.length; sheetIndex++) {
      const sheetName = workbook.SheetNames[sheetIndex];
      
      console.log(`\n${'─'.repeat(80)}`);
      console.log(`\n📁 معالجة: ${sheetName} (${sheetIndex + 1}/${workbook.SheetNames.length})\n`);
      
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
      const nameArCol = Object.keys(firstRow).find(col => 
        col.includes('الاسم') && !col.includes('Name')
      );
      const nameEnCol = Object.keys(firstRow).find(col => 
        col === 'Name' || col.includes('name')
      );
      const nationalIdCol = Object.keys(firstRow).find(col => 
        col.includes('رقم الهوية')
      );
      
      // Get branch info
      const branchNameOriginal = data[0][branchCol] ? String(data[0][branchCol]).trim() : '';
      const branchName = `${branchNameOriginal} - New`;
      const isCorporate = branchNameOriginal.includes('شركة') || branchNameOriginal.includes('الصفر');
      const branchType = isCorporate ? 'COMPANY' : 'SCHOOL';
      
      console.log(`   🏢 الفرع: ${branchName}`);
      console.log(`   📋 النوع: ${branchType === 'SCHOOL' ? 'تعليمي' : 'إداري'}`);
      console.log(`   👥 الموظفين: ${data.length}\n`);
      
      // Create/get branch
      const branch = await getOrCreateBranch(branchName, branchType);
      console.log(`   ✅ الفرع: ${stats.branches.created > 0 ? 'تم الإنشاء' : 'موجود مسبقاً'}\n`);
      
      // Create root OrgUnit (SCHOOL)
      const schoolOrgUnit = await getOrCreateOrgUnit(
        branchName,
        'SCHOOL',
        branch.id,
        null
      );
      
      // Collect unique stages and departments
      const stagesSet = new Set();
      const deptsSet = new Set();
      
      data.forEach(row => {
        const school = row[schoolCol] ? String(row[schoolCol]).trim() : '';
        const dept = row[deptCol] ? String(row[deptCol]).trim() : '';
        
        if (school && school !== 'NULL' && branchType === 'SCHOOL') {
          stagesSet.add(school);
        }
        if (dept && dept !== 'NULL') {
          deptsSet.add(dept);
        }
      });
      
      console.log(`   📚 المراحل: ${stagesSet.size}`);
      console.log(`   📁 الأقسام: ${deptsSet.size}\n`);
      
      // Create OrgUnits for stages
      const stageOrgUnits = new Map();
      if (branchType === 'SCHOOL' && stagesSet.size > 0) {
        console.log('   ⏳ إنشاء المراحل...');
        for (const stageName of stagesSet) {
          const stageOrgUnit = await getOrCreateOrgUnit(
            stageName,
            'STAGE',
            branch.id,
            schoolOrgUnit.id
          );
          stageOrgUnits.set(stageName, stageOrgUnit);
        }
        console.log(`   ✅ تم إنشاء ${stageOrgUnits.size} مرحلة\n`);
      }
      
      // Create OrgUnits for departments
      const deptOrgUnits = new Map();
      if (deptsSet.size > 0) {
        console.log('   ⏳ إنشاء الأقسام...');
        for (const deptName of deptsSet) {
          const deptOrgUnit = await getOrCreateOrgUnit(
            deptName,
            'DEPARTMENT',
            branch.id,
            schoolOrgUnit.id
          );
          deptOrgUnits.set(deptName, deptOrgUnit);
        }
        console.log(`   ✅ تم إنشاء ${deptOrgUnits.size} قسم\n`);
      }
      
      // Import employees
      console.log(`   👥 استيراد الموظفين...\n`);
      
      let importedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;
      
      for (const row of data) {
        const nameAr = row[nameArCol] ? String(row[nameArCol]).trim() : '';
        const nameEn = row[nameEnCol] ? String(row[nameEnCol]).trim() : '';
        const nationalId = row[nationalIdCol] ? String(row[nationalIdCol]).trim() : '';
        const school = row[schoolCol] ? String(row[schoolCol]).trim() : '';
        const dept = row[deptCol] ? String(row[deptCol]).trim() : '';
        
        if (!nameAr || nameAr === 'NULL') continue;
        
        // Skip if already processed
        if (nationalId && processedNationalIds.has(nationalId)) {
          skippedCount++;
          continue;
        }
        
        try {
          // Generate unique employee number
          const timestamp = Date.now();
          const random = Math.floor(Math.random() * 100000);
          const employeeNumber = `EMP-${timestamp}-${random}`;
          
          // Create employee
          const employee = await prisma.employee.create({
            data: {
              fullNameAr: nameAr,
              fullNameEn: nameEn || nameAr,
              nationalId: nationalId || employeeNumber,
              employeeNumber: employeeNumber,
              nationality: 'غير محدد',
              phone: '',
              email: '',
              education: '',
              specialization: '',
              position: 'موظف',
              department: dept || 'عام',
              branchId: branch.id,
              status: 'ACTIVE',
              basicSalary: 0,
              housingAllowance: 0,
              transportAllowance: 0,
              otherAllowances: 0
            }
          });
          
          if (nationalId) {
            processedNationalIds.add(nationalId);
          }
          
          importedCount++;
          stats.employees.created++;
          
          // Create OrgUnitAssignments
          
          // 1. Administrative assignment (to stage, if exists)
          if (branchType === 'SCHOOL' && school && school !== 'NULL' && stageOrgUnits.has(school)) {
            const stageOrgUnit = stageOrgUnits.get(school);
            
            try {
              await prisma.orgUnitAssignment.create({
                data: {
                  employeeId: employee.id,
                  orgUnitId: stageOrgUnit.id,
                  assignmentType: 'ADMIN',
                  role: 'MEMBER',
                  coverageScope: 'BRANCH',
                  isPrimary: false,
                  active: true
                }
              });
              stats.assignments.created++;
            } catch (err) {
              // Already exists - skip
            }
          }
          
          // 2. Functional assignment (to department)
          if (dept && dept !== 'NULL' && deptOrgUnits.has(dept)) {
            const deptOrgUnit = deptOrgUnits.get(dept);
            
            try {
              await prisma.orgUnitAssignment.create({
                data: {
                  employeeId: employee.id,
                  orgUnitId: deptOrgUnit.id,
                  assignmentType: 'FUNCTIONAL',
                  role: 'MEMBER',
                  coverageScope: 'BRANCH',
                  isPrimary: true,
                  active: true
                }
              });
              stats.assignments.created++;
            } catch (err) {
              // Already exists - skip
            }
          }
          
          if (importedCount % 50 === 0) {
            console.log(`      ⏳ ${importedCount} موظف...`);
          }
          
        } catch (error) {
          errorCount++;
          stats.employees.errors++;
          if (errorCount <= 10) {
            console.log(`      ❌ ${nameAr}:`);
            console.log(`         ${error.message}`);
            if (error.meta) {
              console.log(`         Meta:`, JSON.stringify(error.meta, null, 2));
            }
            console.log('');
          }
        }
      }
      
      stats.employees.skipped += skippedCount;
      
      console.log(`\n   ✅ اكتمل الفرع:`);
      console.log(`      • تم استيراد: ${importedCount} موظف`);
      console.log(`      • تم تخطي: ${skippedCount} موظف`);
      console.log(`      • أخطاء: ${errorCount} موظف\n`);
    }
    
    // Final summary
    console.log('\n' + '='.repeat(80));
    console.log('\n🎉 اكتمل الاستيراد بنجاح!\n');
    console.log('📊 الإحصائيات النهائية:\n');
    console.log(`   🏢 الفروع:`);
    console.log(`      ✅ تم إنشاء: ${stats.branches.created}`);
    console.log(`      ⚪ موجود مسبقاً: ${stats.branches.existing}`);
    console.log('');
    console.log(`   🏗️ الوحدات التنظيمية (OrgUnits):`);
    console.log(`      ✅ تم إنشاء: ${stats.orgUnits.created}`);
    console.log(`      ⚪ موجود مسبقاً: ${stats.orgUnits.existing}`);
    console.log('');
    console.log(`   👥 الموظفين:`);
    console.log(`      ✅ تم استيراد: ${stats.employees.created}`);
    console.log(`      ⚪ تم تخطي: ${stats.employees.skipped}`);
    console.log(`      ❌ أخطاء: ${stats.employees.errors}`);
    console.log('');
    console.log(`   🔗 الربط بالهيكل التنظيمي:`);
    console.log(`      ✅ تم إنشاء: ${stats.assignments.created} ربط`);
    console.log('');
    
    // Save stats
    fs.writeFileSync(
      '/data/.openclaw/workspace/albassam-tasks/data/import_final_stats.json',
      JSON.stringify(stats, null, 2)
    );
    
    console.log('✅ تم حفظ الإحصائيات في: data/import_final_stats.json\n');
    
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
