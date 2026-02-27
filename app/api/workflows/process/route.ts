/**
 * POST /api/workflows/process
 * Process (approve/reject) a workflow step
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { requireAuth } from '@/lib/auth';
import { canApprove } from '@/lib/workflow-auth';
import { approveStep, rejectStep } from '@/lib/workflow-engine';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const authResult = await requireAuth(cookieStore);

  if (authResult.error) {
    return authResult.error;
  }

  const userId = authResult.session?.user?.id;

  try {
    const body = await request.json();
    const { logId, action, comments } = body;

    if (!logId || !action) {
      return NextResponse.json(
        { error: 'البيانات ناقصة' },
        { status: 400 }
      );
    }

    // Check authorization
    const authorized = await canApprove(userId, logId);
    if (!authorized) {
      return NextResponse.json(
        { error: 'ليس لديك صلاحية' },
        { status: 403 }
      );
    }

    // Process action
    if (action === 'approve') {
      await approveStep(logId, userId, comments);
    } else if (action === 'reject') {
      if (!comments) {
        return NextResponse.json(
          { error: 'يجب إدخال سبب الرفض' },
          { status: 400 }
        );
      }
      await rejectStep(logId, userId, comments);
    } else {
      return NextResponse.json(
        { error: 'إجراء غير صالح' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing workflow:', error);
    return NextResponse.json(
      { error: 'فشل معالجة الطلب' },
      { status: 500 }
    );
  }
}
