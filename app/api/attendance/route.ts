import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';

// GET /api/attendance - Get user's attendance records
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(await cookies());

    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || session.user.id;
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Check if user can view others' attendance (HR/Admin only)
    if (userId !== session.user.id && session.user.role !== 'ADMIN' && session.user.role !== 'HR_EMPLOYEE') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const where: any = { userId };

    if (date) {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      where.date = {
        gte: targetDate,
        lt: nextDay
      };
    } else if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const records = await prisma.attendanceRecord.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            username: true
          }
        },
        branch: {
          select: {
            id: true,
            name: true
          }
        },
        stage: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { date: 'desc' },
        { checkIn: 'desc' }
      ]
    });

    // Calculate total work hours per day (for multiple sessions)
    const recordsWithDailySummary = records.map(record => {
      return {
        ...record,
        workHours: record.workHours || null
      };
    });

    // Group by date and calculate daily totals
    const dailySummary: { [key: string]: { totalHours: number, sessionCount: number } } = {};
    records.forEach(record => {
      const dateKey = record.date.toISOString().split('T')[0];
      if (!dailySummary[dateKey]) {
        dailySummary[dateKey] = { totalHours: 0, sessionCount: 0 };
      }
      if (record.workHours) {
        dailySummary[dateKey].totalHours += record.workHours;
        dailySummary[dateKey].sessionCount += 1;
      }
    });

    return NextResponse.json({ 
      records: recordsWithDailySummary,
      dailySummary 
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب السجلات' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// POST /api/attendance - Check in/out
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(await cookies());

    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const { action, location } = body; // action: 'check-in' | 'check-out'

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check if there's an ACTIVE (uncompleted) record for today
    // Allow multiple sessions per day (check-in → check-out → check-in → check-out)
    const existingRecord = await prisma.attendanceRecord.findFirst({
      where: {
        userId: session.user.id,
        date: {
          gte: today,
          lt: tomorrow
        },
        checkOut: null // Only get records without check-out (active sessions)
      },
      orderBy: {
        checkIn: 'desc'
      }
    });

    const now = new Date();
    const settings = await prisma.attendanceSettings.findFirst();
    // Fallback defaults (may be overridden per branch/stage/employee)
    const globalWorkStartTime = settings?.workStartTime || '08:00';
    const globalLateThresholdMinutes = settings?.lateThresholdMinutes || 15;

    if (action === 'check-in') {
      // Prevent duplicate check-in if there's an active (uncompleted) session
      if (existingRecord) {
        return NextResponse.json({ 
          error: 'لديك جلسة حضور نشطة. يجب تسجيل الانصراف أولاً قبل بدء جلسة جديدة' 
        }, { status: 400 });
      }

      // Parse user's GPS location
      let userLat: number | null = null;
      let userLon: number | null = null;
      let distance: number | null = null;
      let employeeBranchId: string | null = null;
      let employeeStageId: string | null = null;

      if (location) {
        try {
          const [lat, lon] = location.split(',').map((s: string) => parseFloat(s.trim()));
          if (!isNaN(lat) && !isNaN(lon)) {
            userLat = lat;
            userLon = lon;
          }
        } catch (error) {
          console.error('Error parsing location:', error);
        }
      }

      // Get employee's assigned branch/stage
      const employee = await prisma.employee.findFirst({
        where: { userId: session.user.id },
        include: {
          branch: true,
          stage: true
        }
      });

      // Work schedule for lateness calculation (priority: stage override > branch > global settings)
      const workStartTime =
        employee?.stage?.workStartTime ||
        employee?.branch?.workStartTime ||
        globalWorkStartTime;

      // Morning grace override (minutes) (priority: employee override > global)
      const lateThresholdMinutes = employee?.morningGraceMinutes ?? globalLateThresholdMinutes;

      // Geofencing check - use employee's branch/stage location
      if (settings?.enableGeofencing && userLat && userLon && employee) {
        let targetLat: number | null = null;
        let targetLon: number | null = null;
        let maxDistance: number = 500; // default

        // Priority: Stage location > Branch location > global settings
        if (employee.stageId && employee.stage?.latitude && employee.stage?.longitude) {
          targetLat = employee.stage.latitude;
          targetLon = employee.stage.longitude;
          maxDistance = employee.stage.geofenceRadius || 100;
          employeeStageId = employee.stageId;
          employeeBranchId = employee.branchId;
        } else if (employee.branchId && employee.branch?.latitude && employee.branch?.longitude) {
          targetLat = employee.branch.latitude;
          targetLon = employee.branch.longitude;
          maxDistance = employee.branch.geofenceRadius || 100;
          employeeBranchId = employee.branchId;
        } else {
          // Fallback to global settings (old behavior)
          targetLat = settings.officeLatitude;
          targetLon = settings.officeLongitude;
          maxDistance = settings.maxDistanceMeters || 500;
        }

        if (targetLat && targetLon) {
          distance = calculateDistance(userLat, userLon, targetLat, targetLon);

          if (distance > maxDistance) {
            return NextResponse.json({ 
              error: `أنت خارج نطاق موقع عملك. المسافة: ${Math.round(distance)} متر (المسموح: ${maxDistance} متر)`,
              distance: Math.round(distance),
              maxDistance: maxDistance
            }, { status: 400 });
          }
        }
      } else if (employee) {
        // Even if geofencing is disabled, still save branch/stage info
        employeeBranchId = employee.branchId;
        employeeStageId = employee.stageId;

        // Calculate distance for display purposes (even if not enforcing)
        if (userLat && userLon) {
          let targetLat: number | null = null;
          let targetLon: number | null = null;

          if (employee.stageId && employee.stage?.latitude && employee.stage?.longitude) {
            targetLat = employee.stage.latitude;
            targetLon = employee.stage.longitude;
          } else if (employee.branchId && employee.branch?.latitude && employee.branch?.longitude) {
            targetLat = employee.branch.latitude;
            targetLon = employee.branch.longitude;
          }

          if (targetLat && targetLon) {
            distance = calculateDistance(userLat, userLon, targetLat, targetLon);
          }
        }
      }

      // Calculate if late - compare check-in time with work start time + threshold
      const [hours, minutes] = workStartTime.split(':').map(Number);
      
      // Create work start time for TODAY
      const workStart = new Date(now);
      workStart.setHours(hours, minutes, 0, 0);
      
      // Calculate late threshold (work start + late threshold minutes)
      const lateThreshold = new Date(workStart.getTime() + lateThresholdMinutes * 60 * 1000);

      // Determine status based on check-in time
      // If checking in AFTER the late threshold, mark as LATE
      const status = now > lateThreshold ? 'LATE' : 'PRESENT';

      const record = await prisma.attendanceRecord.create({
        data: {
          userId: session.user.id,
          checkIn: now,
          date: today,
          status,
          location: location || null,
          latitude: userLat,
          longitude: userLon,
          distanceFromBranch: distance ? Math.round(distance) : null,
          branchId: employeeBranchId,
          stageId: employeeStageId
        },
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              username: true
            }
          },
          branch: {
            select: {
              id: true,
              name: true
            }
          },
          stage: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      let message = status === 'LATE' ? 'تم تسجيل الحضور (متأخر)' : 'تم تسجيل الحضور بنجاح';
      if (distance !== null) {
        message += ` - المسافة: ${Math.round(distance)} متر`;
      }

      return NextResponse.json({ 
        record,
        message,
        distance: distance ? Math.round(distance) : null
      });
    } else if (action === 'check-out') {
      if (!existingRecord) {
        return NextResponse.json({ 
          error: 'لم تسجل الحضور اليوم أو قمت بتسجيل الانصراف بالفعل' 
        }, { status: 400 });
      }

      // This shouldn't happen anymore (since we filter by checkOut: null)
      // But keep it as a safety check
      if (existingRecord.checkOut) {
        return NextResponse.json({ 
          error: 'لقد سجلت الانصراف بالفعل لهذه الجلسة' 
        }, { status: 400 });
      }

      // Calculate work hours
      const checkInTime = new Date(existingRecord.checkIn);
      const diffMs = now.getTime() - checkInTime.getTime();
      const workHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));

      const record = await prisma.attendanceRecord.update({
        where: { id: existingRecord.id },
        data: {
          checkOut: now,
          workHours
        },
        include: {
          user: {
            select: {
              id: true,
              displayName: true,
              username: true
            }
          },
          branch: {
            select: {
              id: true,
              name: true
            }
          },
          stage: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      return NextResponse.json({ 
        record,
        message: 'تم تسجيل الانصراف بنجاح'
      });
    }

    return NextResponse.json({ error: 'إجراء غير صالح' }, { status: 400 });
  } catch (error) {
    console.error('Error in attendance action:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء العملية' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
