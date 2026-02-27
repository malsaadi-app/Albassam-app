import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

// GET /api/settings/attendance
export async function GET() {
  try {
    const session = await getSession(await cookies());
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

    let settings = await prisma.attendanceSettings.findFirst();
    
    // Create default if not exists
    if (!settings) {
      settings = await prisma.attendanceSettings.create({
        data: {}
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Get attendance settings error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}

// PATCH /api/settings/attendance
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession(await cookies());
    if (!session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const body = await request.json();
    
    let settings = await prisma.attendanceSettings.findFirst();
    
    const data: any = {};
    if (typeof body.workStartTime === 'string') data.workStartTime = body.workStartTime;
    if (typeof body.workEndTime === 'string') data.workEndTime = body.workEndTime;
    if (typeof body.lateThresholdMinutes === 'number') data.lateThresholdMinutes = body.lateThresholdMinutes;
    if (typeof body.workHoursPerDay === 'number') data.workHoursPerDay = body.workHoursPerDay;
    if (typeof body.workingDaysPerMonth === 'number') data.workingDaysPerMonth = body.workingDaysPerMonth;
    if (typeof body.requireCheckOut === 'boolean') data.requireCheckOut = body.requireCheckOut;
    if (typeof body.enableGpsTracking === 'boolean') data.enableGpsTracking = body.enableGpsTracking;
    if (typeof body.enableGeofencing === 'boolean') data.enableGeofencing = body.enableGeofencing;
    if (typeof body.officeLatitude === 'number') data.officeLatitude = body.officeLatitude;
    if (typeof body.officeLongitude === 'number') data.officeLongitude = body.officeLongitude;
    if (typeof body.maxDistanceMeters === 'number') data.maxDistanceMeters = body.maxDistanceMeters;

    if (settings) {
      settings = await prisma.attendanceSettings.update({
        where: { id: settings.id },
        data
      });
    } else {
      settings = await prisma.attendanceSettings.create({
        data
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Update attendance settings error:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  }
}
