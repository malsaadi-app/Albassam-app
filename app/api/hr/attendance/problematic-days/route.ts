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

    // Default required work hours
    const requiredHours = 8; // Standard 8 hours work day

    // Get ALL attendance records with potential problems
    const allRecords = await prisma.attendanceRecord.findMany({
      where: {
        userId: session.user.id,
        OR: [
          { status: 'LATE' },
          { status: 'ABSENT' },
          { checkOut: { equals: null } }, // Missing checkout
          { checkIn: { equals: null } },  // Missing checkin
          { 
            AND: [
              { workHours: { not: null } },
              { workHours: { lt: requiredHours } } // Insufficient hours
            ]
          }
        ]
      },
      orderBy: {
        date: 'desc'
      },
      take: 90 // Last 90 days
    });

    // Check if any of these days already have excuse requests
    const existingRequests = await prisma.attendanceRequest.findMany({
      where: {
        userId: session.user.id,
        type: 'EXCUSE',
        requestDate: {
          in: allRecords.map(r => r.date)
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

    // Helper function to calculate deduction
    const calculateDeduction = (record: any, dailySalary: number = 300): number => {
      if (record.status === 'ABSENT') return dailySalary; // Full day deduction
      if (record.status === 'LATE') return dailySalary * 0.25; // 25% for late
      if (!record.checkOut && record.checkIn) return dailySalary * 0.25; // 25% for missing checkout
      if (!record.checkIn) return dailySalary; // Full day if no checkin
      if (record.workHours && record.workHours < requiredHours) {
        const missingHours = requiredHours - record.workHours;
        return (dailySalary / requiredHours) * missingHours;
      }
      return 0;
    };

    // Helper function to get problem reason
    const getProblemReason = (record: any): string => {
      if (record.status === 'ABSENT') return 'غياب كامل';
      if (record.status === 'LATE') return 'تأخر عن موعد الحضور';
      if (!record.checkOut && record.checkIn) return 'لم يتم تسجيل الانصراف';
      if (!record.checkIn) return 'لم يتم تسجيل الحضور';
      if (record.workHours && record.workHours < requiredHours) {
        const missing = requiredHours - record.workHours;
        return `ساعات عمل ناقصة (${missing.toFixed(1)} ساعة)`;
      }
      return 'مشكلة في الحضور';
    };

    // Enhance records with detailed information
    const enhancedRecords = allRecords.map(record => {
      const dateStr = record.date.toISOString().split('T')[0];
      const requestStatus = requestMap.get(dateStr);
      const deduction = calculateDeduction(record);
      const missingHours = record.workHours ? Math.max(0, requiredHours - record.workHours) : requiredHours;
      
      return {
        id: record.id,
        date: record.date,
        checkIn: record.checkIn,
        checkOut: record.checkOut,
        workHours: record.workHours,
        requiredHours,
        missingHours,
        status: record.status,
        problemReason: getProblemReason(record),
        expectedDeduction: deduction,
        hasExcuseRequest: !!requestStatus,
        excuseRequestStatus: requestStatus || null
      };
    });

    // Calculate totals
    const totalDeductions = enhancedRecords
      .filter(r => !r.hasExcuseRequest || r.excuseRequestStatus === 'REJECTED')
      .reduce((sum, r) => sum + r.expectedDeduction, 0);

    return NextResponse.json({
      records: enhancedRecords,
      summary: {
        totalDays: enhancedRecords.length,
        totalDeductions,
        pendingRequests: enhancedRecords.filter(r => r.excuseRequestStatus === 'PENDING').length,
        approvedRequests: enhancedRecords.filter(r => r.excuseRequestStatus === 'APPROVED').length,
        rejectedRequests: enhancedRecords.filter(r => r.excuseRequestStatus === 'REJECTED').length
      }
    });
  } catch (error) {
    console.error('Error fetching problematic days:', error);
    return NextResponse.json(
      { error: 'فشل في جلب الأيام' },
      { status: 500 }
    );
  }
}
