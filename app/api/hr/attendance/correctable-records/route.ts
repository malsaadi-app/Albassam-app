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

    // Get all attendance records for the user (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const records = await prisma.attendanceRecord.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: thirtyDaysAgo
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    // Check if any of these records already have correction requests
    const recordIds = records.map(r => r.id);
    
    const existingRequests = await prisma.attendanceRequest.findMany({
      where: {
        userId: session.user.id,
        type: 'CORRECTION',
        attendanceRecordId: {
          in: recordIds
        }
      },
      select: {
        attendanceRecordId: true,
        status: true
      }
    });

    // Create a map of record IDs with their correction request status
    const requestMap = new Map();
    existingRequests.forEach(req => {
      if (req.attendanceRecordId) {
        requestMap.set(req.attendanceRecordId, req.status);
      }
    });

    // Enhance records with correction request status
    const enhancedRecords = records.map(record => {
      const correctionRequestStatus = requestMap.get(record.id);
      
      // Identify potential issues
      const issues = [];
      if (!record.checkOut) {
        issues.push('missing_checkout');
      }
      if (record.workHours && record.workHours < 4) {
        issues.push('low_hours');
      }
      
      return {
        id: record.id,
        date: record.date,
        checkIn: record.checkIn,
        checkOut: record.checkOut,
        workHours: record.workHours,
        status: record.status,
        location: record.location,
        notes: record.notes,
        hasCorrectionRequest: !!correctionRequestStatus,
        correctionRequestStatus: correctionRequestStatus || null,
        potentialIssues: issues
      };
    });

    return NextResponse.json(enhancedRecords);
  } catch (error) {
    console.error('Error fetching correctable records:', error);
    return NextResponse.json(
      { error: 'فشل في جلب السجلات' },
      { status: 500 }
    );
  }
}
