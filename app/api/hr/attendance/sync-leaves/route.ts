import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

/**
 * Sync attendance records with approved leaves
 * Automatically marks absent employees as EXCUSED if they have approved leave
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(await cookies());
    
    // Only admins can trigger this sync
    if (!session.user || (session.user.role !== 'ADMIN' && session.user.role !== 'HR_EMPLOYEE')) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { date } = await request.json();
    const targetDate = date ? new Date(date) : new Date();
    const dateStart = new Date(targetDate);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(targetDate);
    dateEnd.setHours(23, 59, 59, 999);

    // Find all approved HR requests (LEAVE type) for this date
    const approvedLeaves = await prisma.hRRequest.findMany({
      where: {
        type: 'LEAVE',
        status: 'APPROVED',
        startDate: {
          lte: dateEnd
        },
        endDate: {
          gte: dateStart
        }
      },
      select: {
        employeeId: true,
        leaveType: true,
        startDate: true,
        endDate: true
      }
    });

    // Also check Leave table for approved leaves
    const approvedLeaveRecords = await prisma.leave.findMany({
      where: {
        status: 'APPROVED',
        startDate: {
          lte: dateEnd
        },
        endDate: {
          gte: dateStart
        }
      },
      include: {
        employee: {
          select: {
            userId: true
          }
        }
      }
    });

    // Collect all user IDs with approved leaves
    const userIdsOnLeave = new Set<string>();
    
    approvedLeaves.forEach(leave => {
      userIdsOnLeave.add(leave.employeeId);
    });

    approvedLeaveRecords.forEach(leave => {
      if (leave.employee?.userId) {
        userIdsOnLeave.add(leave.employee.userId);
      }
    });

    if (userIdsOnLeave.size === 0) {
      return NextResponse.json({ 
        message: 'لا توجد إجازات معتمدة لهذا اليوم',
        updated: 0
      });
    }

    // Find attendance records for these users that are marked as ABSENT
    const absentRecords = await prisma.attendanceRecord.findMany({
      where: {
        userId: {
          in: Array.from(userIdsOnLeave)
        },
        date: {
          gte: dateStart,
          lte: dateEnd
        },
        status: 'ABSENT'
      }
    });

    // Update them to EXCUSED
    const updatePromises = absentRecords.map(record => 
      prisma.attendanceRecord.update({
        where: { id: record.id },
        data: {
          status: 'EXCUSED',
          notes: record.notes 
            ? `${record.notes} | تم التحديث تلقائياً: إجازة معتمدة`
            : 'تم التحديث تلقائياً: إجازة معتمدة'
        }
      })
    );

    await Promise.all(updatePromises);

    return NextResponse.json({
      message: 'تم مزامنة الإجازات بنجاح',
      updated: absentRecords.length,
      usersOnLeave: Array.from(userIdsOnLeave).length
    });
  } catch (error) {
    console.error('Error syncing leaves:', error);
    return NextResponse.json(
      { error: 'فشل في مزامنة الإجازات' },
      { status: 500 }
    );
  }
}

/**
 * Auto-sync on GET - can be called by cron
 */
export async function GET(request: NextRequest) {
  try {
    // Auto-sync today's date
    const today = new Date();
    const dateStart = new Date(today);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(today);
    dateEnd.setHours(23, 59, 59, 999);

    // Find approved leaves for today
    const approvedLeaves = await prisma.hRRequest.findMany({
      where: {
        type: 'LEAVE',
        status: 'APPROVED',
        startDate: {
          lte: dateEnd
        },
        endDate: {
          gte: dateStart
        }
      },
      select: {
        employeeId: true
      }
    });

    const approvedLeaveRecords = await prisma.leave.findMany({
      where: {
        status: 'APPROVED',
        startDate: {
          lte: dateEnd
        },
        endDate: {
          gte: dateStart
        }
      },
      include: {
        employee: {
          select: {
            userId: true
          }
        }
      }
    });

    const userIdsOnLeave = new Set<string>();
    
    approvedLeaves.forEach(leave => {
      userIdsOnLeave.add(leave.employeeId);
    });

    approvedLeaveRecords.forEach(leave => {
      if (leave.employee?.userId) {
        userIdsOnLeave.add(leave.employee.userId);
      }
    });

    if (userIdsOnLeave.size === 0) {
      return NextResponse.json({ 
        message: 'لا توجد إجازات معتمدة لليوم',
        updated: 0
      });
    }

    const absentRecords = await prisma.attendanceRecord.findMany({
      where: {
        userId: {
          in: Array.from(userIdsOnLeave)
        },
        date: {
          gte: dateStart,
          lte: dateEnd
        },
        status: 'ABSENT'
      }
    });

    const updatePromises = absentRecords.map(record => 
      prisma.attendanceRecord.update({
        where: { id: record.id },
        data: {
          status: 'EXCUSED',
          notes: record.notes 
            ? `${record.notes} | تم التحديث تلقائياً: إجازة معتمدة`
            : 'تم التحديث تلقائياً: إجازة معتمدة'
        }
      })
    );

    await Promise.all(updatePromises);

    return NextResponse.json({
      message: 'تم مزامنة الإجازات بنجاح',
      updated: absentRecords.length
    });
  } catch (error) {
    console.error('Error auto-syncing leaves:', error);
    return NextResponse.json(
      { error: 'فشل في المزامنة التلقائية' },
      { status: 500 }
    );
  }
}
