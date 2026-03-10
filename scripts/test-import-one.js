const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');

// استخدام direct connection
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

async function main() {
  try {
    console.log('\n🔍 فحص موظف واحد فقط للتشخيص...\n');
    
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    const firstRow = data[0];
    const nameArCol = Object.keys(firstRow).find(col => col.includes('الاسم') && !col.includes('Name'));
    const nameEnCol = Object.keys(firstRow).find(col => col === 'Name' || col.includes('name'));
    const nationalIdCol = Object.keys(firstRow).find(col => col.includes('رقم الهوية'));
    const branchCol = Object.keys(firstRow).find(col => 
      col.includes('مجمع') || col.includes('فرع') || col.includes('شركة') || col.includes('معهد')
    );
    
    const row = data[0];
    const nameAr = row[nameArCol] ? String(row[nameArCol]).trim() : '';
    const nameEn = row[nameEnCol] ? String(row[nameEnCol]).trim() : '';
    const nationalId = row[nationalIdCol] ? String(row[nationalIdCol]).trim() : '';
    const branchName = row[branchCol] ? String(row[branchCol]).trim() + ' - New' : '';
    
    console.log('📋 بيانات الموظف الأول:');
    console.log(`   الاسم: ${nameAr}`);
    console.log(`   Name: ${nameEn}`);
    console.log(`   National ID: ${nationalId}`);
    console.log(`   Branch: ${branchName}\n`);
    
    // Get or create branch
    let branch = await prisma.branch.findFirst({
      where: { name: branchName }
    });
    
    if (!branch) {
      console.log('❌ الفرع غير موجود! يجب إنشاء الفرع أولاً.\n');
      return;
    }
    
    console.log(`✅ الفرع موجود: ${branch.id}\n`);
    
    // Try to create employee
    console.log('⏳ محاولة إنشاء الموظف...\n');
    
    const employeeNumber = `TEST-${Date.now()}`;
    
    const employeeData = {
      fullNameAr: nameAr,
      fullNameEn: nameEn || nameAr,
      nationalId: nationalId || employeeNumber,
      employeeNumber: employeeNumber,
      nationality: 'سعودي',
      phone: '0500000000',
      email: '',
      education: '',
      specialization: '',
      position: 'موظف',
      department: 'عام',
      branchId: branch.id,
      status: 'ACTIVE',
      basicSalary: 0.0,
      housingAllowance: 0.0,
      transportAllowance: 0.0,
      otherAllowances: 0.0
    };
    
    console.log('📦 البيانات المرسلة:');
    console.log(JSON.stringify(employeeData, null, 2));
    console.log('');
    
    const employee = await prisma.employee.create({
      data: employeeData
    });
    
    console.log('✅ تم إنشاء الموظف بنجاح!');
    console.log(`   ID: ${employee.id}`);
    console.log(`   رقم الموظف: ${employee.employeeNumber}\n`);
    
  } catch (error) {
    console.error('\n❌ خطأ:', error.message);
    if (error.meta) {
      console.error('\nMeta:', JSON.stringify(error.meta, null, 2));
    }
    console.error('\nStack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

main();
