import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { z } from 'zod'

const schema = z
  .object({
    action: z.enum(['approve', 'reject']),
    comment: z.string().optional()
  })
  .superRefine((val, ctx) => {
    if (val.action === 'reject' && (!val.comment || val.comment.trim().length === 0)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'سبب الرفض مطلوب', path: ['comment'] })
    }
  })

export async function POST(request: NextRequest, { params }: { params: Promise<{ financeRequestId: string }> }) {
  try {
    const session = await getSession(await cookies())
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const { financeRequestId } = await params
    const body = await request.json()
    const input = schema.parse(body)

    const fr = await prisma.financeRequest.findUnique({ where: { id: financeRequestId } })
    if (!fr) return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 })

    const settlement = await prisma.pettyCashSettlement.findUnique({ where: { financeRequestId } })
    if (!settlement) return NextResponse.json({ error: 'لا توجد تسوية' }, { status: 400 })

    const uid = session.user.id

    const isAccountant = fr.accountantUserId === uid
    const isFinanceMgr = fr.financeManagerUserId === uid

    if (session.user.role !== 'ADMIN' && !isAccountant && !isFinanceMgr) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    if (settlement.status === 'DRAFT') {
      return NextResponse.json({ error: 'التسوية لم تُرسل بعد' }, { status: 400 })
    }

    if (input.action === 'reject') {
      const updated = await prisma.pettyCashSettlement.update({
        where: { financeRequestId },
        data: {
          status: 'REJECTED',
          rejectionReason: input.comment?.trim() ?? 'Rejected',
          ...(isAccountant ? { accountantComment: input.comment } : {}),
          ...(isFinanceMgr ? { financeManagerComment: input.comment } : {})
        }
      })
      return NextResponse.json({ success: true, settlement: updated })
    }

    // approve
    if (settlement.status === 'SUBMITTED') {
      if (!isAccountant && session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
      }
      const updated = await prisma.pettyCashSettlement.update({
        where: { financeRequestId },
        data: { status: 'ACCOUNTANT_APPROVED', accountantComment: input.comment ?? null }
      })
      return NextResponse.json({ success: true, settlement: updated })
    }

    if (settlement.status === 'ACCOUNTANT_APPROVED') {
      if (!isFinanceMgr && session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
      }
      const updated = await prisma.pettyCashSettlement.update({
        where: { financeRequestId },
        data: { status: 'FINANCE_MANAGER_APPROVED', financeManagerComment: input.comment ?? null }
      })
      return NextResponse.json({ success: true, settlement: updated })
    }

    return NextResponse.json({ error: 'لا يمكن تنفيذ الإجراء' }, { status: 400 })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.issues?.[0]?.message ?? 'خطأ في البيانات' }, { status: 400 })
    }
    console.error('POST settlement process-step error', e)
    return NextResponse.json({ error: 'حدث خطأ أثناء المعالجة' }, { status: 500 })
  }
}
