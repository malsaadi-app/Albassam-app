import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { hasPermission } from '@/lib/permissions-server';

// GET /api/attendance/settings - Get attendance settings
export async function GET() {
  try {
    const session = await getSession(await cookies());

    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    // Check permission
    if (!hasPermission(session.user, 'attendance.manage')) {
      return NextResponse.json({ error: 'ليس لديك صلاحية إدارة الإعدادات' }, { status: 403 });
    }

    // Get or create default settings
    let settings = await prisma.attendanceSettings.findFirst();

    if (!settings) {
      settings = await prisma.attendanceSettings.create({
        data: {
          lateThresholdMinutes: 15,
          workHoursPerDay: 8,
          workingDaysPerMonth: 22,
          workStartTime: '08:00',
          workEndTime: '16:00',
          requireCheckOut: true,
          enableGpsTracking: false,
          enableGeofencing: false,
          maxDistanceMeters: 500,
        }
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب الإعدادات' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// PUT /api/attendance/settings - Update attendance settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession(await cookies());

    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    // Check permission
    if (!hasPermission(session.user, 'attendance.manage')) {
      return NextResponse.json({ error: 'ليس لديك صلاحية إدارة الإعدادات' }, { status: 403 });
    }

    const body = await request.json();
    const {
      lateThresholdMinutes,
      workHoursPerDay,
      workingDaysPerMonth,
      workStartTime,
      workEndTime,
      requireCheckOut,
      enableGpsTracking,
      enableGeofencing,
      officeLatitude,
      officeLongitude,
      maxDistanceMeters,
    } = body;

    // Validate
    if (lateThresholdMinutes < 0 || lateThresholdMinutes > 120) {
      return NextResponse.json({ error: 'حد التأخير يجب أن يكون بين 0 و 120 دقيقة' }, { status: 400 });
    }

    if (workHoursPerDay < 1 || workHoursPerDay > 24) {
      return NextResponse.json({ error: 'ساعات العمل يجب أن تكون بين 1 و 24 ساعة' }, { status: 400 });
    }

    // Get or create settings
    let settings = await prisma.attendanceSettings.findFirst();

    if (settings) {
      // Update existing
      settings = await prisma.attendanceSettings.update({
        where: { id: settings.id },
        data: {
          lateThresholdMinutes: parseInt(lateThresholdMinutes),
          workHoursPerDay: parseFloat(workHoursPerDay),
          workingDaysPerMonth: parseInt(workingDaysPerMonth),
          workStartTime,
          workEndTime,
          requireCheckOut,
          enableGpsTracking,
          enableGeofencing,
          officeLatitude: officeLatitude ? parseFloat(officeLatitude) : null,
          officeLongitude: officeLongitude ? parseFloat(officeLongitude) : null,
          maxDistanceMeters: parseInt(maxDistanceMeters),
        }
      });
    } else {
      // Create new
      settings = await prisma.attendanceSettings.create({
        data: {
          lateThresholdMinutes: parseInt(lateThresholdMinutes),
          workHoursPerDay: parseFloat(workHoursPerDay),
          workingDaysPerMonth: parseInt(workingDaysPerMonth),
          workStartTime,
          workEndTime,
          requireCheckOut,
          enableGpsTracking,
          enableGeofencing,
          officeLatitude: officeLatitude ? parseFloat(officeLatitude) : null,
          officeLongitude: officeLongitude ? parseFloat(officeLongitude) : null,
          maxDistanceMeters: parseInt(maxDistanceMeters),
        }
      });
    }

    return NextResponse.json({ 
      settings,
      message: 'تم حفظ الإعدادات بنجاح' 
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء حفظ الإعدادات' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
