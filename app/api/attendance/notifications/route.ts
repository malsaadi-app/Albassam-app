import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { hasPermission } from '@/lib/permissions-server';

interface AttendanceNotification {
  id: string;
  type: 'reminder' | 'warning' | 'info';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  actionUrl?: string;
  actionLabel?: string;
}

// GET /api/attendance/notifications - Get attendance notifications
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(await cookies());

    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    if (!(await hasPermission(session.user.id, 'attendance.view_own'))) {
      return NextResponse.json({ error: 'ليس لديك صلاحية' }, { status: 403 });
    }

    const notifications: AttendanceNotification[] = [];

    // Check if user checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayRecord = await prisma.attendanceRecord.findFirst({
      where: {
        userId: session.user.id,
        date: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();

    // Reminder: Haven't checked in yet (after 8:30 AM)
    if (!todayRecord && currentHour >= 8 && (currentHour > 8 || currentMinutes >= 30)) {
      notifications.push({
        id: 'no-checkin-today',
        type: 'reminder',
        title: '⏰ تذكير: لم تسجل حضورك بعد',
        message: 'يرجى تسجيل الدخول في أقرب وقت ممكن.',
        priority: 'high',
        actionUrl: '/attendance',
        actionLabel: 'تسجيل الآن'
      });
    }

    // Warning: Checked in but didn't check out (after 5 PM)
    if (todayRecord && !todayRecord.checkOut && currentHour >= 17) {
      notifications.push({
        id: 'no-checkout-today',
        type: 'warning',
        title: '🔔 تنبيه: لم تسجل خروجك',
        message: 'لا تنسى تسجيل الانصراف قبل المغادرة.',
        priority: 'medium',
        actionUrl: '/attendance',
        actionLabel: 'تسجيل الخروج'
      });
    }

    // Info: Late check-in today
    if (todayRecord && todayRecord.status === 'LATE' && todayRecord.minutesLate > 0) {
      notifications.push({
        id: 'late-today',
        type: 'info',
        title: '📝 تأخير اليوم',
        message: `تم تسجيل تأخير ${todayRecord.minutesLate} دقيقة. يمكنك تقديم تبرير إذا لزم الأمر.`,
        priority: 'low',
        actionUrl: '/hr/attendance/requests/new',
        actionLabel: 'تقديم تبرير'
      });
    }

    // Check for pending attendance requests
    const pendingRequests = await prisma.attendanceRequest.findMany({
      where: {
        userId: session.user.id,
        status: 'PENDING'
      }
    });

    if (pendingRequests.length > 0) {
      notifications.push({
        id: 'pending-requests',
        type: 'info',
        title: '📋 طلبات معلقة',
        message: `لديك ${pendingRequests.length} طلب معلق في انتظار المراجعة.`,
        priority: 'low',
        actionUrl: '/hr/attendance/requests',
        actionLabel: 'عرض الطلبات'
      });
    }

    // Check late pattern (3+ late days in last 7 days)
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentRecords = await prisma.attendanceRecord.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: sevenDaysAgo,
          lt: tomorrow
        }
      }
    });

    const lateDaysCount = recentRecords.filter(r => r.status === 'LATE').length;
    if (lateDaysCount >= 3) {
      notifications.push({
        id: 'late-pattern',
        type: 'warning',
        title: '⚠️ ملاحظة: تكرار التأخير',
        message: `لديك ${lateDaysCount} أيام تأخير في الأسبوع الماضي. يرجى الحرص على الوصول في الوقت المحدد.`,
        priority: 'medium'
      });
    }

    return NextResponse.json({
      notifications,
      count: notifications.length,
      hasHighPriority: notifications.some(n => n.priority === 'high')
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب الإشعارات' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
