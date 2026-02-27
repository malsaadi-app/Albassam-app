import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/db';

// POST /api/procurement/requests/[id]/review - Review purchase request
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

    // Only admins can review
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Only admins can review purchase requests' },
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

    if (purchaseRequest.status !== 'PENDING_REVIEW') {
      return NextResponse.json(
        { error: 'Request has already been reviewed' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { notes } = body;

    const updated = await prisma.purchaseRequest.update({
      where: { id: id },
      data: {
        status: 'REVIEWED',
        reviewedById: session.user.id,
        reviewedAt: new Date(),
        reviewNotes: notes || null
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
        }
      }
    });

    // Notify requester
    await prisma.notification.create({
      data: {
        userId: purchaseRequest.requestedById,
        title: 'تمت مراجعة طلب الشراء',
        message: `تمت مراجعة طلب الشراء ${purchaseRequest.requestNumber} من قبل ${session.user.displayName}`,
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
    console.error('Error reviewing purchase request:', error);
    return NextResponse.json(
      { error: 'Failed to review purchase request' },
      { status: 500 }
    );
  }
}
