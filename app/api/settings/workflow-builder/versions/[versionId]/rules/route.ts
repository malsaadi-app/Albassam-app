import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'

// PUT /api/settings/workflow-builder/versions/:versionId/rules
// Replaces rules for a Draft version.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ versionId: string }> }) {
  const session = await getSession(await cookies())
  if (!session.user || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

  const { versionId } = await params
  const body = await req.json().catch(() => ({}))
  const rules = Array.isArray(body?.rules) ? body.rules : null
  if (!rules) return NextResponse.json({ error: 'Invalid body: rules[] is required' }, { status: 400 })

  const version = await prisma.workflowVersion.findUnique({ where: { id: versionId }, select: { id: true, status: true } })
  if (!version) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (String(version.status).toUpperCase() !== 'DRAFT') {
    return NextResponse.json({ error: 'Only DRAFT versions can be edited' }, { status: 400 })
  }

  const normalized = rules
    .map((r: any) => ({
      requestType: r.requestType ? String(r.requestType).trim() : null,
      branchId: r.branchId ? String(r.branchId).trim() : null,
      enabled: r.enabled !== false,
      conditionsJson: r.conditionsJson && typeof r.conditionsJson === 'object' ? r.conditionsJson : {},
    }))
    .filter((r: any) => r.requestType && r.branchId)

  // Deduplicate by (requestType, branchId)
  const seen = new Set<string>()
  const deduped = normalized.filter((r: any) => {
    const k = `${r.requestType}::${r.branchId}`
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })

  await prisma.$transaction(async (tx) => {
    await tx.workflowRule.deleteMany({ where: { workflowVersionId: versionId } })
    if (deduped.length) {
      await tx.workflowRule.createMany({
        data: deduped.map((r: any) => ({
          workflowVersionId: versionId,
          requestType: r.requestType,
          branchId: r.branchId,
          enabled: r.enabled,
          conditionsJson: r.conditionsJson,
        })),
      })
    }
  })

  return NextResponse.json({ ok: true, count: deduped.length })
}
