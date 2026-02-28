import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { getPendingApprovals } from '@/lib/dashboard/pendingApprovals'

export async function GET() {
  try {
    const session = await getSession(await cookies());
    
    if (!session?.user) {
      return NextResponse.json({
        pendingApprovals: 0,
        unreadNotifications: 0
      });
    }

    const user = session.user;

    // Pending approvals for the current user (across modules)
    const { total: pendingApprovals } = await getPendingApprovals({
      userId: user.id,
      userRole: user.role,
      take: 1
    })

    // Count unread notifications
    const unreadNotifications = await prisma.notification.count({
      where: {
        userId: user.id,
        isRead: false
      }
    });

    return NextResponse.json({
      pendingApprovals,
      unreadNotifications
    });

  } catch (error) {
    console.error('Error fetching sidebar counts:', error);
    return NextResponse.json({
      pendingApprovals: 0,
      unreadNotifications: 0
    });
  }
}
