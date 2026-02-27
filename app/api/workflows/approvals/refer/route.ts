import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * POST /api/workflows/approvals/refer
 * Refer approval to another user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { approvalId, referredToId, referredById, priority, comments } = body;

    if (!approvalId || !referredToId || !referredById) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify approval exists and is pending
    const approval = await prisma.workflowApprovalLog.findUnique({
      where: { id: approvalId },
      include: {
        step: {
          include: {
            workflow: true
          }
        }
      }
    });

    if (!approval) {
      return NextResponse.json(
        { error: 'Approval not found' },
        { status: 404 }
      );
    }

    if (approval.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Approval is not pending' },
        { status: 400 }
      );
    }

    // Verify requester is the approver
    if (approval.approverId !== referredById) {
      return NextResponse.json(
        { error: 'Only the assigned approver can refer to others' },
        { status: 403 }
      );
    }

    // Create referral
    const referral = await prisma.workflowReferral.create({
      data: {
        approvalId,
        referredToId,
        referredById,
        priority: priority || 'NORMAL',
        comments
      },
      include: {
        referredTo: {
          select: {
            id: true,
            displayName: true
          }
        },
        referredBy: {
          select: {
            id: true,
            displayName: true
          }
        }
      }
    });

    // TODO: Send notification to referred user

    return NextResponse.json({
      referral,
      message: `تم إحالة الطلب إلى ${referral.referredTo.displayName}`
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating referral:', error);
    return NextResponse.json(
      { error: 'Failed to create referral', details: error?.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/workflows/approvals/refer?referredToId=xxx
 * Get referrals for a user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const referredToId = searchParams.get('referredToId');
    const status = searchParams.get('status');

    if (!referredToId) {
      return NextResponse.json(
        { error: 'referredToId is required' },
        { status: 400 }
      );
    }

    const where: any = { referredToId };
    if (status) where.status = status;

    const referrals = await prisma.workflowReferral.findMany({
      where,
      include: {
        approval: {
          include: {
            step: {
              include: {
                workflow: true
              }
            }
          }
        },
        referredTo: {
          select: {
            id: true,
            displayName: true
          }
        },
        referredBy: {
          select: {
            id: true,
            displayName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      referrals,
      count: referrals.length
    });

  } catch (error: any) {
    console.error('Error fetching referrals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch referrals', details: error?.message },
      { status: 500 }
    );
  }
}
