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

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession(await cookies())
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const { id } = await params
    const body = await request.json()
    const input = schema.parse(body)

    const fr = await prisma.financeRequest.findUnique({ where: { id } })
    if (!fr) return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 })

    const uid = session.user.id

    const isDeptMgr = fr.currentStep === 'DEPARTMENT_MANAGER' && fr.departmentManagerUserId === uid
    const isAccountant = fr.currentStep === 'ACCOUNTANT_REVIEW' && fr.accountantUserId === uid
    const isFinanceMgr = fr.currentStep === 'FINANCE_MANAGER_APPROVAL' && fr.financeManagerUserId === uid

    const canAct = session.user.role === 'ADMIN' || isDeptMgr || isAccountant || isFinanceMgr
    if (!canAct) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

    if (input.action === 'reject') {
      const updated = await prisma.financeRequest.update({
        where: { id },
        data: {
          status: 'REJECTED',
          currentStep: 'REJECTED',
          rejectionReason: input.comment?.trim() ?? 'Rejected',
          ...(isDeptMgr ? { departmentManagerComment: input.comment } : {}),
          ...(isAccountant ? { accountantComment: input.comment } : {}),
          ...(isFinanceMgr ? { financeManagerComment: input.comment } : {})
        }
      })
      return NextResponse.json({ success: true, request: updated })
    }

    // approve path
    if (fr.currentStep === 'DEPARTMENT_MANAGER') {
      const updated = await prisma.financeRequest.update({
        where: { id },
        data: {
          departmentManagerComment: input.comment ?? null,
          reviewedAt: new Date(),
          reviewedBy: uid,
          currentStep: 'ACCOUNTANT_REVIEW'
        }
      })
      return NextResponse.json({ success: true, request: updated })
    }

    if (fr.currentStep === 'ACCOUNTANT_REVIEW') {
      const updated = await prisma.financeRequest.update({
        where: { id },
        data: {
          accountantComment: input.comment ?? null,
          currentStep: 'FINANCE_MANAGER_APPROVAL'
        }
      })
      return NextResponse.json({ success: true, request: updated })
    }

    if (fr.currentStep === 'FINANCE_MANAGER_APPROVAL') {
      const updated = await prisma.financeRequest.update({
        where: { id },
        data: {
          financeManagerComment: input.comment ?? null,
          approvedAt: new Date(),
          approvedBy: uid,
          currentStep: 'ACCOUNTANT_EXECUTION'
        }
      })
      return NextResponse.json({ success: true, request: updated })
    }

    return NextResponse.json({ error: 'لا يمكن تنفيذ الإجراء' }, { status: 400 })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.issues?.[0]?.message ?? 'خطأ في البيانات' }, { status: 400 })
    }
    console.error('POST /api/finance/requests/[id]/process-step error', e)
    return NextResponse.json({ error: 'حدث خطأ أثناء المعالجة' }, { status: 500 })
  }
}
