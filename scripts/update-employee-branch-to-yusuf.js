const {PrismaClient}=require('@prisma/client');
(async ()=>{
  const p=new PrismaClient();
  try{
    const emp0 = await p.employee.findFirst({ where:{ email:'mohammed.q@bassamgroup.com' }, select:{ id:true } });
    if(!emp0){ console.log('employee not found'); return; }
    await p.employee.update({ where:{ id: emp0.id }, data:{ branchId:'cmm4mq88j000tnmr30lyd0isr' } });
    const emp=await p.employee.findUnique({ where:{ id: emp0.id }, select:{ id:true, branchId:true, stageId:true } });
    console.log('updated', emp);
  }catch(e){console.error(e);}finally{await p.$disconnect();}
})();