import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

function isHR(role?: string) {
  return role === 'ADMIN' || role === 'HR_EMPLOYEE';
}

// POST /api/hr/payroll/runs/[id]/adjust-deduction
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
    const { 
      employeeId, 
      originalAmount, 
      adjustedAmount, 
      ignoredDetails, 
      adjustmentReason 
    } = body;

    if (!employeeId || typeof originalAmount !== 'number' || typeof adjustedAmount !== 'number') {
      return NextResponse.json({ error: 'بيانات غير صحيحة' }, { status: 400 });
    }

    // Verify run exists
    const run = await prisma.payrollRun.findUnique({ where: { id: payrollRunId } });
    if (!run) return NextResponse.json({ error: 'مسير غير موجود' }, { status: 404 });

    // Get employee
    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) return NextResponse.json({ error: 'موظف غير موجود' }, { status: 404 });

    // Create audit log
    const auditLog = await prisma.deductionAuditLog.create({
      data: {
        payrollRunId,
        employeeId,
        employeeName: employee.fullNameAr,
        originalAmount,
        adjustedAmount,
        adjustmentReason,
        ignoredDetails: ignoredDetails ? JSON.stringify(ignoredDetails) : null,
        adjustedBy: session.user.id
      }
    });

    return NextResponse.json({ 
      success: true, 
      auditLog,
      message: 'تم حفظ التعديل بنجاح'
    });
  } catch (error) {
    console.error('Adjust deduction error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء حفظ التعديل' }, { status: 500 });
  }
}
