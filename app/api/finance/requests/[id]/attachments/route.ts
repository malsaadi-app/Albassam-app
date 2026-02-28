import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { z } from 'zod'

const schema = z.object({
  attachment: z.object({
    name: z.string(),
    url: z.string()
  })
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
    const canEdit =
      session.user.role === 'ADMIN' ||
      fr.accountantUserId === uid ||
      fr.financeManagerUserId === uid

    if (!canEdit) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

    const existing = fr.attachments ? JSON.parse(fr.attachments) : []
    const updated = [...existing, input.attachment]

    const saved = await prisma.financeRequest.update({
      where: { id },
      data: {
        attachments: JSON.stringify(updated)
      }
    })

    return NextResponse.json({ success: true, attachments: saved.attachments ? JSON.parse(saved.attachments) : [] })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: e.issues?.[0]?.message ?? 'خطأ في البيانات' }, { status: 400 })
    }
    console.error('POST /api/finance/requests/[id]/attachments error', e)
    return NextResponse.json({ error: 'حدث خطأ أثناء الإضافة' }, { status: 500 })
  }
}
