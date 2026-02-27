const { PrismaClient } = require('@prisma/client');

function norm(s){
  if(s==null) return '';
  return String(s)
    .trim()
    .replace(/\s+/g,' ')
    .replace(/[ـ]/g,'')
    .replace(/[“”]/g,'"');
}

function buildIndex(rows, fields){
  const map = new Map();
  for(const r of rows){
    for(const f of fields){
      if(r[f]) map.set(norm(r[f]), r.id);
    }
  }
  return map;
}

(async () => {
  const prisma = new PrismaClient();
  try{
    const employees = await prisma.employee.findMany({
      select: { id:true, fullNameAr:true, department:true, position:true, departmentId:true, jobTitleId:true }
    });
    const departments = await prisma.department.findMany({ select: {id:true, nameAr:true, nameEn:true} });
    const jobTitles = await prisma.jobTitle.findMany({ select: {id:true, nameAr:true, nameEn:true} });

    const deptIndex = buildIndex(departments, ['nameAr','nameEn']);
    const jobIndex = buildIndex(jobTitles, ['nameAr','nameEn']);

    const uniqueDepts = [...new Set(employees.map(e=>norm(e.department)).filter(Boolean))];
    const uniquePos = [...new Set(employees.map(e=>norm(e.position)).filter(Boolean))];

    const deptMapping = {};
    const jobMapping = {};

    const unmatchedDepts = [];
    for(const d of uniqueDepts){
      const id = deptIndex.get(d);
      if(id) deptMapping[d]=id; else unmatchedDepts.push(d);
    }
    const unmatchedJobs = [];
    for(const p of uniquePos){
      const id = jobIndex.get(p);
      if(id) jobMapping[p]=id; else unmatchedJobs.push(p);
    }

    const updates = employees.map(emp=>{
      const depId = deptMapping[norm(emp.department)] || null;
      const jobId = jobMapping[norm(emp.position)] || null;
      return { emp, depId, jobId };
    });

    const toUpdate = updates.filter(u => u.emp.departmentId!==u.depId || u.emp.jobTitleId!==u.jobId);

    const results = await prisma.$transaction(
      toUpdate.map(u=>prisma.employee.update({
        where:{id:u.emp.id},
        data:{ departmentId:u.depId, jobTitleId:u.jobId }
      }))
    );

    const after = await prisma.employee.findMany({
      select:{ id:true, fullNameAr:true, department:true, position:true, departmentId:true, jobTitleId:true }
    });

    const ok = after.filter(e=>e.departmentId && e.jobTitleId).length;
    const missing = after.filter(e=>!e.departmentId || !e.jobTitleId);

    const report = {
      counts:{
        employees: after.length,
        uniqueDepts: uniqueDepts.length,
        uniquePositions: uniquePos.length,
        attemptedUpdates: toUpdate.length,
        updatedRows: results.length,
        fullyMappedEmployees: ok,
        problematicEmployees: missing.length,
      },
      unmatched:{ departments: unmatchedDepts, jobTitles: unmatchedJobs },
      problematicEmployees: missing.map(e=>({
        id:e.id,
        fullNameAr:e.fullNameAr,
        department:e.department,
        position:e.position,
        departmentId:e.departmentId,
        jobTitleId:e.jobTitleId,
      })),
      mappings:{
        departments: Object.entries(deptMapping).sort((a,b)=>a[0].localeCompare(b[0],'ar')),
        jobTitles: Object.entries(jobMapping).sort((a,b)=>a[0].localeCompare(b[0],'ar')),
      }
    };

    console.log(JSON.stringify(report,null,2));
  } finally {
    await prisma.$disconnect();
  }
})();
