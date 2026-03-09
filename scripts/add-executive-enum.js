const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Adding EXECUTIVE to OrgAssignmentType enum...');
    
    // Check if EXECUTIVE already exists
    const result = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'EXECUTIVE' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'OrgAssignmentType')
      ) as exists;
    `;
    
    if (result[0]?.exists) {
      console.log('✅ EXECUTIVE already exists in enum');
    } else {
      // Add EXECUTIVE value to enum
      await prisma.$executeRawUnsafe(`
        ALTER TYPE "OrgAssignmentType" ADD VALUE 'EXECUTIVE';
      `);
      console.log('✅ Successfully added EXECUTIVE to OrgAssignmentType enum');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
