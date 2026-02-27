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

    // Get attendance records where status is LATE or ABSENT
    const problematicRecords = await prisma.attendanceRecord.findMany({
      where: {
        userId: session.user.id,
        status: {
          in: ['LATE', 'ABSENT']
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    // Check if any of these days already have excuse requests
    const recordDates = problematicRecords.map(r => r.date.toISOString().split('T')[0]);
    
    const existingRequests = await prisma.attendanceRequest.findMany({
      where: {
        userId: session.user.id,
        type: 'EXCUSE',
        requestDate: {
          in: problematicRecords.map(r => r.date)
        }
      },
      select: {
        requestDate: true,
        status: true
      }
    });

    // Create a map of dates with their request status
    const requestMap = new Map();
    existingRequests.forEach(req => {
      const dateStr = new Date(req.requestDate).toISOString().split('T')[0];
      requestMap.set(dateStr, req.status);
    });

    // Enhance records with request status
    const enhancedRecords = problematicRecords.map(record => {
      const dateStr = record.date.toISOString().split('T')[0];
      const requestStatus = requestMap.get(dateStr);
      
      return {
        id: record.id,
        date: record.date,
        checkIn: record.checkIn,
        checkOut: record.checkOut,
        workHours: record.workHours,
        status: record.status,
        hasExcuseRequest: !!requestStatus,
        excuseRequestStatus: requestStatus || null
      };
    });

    return NextResponse.json(enhancedRecords);
  } catch (error) {
    console.error('Error fetching problematic days:', error);
    return NextResponse.json(
      { error: 'فشل في جلب الأيام' },
      { status: 500 }
    );
  }
}
