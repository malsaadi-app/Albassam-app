import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

interface SchoolData {
  col0: number;  // ID
  col1: string;  // اسم المجمع
  col2: string;  // اسم المدرسة
  col3: string | null;  // المرحلة
  col4: string;  // رقم المبنى
  col5: string;  // العنوان
  col6: string;  // الرقم الإحصائي
  col7: number;  // الرمز البريدي
  col8: number;  // الجوال
  col9: string;  // البريد
  col10: number; // السجل التجاري
  col11: number; // رقم المنشأة
}

async function main() {
  try {
    // Read data
    const data = JSON.parse(fs.readFileSync('/tmp/schools-data.json', 'utf8'));
    const schools: SchoolData[] = data.schools;
    
    console.log(`📊 Found ${schools.length} records\n`);
    
    // Group by complex (branch)
    const branches = new Map<string, SchoolData[]>();
    schools.forEach(school => {
      const branchName = school.col1.trim();
      if (!branches.has(branchName)) {
        branches.set(branchName, []);
      }
      branches.get(branchName)!.push(school);
    });
    
    console.log(`🏢 Found ${branches.size} unique branches\n`);
    
    // Create branches and stages
    for (const [branchName, branchSchools] of branches.entries()) {
      const firstRecord = branchSchools[0];
      
      // Determine branch type
      let branchType: 'SCHOOL' | 'INSTITUTE' | 'COMPANY' = 'SCHOOL';
      if (branchName.includes('معهد')) {
        branchType = 'INSTITUTE';
      } else if (branchName.includes('شركة') || branchName.includes('فرع')) {
        branchType = 'COMPANY';
      }
      
      console.log(`\n✅ Creating: ${branchName} (${branchType})`);
      
      // Prepare stages
      const stages = branchSchools
        .filter(s => s.col3) // Only records with stage name
        .map(s => ({
          name: s.col3!.trim(),
          status: 'ACTIVE' as const
        }));
      
      // Create branch with stages
      const branch = await prisma.branch.create({
        data: {
          name: branchName,
          type: branchType,
          commercialRegNo: firstRecord.col10 ? firstRecord.col10.toString() : undefined,
          buildingNo: firstRecord.col4 ? firstRecord.col4.toString() : undefined,
          address: firstRecord.col5 || undefined,
          city: 'الدمام', // Default city
          postalCode: firstRecord.col7 ? firstRecord.col7.toString() : undefined,
          phone: firstRecord.col8 ? firstRecord.col8.toString() : undefined,
          email: firstRecord.col9 || undefined,
          workStartTime: '07:00',
          workEndTime: '14:00',
          workDays: '0,1,2,3,4', // Sun-Thu
          status: 'ACTIVE',
          ...(stages.length > 0 && {
            stages: {
              create: stages
            }
          })
        },
        include: {
          stages: true
        }
      });
      
      console.log(`   ✓ Branch ID: ${branch.id}`);
      console.log(`   ✓ Stages: ${branch.stages.length}`);
      branch.stages.forEach(stage => {
        console.log(`      - ${stage.name}`);
      });
    }
    
    console.log(`\n🎉 Import completed successfully!`);
    
    // Summary
    const totalBranches = await prisma.branch.count();
    const totalStages = await prisma.stage.count();
    
    console.log(`\n📊 Summary:`);
    console.log(`   Total Branches: ${totalBranches}`);
    console.log(`   Total Stages: ${totalStages}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
