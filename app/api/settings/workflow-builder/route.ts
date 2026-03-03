import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'

// Generic Workflow Builder API (v1)
// GET: list definitions
// POST: create definition + draft version
export async function GET() {
  const session = await getSession(await cookies())
  if (!session.user || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

  const defs = await prisma.workflowDefinition.findMany({
    include: {
      versions: {
        orderBy: { version: 'desc' },
        take: 1,
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json({ ok: true, defs })
}

export async function POST(request: NextRequest) {
  const session = await getSession(await cookies())
  if (!session.user || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const moduleName = String(body?.module || 'HR')
  const name = String(body?.name || '').trim()
  const description = body?.description ? String(body.description) : null

  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

  const created = await prisma.$transaction(async (tx) => {
    const def = await tx.workflowDefinition.create({
      data: {
        module: moduleName as any,
        name,
        description,
        createdBy: session.user!.id,
        updatedBy: session.user!.id,
      },
      select: { id: true },
    })

    const v = await tx.workflowVersion.create({
      data: {
        workflowId: def.id,
        version: 1,
        status: 'DRAFT',
        createdBy: session.user!.id,
      },
      select: { id: true },
    })

    return { workflowId: def.id, versionId: v.id }
  })

  return NextResponse.json({ ok: true, ...created })
}
