import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/session';
import { getEmployeePayrollHistory } from '@/lib/payroll';
import prisma from '@/lib/prisma';

// GET /api/profile/payslips - Get employee's payslip history
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(await cookies());

    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    // Get employee record for current user
    const employee = await prisma.employee.findUnique({
      where: { userId: session.user.id }
    });

    if (!employee) {
      return NextResponse.json({ error: 'لم يتم العثور على سجل الموظف' }, { status: 404 });
    }

    const history = await getEmployeePayrollHistory(employee.id, 24); // Last 24 months

    return NextResponse.json({ payslips: history });

  } catch (error) {
    console.error('Error fetching payslips:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب البيانات' },
      { status: 500 }
    );
  }
}
