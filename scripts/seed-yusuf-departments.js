const {PrismaClient}=require('@prisma/client');
(async()=>{
  const p=new PrismaClient();
  try{
    const branchId='cmm4mq88j000tnmr30lyd0isr';
    const names=['الإدارة','الموارد البشرية'];
    for(const name of names){
      const ex=await p.orgUnit.findFirst({where:{branchId,name}});
      if(!ex){
        await p.orgUnit.create({data:{branchId,name,type:'DEPARTMENT',isActive:true}});
        console.log('created',name);
      } else console.log('exists',name);
    }
    const units=await p.orgUnit.findMany({where:{branchId},select:{id,name,type}});
    console.log('units now',units);
  }catch(e){console.error(e);}finally{await p.$disconnect();}
})();