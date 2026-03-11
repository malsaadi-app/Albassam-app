import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/session';
import { manualEscalation } from '@/lib/cron/workflow-escalation';

/**
 * POST /api/workflows/escalate
 * Manually trigger workflow escalation (admin only)
 */
export async function POST() {
  try {
    const session = await getSession(await cookies());
    
    if (!session.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'غير مصرح - مطلوب صلاحيات مدير' }, { status: 403 });
    }

    console.log('[Workflow Escalation] Manual trigger by:', session.user.username);

    const result = await manualEscalation();

    return NextResponse.json({
      success: true,
      escalated: result.escalated,
      ids: result.ids,
      message: result.escalated > 0 
        ? `تم تصعيد ${result.escalated} طلب بنجاح`
        : 'لا توجد طلبات تحتاج تصعيد'
    });
  } catch (error: any) {
    console.error('[Workflow Escalation] Error:', error);
    return NextResponse.json(
      { error: error.message || 'حدث خطأ أثناء التصعيد' },
      { status: 500 }
    );
  }
}
