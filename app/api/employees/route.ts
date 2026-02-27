import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

// GET /api/employees - List employees (lightweight)
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);
    if (!session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only ADMIN + HR_EMPLOYEE can list employees
    if (!['ADMIN', 'HR_EMPLOYEE'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get('search') || '').trim();
    const branchId = (searchParams.get('branchId') || '').trim();
    const stageId = (searchParams.get('stageId') || '').trim();
    const status = (searchParams.get('status') || '').trim();

    const where: any = {};

    if (branchId) where.branchId = branchId;
    if (stageId) where.stageId = stageId;
    if (status) where.status = status;

    if (search) {
      where.OR = [
        { fullNameAr: { contains: search } },
        { fullNameEn: { contains: search } },
        { employeeNumber: { contains: search } },
        { nationalId: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } }
      ];
    }

    const employees = await prisma.employee.findMany({
      where,
      orderBy: [{ fullNameAr: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        fullNameAr: true,
        fullNameEn: true,
        email: true,
        phone: true,
        employeeNumber: true,
        status: true,
        branchId: true,
        stageId: true,
        employeeRole: true,
        branch: { select: { id: true, name: true } },
        stage: { select: { id: true, name: true } }
      }
    });

    return NextResponse.json({ employees });
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
  }
}
