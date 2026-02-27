import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { getSession } from '@/lib/session'
import { decideReplacement } from '@/lib/replacementService'

const schema = z.object({
  decision: z.enum(['CONFIRM_NEW', 'KEEP_OLD', 'EXTEND_PROBATION']),
  decisionReason: z.string().min(2),
  extendMonths: z.number().int().min(1).max(2).optional(),
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

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'بيانات غير صحيحة', details: parsed.error.flatten() }, { status: 400 })
    }

    const replacement = await decideReplacement({
      replacementId,
      decisionByUserId: session.user.id,
      ...parsed.data,
    })

    return NextResponse.json({ replacement })
  } catch (e: any) {
    const statusCode = e?.statusCode && Number.isFinite(e.statusCode) ? e.statusCode : 500
    console.error('POST /api/replacements/[id]/decision error', e)
    return NextResponse.json({ error: e?.message ?? 'حدث خطأ أثناء حفظ القرار' }, { status: statusCode })
  }
}
