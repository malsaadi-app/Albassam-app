const {PrismaClient} = require('@prisma/client');
(async ()=>{
  const p = new PrismaClient();
  try{
    const emp = await p.employee.findFirst({ where: { email: 'mohammed.q@bassamgroup.com' }, select: { id: true, fullNameAr: true, branchId: true, stageId: true } });
    console.log(emp);
  }catch(e){console.error(e);}finally{await p.$disconnect();}
})();