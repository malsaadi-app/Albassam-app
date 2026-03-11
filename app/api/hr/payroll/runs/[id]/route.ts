import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/session';
import prisma from '@/lib/prisma';
import { deletePayrollRun } from '@/lib/payroll';

interface Params {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/hr/payroll/runs/[id] - Get payroll run details
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const session = await getSession(await cookies());

    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const hasPermission = session.user.permissions?.includes('payroll.manage');
    if (!hasPermission) {
      return NextResponse.json({ error: 'ليس لديك صلاحية' }, { status: 403 });
    }

    const { id } = await params;

    const run = await prisma.payrollRun.findUnique({
      where: { id },
      include: {
        lines: {
          include: {
            items: true,
            employee: {
              select: {
                id: true,
                fullNameAr: true,
                employeeNumber: true
              }
            }
          },
          orderBy: {
            employeeName: 'asc'
          }
        }
      }
    });

    if (!run) {
      return NextResponse.json({ error: 'لم يتم العثور على الرواتب' }, { status: 404 });
    }

    return NextResponse.json({ run });

  } catch (error) {
    console.error('Error fetching payroll run:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب البيانات' },
      { status: 500 }
    );
  }
}

// DELETE /api/hr/payroll/runs/[id] - Delete payroll run
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await getSession(await cookies());

    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const hasPermission = session.user.permissions?.includes('payroll.manage');
    if (!hasPermission) {
      return NextResponse.json({ error: 'ليس لديك صلاحية' }, { status: 403 });
    }

    const { id } = await params;

    await deletePayrollRun(id);

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error deleting payroll run:', error);
    return NextResponse.json(
      { error: error.message || 'حدث خطأ أثناء الحذف' },
      { status: 500 }
    );
  }
}
