import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/session'
import { runReplacementNotificationsCron } from '@/lib/replacementService'

// Can be called by an authenticated admin/HR user, or by an external cron with a secret header.
// If you want to lock it down further, set REPLACEMENTS_CRON_SECRET in env.
export async function POST(req: NextRequest) {
  try {
    const secret = process.env.REPLACEMENTS_CRON_SECRET
    const headerSecret = req.headers.get('x-cron-secret')

    if (secret && headerSecret === secret) {
      const result = await runReplacementNotificationsCron(new Date())
      return NextResponse.json({ ok: true, ...result })
    }

    const session = await getSession(await cookies())
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    if (session.user.role !== 'ADMIN' && session.user.role !== 'HR_EMPLOYEE') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    const result = await runReplacementNotificationsCron(new Date())
    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    console.error('POST /api/replacements/cron error', e)
    return NextResponse.json({ error: 'حدث خطأ أثناء تشغيل التنبيهات' }, { status: 500 })
  }
}
