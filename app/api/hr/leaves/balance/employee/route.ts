import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';


// GET /api/hr/leaves/balance/employee?employeeId=xxx - رصيد إجازات موظف
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(await cookies());

    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');

    if (!employeeId) {
      return NextResponse.json({ error: 'employeeId مطلوب' }, { status: 400 });
    }

    const balance = await prisma.leaveBalance.findUnique({
      where: { employeeId },
      include: {
        employee: {
          select: {
            fullNameAr: true,
            employeeNumber: true,
            department: true
          }
        }
      }
    });

    if (!balance) {
      return NextResponse.json({ error: 'رصيد الإجازات غير موجود' }, { status: 404 });
    }

    // Get leave history
    const leaveHistory = await prisma.leave.findMany({
      where: {
        employeeId,
        status: 'APPROVED'
      },
      orderBy: { startDate: 'desc' },
      take: 10
    });

    return NextResponse.json({
      balance,
      leaveHistory
    });
  } catch (error) {
    console.error('Error fetching leave balance:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب البيانات' },
      { status: 500 }
    );
  }
}
