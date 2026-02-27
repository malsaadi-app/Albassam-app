import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { getSession } from '@/lib/session'
import { submitReplacementEvaluation } from '@/lib/replacementService'

const schema = z.object({
  evaluationScore: z.number().int().min(1).max(10),
  evaluationNotes: z.string().optional().nullable(),
})

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession(await cookies())
    if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

    const { id } = await ctx.params
    const replacementId = Number(id)
    if (!Number.isFinite(replacementId)) return NextResponse.json({ error: 'معرف غير صحيح' }, { status: 400 })

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'بيانات غير صحيحة', details: parsed.error.flatten() }, { status: 400 })
    }

    const replacement = await submitReplacementEvaluation({
      replacementId,
      evaluatedByUserId: session.user.id,
      ...parsed.data,
    })

    return NextResponse.json({ replacement })
  } catch (e: any) {
    const statusCode = e?.statusCode && Number.isFinite(e.statusCode) ? e.statusCode : 500
    console.error('POST /api/replacements/[id]/evaluation error', e)
    return NextResponse.json({ error: e?.message ?? 'حدث خطأ أثناء حفظ التقييم' }, { status: statusCode })
  }
}
