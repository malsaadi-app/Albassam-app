import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/session';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(await cookies());

    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');

    // Build filters
    const where: any = {
      userId: session.user.id
    };

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    if (status) {
      where.status = status;
    }

    // Fetch attendance records
    const records = await prisma.attendanceRecord.findMany({
      where,
      orderBy: {
        date: 'desc'
      },
      select: {
        id: true,
        date: true,
        checkIn: true,
        checkOut: true,
        workHours: true,
        status: true,
        notes: true
      }
    });

    // Calculate stats
    const totalDays = records.length;
    const presentDays = records.filter(r => r.status === 'PRESENT').length;
    const lateDays = records.filter(r => r.status === 'LATE').length;
    const absentDays = records.filter(r => r.status === 'ABSENT').length;
    const excusedDays = records.filter(r => r.status === 'EXCUSED').length;
    
    const totalWorkHours = records
      .filter(r => r.workHours !== null)
      .reduce((sum, r) => sum + (r.workHours || 0), 0);
    
    const averageWorkHours = totalDays > 0 ? totalWorkHours / totalDays : 0;
    const attendanceRate = totalDays > 0 ? ((presentDays + excusedDays) / totalDays) * 100 : 0;

    const stats = {
      totalDays,
      presentDays,
      lateDays,
      absentDays,
      excusedDays,
      averageWorkHours: Math.round(averageWorkHours * 10) / 10,
      attendanceRate: Math.round(attendanceRate * 10) / 10
    };

    return NextResponse.json({
      records: records.map(r => ({
        ...r,
        date: r.date.toISOString().split('T')[0]
      })),
      stats
    });

  } catch (error) {
    console.error('Error fetching attendance history:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب البيانات' },
      { status: 500 }
    );
  }
}
