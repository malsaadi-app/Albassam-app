import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { z } from 'zod'

const schema = z
  .object({
    action: z.enum(['approve', 'reject', 'mark-paid']),
    comment: z.string().optional()
  })
  .superRefine((val, ctx) => {
    if (val.action === 'reject' && (!val.comment || val.comment.trim().length === 0)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'سبب الرفض مطلوب', path: ['comment'] })
    }
  })

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession(await cookies())
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const { id } = await params
    const body = await request.json()
    const input = schema.parse(body)

    const topup = await prisma.pettyCashTopUpRequest.findUnique({ where: { id }, include: { settlement: { include: { financeRequest: true } } } })
    if (!topup) return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 })

    const fr = topup.settlement.financeRequest
    const uid = session.user.id

    const isAccountant = fr.accountantUserId === uid
    const isFinanceMgr = fr.financeManagerUserId === uid

    const canApprove = session.user.role === 'ADMIN' || isAccountant || isFinanceMgr
    if (!canApprove) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

    if (input.action === 'reject') {
      const updated = await prisma.pettyCashTopUpRequest.update({
        where: { id },
        data: { status: 'REJECTED', rejectionReason: input.comment?.trim() }
      })
      return NextResponse.json({ success: true, topUp: updated })
    }

    if (input.action === 'approve') {
      // Finance manager approves; accountant can prepare but we keep it simple: both can approve.
      const updated = await prisma.pettyCashTopUpRequest.update({
        where: { id },
        data: { status: 'APPROVED', approvedById: uid, approvedAt: new Date() }
      })
      return NextResponse.json({ success: true, topUp: updated })
    }

    if (input.action === 'mark-paid') {
      // Accountant execution step
      if (!isAccountant && session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
      }
      const updated = await prisma.pettyCashTopUpRequest.update({
        where: { id },
        data: { status: 'PAID', paidAt: new Date() }
      })
      return NextResponse.json({ success: true, topUp: updated })
    }

    return NextResponse.json({ error: 'إجراء غير صحيح' }, { status: 400 })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.issues?.[0]?.message ?? 'خطأ في البيانات' }, { status: 400 })
    }
    console.error('POST topup process error', e)
    return NextResponse.json({ error: 'حدث خطأ أثناء المعالجة' }, { status: 500 })
  }
}
