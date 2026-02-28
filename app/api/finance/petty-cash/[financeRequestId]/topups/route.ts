import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'

// POST create top-up request
export async function POST(request: NextRequest, { params }: { params: Promise<{ financeRequestId: string }> }) {
  try {
    const session = await getSession(await cookies())
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const { financeRequestId } = await params
    const fr = await prisma.financeRequest.findUnique({ where: { id: financeRequestId } })
    if (!fr) return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 })

    if (fr.type !== 'PETTY_CASH') return NextResponse.json({ error: 'ليس طلب عهدة' }, { status: 400 })

    if (fr.status !== 'PAID') {
      return NextResponse.json({ error: 'لا يمكن طلب زيادة قبل صرف العهدة' }, { status: 400 })
    }

    const uid = session.user.id
    if (fr.requesterId !== uid && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    const body = await request.json()
    const amount = Number(body.amount)
    const reason = body.reason ? String(body.reason) : ''

    if (!amount || amount <= 0 || !reason.trim()) {
      return NextResponse.json({ error: 'المبلغ والسبب مطلوبين' }, { status: 400 })
    }

    const settlement = await prisma.pettyCashSettlement.upsert({
      where: { financeRequestId },
      update: {},
      create: { financeRequestId }
    })

    const topup = await prisma.pettyCashTopUpRequest.create({
      data: {
        settlementId: settlement.id,
        amount,
        reason: reason.trim(),
        requestedById: uid,
        status: 'PENDING'
      }
    })

    return NextResponse.json({ success: true, topUp: topup })
  } catch (e) {
    console.error('POST topup error', e)
    return NextResponse.json({ error: 'حدث خطأ أثناء الإنشاء' }, { status: 500 })
  }
}
