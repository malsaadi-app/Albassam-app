import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { hasPermission, getAccessibleEmployees } from '@/lib/permissions-server';

// GET /api/attendance/analytics - Get attendance analytics
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(await cookies());

    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month'; // week, month, year
    const userId = searchParams.get('userId');

    // Determine accessible user IDs based on permissions
    let accessibleUserIds: string[] = [];
    
    if (await hasPermission(session.user.id, 'attendance.view')) {
      // Global view - can see all employees
      const allEmployees = await prisma.employee.findMany({
        where: { status: 'ACTIVE' },
        select: { userId: true }
      });
      accessibleUserIds = allEmployees.map(e => e.userId).filter(Boolean) as string[];
    } else if (await hasPermission(session.user.id, 'attendance.view_team')) {
      // Team view - can see team members only
      accessibleUserIds = await getAccessibleEmployees(session.user.id);
    } else if (await hasPermission(session.user.id, 'attendance.view_own')) {
      // Own view - can see only own records
      accessibleUserIds = [session.user.id];
    } else {
      return NextResponse.json({ error: 'ليس لديك صلاحية عرض التحليلات' }, { status: 403 });
    }

    // If specific user requested, check if accessible
    const targetUserId = userId || session.user.id;
    if (userId && !accessibleUserIds.includes(userId)) {
      return NextResponse.json({ error: 'ليس لديك صلاحية عرض تحليلات هذا الموظف' }, { status: 403 });
    }

    // Calculate date range
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date();
    
    switch (period) {
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }
    startDate.setHours(0, 0, 0, 0);

    // Fetch records
    const records = await prisma.attendanceRecord.findMany({
      where: {
        userId: targetUserId,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { date: 'asc' }
    });

    // Calculate statistics
    const totalDays = records.length;
    const presentDays = records.filter(r => r.status === 'PRESENT').length;
    const lateDays = records.filter(r => r.status === 'LATE').length;
    const totalWorkHours = records.reduce((sum, r) => sum + (r.workHours || 0), 0);
    const avgWorkHours = totalDays > 0 ? totalWorkHours / totalDays : 0;

    // Calculate average check-in time
    const checkInTimes = records.map(r => {
      const date = new Date(r.checkIn);
      return date.getHours() * 60 + date.getMinutes();
    });
    const avgCheckInMinutes = checkInTimes.length > 0 
      ? checkInTimes.reduce((a, b) => a + b, 0) / checkInTimes.length 
      : 0;
    const avgCheckInHours = Math.floor(avgCheckInMinutes / 60);
    const avgCheckInMins = Math.round(avgCheckInMinutes % 60);

    // Calculate punctuality rate
    const punctualityRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 100;

    // Group by day of week
    const dayOfWeekStats: { [key: string]: number } = {
      'Sunday': 0, 'Monday': 0, 'Tuesday': 0, 'Wednesday': 0,
      'Thursday': 0, 'Friday': 0, 'Saturday': 0
    };
    
    records.forEach(r => {
      const dayName = new Date(r.date).toLocaleDateString('en-US', { weekday: 'long' });
      dayOfWeekStats[dayName]++;
    });

    // Group by week for trend
    const weeklyTrend: { week: string; present: number; late: number; hours: number }[] = [];
    const weekMap: { [key: string]: { present: number; late: number; hours: number } } = {};
    
    records.forEach(r => {
      const weekStart = new Date(r.date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weekMap[weekKey]) {
        weekMap[weekKey] = { present: 0, late: 0, hours: 0 };
      }
      
      if (r.status === 'PRESENT') weekMap[weekKey].present++;
      if (r.status === 'LATE') weekMap[weekKey].late++;
      weekMap[weekKey].hours += r.workHours || 0;
    });
    
    Object.entries(weekMap).forEach(([week, data]) => {
      weeklyTrend.push({ week, ...data });
    });
    weeklyTrend.sort((a, b) => a.week.localeCompare(b.week));

    // Late pattern analysis
    const lateRecords = records.filter(r => r.status === 'LATE');
    const avgLateMinutes = lateRecords.length > 0
      ? lateRecords.reduce((sum, r) => sum + r.minutesLate, 0) / lateRecords.length
      : 0;

    // Best streak (consecutive present days)
    let currentStreak = 0;
    let bestStreak = 0;
    records.forEach(r => {
      if (r.status === 'PRESENT') {
        currentStreak++;
        bestStreak = Math.max(bestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    });

    return NextResponse.json({
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      summary: {
        totalDays,
        presentDays,
        lateDays,
        totalWorkHours: Math.round(totalWorkHours * 10) / 10,
        avgWorkHours: Math.round(avgWorkHours * 10) / 10,
        avgCheckInTime: `${avgCheckInHours.toString().padStart(2, '0')}:${avgCheckInMins.toString().padStart(2, '0')}`,
        punctualityRate: Math.round(punctualityRate),
        avgLateMinutes: Math.round(avgLateMinutes),
        bestStreak
      },
      dayOfWeekStats,
      weeklyTrend,
      recentRecords: records.slice(-7).map(r => ({
        date: r.date,
        status: r.status,
        checkIn: r.checkIn,
        checkOut: r.checkOut,
        workHours: r.workHours,
        minutesLate: r.minutesLate
      }))
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب التحليلات' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
