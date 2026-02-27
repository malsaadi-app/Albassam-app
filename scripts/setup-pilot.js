/* eslint-disable no-console */

const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const PASSWORD = process.env.PILOT_DEFAULT_PASSWORD || 'Test1234';

function dmsToDecimal(dms, hemi) {
  // dms: [deg, min, sec]
  const [deg, min, sec] = dms;
  let val = deg + min / 60 + sec / 3600;
  if (hemi === 'S' || hemi === 'W') val *= -1;
  return Number(val.toFixed(6));
}

async function upsertUser({ username, displayName, role }) {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    // Keep existing passwordHash unless PILOT_FORCE_PASSWORD=1
    const data = { displayName, role };
    if (process.env.PILOT_FORCE_PASSWORD === '1') data.passwordHash = passwordHash;
    return prisma.user.update({ where: { username }, data });
  }

  return prisma.user.create({
    data: {
      username,
      displayName,
      role,
      passwordHash,
    },
  });
}

async function upsertEmployee({ userId, username, fullNameAr, branchId, employeeRole, morningGraceMinutes }) {
  const existing = await prisma.employee.findFirst({ where: { userId } });
  if (existing) {
    return prisma.employee.update({
      where: { id: existing.id },
      data: {
        branchId,
        employeeRole,
        morningGraceMinutes: morningGraceMinutes ?? null,
      },
    });
  }

  // Minimal valid employee payload (dummy values for pilot)
  // NOTE: update with real employee data before production.
  const now = new Date();
  const dob = new Date('1995-01-01T00:00:00.000Z');

  // Generate unique ids
  const suffix = Math.floor(Math.random() * 900000 + 100000);
  const nationalId = `9${suffix}${suffix}`.slice(0, 10);
  const employeeNumber = `P${suffix}`;

  // Gender heuristic
  const gender = ['hinds', 'asma'].includes(username.toLowerCase()) ? 'FEMALE' : 'MALE';

  return prisma.employee.create({
    data: {
      fullNameAr,
      fullNameEn: null,
      nationalId,
      nationality: 'SA',
      dateOfBirth: dob,
      gender,
      maritalStatus: 'SINGLE',
      phone: `05${suffix}`.slice(0, 10),
      email: null,
      address: null,
      city: null,
      employeeNumber,
      department: 'Pilot',
      position: 'Pilot',
      directManager: null,
      hireDate: now,
      employmentType: 'PERMANENT',
      contractEndDate: null,
      status: 'ACTIVE',
      basicSalary: 5000,
      housingAllowance: 0,
      transportAllowance: 0,
      otherAllowances: 0,
      bankName: null,
      bankAccountNumber: null,
      iban: null,
      education: null,
      specialization: null,
      certifications: null,
      photoUrl: null,
      userId,
      branchId,
      stageId: null,
      employeeRole,
      morningGraceMinutes: morningGraceMinutes ?? null,
    },
  });
}

async function main() {
  console.log('Setting up pilot…');

  // 1) Update branches with pilot GPS + radius + schedules
  const branches = await prisma.branch.findMany({ select: { id: true, name: true } });
  const byName = Object.fromEntries(branches.map((b) => [b.name, b.id]));

  const pilotBranches = [
    {
      name: 'شركة الصفر التجارية',
      latitude: 26.367333,
      longitude: 50.125361,
      geofenceRadius: 50,
      workStartTime: '07:00',
      workEndTime: '16:00',
      workDays: '0,1,2,3,4',
    },
    {
      name: 'مجمع البسام الأهلية بنين',
      latitude: 26.474528,
      longitude: 50.127861,
      geofenceRadius: 50,
      workStartTime: '07:00',
      workEndTime: '14:00',
      workDays: '0,1,2,3,4',
    },
    {
      name: 'مجمع البسام الأهلية بنات',
      latitude: 26.463694,
      longitude: 50.117833,
      geofenceRadius: 50,
      workStartTime: '07:00',
      workEndTime: '14:00',
      workDays: '0,1,2,3,4',
    },
  ];

  for (const b of pilotBranches) {
    const id = byName[b.name];
    if (!id) throw new Error(`Branch not found: ${b.name}`);
    await prisma.branch.update({ where: { id }, data: b });
  }

  // 2) Attendance global settings (fallback)
  const settings = await prisma.attendanceSettings.findFirst();
  if (settings) {
    await prisma.attendanceSettings.update({
      where: { id: settings.id },
      data: {
        lateThresholdMinutes: 15,
        workStartTime: '07:00',
        workEndTime: '14:00',
        enableGpsTracking: true,
        enableGeofencing: true,
        maxDistanceMeters: 50,
      },
    });
  } else {
    await prisma.attendanceSettings.create({
      data: {
        lateThresholdMinutes: 15,
        workHoursPerDay: 8,
        workingDaysPerMonth: 22,
        workStartTime: '07:00',
        workEndTime: '14:00',
        requireCheckOut: true,
        enableGpsTracking: true,
        enableGeofencing: true,
        officeLatitude: null,
        officeLongitude: null,
        maxDistanceMeters: 50,
      },
    });
  }

  // 3) Users + employees
  const users = [
    // HR manager
    { username: 'Mohammedhr', displayName: 'محمد - مدير الموارد البشرية', role: 'HR_EMPLOYEE', branch: null, employeeRole: 'ADMIN' },

    // Branch managers
    { username: 'mohammedtj', displayName: 'محمد - مسؤول فرع الصفر', role: 'USER', branch: 'شركة الصفر التجارية', employeeRole: 'BRANCH_MANAGER' },
    { username: 'khalidj', displayName: 'خالد - مسؤول فرع بنين', role: 'USER', branch: 'مجمع البسام الأهلية بنين', employeeRole: 'BRANCH_MANAGER' },
    { username: 'hinds', displayName: 'هند - مسؤولة فرع بنات', role: 'USER', branch: 'مجمع البسام الأهلية بنات', employeeRole: 'BRANCH_MANAGER' },

    // Procurement
    { username: 'abdullahsh', displayName: 'عبدالله - مسؤول مشتريات', role: 'USER', branch: 'شركة الصفر التجارية', employeeRole: 'EMPLOYEE' },
    { username: 'mq', displayName: 'مدير المشتريات', role: 'USER', branch: 'شركة الصفر التجارية', employeeRole: 'SUPERVISOR' },

    // Grace overrides
    { username: 'abdulrahman', displayName: 'عبدالرحمن', role: 'USER', branch: 'شركة الصفر التجارية', employeeRole: 'EMPLOYEE', morningGraceMinutes: 60 },
    { username: 'ibrahim', displayName: 'إبراهيم', role: 'USER', branch: 'مجمع البسام الأهلية بنين', employeeRole: 'EMPLOYEE', morningGraceMinutes: 60 },
    { username: 'asma', displayName: 'أسماء', role: 'USER', branch: 'مجمع البسام الأهلية بنات', employeeRole: 'EMPLOYEE', morningGraceMinutes: 60 },

    // Regular employees
    { username: 'User1zero', displayName: 'موظف 1 - الصفر', role: 'USER', branch: 'شركة الصفر التجارية', employeeRole: 'EMPLOYEE' },
    { username: 'User2zero', displayName: 'موظف 2 - الصفر', role: 'USER', branch: 'شركة الصفر التجارية', employeeRole: 'EMPLOYEE' },

    { username: 'User1boys', displayName: 'موظف 1 - بنين', role: 'USER', branch: 'مجمع البسام الأهلية بنين', employeeRole: 'EMPLOYEE' },
    { username: 'User2boys', displayName: 'موظف 2 - بنين', role: 'USER', branch: 'مجمع البسام الأهلية بنين', employeeRole: 'EMPLOYEE' },

    { username: 'User1girls', displayName: 'موظف 1 - بنات', role: 'USER', branch: 'مجمع البسام الأهلية بنات', employeeRole: 'EMPLOYEE' },
    { username: 'User2girls', displayName: 'موظف 2 - بنات', role: 'USER', branch: 'مجمع البسام الأهلية بنات', employeeRole: 'EMPLOYEE' },
  ];

  const created = [];
  for (const u of users) {
    const user = await upsertUser({ username: u.username, displayName: u.displayName, role: u.role });

    // Some admin-like accounts may not be tied to a branch employee record
    if (u.branch) {
      const branchId = byName[u.branch];
      await upsertEmployee({
        userId: user.id,
        username: u.username,
        fullNameAr: u.displayName,
        branchId,
        employeeRole: u.employeeRole,
        morningGraceMinutes: u.morningGraceMinutes,
      });
    }

    created.push({ username: u.username, role: u.role, displayName: u.displayName, branch: u.branch || null, grace: u.morningGraceMinutes ?? null });
  }

  console.log('Pilot users ensured. Default password:', PASSWORD);
  console.table(created);

  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
