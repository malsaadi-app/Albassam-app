import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';


// GET /api/hr/dashboard/stats - إحصائيات الموارد البشرية
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(await cookies());

    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    // Get current month dates
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get this week's date range
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    const thisWeekEnd = new Date(thisWeekStart);
    thisWeekEnd.setDate(thisWeekStart.getDate() + 7);

    // Get 30 days from now
    const next30Days = new Date(today);
    next30Days.setDate(today.getDate() + 30);

    // Fetch all stats in parallel
    const [
      totalEmployees,
      activeEmployees,
      onLeaveEmployees,
      resignedEmployees,
      newEmployeesThisMonth,
      pendingLeaves,
      approvedLeavesToday,
      approvedLeavesThisWeek,
      expiringDocuments,
      expiredDocuments,
      employeesByDepartment
    ] = await Promise.all([
      // Total employees
      prisma.employee.count(),

      // Active employees
      prisma.employee.count({
        where: { status: 'ACTIVE' }
      }),

      // On leave employees
      prisma.employee.count({
        where: { status: 'ON_LEAVE' }
      }),

      // Resigned/terminated employees
      prisma.employee.count({
        where: {
          status: {
            in: ['RESIGNED', 'TERMINATED']
          }
        }
      }),

      // New employees this month
      prisma.employee.count({
        where: {
          hireDate: {
            gte: firstDayOfMonth,
            lte: lastDayOfMonth
          }
        }
      }),

      // Pending leave requests
      prisma.leave.count({
        where: { status: 'PENDING' }
      }),

      // Approved leaves today
      prisma.leave.count({
        where: {
          status: 'APPROVED',
          startDate: { lte: tomorrow },
          endDate: { gte: today }
        }
      }),

      // Approved leaves this week
      prisma.leave.count({
        where: {
          status: 'APPROVED',
          startDate: { lte: thisWeekEnd },
          endDate: { gte: thisWeekStart }
        }
      }),

      // Documents expiring soon (within 30 days)
      prisma.document.count({
        where: {
          expiryDate: {
            gte: today,
            lte: next30Days
          }
        }
      }),

      // Expired documents
      prisma.document.count({
        where: {
          expiryDate: {
            lt: today
          }
        }
      }),

      // Employees by department
      prisma.employee.groupBy({
        by: ['department'],
        where: {
          status: {
            in: ['ACTIVE', 'ON_LEAVE']
          }
        },
        _count: true
      })
    ]);

    // Get recent leaves
    const recentLeaves = await prisma.leave.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        employee: {
          select: {
            fullNameAr: true,
            employeeNumber: true,
            department: true
          }
        }
      }
    });

    // Get recent employees
    const recentEmployees = await prisma.employee.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fullNameAr: true,
        employeeNumber: true,
        department: true,
        position: true,
        hireDate: true,
        status: true
      }
    });

    return NextResponse.json({
      employees: {
        total: totalEmployees,
        active: activeEmployees,
        onLeave: onLeaveEmployees,
        resigned: resignedEmployees,
        newThisMonth: newEmployeesThisMonth
      },
      leaves: {
        pending: pendingLeaves,
        today: approvedLeavesToday,
        thisWeek: approvedLeavesThisWeek,
        recent: recentLeaves
      },
      documents: {
        expiringSoon: expiringDocuments,
        expired: expiredDocuments
      },
      departmentStats: employeesByDepartment.map(dept => ({
        department: dept.department,
        count: dept._count
      })),
      recentEmployees
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب الإحصائيات' },
      { status: 500 }
    );
  }
}
