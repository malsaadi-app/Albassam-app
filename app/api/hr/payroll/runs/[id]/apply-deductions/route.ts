import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

function isHR(role?: string) {
  return role === 'ADMIN' || role === 'HR_EMPLOYEE';
}

// POST /api/hr/payroll/runs/[id]/apply-deductions
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(await cookies());
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    if (!isHR(session.user.role)) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const { id: payrollRunId } = await params;
    const body = await request.json();
    const deductions = body.deductions as Array<{ employeeId: string; amount: number }>;

    if (!Array.isArray(deductions) || deductions.length === 0) {
      return NextResponse.json({ error: 'بيانات غير صحيحة' }, { status: 400 });
    }

    // Verify run exists and is DRAFT
    const run = await prisma.payrollRun.findUnique({ where: { id: payrollRunId } });
    if (!run) return NextResponse.json({ error: 'مسير غير موجود' }, { status: 404 });
    if (run.status === 'LOCKED') {
      return NextResponse.json({ error: 'المسير مقفل ولا يمكن تعديله' }, { status: 400 });
    }

    // Apply deductions to each employee's payroll line
    const updates = [];
    for (const { employeeId, amount } of deductions) {
      // Find the payroll line
      const line = await prisma.payrollLine.findFirst({
        where: {
          payrollRunId,
          employeeId
        }
      });

      if (!line) {
        console.warn(`PayrollLine not found for employee ${employeeId}`);
        continue;
      }

      // Add the deduction amount (accumulate if there are existing deductions)
      const newDeductions = line.deductions + amount;
      const newTotalSalary = line.basicSalary + line.transportAllowance + line.housingAllowance + 
                             line.otherAllowances + line.additions - newDeductions;

      const updated = await prisma.payrollLine.update({
        where: { id: line.id },
        data: {
          deductions: newDeductions,
          totalSalary: newTotalSalary
        }
      });

      updates.push(updated);
    }

    return NextResponse.json({ 
      success: true, 
      updatedCount: updates.length,
      message: `تم تطبيق الخصومات على ${updates.length} موظف`
    });
  } catch (error) {
    console.error('Apply deductions error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء تطبيق الخصومات' }, { status: 500 });
  }
}
