import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { getSession } from '@/lib/session';

const reviewLeaveSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'CANCELLED']),
  reviewNotes: z.string().optional()
});

// PATCH /api/hr/leaves/[id] - موافقة/رفض إجازة
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(await cookies());

    if (!session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = reviewLeaveSchema.parse(body);

    const leave = await prisma.leave.findUnique({
      where: { id },
      include: { employee: true }
    });

    if (!leave) {
      return NextResponse.json({ error: 'الإجازة غير موجودة' }, { status: 404 });
    }

    // Update leave status
    const updatedLeave = await prisma.leave.update({
      where: { id },
      data: {
        status: validatedData.status,
        reviewedBy: session.user.displayName,
        reviewedAt: new Date(),
        reviewNotes: validatedData.reviewNotes
      }
    });

    // If approved, update leave balance
    if (validatedData.status === 'APPROVED') {
      const balance = await prisma.leaveBalance.findUnique({
        where: { employeeId: leave.employeeId }
      });

      if (balance) {
        const updateData: any = {};

        if (leave.type === 'ANNUAL') {
          updateData.annualUsed = balance.annualUsed + leave.days;
          updateData.annualRemaining = balance.annualRemaining - leave.days;
        } else if (leave.type === 'CASUAL') {
          updateData.casualUsed = balance.casualUsed + leave.days;
          updateData.casualRemaining = balance.casualRemaining - leave.days;
        }

        if (Object.keys(updateData).length > 0) {
          await prisma.leaveBalance.update({
            where: { employeeId: leave.employeeId },
            data: updateData
          });
        }
      }

      // Update employee status if leave is starting now or in the past
      const now = new Date();
      if (leave.startDate <= now && leave.endDate >= now) {
        await prisma.employee.update({
          where: { id: leave.employeeId },
          data: { status: 'ON_LEAVE' }
        });
      }
    }

    return NextResponse.json(updatedLeave);
  } catch (error) {
    console.error('Error reviewing leave:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'بيانات غير صحيحة', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'حدث خطأ أثناء المراجعة' },
      { status: 500 }
    );
  }
}

// GET /api/hr/leaves/[id] - تفاصيل إجازة
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(await cookies());

    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { id } = await params;

    const leave = await prisma.leave.findUnique({
      where: { id },
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
    });

    if (!leave) {
      return NextResponse.json({ error: 'الإجازة غير موجودة' }, { status: 404 });
    }

    return NextResponse.json(leave);
  } catch (error) {
    console.error('Error fetching leave:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب البيانات' },
      { status: 500 }
    );
  }
}
