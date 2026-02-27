import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(await cookies());
    
    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    const where: any = {};

    // Admins and HR can see all requests, users see only their own
    if (session.user.role !== 'ADMIN' && session.user.role !== 'HR_EMPLOYEE') {
      where.userId = session.user.id;
    }

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    const requests = await prisma.attendanceRequest.findMany({
      where,
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error fetching attendance requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch requests' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(await cookies());
    
    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      type, 
      requestDate, 
      reason, 
      attachment,
      // CORRECTION fields
      attendanceRecordId,
      originalCheckIn,
      originalCheckOut,
      requestedCheckIn,
      requestedCheckOut,
      correctionType
    } = body;

    if (!type || !requestDate || !reason) {
      return NextResponse.json(
        { error: 'البيانات المطلوبة ناقصة' },
        { status: 400 }
      );
    }

    const data: any = {
      userId: session.user.id,
      type,
      requestDate: new Date(requestDate),
      reason,
      attachment: attachment || null,
      status: 'PENDING'
    };

    // Add CORRECTION-specific fields if type is CORRECTION
    if (type === 'CORRECTION') {
      data.attendanceRecordId = attendanceRecordId || null;
      data.originalCheckIn = originalCheckIn ? new Date(originalCheckIn) : null;
      data.originalCheckOut = originalCheckOut ? new Date(originalCheckOut) : null;
      data.requestedCheckIn = requestedCheckIn ? new Date(requestedCheckIn) : null;
      data.requestedCheckOut = requestedCheckOut ? new Date(requestedCheckOut) : null;
      data.correctionType = correctionType || null;
    }

    const attendanceRequest = await prisma.attendanceRequest.create({
      data,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true
          }
        }
      }
    });

    // TODO: Send notification to admin/manager

    return NextResponse.json(attendanceRequest);
  } catch (error) {
    console.error('Error creating attendance request:', error);
    return NextResponse.json(
      { error: 'Failed to create request' },
      { status: 500 }
    );
  }
}
