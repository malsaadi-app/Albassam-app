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

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Employee Analytics
    const [
      totalEmployees,
      activeEmployees,
      onLeaveEmployees,
      resignedEmployees,
      terminatedEmployees,
      employeesByBranch,
      employeesByDepartment
    ] = await Promise.all([
      prisma.employee.count(),
      prisma.employee.count({ where: { status: 'ACTIVE' } }),
      prisma.employee.count({ where: { status: 'ON_LEAVE' } }),
      prisma.employee.count({ where: { status: 'RESIGNED' } }),
      prisma.employee.count({ where: { status: 'TERMINATED' } }),
      prisma.employee.groupBy({
        by: ['branchId'],
        _count: true,
        where: { status: 'ACTIVE' }
      }),
      prisma.employee.groupBy({
        by: ['department'],
        _count: true,
        where: { status: 'ACTIVE' }
      })
    ]);

    // Get branch names
    const branchIds = employeesByBranch.map(b => b.branchId).filter(Boolean) as string[];
    const branches = await prisma.branch.findMany({
      where: { id: { in: branchIds } },
      select: { id: true, name: true }
    });

    const branchMap = new Map(branches.map(b => [b.id, b.name]));

    const byBranch = employeesByBranch
      .map(b => ({
        branch: b.branchId ? branchMap.get(b.branchId) || 'غير محدد' : 'غير محدد',
        count: b._count
      }))
      .sort((a, b) => b.count - a.count);

    const byDepartment = employeesByDepartment
      .map(d => ({
        department: d.department || 'غير محدد',
        count: d._count
      }))
      .sort((a, b) => b.count - a.count);

    // Attendance Analytics (Today)
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: {
        date: {
          gte: today,
          lt: tomorrow
        }
      },
      select: {
        status: true
      }
    });

    const attendanceStats = {
      present: attendanceRecords.filter(r => r.status === 'PRESENT').length,
      late: attendanceRecords.filter(r => r.status === 'LATE').length,
      absent: attendanceRecords.filter(r => r.status === 'ABSENT').length,
      excused: attendanceRecords.filter(r => r.status === 'EXCUSED').length
    };

    const totalAttendance = attendanceRecords.length;
    const attendanceRate = totalAttendance > 0
      ? ((attendanceStats.present + attendanceStats.excused) / totalAttendance) * 100
      : 0;

    // HR Requests Analytics
    const [
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      totalRequests
    ] = await Promise.all([
      prisma.hRRequest.count({ where: { status: 'PENDING_REVIEW' } }),
      prisma.hRRequest.count({ where: { status: 'APPROVED' } }),
      prisma.hRRequest.count({ where: { status: 'REJECTED' } }),
      prisma.hRRequest.count()
    ]);

    // Workflow Analytics
    const [
      activeApprovals,
      escalatedApprovals,
      completedApprovals
    ] = await Promise.all([
      prisma.workflowRuntimeApproval.count({ where: { status: 'PENDING' } }),
      prisma.workflowRuntimeApproval.count({ where: { status: 'ESCALATED' } }),
      prisma.workflowRuntimeApproval.findMany({
        where: { 
          status: { in: ['APPROVED', 'REJECTED'] },
          reviewedAt: { not: null }
        },
        select: {
          createdAt: true,
          reviewedAt: true
        },
        take: 100
      })
    ]);

    // Calculate average approval time (in hours)
    const approvalTimes = completedApprovals
      .filter(a => a.reviewedAt) // Extra safety check
      .map(a => {
        const diffMs = a.reviewedAt!.getTime() - a.createdAt.getTime();
        return diffMs / (1000 * 60 * 60); // Convert to hours
      });

    const averageApprovalTime = approvalTimes.length > 0
      ? approvalTimes.reduce((sum, time) => sum + time, 0) / approvalTimes.length
      : 0;

    return NextResponse.json({
      employees: {
        total: totalEmployees,
        active: activeEmployees,
        onLeave: onLeaveEmployees,
        resigned: resignedEmployees,
        terminated: terminatedEmployees,
        byBranch,
        byDepartment
      },
      attendance: {
        ...attendanceStats,
        attendanceRate
      },
      hr: {
        pendingRequests,
        approvedRequests,
        rejectedRequests,
        totalRequests
      },
      workflows: {
        activeApprovals,
        escalatedApprovals,
        averageApprovalTime
      }
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب البيانات' },
      { status: 500 }
    );
  }
}
