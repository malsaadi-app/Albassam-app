import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { getSession } from '@/lib/session';

const leaveSchema = z.object({
  // employeeId must be derived from the current session (prevent spoofing)
  type: z.enum(['ANNUAL', 'SICK', 'CASUAL', 'MATERNITY', 'HAJJ', 'UNPAID']),
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string().optional(),
  attachments: z.string().optional()
});

// Calculate days between two dates (excluding weekends)
function calculateWorkingDays(start: Date, end: Date): number {
  let count = 0;
  const current = new Date(start);
  
  while (current <= end) {
    const dayOfWeek = current.getDay();
    // Skip Friday (5) and Saturday (6) - weekend in Saudi Arabia
    if (dayOfWeek !== 5 && dayOfWeek !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}

// GET /api/hr/leaves - قائمة الإجازات
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(await cookies());

    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = {};

    if (employeeId) {
      where.employeeId = employeeId;
    }

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    const [leaves, total] = await Promise.all([
      prisma.leave.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          employee: {
            select: {
              id: true,
              fullNameAr: true,
              employeeNumber: true,
              department: true,
              position: true
            }
          }
        }
      }),
      prisma.leave.count({ where })
    ]);

    return NextResponse.json({
      leaves,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching leaves:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب البيانات' },
      { status: 500 }
    );
  }
}

// POST /api/hr/leaves - طلب إجازة جديد
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(await cookies());

    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = leaveSchema.parse(body);

    // Resolve current employee from session (prevents employeeId spoofing)
    const employee = await prisma.employee.findFirst({
      where: { userId: session.user.id }
    });

    if (!employee) {
      return NextResponse.json(
        { error: 'لا يوجد سجل موظف لهذا المستخدم' },
        { status: 404 }
      );
    }

    const startDate = new Date(validatedData.startDate);
    const endDate = new Date(validatedData.endDate);

    // Validate dates
    if (startDate > endDate) {
      return NextResponse.json(
        { error: 'تاريخ البداية يجب أن يكون قبل تاريخ النهاية' },
        { status: 400 }
      );
    }

    // Calculate working days
    const days = calculateWorkingDays(startDate, endDate);

    // Check leave balance for annual and casual leaves
    if (validatedData.type === 'ANNUAL' || validatedData.type === 'CASUAL') {
      const balance = await prisma.leaveBalance.findFirst({
        where: { employeeId: employee.id, year: new Date().getFullYear() }
      });

      if (balance) {
        if (validatedData.type === 'ANNUAL' && balance.annualRemaining < days) {
          return NextResponse.json(
            { error: `رصيد الإجازات السنوية غير كافي. المتبقي: ${balance.annualRemaining} يوم` },
            { status: 400 }
          );
        }
        if (validatedData.type === 'CASUAL' && balance.casualRemaining < days) {
          return NextResponse.json(
            { error: `رصيد الإجازات العارضة غير كافي. المتبقي: ${balance.casualRemaining} يوم` },
            { status: 400 }
          );
        }
      }
    }

    const leave = await prisma.leave.create({
      data: {
        ...validatedData,
        employeeId: employee.id,
        startDate,
        endDate,
        days,
        status: 'PENDING'
      },
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

    return NextResponse.json(leave, { status: 201 });
  } catch (error) {
    console.error('Error creating leave:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'بيانات غير صحيحة', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء الإجازة' },
      { status: 500 }
    );
  }
}
