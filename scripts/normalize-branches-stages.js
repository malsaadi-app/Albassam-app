#!/usr/bin/env node
/*
  Normalize branch/stage names created during import.

  - Merge duplicate "معهد البسام العالي للتدريب (رجالي )" and "(رجالي)".
  - Normalize stage names:
      ابتدائي  -> ابتدائية
      متوسط   -> متوسطة
      ثانوي   -> ثانوية

  Strategy:
  - If both names exist under same branch, move employees from variant -> canonical and delete variant stage.
  - Else rename variant stage to canonical.
*/

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function mergeBranches() {
  const aName = 'معهد البسام العالي للتدريب (رجالي )';
  const bName = 'معهد البسام العالي للتدريب (رجالي)';

  const a = await prisma.branch.findFirst({ where: { name: aName } });
  const b = await prisma.branch.findFirst({ where: { name: bName } });
  if (!a || !b) return;

  // Move employees from b -> a
  const moved = await prisma.employee.updateMany({
    where: { branchId: b.id },
    data: { branchId: a.id },
  });

  // Move stages from b -> a (none expected)
  await prisma.stage.updateMany({
    where: { branchId: b.id },
    data: { branchId: a.id },
  });

  // Delete b (should be safe now)
  await prisma.branch.delete({ where: { id: b.id } });

  // Rename a to canonical
  await prisma.branch.update({ where: { id: a.id }, data: { name: bName } });

  console.log(`Merged branches: moved employees=${moved.count}, deleted='${aName}' duplicate, canonical='${bName}'`);
}

async function normalizeStages() {
  const map = {
    'ابتدائي': 'ابتدائية',
    'متوسط': 'متوسطة',
    'ثانوي': 'ثانوية',
  };

  const branches = await prisma.branch.findMany({ select: { id: true, name: true } });

  for (const br of branches) {
    const stages = await prisma.stage.findMany({ where: { branchId: br.id }, select: { id: true, name: true } });
    const byName = new Map(stages.map((s) => [s.name, s]));

    for (const [from, to] of Object.entries(map)) {
      const fromStage = byName.get(from);
      if (!fromStage) continue;

      const toStage = byName.get(to);
      if (toStage) {
        // Move employees
        const moved = await prisma.employee.updateMany({
          where: { stageId: fromStage.id },
          data: { stageId: toStage.id },
        });
        // Delete old stage
        await prisma.stage.delete({ where: { id: fromStage.id } });
        console.log(`Branch '${br.name}': merged stage '${from}' -> '${to}' (moved ${moved.count})`);
      } else {
        // Rename stage
        await prisma.stage.update({ where: { id: fromStage.id }, data: { name: to } });
        console.log(`Branch '${br.name}': renamed stage '${from}' -> '${to}'`);
      }
    }
  }
}

async function main() {
  await mergeBranches();
  await normalizeStages();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
