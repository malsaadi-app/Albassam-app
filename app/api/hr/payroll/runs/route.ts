import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/session';
import prisma from '@/lib/prisma';
import { generatePayrollRun } from '@/lib/payroll';

// GET /api/hr/payroll/runs - List all payroll runs
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(await cookies());

    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    // Check permission
    const hasPermission = session.user.permissions?.includes('payroll.manage');
    if (!hasPermission) {
      return NextResponse.json({ error: 'ليس لديك صلاحية إدارة الرواتب' }, { status: 403 });
    }

    const runs = await prisma.payrollRun.findMany({
      include: {
        _count: {
          select: { lines: true }
        },
        lines: {
          select: {
            totalSalary: true
          }
        }
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' }
      ]
    });

    const formattedRuns = runs.map(run => ({
      id: run.id,
      year: run.year,
      month: run.month,
      status: run.status,
      linesCount: run._count.lines,
      totalAmount: run.lines.reduce((sum, line) => sum + line.totalSalary, 0),
      createdAt: run.createdAt.toISOString()
    }));

    return NextResponse.json({ runs: formattedRuns });

  } catch (error) {
    console.error('Error fetching payroll runs:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب البيانات' },
      { status: 500 }
    );
  }
}

// POST /api/hr/payroll/runs - Create new payroll run
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(await cookies());

    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    // Check permission
    const hasPermission = session.user.permissions?.includes('payroll.manage');
    if (!hasPermission) {
      return NextResponse.json({ error: 'ليس لديك صلاحية إدارة الرواتب' }, { status: 403 });
    }

    const body = await request.json();
    const { year, month } = body;

    if (!year || !month) {
      return NextResponse.json({ error: 'السنة والشهر مطلوبان' }, { status: 400 });
    }

    const result = await generatePayrollRun(year, month, session.user.id);

    return NextResponse.json({
      success: true,
      runId: result.runId,
      linesCount: result.linesCount
    });

  } catch (error: any) {
    console.error('Error generating payroll run:', error);
    return NextResponse.json(
      { error: error.message || 'حدث خطأ أثناء إنشاء الرواتب' },
      { status: 500 }
    );
  }
}
