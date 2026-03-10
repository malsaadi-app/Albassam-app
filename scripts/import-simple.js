const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const fs = require('fs');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

const filePath = '/data/.openclaw/workspace/albassam-tasks/data/employees_data_final_clean.xlsx';

console.log('\n🚀 استيراد بيانات الموظفين (مبسط - بدون فحص تكرار)\n');
console.log('='.repeat(80));

const stats = {
  branches: 0,
  orgUnits: 0,
  employees: 0,
  assignments: 0,
  errors: []
};

async function main() {
  try {
    console.log('\n📊 قراءة ملف Excel...\n');
    
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0]; // First sheet only for testing
    
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`\n📁 معالجة: ${sheetName}\n`);
    
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    if (data.length === 0) {
      console.log('   ⚪ شيت فارغ - تخطي\n');
      return;
    }
    
    // Get column names
    const firstRow = data[0];
    const branchCol = Object.keys(firstRow).find(col => 
      col.includes('مجمع') || col.includes('فرع') || col.includes('شركة') || col.includes('معهد')
    );
    
    const branchNameOriginal = data[0][branchCol] ? String(data[0][branchCol]).trim() : '';
    const branchName = `${branchNameOriginal} - New`;
    
    const isCorporate = branchNameOriginal.includes('شركة') || branchNameOriginal.includes('الصفر');
    const branchType = isCorporate ? 'COMPANY' : 'SCHOOL';
    
    console.log(`   🏢 الفرع: ${branchName}`);
    console.log(`   📋 النوع: ${branchType === 'SCHOOL' ? 'تعليمي' : 'إداري/شركة'}`);
    console.log(`   👥 الموظفين: ${data.length}\n`);
    
    // Create branch using upsert
    const branch = await prisma.branch.upsert({
      where: { name: branchName },
      update: {},
      create: {
        name: branchName,
        type: branchType,
        status: 'ACTIVE',
        workStartTime: '07:00',
        workEndTime: '14:00',
        workDays: '0,1,2,3,4'
      }
    });
    
    stats.branches++;
    console.log(`   ✅ الفرع: ${branchName}\n`);
    
    // Create root OrgUnit using upsert
    const schoolOrgUnit = await prisma.orgUnit.upsert({
      where: {
        branchId_parentId_name_type: {
          branchId: branch.id,
          parentId: null,
          name: branchName,
          type: 'SCHOOL'
        }
      },
      update: {},
      create: {
        name: branchName,
        type: 'SCHOOL',
        branchId: branch.id,
        parentId: null,
        isActive: true,
        sortOrder: 0
      }
    });
    
    stats.orgUnits++;
    
    console.log(`   👥 استيراد الموظفين (عينة: أول 10 فقط)...\n`);
    
    // Import first 10 employees only (for testing)
    for (const row of data.slice(0, 10)) {
      const nameArCol = Object.keys(row).find(col => col.includes('الاسم') && !col.includes('Name'));
      const nameEnCol = Object.keys(row).find(col => col === 'Name' || col.includes('name'));
      const nationalIdCol = Object.keys(row).find(col => col.includes('رقم الهوية'));
      
      const nameAr = row[nameArCol] ? String(row[nameArCol]).trim() : '';
      const nameEn = row[nameEnCol] ? String(row[nameEnCol]).trim() : '';
      const nationalId = row[nationalIdCol] ? String(row[nationalIdCol]).trim() : '';
      
      if (!nameAr || nameAr === 'NULL') continue;
      
      try {
        const employeeNumber = `EMP-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        
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
            department: 'عام',
            branchId: branch.id,
            status: 'ACTIVE',
            basicSalary: 0,
            housingAllowance: 0,
            transportAllowance: 0,
            otherAllowances: 0
          }
        });
        
        stats.employees++;
        console.log(`      ✅ ${stats.employees}. ${nameAr}`);
        
      } catch (error) {
        stats.errors.push({
          employee: nameAr,
          error: error.message
        });
        console.log(`      ❌ ${nameAr}: ${error.message}`);
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('\n🎉 اكتمل الاستيراد (عينة)!\n');
    console.log('📊 الإحصائيات:\n');
    console.log(`   🏢 الفروع: ${stats.branches}`);
    console.log(`   🏗️ OrgUnits: ${stats.orgUnits}`);
    console.log(`   👥 الموظفين: ${stats.employees}`);
    console.log(`   ❌ أخطاء: ${stats.errors.length}`);
    console.log('');
    
    if (stats.errors.length > 0) {
      console.log('⚠️ الأخطاء:\n');
      stats.errors.forEach(err => {
        console.log(`   • ${err.employee}: ${err.error}`);
      });
      console.log('');
    }
    
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
