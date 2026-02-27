import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/db';

// GET /api/procurement/requests/[id] - Get purchase request details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getSession(await cookies());
    if (!session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const purchaseRequest = await prisma.purchaseRequest.findUnique({
      where: { id },
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

    if (!purchaseRequest) {
      return NextResponse.json(
        { error: 'Purchase request not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (
      session.user.role !== 'ADMIN' && 
      purchaseRequest.requestedById !== session.user.id
    ) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      request: {
        ...purchaseRequest,
        items: JSON.parse(purchaseRequest.items),
        attachments: purchaseRequest.attachments ? JSON.parse(purchaseRequest.attachments) : []
      }
    });
  } catch (error) {
    console.error('Error fetching purchase request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch purchase request' },
      { status: 500 }
    );
  }
}

// PATCH /api/procurement/requests/[id] - Update purchase request
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getSession(await cookies());
    if (!session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const purchaseRequest = await prisma.purchaseRequest.findUnique({
      where: { id }
    });

    if (!purchaseRequest) {
      return NextResponse.json(
        { error: 'Purchase request not found' },
        { status: 404 }
      );
    }

    // Only creator can edit, and only if status is PENDING_REVIEW
    if (purchaseRequest.requestedById !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    if (purchaseRequest.status !== 'PENDING_REVIEW') {
      return NextResponse.json(
        { error: 'Cannot edit request after review' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      department,
      category,
      items,
      priority,
      justification,
      attachments,
      estimatedBudget,
      requiredDate
    } = body;

    const updated = await prisma.purchaseRequest.update({
      where: { id },
      data: {
        ...(department && { department }),
        ...(category && { category }),
        ...(items && { items: JSON.stringify(items) }),
        ...(priority && { priority }),
        ...(justification !== undefined && { justification }),
        ...(attachments && { attachments: JSON.stringify(attachments) }),
        ...(estimatedBudget !== undefined && { 
          estimatedBudget: estimatedBudget ? parseFloat(estimatedBudget) : null 
        }),
        ...(requiredDate !== undefined && { 
          requiredDate: requiredDate ? new Date(requiredDate) : null 
        })
      },
      include: {
        requestedBy: {
          select: {
            id: true,
            displayName: true,
            username: true
          }
        }
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
    console.error('Error updating purchase request:', error);
    return NextResponse.json(
      { error: 'Failed to update purchase request' },
      { status: 500 }
    );
  }
}

// DELETE /api/procurement/requests/[id] - Cancel/delete purchase request
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getSession(await cookies());
    if (!session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const purchaseRequest = await prisma.purchaseRequest.findUnique({
      where: { id }
    });

    if (!purchaseRequest) {
      return NextResponse.json(
        { error: 'Purchase request not found' },
        { status: 404 }
      );
    }

    // Only creator or admin can cancel
    if (
      purchaseRequest.requestedById !== session.user.id &&
      session.user.role !== 'ADMIN'
    ) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Cannot cancel if already approved or completed
    if (['APPROVED', 'COMPLETED'].includes(purchaseRequest.status)) {
      return NextResponse.json(
        { error: 'Cannot cancel approved or completed request' },
        { status: 400 }
      );
    }

    await prisma.purchaseRequest.update({
      where: { id },
      data: {
        status: 'CANCELLED'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Purchase request cancelled'
    });
  } catch (error) {
    console.error('Error cancelling purchase request:', error);
    return NextResponse.json(
      { error: 'Failed to cancel purchase request' },
      { status: 500 }
    );
  }
}
