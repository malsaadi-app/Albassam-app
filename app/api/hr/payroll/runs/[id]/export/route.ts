import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

function isHR(role?: string) {
  return role === 'ADMIN' || role === 'HR_EMPLOYEE';
}

function csvEscape(value: any) {
  const s = String(value ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

// GET /api/hr/payroll/runs/[id]/export - export CSV
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
                id: true
              }
            }
          },
          orderBy: { employee: { fullNameAr: 'asc' } }
        }
      }
    });

    if (!run) return NextResponse.json({ error: 'مسير غير موجود' }, { status: 404 });

    const headers = [
      'الاسم',
      'رقم الهوية',
      'اسم البنك',
      'IBAN',
      'الراتب الأساسي',
      'بدل النقل',
      'بدل السكن',
      'بدلات أخرى',
      'الخصومات',
      'اجمالي الراتب'
    ];

    const rows = run.lines.map((l: any) => [
      l.employeeName,
      l.nationalId,
      l.bankName ?? '',
      l.iban ?? '',
      l.basicSalary,
      l.transportAllowance,
      l.housingAllowance,
      l.otherAllowances,
      l.deductions,
      l.totalSalary
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(csvEscape).join(','))
      .join('\n');

    const filename = `payroll_${run.year}_${String(run.month).padStart(2, '0')}.csv`;

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Payroll export error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء تصدير الملف' }, { status: 500 });
  }
}
