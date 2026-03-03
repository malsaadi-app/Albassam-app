import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'

// POST /api/settings/workflow-builder/:versionId/publish
export async function POST(_req: NextRequest, { params }: { params: Promise<{ versionId: string }> }) {
  const session = await getSession(await cookies())
  if (!session.user || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

  const { versionId } = await params

  const v = await prisma.workflowVersion.findUnique({ where: { id: versionId }, select: { id: true, workflowId: true } })
  if (!v) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.$transaction(async (tx) => {
    await tx.workflowVersion.updateMany({ where: { workflowId: v.workflowId }, data: { status: 'DRAFT' } })
    await tx.workflowVersion.update({ where: { id: v.id }, data: { status: 'PUBLISHED', publishedAt: new Date() } })
  })

  return NextResponse.json({ ok: true })
}
