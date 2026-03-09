import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { hasPermission, getAccessibleEmployees } from '@/lib/permissions-server';

// GET /api/attendance/paginated - Get paginated attendance records
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(await cookies());

    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');

    // Validate pagination
    const pageNum = Math.max(1, page);
    const pageSize = Math.min(100, Math.max(1, limit));
    const skip = (pageNum - 1) * pageSize;

    // Determine accessible user IDs
    let accessibleUserIds: string[] = [];
    
    if (hasPermission(session.user, 'attendance.view')) {
      // Global view
      const allEmployees = await prisma.employee.findMany({
        where: { status: 'ACTIVE' },
        select: { userId: true }
      });
      accessibleUserIds = allEmployees.map(e => e.userId).filter(Boolean) as string[];
    } else if (hasPermission(session.user, 'attendance.view_team')) {
      // Team view
      const accessibleEmployees = await getAccessibleEmployees(session.user, 'attendance.view', 'attendance.view_team');
      if (accessibleEmployees.length > 0) {
        const employees = await prisma.employee.findMany({
          where: { id: { in: accessibleEmployees } },
          select: { userId: true }
        });
        accessibleUserIds = employees.map(e => e.userId).filter(Boolean) as string[];
      }
    } else if (hasPermission(session.user, 'attendance.view_own')) {
      accessibleUserIds = [session.user.id];
    } else {
      return NextResponse.json({ error: 'ليس لديك صلاحية عرض الحضور' }, { status: 403 });
    }

    // Build where clause
    const where: any = {
      userId: { in: accessibleUserIds }
    };

    if (startDate) {
      where.date = { ...where.date, gte: new Date(startDate) };
    }
    if (endDate) {
      where.date = { ...where.date, lte: new Date(endDate) };
    }
    if (status) {
      where.status = status;
    }

    // Get total count
    const total = await prisma.attendanceRecord.count({ where });

    // Fetch paginated records
    const records = await prisma.attendanceRecord.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            employee: {
              select: {
                fullNameAr: true,
                employeeNumber: true,
                position: true
              }
            }
          }
        }
      },
      orderBy: [{ date: 'desc' }, { checkIn: 'desc' }],
      skip,
      take: pageSize
    });

    // Calculate pagination info
    const totalPages = Math.ceil(total / pageSize);
    const hasNextPage = pageNum < totalPages;
    const hasPreviousPage = pageNum > 1;

    return NextResponse.json({
      records: records.map(r => ({
        id: r.id,
        date: r.date,
        status: r.status,
        checkIn: r.checkIn,
        checkOut: r.checkOut,
        workHours: r.workHours,
        minutesLate: r.minutesLate,
        employee: {
          id: r.user.id,
          name: r.user.employee?.fullNameAr || r.user.displayName || r.user.username,
          number: r.user.employee?.employeeNumber,
          position: r.user.employee?.position
        }
      })),
      pagination: {
        page: pageNum,
        limit: pageSize,
        total,
        totalPages,
        hasNextPage,
        hasPreviousPage
      }
    });
  } catch (error) {
    console.error('Error fetching paginated records:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب السجلات' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
