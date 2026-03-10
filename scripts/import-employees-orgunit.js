const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const fs = require('fs');

const prisma = new PrismaClient();
const filePath = '/data/.openclaw/workspace/albassam-tasks/data/employees_data_final_clean.xlsx';

console.log('\n🚀 استيراد بيانات الموظفين مع الهيكل التنظيمي (OrgUnit)\n');
console.log('='.repeat(80));

const stats = {
  branches: { created: 0, skipped: 0 },
  orgUnits: { created: 0, skipped: 0 },
  employees: { created: 0, skipped: 0, errors: 0 },
  assignments: { created: 0, errors: 0 },
  errors: []
};

// Maps to store created entities
const branchMap = new Map();
const orgUnitMap = new Map();
const employeeMap = new Map();

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
      const branchType = isCorporate ? 'COMPANY' : 'SCHOOL';
      
      console.log(`   🏢 الفرع: ${branchName}`);
      console.log(`   📋 النوع: ${branchType === 'SCHOOL' ? 'تعليمي' : 'إداري/شركة'}`);
      console.log(`   👥 الموظفين: ${data.length}\n`);
      
      // Create or get branch
      let branch = await prisma.branch.findFirst({
        where: { name: branchName }
      });
      
      if (!branch) {
        branch = await prisma.branch.create({
          data: {
            name: branchName,
            type: branchType,
            status: 'ACTIVE',
            workStartTime: '07:00',
            workEndTime: '14:00',
            workDays: '0,1,2,3,4' // Sun-Thu
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
      
      // Create root OrgUnit for branch (SCHOOL type)
      const schoolOrgKey = `${branchName}__ROOT`;
      let schoolOrgUnit = orgUnitMap.get(schoolOrgKey);
      
      if (!schoolOrgUnit) {
        schoolOrgUnit = await prisma.orgUnit.findFirst({
          where: {
            branchId: branch.id,
            parentId: null,
            type: 'SCHOOL'
          }
        });
        
        if (!schoolOrgUnit) {
          schoolOrgUnit = await prisma.orgUnit.create({
            data: {
              name: branchName,
              type: 'SCHOOL',
              branchId: branch.id,
              parentId: null,
              isActive: true,
              sortOrder: 0
            }
          });
          stats.orgUnits.created++;
          console.log(`   ✅ OrgUnit (ROOT/SCHOOL): ${branchName}`);
        }
        
        orgUnitMap.set(schoolOrgKey, schoolOrgUnit.id);
      }
      
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
      
      // Create OrgUnits for stages (educational branches only)
      if (branchType === 'SCHOOL') {
        for (const stageName of stagesSet) {
          const stageOrgKey = `${branchName}__STAGE__${stageName}`;
          
          let stageOrgUnit = orgUnitMap.get(stageOrgKey);
          
          if (!stageOrgUnit) {
            stageOrgUnit = await prisma.orgUnit.findFirst({
              where: {
                branchId: branch.id,
                parentId: schoolOrgUnit.id,
                name: stageName,
                type: 'STAGE'
              }
            });
            
            if (!stageOrgUnit) {
              stageOrgUnit = await prisma.orgUnit.create({
                data: {
                  name: stageName,
                  type: 'STAGE',
                  branchId: branch.id,
                  parentId: schoolOrgUnit.id,
                  isActive: true,
                  sortOrder: 0
                }
              });
              stats.orgUnits.created++;
              console.log(`      ✅ OrgUnit (STAGE): ${stageName}`);
            }
            
            orgUnitMap.set(stageOrgKey, stageOrgUnit.id);
          }
        }
      }
      
      // Create OrgUnits for departments
      for (const deptName of deptsSet) {
        // Determine if this department belongs to a stage or is top-level
        // For now, we'll create departments under the school root
        // (You can refine this logic to link departments to stages)
        
        const deptOrgKey = `${branchName}__DEPT__${deptName}`;
        
        let deptOrgUnit = orgUnitMap.get(deptOrgKey);
        
        if (!deptOrgUnit) {
          deptOrgUnit = await prisma.orgUnit.findFirst({
            where: {
              branchId: branch.id,
              name: deptName,
              type: 'DEPARTMENT'
            }
          });
          
          if (!deptOrgUnit) {
            deptOrgUnit = await prisma.orgUnit.create({
              data: {
                name: deptName,
                type: 'DEPARTMENT',
                branchId: branch.id,
                parentId: schoolOrgUnit.id, // Under branch root for now
                isActive: true,
                sortOrder: 0
              }
            });
            stats.orgUnits.created++;
            console.log(`      ✅ OrgUnit (DEPARTMENT): ${deptName}`);
          }
          
          orgUnitMap.set(deptOrgKey, deptOrgUnit.id);
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
          // Check if employee already exists
          const existing = await prisma.employee.findFirst({
            where: { nationalId: nationalId }
          });
          
          if (existing) {
            employeeMap.set(nationalId, existing.id);
            stats.employees.skipped++;
            continue;
          }
          
          // Generate unique employee number
          const employeeNumber = `EMP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          
          // Create employee
          const employee = await prisma.employee.create({
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
              department: dept, // Legacy field
              branchId: branch.id,
              status: 'ACTIVE',
              basicSalary: 0,
              housingAllowance: 0,
              transportAllowance: 0,
              otherAllowances: 0
            }
          });
          
          employeeMap.set(nationalId, employee.id);
          stats.employees.created++;
          
          // Create OrgUnitAssignments
          
          // 1. Administrative assignment (to stage, if exists)
          if (branchType === 'SCHOOL' && school && school !== 'NULL') {
            const stageOrgKey = `${branchName}__STAGE__${school}`;
            const stageOrgUnitId = orgUnitMap.get(stageOrgKey);
            
            if (stageOrgUnitId) {
              try {
                await prisma.orgUnitAssignment.create({
                  data: {
                    employeeId: employee.id,
                    orgUnitId: stageOrgUnitId,
                    assignmentType: 'ADMIN', // Administrative reference
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
          }
          
          // 2. Functional/Academic assignment (to department)
          if (dept && dept !== 'NULL') {
            const deptOrgKey = `${branchName}__DEPT__${dept}`;
            const deptOrgUnitId = orgUnitMap.get(deptOrgKey);
            
            if (deptOrgUnitId) {
              const isTeacher = jobTitle && jobTitle.includes('معلم');
              const assignmentType = isTeacher ? 'FUNCTIONAL' : 'ADMIN';
              
              try {
                await prisma.orgUnitAssignment.create({
                  data: {
                    employeeId: employee.id,
                    orgUnitId: deptOrgUnitId,
                    assignmentType: assignmentType, // Functional for teachers
                    role: 'MEMBER',
                    coverageScope: 'BRANCH',
                    isPrimary: true, // Primary assignment
                    active: true
                  }
                });
                stats.assignments.created++;
              } catch (err) {
                // Already exists - skip
              }
            }
          }
          
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
    console.log(`   🏗️ OrgUnits (الهيكل التنظيمي):`);
    console.log(`      ✅ تم إنشاء: ${stats.orgUnits.created}`);
    console.log(`      ⚪ موجود: ${stats.orgUnits.skipped}`);
    console.log('');
    console.log(`   👥 الموظفين:`);
    console.log(`      ✅ تم إنشاء: ${stats.employees.created}`);
    console.log(`      ⚪ تم تخطي: ${stats.employees.skipped}`);
    console.log(`      ❌ أخطاء: ${stats.employees.errors}`);
    console.log('');
    console.log(`   🔗 OrgUnitAssignments (الربط بالهيكل):`);
    console.log(`      ✅ تم إنشاء: ${stats.assignments.created}`);
    console.log(`      ❌ أخطاء: ${stats.assignments.errors}`);
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
      '/data/.openclaw/workspace/albassam-tasks/data/import_orgunit_stats.json',
      JSON.stringify(stats, null, 2)
    );
    
    console.log('✅ تم حفظ الإحصائيات في: data/import_orgunit_stats.json\n');
    
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
