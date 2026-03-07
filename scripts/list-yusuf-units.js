const {PrismaClient}=require('@prisma/client');
(async ()=>{
  const p=new PrismaClient();
  try{
    const branchId='cmm4mq88j000tnmr30lyd0isr';
    const units=await p.orgUnit.findMany({where:{branchId},select:{id:true,name:true,type:true}});
    console.log('units', units);
  }catch(e){console.error(e);}finally{await p.$disconnect();}
})();