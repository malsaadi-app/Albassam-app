import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'

// GET settlement by financeRequestId
export async function GET(_req: NextRequest, { params }: { params: Promise<{ financeRequestId: string }> }) {
  try {
    const session = await getSession(await cookies())
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const { financeRequestId } = await params

    const fr = await prisma.financeRequest.findUnique({ where: { id: financeRequestId } })
    if (!fr) return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 })

    const uid = session.user.id
    const canSee =
      fr.requesterId === uid ||
      fr.accountantUserId === uid ||
      fr.financeManagerUserId === uid ||
      session.user.role === 'ADMIN'
    if (!canSee) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

    const settlement = await prisma.pettyCashSettlement.findUnique({
      where: { financeRequestId },
      include: { items: { orderBy: { createdAt: 'asc' } }, topUps: { orderBy: { createdAt: 'asc' } } }
    })

    return NextResponse.json({
      settlement,
      items: settlement?.items ?? [],
      topUps: settlement?.topUps ?? []
    })
  } catch (e) {
    console.error('GET petty cash settlement error', e)
    return NextResponse.json({ error: 'حدث خطأ أثناء جلب البيانات' }, { status: 500 })
  }
}

// POST create settlement if missing
export async function POST(_req: NextRequest, { params }: { params: Promise<{ financeRequestId: string }> }) {
  try {
    const session = await getSession(await cookies())
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const { financeRequestId } = await params
    const fr = await prisma.financeRequest.findUnique({ where: { id: financeRequestId } })
    if (!fr) return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 })

    const uid = session.user.id
    const canCreate = fr.requesterId === uid || session.user.role === 'ADMIN'
    if (!canCreate) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

    const existing = await prisma.pettyCashSettlement.findUnique({ where: { financeRequestId } })
    if (existing) return NextResponse.json({ settlement: existing })

    const settlement = await prisma.pettyCashSettlement.create({
      data: { financeRequestId },
      include: { items: true, topUps: true }
    })

    return NextResponse.json({ success: true, settlement })
  } catch (e) {
    console.error('POST petty cash settlement error', e)
    return NextResponse.json({ error: 'حدث خطأ أثناء الإنشاء' }, { status: 500 })
  }
}
