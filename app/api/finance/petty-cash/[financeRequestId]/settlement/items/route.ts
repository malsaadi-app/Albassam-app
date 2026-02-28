import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'

export async function POST(request: NextRequest, { params }: { params: Promise<{ financeRequestId: string }> }) {
  try {
    const session = await getSession(await cookies())
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const { financeRequestId } = await params

    const fr = await prisma.financeRequest.findUnique({ where: { id: financeRequestId } })
    if (!fr) return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 })

    const uid = session.user.id
    const canAdd = fr.requesterId === uid || session.user.role === 'ADMIN'
    if (!canAdd) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

    const body = await request.json()
    const { description, amount, vendor, date, attachments } = body

    if (!description || !amount) {
      return NextResponse.json({ error: 'البيانات المطلوبة ناقصة' }, { status: 400 })
    }

    const settlement = await prisma.pettyCashSettlement.upsert({
      where: { financeRequestId },
      update: {},
      create: { financeRequestId }
    })

    if (settlement.status !== 'DRAFT' && settlement.status !== 'REJECTED') {
      return NextResponse.json({ error: 'لا يمكن إضافة بنود بعد الإرسال' }, { status: 400 })
    }

    const item = await prisma.pettyCashExpenseItem.create({
      data: {
        settlementId: settlement.id,
        description: String(description),
        amount: Number(amount),
        vendor: vendor ? String(vendor) : null,
        date: date ? new Date(String(date)) : null,
        attachments: attachments ? JSON.stringify(attachments) : null
      }
    })

    return NextResponse.json({ success: true, item })
  } catch (e) {
    console.error('POST settlement item error', e)
    return NextResponse.json({ error: 'حدث خطأ أثناء الإضافة' }, { status: 500 })
  }
}
