import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/session';
import prisma from '@/lib/prisma';

interface Params {
  params: Promise<{
    id: string;
  }>;
}

// GET /api/profile/payslips/[id] - Get specific payslip details
export async function GET(request: NextRequest, { params }: Params) {
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

    const { id } = await params;

    const payslip = await prisma.payrollLine.findFirst({
      where: {
        id,
        employeeId: employee.id // Security: only own payslips
      },
      include: {
        items: true,
        payrollRun: true,
        employee: {
          include: {
            branch: true,
            stage: true
          }
        }
      }
    });

    if (!payslip) {
      return NextResponse.json({ error: 'لم يتم العثور على كشف الراتب' }, { status: 404 });
    }

    return NextResponse.json({ payslip });

  } catch (error) {
    console.error('Error fetching payslip:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب البيانات' },
      { status: 500 }
    );
  }
}
