import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { getSession } from '@/lib/session'
import { cancelReplacement } from '@/lib/replacementService'

const schema = z.object({
  reason: z.string().optional().nullable(),
})

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession(await cookies())
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    if (session.user.role !== 'ADMIN' && session.user.role !== 'HR_EMPLOYEE') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    const { id } = await ctx.params
    const replacementId = Number(id)
    if (!Number.isFinite(replacementId)) return NextResponse.json({ error: 'معرف غير صحيح' }, { status: 400 })

    const body = await req.json().catch(() => ({}))
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'بيانات غير صحيحة', details: parsed.error.flatten() }, { status: 400 })
    }

    const replacement = await cancelReplacement({
      replacementId,
      cancelledByUserId: session.user.id,
      reason: parsed.data.reason ?? undefined,
    })

    return NextResponse.json({ replacement })
  } catch (e: any) {
    const statusCode = e?.statusCode && Number.isFinite(e.statusCode) ? e.statusCode : 500
    console.error('POST /api/replacements/[id]/cancel error', e)
    return NextResponse.json({ error: e?.message ?? 'حدث خطأ أثناء الإلغاء' }, { status: statusCode })
  }
}
