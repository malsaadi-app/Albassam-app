import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'

// PUT /api/settings/workflow-builder/versions/:versionId
// Update Draft version steps/rules (v1: steps only)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ versionId: string }> }) {
  const session = await getSession(await cookies())
  if (!session.user || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

  const { versionId } = await params
  const body = await req.json().catch(() => ({}))
  const steps = Array.isArray(body?.steps) ? body.steps : null
  if (!steps) return NextResponse.json({ error: 'Invalid body: steps[] is required' }, { status: 400 })

  const version = await prisma.workflowVersion.findUnique({ where: { id: versionId }, select: { id: true, status: true } })
  if (!version) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (String(version.status).toUpperCase() !== 'DRAFT') {
    return NextResponse.json({ error: 'Only DRAFT versions can be edited' }, { status: 400 })
  }

  // Normalize + validate steps
  const normalized = steps
    .map((s: any, idx: number) => ({
      order: Number.isFinite(Number(s.order)) ? Number(s.order) : idx + 1,
      titleAr: String(s.titleAr || '').trim(),
      titleEn: s.titleEn ? String(s.titleEn).trim() : null,
      stepType: String(s.stepType || '').trim(),
      configJson: s.configJson && typeof s.configJson === 'object' ? s.configJson : {},
      requireComment: s.requireComment !== undefined ? !!s.requireComment : true,
      allowConsult: s.allowConsult !== undefined ? !!s.allowConsult : true,
      allowDelegation: s.allowDelegation !== undefined ? !!s.allowDelegation : true,
    }))
    .filter((s: any) => s.titleAr && s.stepType)

  if (normalized.length === 0) {
    return NextResponse.json({ error: 'At least 1 valid step is required' }, { status: 400 })
  }

  // Ensure contiguous ordering (1..n)
  normalized.sort((a: any, b: any) => a.order - b.order)
  normalized.forEach((s: any, i: number) => (s.order = i + 1))

  await prisma.$transaction(async (tx) => {
    await tx.workflowStepDefinition.deleteMany({ where: { workflowVersionId: versionId } })
    await tx.workflowStepDefinition.createMany({
      data: normalized.map((s: any) => ({
        workflowVersionId: versionId,
        order: s.order,
        titleAr: s.titleAr,
        titleEn: s.titleEn,
        stepType: s.stepType,
        configJson: s.configJson,
        requireComment: s.requireComment,
        allowConsult: s.allowConsult,
        allowDelegation: s.allowDelegation,
      })),
    })
  })

  return NextResponse.json({ ok: true })
}
