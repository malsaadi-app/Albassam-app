import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

function isHR(role?: string) {
  return role === 'ADMIN' || role === 'HR_EMPLOYEE';
}

// GET /api/hr/payroll/runs/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(await cookies());
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    if (!isHR(session.user.role)) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const { id } = await params;

    const run = await prisma.payrollRun.findUnique({
      where: { id },
      include: {
        lines: {
          include: {
            employee: {
              select: {
                employeeNumber: true,
                department: true,
              }
            }
          },
          orderBy: { employee: { employeeNumber: 'asc' } }
        }
      }
    });

    if (!run) return NextResponse.json({ error: 'مسير غير موجود' }, { status: 404 });

    return NextResponse.json({ run });
  } catch (error) {
    console.error('Payroll run GET error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب المسير' }, { status: 500 });
  }
}

// PATCH /api/hr/payroll/runs/[id] - lock/unlock or update notes
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(await cookies());
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    if (!isHR(session.user.role)) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const { id } = await params;
    const body = await request.json();

    const patch: any = {};
    if (typeof body.notes === 'string') patch.notes = body.notes;
    if (body.status && ['DRAFT', 'LOCKED'].includes(body.status)) patch.status = body.status;

    const updated = await prisma.payrollRun.update({ where: { id }, data: patch });
    return NextResponse.json({ run: updated });
  } catch (error) {
    console.error('Payroll run PATCH error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء تحديث المسير' }, { status: 500 });
  }
}
