import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { z } from 'zod'

const schema = z.object({
  comment: z.string().optional()
})

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession(await cookies())
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const input = schema.parse(body)

    const fr = await prisma.financeRequest.findUnique({ where: { id } })
    if (!fr) return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 })

    const uid = session.user.id
    const canExecute = session.user.role === 'ADMIN' || (fr.currentStep === 'ACCOUNTANT_EXECUTION' && fr.accountantUserId === uid)

    if (!canExecute) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

    const updated = await prisma.financeRequest.update({
      where: { id },
      data: {
        paidAt: new Date(),
        status: 'PAID',
        currentStep: 'PAID',
        accountantComment: input.comment ?? fr.accountantComment
      }
    })

    return NextResponse.json({ success: true, request: updated })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.issues?.[0]?.message ?? 'خطأ في البيانات' }, { status: 400 })
    }
    console.error('POST /api/finance/requests/[id]/mark-paid error', e)
    return NextResponse.json({ error: 'حدث خطأ أثناء التنفيذ' }, { status: 500 })
  }
}
