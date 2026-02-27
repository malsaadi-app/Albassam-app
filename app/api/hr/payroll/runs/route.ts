import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

function isHR(role?: string) {
  return role === 'ADMIN' || role === 'HR_EMPLOYEE';
}

// GET /api/hr/payroll/runs - list payroll runs
export async function GET() {
  try {
    const session = await getSession(await cookies());
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    if (!isHR(session.user.role)) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const runs = await prisma.payrollRun.findMany({
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      include: { _count: { select: { lines: true } } }
    });

    return NextResponse.json({ runs });
  } catch (error) {
    console.error('Payroll runs GET error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب مسيرات الرواتب' }, { status: 500 });
  }
}

// POST /api/hr/payroll/runs - create a payroll run and generate lines
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(await cookies());
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    if (!isHR(session.user.role)) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const body = await request.json();
    const year = Number(body.year);
    const month = Number(body.month);
    const notes = body.notes ? String(body.notes) : null;

    if (!year || !month || month < 1 || month > 12) {
      return NextResponse.json({ error: 'بيانات غير صحيحة (السنة/الشهر)' }, { status: 400 });
    }

    // prevent duplicate
    const existing = await prisma.payrollRun.findUnique({ where: { year_month: { year, month } } });
    if (existing) {
      return NextResponse.json({ error: 'مسير هذا الشهر موجود مسبقاً' }, { status: 400 });
    }

    const employees = await prisma.employee.findMany({
      where: { status: { in: ['ACTIVE', 'ON_LEAVE'] } },
      select: {
        id: true,
        fullNameAr: true,
        nationalId: true,
        bankName: true,
        iban: true,
        basicSalary: true,
        transportAllowance: true,
        housingAllowance: true,
        otherAllowances: true,
      }
    });

    const run = await prisma.payrollRun.create({
      data: {
        year,
        month,
        notes,
        createdBy: session.user.username,
        lines: {
          create: employees.map((e) => {
            const deductions = 0;
            const totalSalary = e.basicSalary + e.transportAllowance + e.housingAllowance + e.otherAllowances - deductions;
            return {
              employeeId: e.id,
              employeeName: e.fullNameAr,
              nationalId: e.nationalId,
              bankName: e.bankName,
              iban: e.iban,
              basicSalary: e.basicSalary,
              transportAllowance: e.transportAllowance,
              housingAllowance: e.housingAllowance,
              otherAllowances: e.otherAllowances,
              deductions,
              totalSalary,
            };
          })
        }
      },
      include: { lines: true }
    });

    return NextResponse.json({ run }, { status: 201 });
  } catch (error) {
    console.error('Payroll runs POST error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء إنشاء مسير الرواتب' }, { status: 500 });
  }
}
