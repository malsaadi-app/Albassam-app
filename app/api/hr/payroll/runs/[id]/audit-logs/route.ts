import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

// GET /api/hr/payroll/runs/[id]/audit-logs
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(await cookies());
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    const { id: payrollRunId } = await params;

    const logs = await prisma.deductionAuditLog.findMany({
      where: { payrollRunId },
      orderBy: { adjustedAt: 'desc' },
      include: {
        employee: {
          select: {
            fullNameAr: true,
            employeeNumber: true
          }
        }
      }
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Get audit logs error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
