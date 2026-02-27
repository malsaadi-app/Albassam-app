import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';


// GET /api/notifications - Get user notifications
export async function GET(request: NextRequest) {
  try {
    const session = await getSession(await cookies());

    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {
      userId: session.user.id
    };

    if (unreadOnly) {
      where.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId: session.user.id,
        isRead: false
      }
    });

    return NextResponse.json({
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب الإشعارات' },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Mark notification(s) as read
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(await cookies());

    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const { notificationId, markAllAsRead } = body;

    if (markAllAsRead) {
      // Mark all notifications as read
      await prisma.notification.updateMany({
        where: {
          userId: session.user.id,
          isRead: false
        },
        data: {
          isRead: true
        }
      });

      return NextResponse.json({ success: true, message: 'تم تحديد جميع الإشعارات كمقروءة' });
    } else if (notificationId) {
      // Mark specific notification as read
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId }
      });

      if (!notification) {
        return NextResponse.json({ error: 'الإشعار غير موجود' }, { status: 404 });
      }

      if (notification.userId !== session.user.id) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
      }

      await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true }
      });

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'يجب تحديد notificationId أو markAllAsRead' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحديث الإشعار' },
      { status: 500 }
    );
  }
}
