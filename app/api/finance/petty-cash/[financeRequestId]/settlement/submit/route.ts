import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(_request: NextRequest, { params }: { params: Promise<{ financeRequestId: string }> }) {
  try {
    const session = await getSession(await cookies())
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const { financeRequestId } = await params

    const fr = await prisma.financeRequest.findUnique({ where: { id: financeRequestId } })
    if (!fr) return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 })

    const uid = session.user.id
    if (fr.requesterId !== uid && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    const settlement = await prisma.pettyCashSettlement.findUnique({
      where: { financeRequestId },
      include: { items: true }
    })

    if (!settlement) return NextResponse.json({ error: 'لا توجد تسوية' }, { status: 400 })

    if (!settlement.items.length) {
      return NextResponse.json({ error: 'لا يمكن إرسال تسوية بدون بنود' }, { status: 400 })
    }

    const updated = await prisma.pettyCashSettlement.update({
      where: { financeRequestId },
      data: { status: 'SUBMITTED', submittedAt: new Date(), rejectionReason: null }
    })

    return NextResponse.json({ success: true, settlement: updated })
  } catch (e) {
    console.error('POST settlement submit error', e)
    return NextResponse.json({ error: 'حدث خطأ أثناء الإرسال' }, { status: 500 })
  }
}
