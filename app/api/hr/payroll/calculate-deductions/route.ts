import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

function isHR(role?: string) {
  return role === 'ADMIN' || role === 'HR_EMPLOYEE';
}

function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return { hours, minutes };
}

function getMinutesDiff(checkIn: Date, expectedTime: string): number {
  const expected = parseTime(expectedTime);
  const checkInDate = new Date(checkIn);
  const expectedDate = new Date(checkIn);
  expectedDate.setHours(expected.hours, expected.minutes, 0, 0);
  
  const diffMs = checkInDate.getTime() - expectedDate.getTime();
  return Math.floor(diffMs / 60000); // convert to minutes
}

// POST /api/hr/payroll/calculate-deductions
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(await cookies());
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    if (!isHR(session.user.role)) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

    const body = await request.json();
    const year = Number(body.year);
    const month = Number(body.month); // 1-12

    if (!year || !month || month < 1 || month > 12) {
      return NextResponse.json({ error: 'بيانات غير صحيحة' }, { status: 400 });
    }

    // Get attendance settings
    const settings = await prisma.attendanceSettings.findFirst();
    if (!settings) {
      return NextResponse.json({ error: 'لم يتم تكوين إعدادات الحضور' }, { status: 400 });
    }

    // Get all active employees with userId
    const employees = await prisma.employee.findMany({
      where: {
        status: { in: ['ACTIVE', 'ON_LEAVE'] },
        userId: { not: null }
      },
      select: {
        id: true,
        userId: true,
        fullNameAr: true,
        employeeNumber: true,
        basicSalary: true,
        transportAllowance: true,
        housingAllowance: true,
        otherAllowances: true,
        morningGraceMinutes: true,
        branch: {
          select: {
            workStartTime: true,
            workEndTime: true,
            workDays: true
          }
        },
        stage: {
          select: {
            workStartTime: true,
            workEndTime: true
          }
        }
      }
    });

    // Calculate date range for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const deductions = [];

    for (const employee of employees) {
      // Get attendance records for this employee in this month
      if (!employee.userId) continue;
      
      const records = await prisma.attendanceRecord.findMany({
        where: {
          userId: employee.userId,
          checkIn: {
            gte: startDate,
            lte: endDate,
          }
        },
        orderBy: { checkIn: 'asc' }
      });

      if (records.length === 0) {
        continue; // Skip if no attendance records
      }

      let totalLateMinutes = 0;
      let totalEarlyLeaveMinutes = 0;
      let lateCount = 0;
      let earlyLeaveCount = 0;
      const details: any[] = [];

      for (const record of records) {
        const checkInDate = new Date(record.checkIn);
        const dayOfWeek = checkInDate.getDay(); // 0 = Sunday, 6 = Saturday

        // Work schedule (priority: stage override > branch > global settings)
        const expectedStart = employee.stage?.workStartTime || employee.branch?.workStartTime || settings.workStartTime;
        const expectedEnd = employee.stage?.workEndTime || employee.branch?.workEndTime || settings.workEndTime;

        // Work days (0=Sun..6=Sat). If branch has workDays configured, respect it.
        const workDaysStr = employee.branch?.workDays || '0,1,2,3,4';
        const workDays = new Set(workDaysStr.split(',').map(s => Number(s.trim())).filter(n => !Number.isNaN(n)));

        // Skip non-working days
        if (!workDays.has(dayOfWeek)) {
          continue;
        }

        // Grace for lateness (morning only): employee override > global
        const graceMinutes = typeof employee.morningGraceMinutes === 'number'
          ? employee.morningGraceMinutes
          : settings.lateThresholdMinutes;

        // Check late arrival
        const lateMinutes = getMinutesDiff(record.checkIn, expectedStart);
        if (lateMinutes > graceMinutes) {
          const actualLate = lateMinutes - graceMinutes;
          totalLateMinutes += actualLate;
          lateCount++;
          details.push({
            date: checkInDate.toISOString().split('T')[0],
            type: 'تأخير',
            minutes: actualLate,
            checkIn: checkInDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          });
        }

        // Check early leave (uses global threshold; no per-employee exception requested)
        if (record.checkOut) {
          const checkOutDate = new Date(record.checkOut);
          const earlyMinutes = -getMinutesDiff(record.checkOut, expectedEnd);
          if (earlyMinutes > settings.lateThresholdMinutes) {
            const actualEarly = earlyMinutes - settings.lateThresholdMinutes;
            totalEarlyLeaveMinutes += actualEarly;
            earlyLeaveCount++;
            details.push({
              date: checkInDate.toISOString().split('T')[0],
              type: 'انصراف مبكر',
              minutes: actualEarly,
              checkOut: checkOutDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            });
          }
        }
      }

      // Calculate deductions if any violations
      if (totalLateMinutes > 0 || totalEarlyLeaveMinutes > 0) {
        const totalSalary = employee.basicSalary + employee.transportAllowance + 
                           employee.housingAllowance + employee.otherAllowances;
        const dailyRate = totalSalary / settings.workingDaysPerMonth;
        const hourlyRate = dailyRate / settings.workHoursPerDay;
        const minuteRate = hourlyRate / 60;

        const totalMinutes = totalLateMinutes + totalEarlyLeaveMinutes;
        const totalHours = totalMinutes / 60;
        const deductionAmount = totalMinutes * minuteRate;

        deductions.push({
          employeeId: employee.id,
          employeeName: employee.fullNameAr,
          employeeNumber: employee.employeeNumber,
          totalSalary,
          dailyRate: Math.round(dailyRate * 100) / 100,
          hourlyRate: Math.round(hourlyRate * 100) / 100,
          lateCount,
          earlyLeaveCount,
          totalLateMinutes,
          totalEarlyLeaveMinutes,
          totalMinutes,
          totalHours: Math.round(totalHours * 100) / 100,
          deductionAmount: Math.round(deductionAmount * 100) / 100,
          details
        });
      }
    }

    return NextResponse.json({ 
      deductions,
      settings: {
        workStartTime: settings.workStartTime,
        workEndTime: settings.workEndTime,
        lateThresholdMinutes: settings.lateThresholdMinutes,
        workHoursPerDay: settings.workHoursPerDay,
        workingDaysPerMonth: settings.workingDaysPerMonth,
      },
      summary: {
        totalEmployees: employees.length,
        employeesWithDeductions: deductions.length,
        totalDeductionAmount: deductions.reduce((sum, d) => sum + d.deductionAmount, 0)
      }
    });
  } catch (error) {
    console.error('Calculate deductions error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء حساب الخصومات' }, { status: 500 });
  }
}
