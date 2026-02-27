import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(await cookies());
    
    if (!session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    // Get existing settings or return defaults
    const settings = await prisma.hRWorkflowSettings.findFirst({
      orderBy: { updatedAt: 'desc' }
    });

    if (!settings) {
      // Return defaults if no settings exist yet
      return NextResponse.json({
        reviewerUserId: null,
        approverUserId: null,
        requireReview: true,
        requireApproval: true,
        autoApproveLeave: false,
        autoApproveTravel: false,
        autoApproveSalary: false,
        reviewTimeoutDays: 3,
        approvalTimeoutDays: 3
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching HR workflow settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(await cookies());
    
    if (!session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    const body = await request.json();

    // Delete existing settings (we only keep one record)
    await prisma.hRWorkflowSettings.deleteMany({});

    // Create new settings
    const settings = await prisma.hRWorkflowSettings.create({
      data: {
        reviewerUserId: body.reviewerUserId || null,
        approverUserId: body.approverUserId || null,
        requireReview: body.requireReview ?? true,
        requireApproval: body.requireApproval ?? true,
        autoApproveLeave: body.autoApproveLeave ?? false,
        autoApproveTravel: body.autoApproveTravel ?? false,
        autoApproveSalary: body.autoApproveSalary ?? false,
        reviewTimeoutDays: body.reviewTimeoutDays || 3,
        approvalTimeoutDays: body.approvalTimeoutDays || 3,
        updatedBy: session.user.id
      }
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error saving HR workflow settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}
