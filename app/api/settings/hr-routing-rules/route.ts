import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'

// GET /api/settings/hr-routing-rules
export async function GET() {
  try {
    const session = await getSession(await cookies())
    if (!session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    const rules = await prisma.hRRoutingRule.findMany({
      orderBy: { requestType: 'asc' },
      include: {
        vp: { select: { id: true, displayName: true, username: true } },
        hrManager: { select: { id: true, displayName: true, username: true } },
      },
    })

    return NextResponse.json({ ok: true, rules })
  } catch (e) {
    console.error('hr-routing-rules GET error', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

// POST /api/settings/hr-routing-rules
// Body: { rules: Array<{ requestType, enabled, useStageHead, vpUserId?, hrManagerUserId?, allowDelegation }> }
export async function POST(request: NextRequest) {
  try {
    const session = await getSession(await cookies())
    if (!session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const rules = Array.isArray(body?.rules) ? body.rules : []

    const updated = await Promise.all(
      rules.map((r: any) =>
        prisma.hRRoutingRule.upsert({
          where: { requestType: String(r.requestType) },
          update: {
            enabled: Boolean(r.enabled),
            useStageHead: Boolean(r.useStageHead),
            vpUserId: r.vpUserId ? String(r.vpUserId) : null,
            hrManagerUserId: r.hrManagerUserId ? String(r.hrManagerUserId) : null,
            allowDelegation: Boolean(r.allowDelegation),
            updatedBy: session.user!.id,
          },
          create: {
            requestType: String(r.requestType),
            enabled: Boolean(r.enabled),
            useStageHead: Boolean(r.useStageHead),
            vpUserId: r.vpUserId ? String(r.vpUserId) : null,
            hrManagerUserId: r.hrManagerUserId ? String(r.hrManagerUserId) : null,
            allowDelegation: Boolean(r.allowDelegation),
            updatedBy: session.user!.id,
          },
        })
      )
    )

    return NextResponse.json({ ok: true, count: updated.length })
  } catch (e) {
    console.error('hr-routing-rules POST error', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
