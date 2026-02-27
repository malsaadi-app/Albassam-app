import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession(await cookies());
    
    if (!session?.user) {
      return NextResponse.json({ 
        pendingRequests: 0,
        unreadNotifications: 0 
      });
    }

    const user = session.user;

    // Count pending HR requests (for HR_EMPLOYEE/ADMIN)
    let pendingRequests = 0;
    if (user.role === 'ADMIN' || user.role === 'HR_EMPLOYEE') {
      pendingRequests = await prisma.hRRequest.count({
        where: {
          status: {
            in: ['PENDING_REVIEW', 'PENDING_APPROVAL']
          }
        }
      });
    }

    // Count unread notifications
    const unreadNotifications = await prisma.notification.count({
      where: {
        userId: user.id,
        isRead: false
      }
    });

    return NextResponse.json({
      pendingRequests,
      unreadNotifications
    });

  } catch (error) {
    console.error('Error fetching sidebar counts:', error);
    return NextResponse.json({ 
      pendingRequests: 0,
      unreadNotifications: 0 
    });
  }
}
