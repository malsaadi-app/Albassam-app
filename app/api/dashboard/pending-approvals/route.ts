import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/session'
import { getPendingApprovals } from '@/lib/dashboard/pendingApprovals'

// GET /api/dashboard/pending-approvals - الطلبات المعلقة التي تحتاج موافقة
export async function GET() {
  try {
    const session = await getSession(await cookies())

    if (!session.user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const { approvals, total } = await getPendingApprovals({
      userId: session.user.id,
      userRole: session.user.role,
      take: 20
    })

    return NextResponse.json({ approvals, total })
  } catch (error) {
    console.error('Error fetching pending approvals:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب البيانات' }, { status: 500 })
  }
}
