import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

function safeTrim(v: unknown) {
  return typeof v === 'string' ? v.trim() : '';
}

async function generateUniqueEmployeeNumber() {
  // Generates TMP-YYYYMMDD-XXXX
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');

  for (let i = 0; i < 10; i++) {
    const rand = Math.floor(Math.random() * 9000 + 1000);
    const candidate = `TMP-${y}${m}${d}-${rand}`;
    const exists = await prisma.employee.findUnique({
      where: { employeeNumber: candidate },
      select: { id: true }
    });
    if (!exists) return candidate;
  }
  // Fallback (very unlikely)
  return `TMP-${Date.now()}`;
}

async function generateUniqueNationalId() {
  // Placeholder national ID (10+ chars) if not provided
  for (let i = 0; i < 10; i++) {
    const candidate = `TEMP-${Math.floor(Math.random() * 1e12)}`;
    const exists = await prisma.employee.findUnique({
      where: { nationalId: candidate },
      select: { id: true }
    });
    if (!exists) return candidate;
  }
  return `TEMP-${Date.now()}`;
}

// POST /api/branches/[id]/employees - Assign an employee to a branch (or create + assign)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);
    if (!session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin + HR can manage assignments
    if (session.user.role !== 'ADMIN' && session.user.role !== 'HR_EMPLOYEE') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: branchId } = await params;
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      select: {
        id: true,
        latitude: true,
        longitude: true,
        geofenceRadius: true,
        workStartTime: true,
        workEndTime: true
      }
    });

    if (!branch) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }

    const body = await request.json();

    const employeeId = safeTrim(body.employeeId);
    const stageId = safeTrim(body.stageId);
    const employeeRole = safeTrim(body.employeeRole);
    const status = safeTrim(body.status);

    if (stageId) {
      const stage = await prisma.stage.findUnique({
        where: { id: stageId },
        select: { id: true, branchId: true }
      });
      if (!stage) {
        return NextResponse.json({ error: 'Stage not found' }, { status: 400 });
      }
      if (stage.branchId !== branchId) {
        return NextResponse.json(
          { error: 'Stage does not belong to this branch' },
          { status: 400 }
        );
      }
    }

    // Assign existing employee
    if (employeeId) {
      const employee = await prisma.employee.update({
        where: { id: employeeId },
        data: {
          branchId,
          stageId: stageId || null,
          ...(employeeRole ? { employeeRole: employeeRole as any } : {}),
          ...(status ? { status: status as any } : {}),
          updatedAt: new Date()
        },
        select: {
          id: true,
          fullNameAr: true,
          email: true,
          phone: true,
          branchId: true,
          stageId: true,
          employeeRole: true,
          status: true
        }
      });

      // If assigning as stage manager, also set stage.managerId
      if (stageId && employeeRole === 'STAGE_MANAGER') {
        await prisma.stage.update({
          where: { id: stageId },
          data: { managerId: employee.id, updatedAt: new Date() }
        });
      }

      return NextResponse.json({ employee, message: 'Employee assigned successfully' }, { status: 200 });
    }

    // Create new employee (quick-create) + assign
    const fullNameAr = safeTrim(body.fullNameAr);
    const email = safeTrim(body.email);
    const phone = safeTrim(body.phone);
    const providedNationalId = safeTrim(body.nationalId);

    if (!fullNameAr) {
      return NextResponse.json({ error: 'fullNameAr is required' }, { status: 400 });
    }
    if (!email) {
      return NextResponse.json({ error: 'email is required' }, { status: 400 });
    }

    const nationalId = providedNationalId || (await generateUniqueNationalId());
    const employeeNumber = await generateUniqueEmployeeNumber();

    const employee = await prisma.employee.create({
      data: {
        fullNameAr,
        fullNameEn: null,
        nationalId,
        nationality: body.nationality ? String(body.nationality) : 'غير محدد',
        dateOfBirth: new Date(body.dateOfBirth || '1990-01-01'),
        gender: (body.gender || 'MALE') as any,
        maritalStatus: (body.maritalStatus || 'SINGLE') as any,
        phone: phone || '0500000000',
        email: email || null,
        address: null,
        city: null,
        employeeNumber,
        department: body.department ? String(body.department) : 'غير محدد',
        position: body.position ? String(body.position) : 'غير محدد',
        directManager: null,
        hireDate: new Date(body.hireDate || new Date()),
        employmentType: (body.employmentType || 'PERMANENT') as any,
        contractEndDate: null,
        status: (status || 'ACTIVE') as any,
        basicSalary: typeof body.basicSalary === 'number' ? body.basicSalary : 0,
        housingAllowance: 0,
        transportAllowance: 0,
        otherAllowances: 0,
        bankName: null,
        bankAccountNumber: null,
        iban: null,
        education: null,
        certifications: null,
        photoUrl: null,

        branchId,
        stageId: stageId || null,
        employeeRole: (employeeRole || 'EMPLOYEE') as any,
        updatedAt: new Date()
      },
      select: {
        id: true,
        fullNameAr: true,
        email: true,
        phone: true,
        employeeNumber: true,
        branchId: true,
        stageId: true,
        employeeRole: true,
        status: true
      }
    });

    // If creating as stage manager, set stage.managerId
    if (stageId && employeeRole === 'STAGE_MANAGER') {
      await prisma.stage.update({
        where: { id: stageId },
        data: { managerId: employee.id, updatedAt: new Date() }
      });
    }

    return NextResponse.json({ employee, message: 'Employee created and assigned successfully' }, { status: 201 });
  } catch (error: any) {
    console.error('Error assigning employee to branch:', error);
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Unique constraint failed (nationalId or employeeNumber already exists)' },
        { status: 400 }
      );
    }
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to assign employee' }, { status: 500 });
  }
}
