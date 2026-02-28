import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { getSession } from '@/lib/session'
import { createHRRequestAuditLog } from '@/lib/audit'

const schema = z.object({
  comment: z.string().min(1, 'تعليق الإعادة مطلوب')
})

// POST /api/hr/requests/[id]/resubmit
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getSession(await cookies())
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const body = schema.parse(await request.json())

    const hrRequest = await prisma.hRRequest.findUnique({ where: { id } })
    if (!hrRequest) return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 })

    if (hrRequest.employeeId !== session.user.id) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    const updated = await prisma.hRRequest.update({
      where: { id },
      data: {
        status: 'PENDING_APPROVAL',
        reviewComment: body.comment,
        reviewedBy: session.user.id,
        reviewedAt: new Date()
      }
    })

    await createHRRequestAuditLog(prisma, {
      requestId: id,
      actorUserId: session.user.id,
      action: 'REQUEST_UPDATED',
      message: `تمت إعادة إرسال الطلب بعد الإرجاع: ${body.comment}`
    })

    return NextResponse.json(updated)
  } catch (e: any) {
    console.error('POST /api/hr/requests/[id]/resubmit error', e)
    return NextResponse.json({ error: e?.message || 'حدث خطأ' }, { status: 400 })
  }
}
