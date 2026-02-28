#!/usr/bin/env node
/*
  Bulk import employees from the provided 8-sheet Excel.

  Rules:
  - Branch = Arabic "المجمع" (8 unique)
  - Stage = derived from "المدرسة" (ابتدائية/متوسطة/ثانوية/رياض/إدارة) per employee
  - Department = "القسم" (kept as-is)
  - Position = "الصلاحية بالنظام" (kept as-is)
  - Primary match key: nationalId (رقم الهوية)
  - employeeNumber (required/unique): use "كود الموظف" if present else NID-<nationalId>

  Safe behavior:
  - Upsert by nationalId (update existing, create missing)
  - Create missing branches/stages
*/

const path = require('path');
const fs = require('fs');
const { PrismaClient, BranchType } = require('@prisma/client');
const XLSX = require('xlsx');

const prisma = new PrismaClient();

function norm(v) {
  if (v === null || v === undefined) return null;
  let s = String(v).trim();
  s = s.replace(/\s+/g, ' ');
  // Normalize common parentheses spacing issues
  s = s.replace(/\(رجالي \)/g, '(رجالي)');
  s = s.replace(/\(رجالي\s+\)/g, '(رجالي)');
  if (!s) return null;
  if (s.toUpperCase() === 'NULL') return null;
  return s;
}

function toNumber(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  const s = String(v).replace(/,/g, '').trim();
  if (!s || s.toUpperCase() === 'NULL') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function toDate(v) {
  if (!v) return null;
  if (v instanceof Date && !isNaN(v.getTime())) {
    const y = v.getUTCFullYear();
    if (y < 1900 || y > 2100) return null;
    return v;
  }
  const s = norm(v);
  if (!s) return null;
  // handle known placeholders
  if (s === '0000-00-00' || s === '2025-00-00' || s === '1447-00-00' || s === '1448-00-00') return null;
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    const y = d.getUTCFullYear();
    if (y < 1900 || y > 2100) return null;
    return d;
  }
  return null;
}

function detectBranchType(branchName) {
  const t = (branchName || '').toLowerCase();
  if (t.includes('معهد')) return BranchType.INSTITUTE;
  if (t.includes('شركة')) return BranchType.COMPANY;
  return BranchType.SCHOOL;
}

function detectStageName(schoolName, dept) {
  const t = `${schoolName || ''} ${dept || ''}`.replace(/\s+/g, ' ').trim();
  if (!t) return null;
  if (/إدارة عليا/.test(t)) return 'إدارة';
  if (/رياض|روضة|تمهيدي/.test(t)) return 'رياض أطفال';
  if (/ابتدائ|الصفوف الأولية|الأولية/.test(t)) return 'ابتدائية';
  if (/متوسط/.test(t)) return 'متوسطة';
  if (/ثانوي|الثانوية/.test(t)) return 'ثانوية';
  return null;
}

async function ensureBranch(branchName) {
  const existing = await prisma.branch.findFirst({ where: { name: branchName } });
  if (existing) return existing;
  return prisma.branch.create({
    data: {
      name: branchName,
      type: detectBranchType(branchName),
      status: 'ACTIVE',
      // leave location/work schedule defaults as-is
    },
  });
}

async function ensureStage(branchId, stageName) {
  const existing = await prisma.stage.findFirst({
    where: { branchId, name: stageName },
  });
  if (existing) return existing;
  return prisma.stage.create({
    data: {
      branchId,
      name: stageName,
      status: 'ACTIVE',
    },
  });
}

async function main() {
  const excelPath = process.argv[2] || '/data/.openclaw/workspace/imports/employees_8branches.xlsx';
  if (!fs.existsSync(excelPath)) {
    console.error('Excel not found:', excelPath);
    process.exit(1);
  }

  const wb = XLSX.readFile(excelPath, { cellDates: true });
  console.log('Sheets:', wb.SheetNames);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  // Cache branches/stages
  const branchCache = new Map(); // name -> branch
  const stageCache = new Map(); // `${branchId}:${stageName}` -> stage

  for (const sheet of wb.SheetNames) {
    const ws = wb.Sheets[sheet];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, blankrows: false });
    const nonEmpty = rows.filter((r) => r.some((v) => v !== null && String(v).trim() !== ''));
    if (!nonEmpty.length) continue;

    const header = nonEmpty[0].map((v) => String(v ?? '').trim());
    const idx = (name) => header.indexOf(name);

    const iComplex = idx('المجمع');
    const iSchool = idx('المدرسة');
    const iNameAr = idx('الاسم');
    const iNameEn = idx('Name');
    const iNat = idx('الجنسية');
    const iNationalId = idx('رقم الهوية');
    const iNationalIdExp = idx('تاريخ انتهاء الهوية');
    const iPhone = idx('رقم الجوال');
    const iDept = idx('القسم');
    const iEdu = idx('المؤهل');
    const iSpec = idx('التخصص');
    const iEmail = idx('البريد الإلكتروني');
    const iPassNo = idx('رقم جواز السفر');
    const iPassExp = idx('تاريخ انتهاء جواز السفر');
    const iEmpCode = idx('كود الموظف');
    const iPosition = idx('الصلاحية بالنظام');
    const iBasic = idx('الراتب الأساسي');
    const iHousing = idx('بدل السكن');
    const iOther = idx('بدلات أخرى');
    const iTransport = idx('بدل النقل');
    const iIban = idx('Iban');

    for (const row of nonEmpty.slice(1)) {
      const branchName = norm(row[iComplex]) || norm(row[iSchool]);
      const schoolName = norm(row[iSchool]);
      const fullNameAr = norm(row[iNameAr]);
      const fullNameEn = norm(row[iNameEn]);
      const nationality = norm(row[iNat]) || 'غير محدد';
      const nationalIdRaw = row[iNationalId];
      const nationalId = norm(nationalIdRaw);
      const nationalIdExpiry = toDate(row[iNationalIdExp]);
      const phone = norm(row[iPhone]) || '';
      const department = norm(row[iDept]) || 'غير محدد';
      const education = norm(row[iEdu]);
      const specialization = norm(row[iSpec]);
      const email = norm(row[iEmail]);
      const passportNumber = norm(row[iPassNo]);
      const passportExpiry = toDate(row[iPassExp]);
      const empCode = norm(row[iEmpCode]);
      const employeeNumber = empCode ? String(empCode) : `NID-${nationalId}`;
      const position = norm(row[iPosition]) || 'موظف';

      const basicSalary = toNumber(row[iBasic]) ?? 0;
      const housingAllowance = toNumber(row[iHousing]) ?? 0;
      const otherAllowances = toNumber(row[iOther]) ?? 0;
      const transportAllowance = toNumber(row[iTransport]) ?? 0;
      const iban = norm(row[iIban]);

      if (!branchName || !fullNameAr || !nationalId) {
        skipped++;
        continue;
      }

      let branch = branchCache.get(branchName);
      if (!branch) {
        branch = await ensureBranch(branchName);
        branchCache.set(branchName, branch);
      }

      const stageName = detectStageName(schoolName, department) || 'عام';
      const stageKey = `${branch.id}:${stageName}`;
      let stage = stageCache.get(stageKey);
      if (!stage) {
        stage = await ensureStage(branch.id, stageName);
        stageCache.set(stageKey, stage);
      }

      const existing = await prisma.employee.findUnique({ where: { nationalId } });
      const data = {
        fullNameAr,
        fullNameEn,
        nationalId,
        nationalIdExpiry,
        nationality,
        phone,
        email,
        employeeNumber,
        department,
        position,
        branchId: branch.id,
        stageId: stage.id,
        education,
        specialization,
        passportNumber,
        passportExpiry,
        schoolName,
        basicSalary,
        housingAllowance,
        transportAllowance,
        otherAllowances,
        iban,
        // Keep these fields empty for now (nullable after migration)
        dateOfBirth: null,
        gender: null,
        maritalStatus: null,
        hireDate: null,
        employmentType: null,
      };

      try {
        if (existing) {
          await prisma.employee.update({ where: { id: existing.id }, data });
          updated++;
        } else {
          await prisma.employee.create({ data });
          created++;
        }
      } catch (e) {
        console.error('Failed row:', { fullNameAr, nationalId, employeeNumber, branchName, stageName }, e.message);
        skipped++;
      }
    }
  }

  console.log('\nDone. created:', created, 'updated:', updated, 'skipped:', skipped);

  // Summary counts by branch/stage
  const byBranch = await prisma.branch.findMany({
    select: {
      id: true,
      name: true,
      stages: {
        select: {
          id: true,
          name: true,
          _count: { select: { employees: true } },
        },
        orderBy: { name: 'asc' },
      },
      _count: { select: { employees: true } },
    },
    orderBy: { name: 'asc' },
  });

  console.log('\nEmployees per branch/stage:');
  for (const b of byBranch) {
    if (b._count.employees === 0) continue;
    console.log(`- ${b.name}: ${b._count.employees}`);
    for (const s of b.stages) {
      if (s._count.employees === 0) continue;
      console.log(`   - ${s.name}: ${s._count.employees}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
