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
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());

    // Calculate date range for the month
    const startDate = new Date(year, month - 1, 1); // First day of month
    const endDate = new Date(year, month, 0, 23, 59, 59); // Last day of month

    // Fetch all attendance records for this user in the specified month
    const records = await prisma.attendanceRecord.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        date: 'asc'
      }
    });

    // Calculate statistics
    const totalDays = records.length;
    const presentDays = records.filter(r => 
      r.status === 'PRESENT' || r.status === 'LATE'
    ).length;
    const lateDays = records.filter(r => r.status === 'LATE').length;
    const absentDays = records.filter(r => r.status === 'ABSENT').length;
    
    const totalWorkHours = records.reduce((sum, r) => sum + (r.workHours || 0), 0);
    const averageWorkHours = totalDays > 0 ? totalWorkHours / totalDays : 0;
    const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

    // Format daily records for frontend
    const dailyRecords = records.map(record => ({
      date: record.date.toISOString(),
      status: record.status,
      checkIn: record.checkIn ? record.checkIn.toISOString() : null,
      checkOut: record.checkOut ? record.checkOut.toISOString() : null,
      workHours: record.workHours,
      notes: record.notes
    }));

    return NextResponse.json({
      stats: {
        totalDays,
        presentDays,
        lateDays,
        absentDays,
        totalWorkHours,
        averageWorkHours,
        attendanceRate
      },
      dailyRecords
    });

  } catch (error) {
    console.error('Error fetching attendance report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance report' },
      { status: 500 }
    );
  }
}
