import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { z } from 'zod';


const settingsSchema = z.object({
  lateThresholdMinutes: z.number().min(0).max(120),
  workHoursPerDay: z.number().min(1).max(24),
  workStartTime: z.string().regex(/^\d{2}:\d{2}$/),
  workEndTime: z.string().regex(/^\d{2}:\d{2}$/),
  requireCheckOut: z.boolean(),
  enableGpsTracking: z.boolean(),
  enableGeofencing: z.boolean(),
  officeLatitude: z.number().nullable().optional(),
  officeLongitude: z.number().nullable().optional(),
  maxDistanceMeters: z.number().min(10).max(10000).optional()
});

// GET /api/hr/attendance/settings - Get attendance settings
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(await cookies());

    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const settings = await prisma.attendanceSettings.findFirst();

    if (!settings) {
      // Create default settings if none exist
      const defaultSettings = await prisma.attendanceSettings.create({
        data: {
          lateThresholdMinutes: 15,
          workHoursPerDay: 8,
          workStartTime: '08:00',
          workEndTime: '16:00',
          requireCheckOut: true,
          enableGpsTracking: false
        }
      });
      return NextResponse.json({ settings: defaultSettings });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching attendance settings:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب الإعدادات' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// PUT /api/hr/attendance/settings - Update attendance settings (Admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession(await cookies());

    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح - المسؤول فقط' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = settingsSchema.parse(body);

    // Get existing settings
    const existingSettings = await prisma.attendanceSettings.findFirst();

    let settings;
    if (existingSettings) {
      settings = await prisma.attendanceSettings.update({
        where: { id: existingSettings.id },
        data: validatedData
      });
    } else {
      settings = await prisma.attendanceSettings.create({
        data: validatedData
      });
    }

    return NextResponse.json({ 
      settings,
      message: 'تم تحديث الإعدادات بنجاح'
    });
  } catch (error: any) {
    console.error('Error updating attendance settings:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'بيانات غير صالحة',
        details: error.errors 
      }, { status: 400 });
    }

    return NextResponse.json({ error: 'حدث خطأ أثناء تحديث الإعدادات' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
