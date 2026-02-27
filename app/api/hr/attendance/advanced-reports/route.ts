import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(await cookies());
    
    if (!session.user || (session.user.role !== 'ADMIN' && session.user.role !== 'HR_EMPLOYEE')) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const department = searchParams.get('department');

    const dateStart = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const dateEnd = endDate ? new Date(endDate) : new Date();

    switch (reportType) {
      case 'team-dashboard':
        return await getTeamDashboard(dateStart, dateEnd, department);
      
      case 'late-patterns':
        return await getLatePatterns(dateStart, dateEnd, department);
      
      case 'department-comparison':
        return await getDepartmentComparison(dateStart, dateEnd);
      
      case 'monthly-trends':
        return await getMonthlyTrends(dateStart, dateEnd, department);
      
      default:
        return NextResponse.json({ error: 'نوع التقرير غير صالح' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error generating advanced report:', error);
    return NextResponse.json(
      { error: 'فشل في إنشاء التقرير' },
      { status: 500 }
    );
  }
}

async function getTeamDashboard(startDate: Date, endDate: Date, department?: string | null) {
  // Get all users with their employee data
  const usersQuery: any = {
    role: {
      in: ['USER', 'HR_EMPLOYEE']
    }
  };

  if (department) {
    usersQuery.employee = {
      department: department
    };
  }

  const users = await prisma.user.findMany({
    where: usersQuery,
    include: {
      employee: {
        select: {
          department: true,
          position: true,
          fullNameAr: true
        }
      },
      attendanceRecords: {
        where: {
          date: {
            gte: startDate,
            lte: endDate
          }
        }
      }
    }
  });

  // Calculate stats for each user
  const teamStats = users.map(user => {
    const records = user.attendanceRecords;
    const totalDays = records.length;
    const presentDays = records.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
    const lateDays = records.filter(r => r.status === 'LATE').length;
    const absentDays = records.filter(r => r.status === 'ABSENT').length;
    const excusedDays = records.filter(r => r.status === 'EXCUSED').length;
    
    const totalWorkHours = records.reduce((sum, r) => sum + (r.workHours || 0), 0);
    const avgWorkHours = totalDays > 0 ? (totalWorkHours / totalDays) : 0;
    
    const attendanceRate = totalDays > 0 ? ((presentDays / totalDays) * 100) : 0;

    return {
      userId: user.id,
      displayName: user.displayName,
      fullNameAr: user.employee?.fullNameAr || user.displayName,
      department: user.employee?.department || 'غير محدد',
      position: user.employee?.position || 'غير محدد',
      stats: {
        totalDays,
        presentDays,
        lateDays,
        absentDays,
        excusedDays,
        totalWorkHours: parseFloat(totalWorkHours.toFixed(2)),
        avgWorkHours: parseFloat(avgWorkHours.toFixed(2)),
        attendanceRate: parseFloat(attendanceRate.toFixed(1))
      }
    };
  });

  // Calculate overall team stats
  const overallStats = {
    totalEmployees: users.length,
    avgAttendanceRate: teamStats.length > 0 
      ? parseFloat((teamStats.reduce((sum, t) => sum + t.stats.attendanceRate, 0) / teamStats.length).toFixed(1))
      : 0,
    totalPresentDays: teamStats.reduce((sum, t) => sum + t.stats.presentDays, 0),
    totalLateDays: teamStats.reduce((sum, t) => sum + t.stats.lateDays, 0),
    totalAbsentDays: teamStats.reduce((sum, t) => sum + t.stats.absentDays, 0),
    totalWorkHours: parseFloat(teamStats.reduce((sum, t) => sum + t.stats.totalWorkHours, 0).toFixed(2))
  };

  return NextResponse.json({
    dateRange: { startDate, endDate },
    department: department || 'الكل',
    overallStats,
    teamStats: teamStats.sort((a, b) => b.stats.attendanceRate - a.stats.attendanceRate)
  });
}

async function getLatePatterns(startDate: Date, endDate: Date, department?: string | null) {
  const whereClause: any = {
    date: {
      gte: startDate,
      lte: endDate
    },
    status: 'LATE'
  };

  if (department) {
    whereClause.user = {
      employee: {
        department: department
      }
    };
  }

  const lateRecords = await prisma.attendanceRecord.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          id: true,
          displayName: true,
          employee: {
            select: {
              fullNameAr: true,
              department: true,
              position: true
            }
          }
        }
      }
    },
    orderBy: {
      date: 'desc'
    }
  });

  // Group by user
  const userLateMap = new Map();
  lateRecords.forEach(record => {
    const userId = record.user.id;
    if (!userLateMap.has(userId)) {
      userLateMap.set(userId, {
        userId,
        displayName: record.user.displayName,
        fullNameAr: record.user.employee?.fullNameAr || record.user.displayName,
        department: record.user.employee?.department || 'غير محدد',
        position: record.user.employee?.position || 'غير محدد',
        lateCount: 0,
        lateDates: []
      });
    }
    
    const userData = userLateMap.get(userId);
    userData.lateCount++;
    userData.lateDates.push({
      date: record.date,
      checkIn: record.checkIn
    });
  });

  const latePatterns = Array.from(userLateMap.values())
    .sort((a, b) => b.lateCount - a.lateCount);

  return NextResponse.json({
    dateRange: { startDate, endDate },
    department: department || 'الكل',
    totalLateRecords: lateRecords.length,
    latePatterns
  });
}

async function getDepartmentComparison(startDate: Date, endDate: Date) {
  // Get all attendance records with employee/department info
  const records = await prisma.attendanceRecord.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      user: {
        select: {
          employee: {
            select: {
              department: true
            }
          }
        }
      }
    }
  });

  // Group by department
  const deptMap = new Map();
  
  records.forEach(record => {
    const dept = record.user.employee?.department || 'غير محدد';
    
    if (!deptMap.has(dept)) {
      deptMap.set(dept, {
        department: dept,
        totalRecords: 0,
        presentCount: 0,
        lateCount: 0,
        absentCount: 0,
        excusedCount: 0,
        totalWorkHours: 0
      });
    }
    
    const deptData = deptMap.get(dept);
    deptData.totalRecords++;
    
    if (record.status === 'PRESENT') deptData.presentCount++;
    if (record.status === 'LATE') deptData.lateCount++;
    if (record.status === 'ABSENT') deptData.absentCount++;
    if (record.status === 'EXCUSED') deptData.excusedCount++;
    
    deptData.totalWorkHours += record.workHours || 0;
  });

  // Calculate rates and format
  const departmentStats = Array.from(deptMap.values()).map(dept => ({
    ...dept,
    attendanceRate: dept.totalRecords > 0 
      ? parseFloat(((dept.presentCount + dept.lateCount) / dept.totalRecords * 100).toFixed(1))
      : 0,
    lateRate: dept.totalRecords > 0 
      ? parseFloat((dept.lateCount / dept.totalRecords * 100).toFixed(1))
      : 0,
    avgWorkHours: dept.totalRecords > 0 
      ? parseFloat((dept.totalWorkHours / dept.totalRecords).toFixed(2))
      : 0,
    totalWorkHours: parseFloat(dept.totalWorkHours.toFixed(2))
  }));

  return NextResponse.json({
    dateRange: { startDate, endDate },
    departmentStats: departmentStats.sort((a, b) => b.attendanceRate - a.attendanceRate)
  });
}

async function getMonthlyTrends(startDate: Date, endDate: Date, department?: string | null) {
  const whereClause: any = {
    date: {
      gte: startDate,
      lte: endDate
    }
  };

  if (department) {
    whereClause.user = {
      employee: {
        department: department
      }
    };
  }

  const records = await prisma.attendanceRecord.findMany({
    where: whereClause,
    orderBy: {
      date: 'asc'
    }
  });

  // Group by month
  const monthMap = new Map();
  
  records.forEach(record => {
    const date = new Date(record.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, {
        month: monthKey,
        totalRecords: 0,
        presentCount: 0,
        lateCount: 0,
        absentCount: 0,
        excusedCount: 0,
        totalWorkHours: 0
      });
    }
    
    const monthData = monthMap.get(monthKey);
    monthData.totalRecords++;
    
    if (record.status === 'PRESENT') monthData.presentCount++;
    if (record.status === 'LATE') monthData.lateCount++;
    if (record.status === 'ABSENT') monthData.absentCount++;
    if (record.status === 'EXCUSED') monthData.excusedCount++;
    
    monthData.totalWorkHours += record.workHours || 0;
  });

  // Calculate rates
  const monthlyTrends = Array.from(monthMap.values()).map(month => ({
    ...month,
    attendanceRate: month.totalRecords > 0 
      ? parseFloat(((month.presentCount + month.lateCount) / month.totalRecords * 100).toFixed(1))
      : 0,
    avgWorkHours: month.totalRecords > 0 
      ? parseFloat((month.totalWorkHours / month.totalRecords).toFixed(2))
      : 0,
    totalWorkHours: parseFloat(month.totalWorkHours.toFixed(2))
  }));

  return NextResponse.json({
    dateRange: { startDate, endDate },
    department: department || 'الكل',
    monthlyTrends
  });
}
