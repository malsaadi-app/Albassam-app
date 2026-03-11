import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/db';

// GET /api/requests/pending-count - Get count of pending requests awaiting CURRENT USER action
export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const userId = session.user.id;

    // Count workflow runtime approvals that are:
    // 1. Status = PENDING
    // 2. Assigned to current user (approverId)
    // NOTE: Using NEW workflow system (WorkflowRuntimeApproval)
    
    const pendingApprovals = await prisma.workflowRuntimeApproval.findMany({
      where: {
        approverId: userId,
        status: 'PENDING'
      },
      select: {
        requestType: true
      }
    });

    // Count by type
    let hrCount = 0;
    let maintenanceCount = 0;
    let purchaseCount = 0;
    let attendanceCount = 0;

    for (const approval of pendingApprovals) {
      const type = approval.requestType;
      
      // Map request types to categories
      if (type === 'HR_REQUEST' || type.startsWith('LEAVE') || type.startsWith('HR_')) {
        hrCount++;
      } else if (type === 'MAINTENANCE_REQUEST' || type.startsWith('MAINTENANCE')) {
        maintenanceCount++;
      } else if (type === 'PURCHASE_REQUEST' || type.startsWith('PURCHASE') || type.startsWith('PROCUREMENT')) {
        purchaseCount++;
      } else if (type.includes('ATTENDANCE') || type === 'ATTENDANCE_CORRECTION') {
        attendanceCount++;
      } else {
        // Unknown type - add to HR by default
        hrCount++;
      }
    }

    const total = hrCount + maintenanceCount + purchaseCount + attendanceCount;

    return NextResponse.json({
      total,
      breakdown: {
        hr: hrCount,
        maintenance: maintenanceCount,
        purchase: purchaseCount,
        attendance: attendanceCount
      }
    });
  } catch (error) {
    console.error('Error fetching pending requests count:', error);
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
