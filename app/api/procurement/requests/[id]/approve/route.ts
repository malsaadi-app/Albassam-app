import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/db';

// POST /api/procurement/requests/[id]/approve - Approve purchase request
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getSession(await cookies());
    if (!session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can approve
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can approve purchase requests' },
        { status: 403 }
      );
    }

    const purchaseRequest = await prisma.purchaseRequest.findUnique({
      where: { id: id },
      include: {
        requestedBy: true
      }
    });

    if (!purchaseRequest) {
      return NextResponse.json(
        { error: 'Purchase request not found' },
        { status: 404 }
      );
    }

    if (!['PENDING_REVIEW', 'REVIEWED'].includes(purchaseRequest.status)) {
      return NextResponse.json(
        { error: 'Request cannot be approved in current status' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { notes } = body;

    const updated = await prisma.purchaseRequest.update({
      where: { id: id },
      data: {
        status: 'APPROVED',
        approvedById: session.user.id,
        approvedAt: new Date(),
        approvalNotes: notes || null,
        // If not reviewed yet, mark as reviewed too
        ...(purchaseRequest.status === 'PENDING_REVIEW' && {
          reviewedById: session.user.id,
          reviewedAt: new Date()
        })
      },
      include: {
        requestedBy: {
          select: {
            id: true,
            displayName: true,
            username: true
          }
        },
        reviewedBy: {
          select: {
            id: true,
            displayName: true,
            username: true
          }
        },
        approvedBy: {
          select: {
            id: true,
            displayName: true,
            username: true
          }
        }
      }
    });

    // Notify requester
    await prisma.notification.create({
      data: {
        userId: purchaseRequest.requestedById,
        title: 'تمت الموافقة على طلب الشراء',
        message: `تمت الموافقة على طلب الشراء ${purchaseRequest.requestNumber} من قبل ${session.user.displayName}`,
        type: 'PURCHASE_REQUEST',
        relatedId: purchaseRequest.id
      }
    });

    return NextResponse.json({
      success: true,
      request: {
        ...updated,
        items: JSON.parse(updated.items),
        attachments: updated.attachments ? JSON.parse(updated.attachments) : []
      }
    });
  } catch (error) {
    console.error('Error approving purchase request:', error);
    return NextResponse.json(
      { error: 'Failed to approve purchase request' },
      { status: 500 }
    );
  }
}
