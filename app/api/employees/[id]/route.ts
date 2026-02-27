import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

// GET /api/employees/[id] - Get employee (lightweight)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);
    if (!session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const employee = await prisma.employee.findUnique({
      where: { id },
      select: {
        id: true,
        fullNameAr: true,
        fullNameEn: true,
        // nationalId intentionally omitted (PII)
        phone: true,
        email: true,
        status: true,
        employeeRole: true,
        branchId: true,
        stageId: true,
        branch: { select: { id: true, name: true } },
        stage: { select: { id: true, name: true, branchId: true } },
        createdAt: true,
        updatedAt: true
      }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    return NextResponse.json(employee);
  } catch (error) {
    console.error('Error fetching employee:', error);
    return NextResponse.json({ error: 'Failed to fetch employee' }, { status: 500 });
  }
}

// PUT /api/employees/[id] - Update employee (lightweight)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);
    if (!session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin + HR can update employees
    if (session.user.role !== 'ADMIN' && session.user.role !== 'HR_EMPLOYEE') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    const {
      fullNameAr,
      fullNameEn,
      email,
      phone,
      status,
      employeeRole,
      branchId,
      stageId
    } = body;

    if (stageId) {
      const stage = await prisma.stage.findUnique({
        where: { id: stageId },
        select: { id: true, branchId: true }
      });
      if (!stage) {
        return NextResponse.json({ error: 'Stage not found' }, { status: 400 });
      }
      if (branchId && stage.branchId !== branchId) {
        return NextResponse.json(
          { error: 'Stage does not belong to the specified branch' },
          { status: 400 }
        );
      }
    }

    const employee = await prisma.employee.update({
      where: { id },
      data: {
        ...(fullNameAr !== undefined && { fullNameAr }),
        ...(fullNameEn !== undefined && { fullNameEn }),
        ...(email !== undefined && { email: email || null }),
        ...(phone !== undefined && { phone }),
        ...(status !== undefined && { status }),
        ...(employeeRole !== undefined && { employeeRole }),
        ...(branchId !== undefined && { branchId: branchId || null }),
        ...(stageId !== undefined && { stageId: stageId || null }),
        updatedAt: new Date()
      },
      select: {
        id: true,
        fullNameAr: true,
        email: true,
        phone: true,
        status: true,
        employeeRole: true,
        branchId: true,
        stageId: true
      }
    });

    return NextResponse.json(employee);
  } catch (error: any) {
    console.error('Error updating employee:', error);
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 });
  }
}
