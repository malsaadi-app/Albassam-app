import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

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

    const attendanceRequest = await prisma.attendanceRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true
          }
        },
        reviewer: {
          select: {
            id: true,
            username: true,
            displayName: true
          }
        }
      }
    });

    if (!attendanceRequest) {
      return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 });
    }

    // Users can only see their own requests, admins/HR can see all
    if (
      session.user.role !== 'ADMIN' &&
      session.user.role !== 'HR_EMPLOYEE' &&
      attendanceRequest.userId !== session.user.id
    ) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    return NextResponse.json(attendanceRequest);
  } catch (error) {
    console.error('Error fetching attendance request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch request' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(await cookies());
    
    if (!session.user || (session.user.role !== 'ADMIN' && session.user.role !== 'HR_EMPLOYEE')) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, reviewComment } = body;

    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: 'حالة غير صحيحة' }, { status: 400 });
    }

    const attendanceRequest = await prisma.attendanceRequest.findUnique({
      where: { id }
    });

    if (!attendanceRequest) {
      return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 });
    }

    if (attendanceRequest.status !== 'PENDING') {
      return NextResponse.json({ error: 'الطلب تمت مراجعته مسبقاً' }, { status: 400 });
    }

    // Update request status
    const updatedRequest = await prisma.attendanceRequest.update({
      where: { id },
      data: {
        status,
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        reviewComment: reviewComment || null
      },
      include: {
        user: true,
        reviewer: true
      }
    });

    // If approved and type is EXCUSE, update the attendance record
    if (status === 'APPROVED' && updatedRequest.type === 'EXCUSE') {
      const requestDate = new Date(updatedRequest.requestDate);
      requestDate.setHours(0, 0, 0, 0);

      const existingRecord = await prisma.attendanceRecord.findFirst({
        where: {
          userId: updatedRequest.userId,
          date: requestDate
        }
      });

      if (existingRecord) {
        await prisma.attendanceRecord.update({
          where: { id: existingRecord.id },
          data: {
            status: 'EXCUSED',
            notes: `تم تبرير الغياب/التأخير - ${updatedRequest.reason}`
          }
        });
      }
    }

    // TODO: Send notification to user

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error('Error updating attendance request:', error);
    return NextResponse.json(
      { error: 'Failed to update request' },
      { status: 500 }
    );
  }
}
