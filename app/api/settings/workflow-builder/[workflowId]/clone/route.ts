import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'

// POST /api/settings/workflow-builder/:workflowId/clone
// Body: { sourceVersionId, targetRequestType? }
// Creates a new DRAFT version by copying steps+rules 1:1.
export async function POST(req: NextRequest, { params }: { params: Promise<{ workflowId: string }> }) {
  const session = await getSession(await cookies())
  if (!session.user || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

  const { workflowId } = await params
  const body = await req.json().catch(() => ({}))
  const sourceVersionId = String(body?.sourceVersionId || '')
  const targetRequestType = body?.targetRequestType ? String(body.targetRequestType) : null

  if (!sourceVersionId) return NextResponse.json({ error: 'sourceVersionId is required' }, { status: 400 })

  const source = await prisma.workflowVersion.findUnique({
    where: { id: sourceVersionId },
    include: { rules: true, steps: { orderBy: { order: 'asc' } } },
  })
  if (!source) return NextResponse.json({ error: 'Source not found' }, { status: 404 })

  const latest = await prisma.workflowVersion.findFirst({ where: { workflowId }, orderBy: { version: 'desc' }, select: { version: true } })
  const nextVersion = (latest?.version || 0) + 1

  const created = await prisma.$transaction(async (tx) => {
    const v = await tx.workflowVersion.create({
      data: { workflowId, version: nextVersion, status: 'DRAFT', createdBy: session.user!.id },
      select: { id: true },
    })

    // Clone rules (optionally override requestType)
    const rules = source.rules.map((r) => ({
      workflowVersionId: v.id,
      requestType: (targetRequestType || r.requestType) as any,
      branchId: r.branchId,
      enabled: r.enabled,
    }))
    if (rules.length) await tx.workflowRule.createMany({ data: rules })

    // Clone steps 1:1
    const steps = source.steps.map((s) => ({
      workflowVersionId: v.id,
      order: s.order,
      titleAr: s.titleAr,
      titleEn: s.titleEn,
      stepType: s.stepType,
      configJson: (s.configJson ?? {}) as any,
      requireComment: s.requireComment,
      allowConsult: s.allowConsult,
      allowDelegation: s.allowDelegation,
    }))
    if (steps.length) await tx.workflowStepDefinition.createMany({ data: steps })

    return v.id
  })

  return NextResponse.json({ ok: true, versionId: created })
}
