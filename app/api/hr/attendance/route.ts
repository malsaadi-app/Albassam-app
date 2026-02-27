import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';

// GET /api/hr/attendance - Get all employees' attendance (HR/Admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(await cookies());

    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'HR_EMPLOYEE') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const userId = searchParams.get('userId');
    const department = searchParams.get('department');
    const status = searchParams.get('status');

    // Default to today if no date specified
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const where: any = {};

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    } else {
      where.date = {
        gte: targetDate,
        lt: nextDay
      };
    }

    if (userId) {
      where.userId = userId;
    }

    if (status) {
      where.status = status;
    }

    const records = await prisma.attendanceRecord.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            username: true,
            employee: {
              select: {
                department: true,
                position: true,
                employeeNumber: true
              }
            }
          }
        }
      },
      orderBy: [
        { date: 'desc' },
        { checkIn: 'asc' }
      ]
    });

    // Filter by department if specified
    let filteredRecords = records;
    if (department) {
      filteredRecords = records.filter(r => r.user.employee?.department === department);
    }

    // Get all users to identify who's absent
    const allUsers = await prisma.user.findMany({
      where: {
        role: 'USER'
      },
      include: {
        employee: {
          select: {
            department: true,
            position: true,
            employeeNumber: true,
            status: true
          }
        }
      }
    });

    // Filter active employees
    const activeUsers = allUsers.filter(u => 
      u.employee && u.employee.status === 'ACTIVE'
    );

    // Filter by department if specified
    const usersToCheck = department 
      ? activeUsers.filter(u => u.employee?.department === department)
      : activeUsers;

    // Find absent employees
    const presentUserIds = new Set(filteredRecords.map(r => r.userId));
    const absentEmployees = usersToCheck
      .filter(u => !presentUserIds.has(u.id))
      .map(u => ({
        userId: u.id,
        displayName: u.displayName,
        username: u.username,
        employee: u.employee,
        status: 'ABSENT',
        date: targetDate
      }));

    // Get settings for reference
    const settings = await prisma.attendanceSettings.findFirst();

    return NextResponse.json({ 
      records: filteredRecords,
      absentEmployees,
      settings,
      date: targetDate,
      totalEmployees: usersToCheck.length,
      presentCount: filteredRecords.length,
      absentCount: absentEmployees.length,
      lateCount: filteredRecords.filter(r => r.status === 'LATE').length
    });
  } catch (error) {
    console.error('Error fetching HR attendance:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب السجلات' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
