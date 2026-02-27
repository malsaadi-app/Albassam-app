import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

function isHR(role?: string) {
  return role === 'ADMIN' || role === 'HR_EMPLOYEE';
}

// PATCH /api/hr/payroll/runs/[id]/lines - update deductions (and recompute totals)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(await cookies());
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    if (!isHR(session.user.role)) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const { id: payrollRunId } = await params;
    const body = await request.json();
    const lineId = String(body.lineId || '');
    const deductions = Number(body.deductions);

    if (!lineId || Number.isNaN(deductions) || deductions < 0) {
      return NextResponse.json({ error: 'بيانات غير صحيحة' }, { status: 400 });
    }

    const run = await prisma.payrollRun.findUnique({ where: { id: payrollRunId } });
    if (!run) return NextResponse.json({ error: 'مسير غير موجود' }, { status: 404 });
    if (run.status === 'LOCKED') {
      return NextResponse.json({ error: 'المسير مقفل ولا يمكن تعديله' }, { status: 400 });
    }

    const line = await prisma.payrollLine.findUnique({ where: { id: lineId } });
    if (!line || line.payrollRunId !== payrollRunId) {
      return NextResponse.json({ error: 'سطر غير موجود' }, { status: 404 });
    }

    const totalSalary = line.basicSalary + line.transportAllowance + line.housingAllowance + line.otherAllowances - deductions;

    const updated = await prisma.payrollLine.update({
      where: { id: lineId },
      data: { deductions, totalSalary }
    });

    return NextResponse.json({ line: updated });
  } catch (error) {
    console.error('Payroll line PATCH error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء تحديث الخصومات' }, { status: 500 });
  }
}
