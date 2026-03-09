const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    const request = await prisma.hRRequest.findUnique({
      where: { id: 'cmmjnqjy60005dt3mfkhsgvho' }
    });
    
    console.log(JSON.stringify(request, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
