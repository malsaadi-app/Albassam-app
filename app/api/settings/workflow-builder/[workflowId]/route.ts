import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'

// GET /api/settings/workflow-builder/:workflowId
// Returns definition + versions + draft/published data.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ workflowId: string }> }) {
  const session = await getSession(await cookies())
  if (!session.user || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

  const { workflowId } = await params

  const def = await prisma.workflowDefinition.findUnique({
    where: { id: workflowId },
    include: {
      versions: {
        orderBy: { version: 'desc' },
        include: { rules: true, steps: { orderBy: { order: 'asc' } } },
      },
    },
  })

  if (!def) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ ok: true, def })
}

// PUT /api/settings/workflow-builder/:workflowId
// Body: { name?, description? }
export async function PUT(req: NextRequest, { params }: { params: Promise<{ workflowId: string }> }) {
  const session = await getSession(await cookies())
  if (!session.user || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

  const { workflowId } = await params
  const body = await req.json().catch(() => ({}))

  const updated = await prisma.workflowDefinition.update({
    where: { id: workflowId },
    data: {
      ...(body?.name ? { name: String(body.name).trim() } : {}),
      ...(body?.description !== undefined ? { description: body.description ? String(body.description) : null } : {}),
      updatedBy: session.user!.id,
    },
    select: { id: true },
  })

  return NextResponse.json({ ok: true, id: updated.id })
}
