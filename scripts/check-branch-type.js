const {PrismaClient}=require('@prisma/client');
(async()=>{
  const p=new PrismaClient();
  try{
    const b=await p.branch.findUnique({where:{id:'cmm4mq88j000tnmr30lyd0isr'}, select:{id:true,name:true,type:true}});
    console.log('branch',b);
  }catch(e){console.error(e);}finally{await p.$disconnect();}
})();