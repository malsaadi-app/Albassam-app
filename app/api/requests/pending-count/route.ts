import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/db';

// GET /api/requests/pending-count - Get count of pending requests awaiting user action
export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const userId = session.user.id;

    // Count HR Requests awaiting review or approval
    // (Those in pending status that may need action from this user)
    const hrRequests = await prisma.hRRequest.count({
      where: {
        status: {
          in: ['PENDING_REVIEW', 'PENDING_APPROVAL']
        }
      }
    });

    // Count Maintenance Requests awaiting action
    const maintenanceRequests = await prisma.maintenanceRequest.count({
      where: {
        status: {
          in: ['SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED']
        }
      }
    });

    // Count Purchase Requests awaiting review or approval
    const purchaseRequests = await prisma.purchaseRequest.count({
      where: {
        status: {
          in: ['PENDING_REVIEW', 'REVIEWED']
        }
      }
    });

    // Count Attendance Requests pending review
    const attendanceRequests = await prisma.attendanceRequest.count({
      where: {
        status: 'PENDING'
      }
    });

    const total = hrRequests + maintenanceRequests + purchaseRequests + attendanceRequests;

    return NextResponse.json({
      total,
      breakdown: {
        hr: hrRequests,
        maintenance: maintenanceRequests,
        purchase: purchaseRequests,
        attendance: attendanceRequests
      }
    });
  } catch (error) {
    console.error('Error fetching pending requests count:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
