import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * POST /api/workflows/approvals/refer/respond
 * Respond to a referral request
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { referralId, referredToId, response } = body;

    if (!referralId || !referredToId || !response) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify referral exists
    const referral = await prisma.workflowReferral.findUnique({
      where: { id: referralId },
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

    if (!referral) {
      return NextResponse.json(
        { error: 'Referral not found' },
        { status: 404 }
      );
    }

    // Verify user is the referred person
    if (referral.referredToId !== referredToId) {
      return NextResponse.json(
        { error: 'You are not authorized to respond to this referral' },
        { status: 403 }
      );
    }

    if (referral.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'This referral has already been responded to' },
        { status: 400 }
      );
    }

    // Update referral
    const updated = await prisma.workflowReferral.update({
      where: { id: referralId },
      data: {
        response,
        status: 'COMPLETED',
        respondedAt: new Date()
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

    // TODO: Send notification to requester

    return NextResponse.json({
      referral: updated,
      message: 'تم تسجيل الرد على الإحالة بنجاح'
    });

  } catch (error: any) {
    console.error('Error responding to referral:', error);
    return NextResponse.json(
      { error: 'Failed to respond to referral', details: error?.message },
      { status: 500 }
    );
  }
}
