import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/db';
import { withCache, buildCacheKey, CACHE_PREFIX, CACHE_TTL } from '@/lib/cache';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user;
    const isAdmin = user.role === 'ADMIN' || user.role === 'HR_EMPLOYEE';

    // Use cache for performance (5 minute TTL)
    const stats = await withCache(
      buildCacheKey(CACHE_PREFIX.DASHBOARD, 'stats', user.id),
      async () => {
        // Tasks stats
        const tasksWhere = isAdmin ? {} : { ownerId: user.id };
        const [totalTasks, pendingTasks, inProgressTasks, completedTasks] = await Promise.all([
          prisma.task.count({ where: tasksWhere }),
          prisma.task.count({ where: { ...tasksWhere, status: 'NEW' } }),
          prisma.task.count({ where: { ...tasksWhere, status: 'IN_PROGRESS' } }),
          prisma.task.count({ where: { ...tasksWhere, status: 'DONE' } }),
        ]);

        // Attendance stats (for current user)
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        const attendanceRecords = await prisma.attendanceRecord.findMany({
          where: {
            userId: user.id,
            date: { gte: startOfMonth },
          },
          select: {
            status: true,
          },
        });

        const presentCount = attendanceRecords.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length;
        const absentCount = attendanceRecords.filter(r => r.status === 'ABSENT').length;
        const lateCount = attendanceRecords.filter(r => r.status === 'LATE').length;
        const totalDays = attendanceRecords.length || 1;
        const attendanceRate = Math.round((presentCount / totalDays) * 100);

        // Leaves stats (for current user's employee record)
        const userWithEmployee = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            employee: {
              select: {
                id: true,
                leaveBalance: true,
              },
            },
          },
        });

        const employeeId = userWithEmployee?.employee?.id;
        const leaveBalanceObj = userWithEmployee?.employee?.leaveBalance;
        const annualRemaining = leaveBalanceObj?.annualRemaining || 0;

        const [pendingLeaves, approvedLeaves] = employeeId 
          ? await Promise.all([
              prisma.leave.count({
                where: {
                  employeeId: employeeId,
                  status: 'PENDING',
                },
              }),
              prisma.leave.count({
                where: {
                  employeeId: employeeId,
                  status: 'APPROVED',
                },
              }),
            ])
          : [0, 0];

        // HR Requests stats (pending approvals)
        const pendingHRRequests = await prisma.hRRequest.count({
          where: {
            status: {
              in: ['PENDING_REVIEW', 'PENDING_APPROVAL'],
            },
          },
        });

        return {
          tasks: {
            total: totalTasks,
            pending: pendingTasks,
            inProgress: inProgressTasks,
            completed: completedTasks,
          },
          attendance: {
            present: presentCount,
            absent: absentCount,
            late: lateCount,
            rate: attendanceRate,
          },
          leaves: {
            pending: pendingLeaves,
            approved: approvedLeaves,
            balance: annualRemaining,
          },
          hrRequests: {
            pending: pendingHRRequests,
          },
        };
      },
      CACHE_TTL.DASHBOARD_STATS // 5 minutes cache
    );

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
