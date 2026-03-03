import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'

// POST /api/settings/workflow-builder/templates/schools/publish-all
// Publishes latest DRAFT versions for the 4 HR school templates (Arabic names).
export async function POST() {
  const session = await getSession(await cookies())
  if (!session.user || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

  const names = [
    'الموارد البشرية — طلب إجازة',
    'الموارد البشرية — خروج وعودة (مفرد)',
    'الموارد البشرية — خروج وعودة (متعدد)',
    'الموارد البشرية — استقالة',
  ]

  const defs = await prisma.workflowDefinition.findMany({
    where: { module: 'HR', name: { in: names } },
    select: { id: true, name: true },
  })

  const results: any[] = []

  for (const d of defs) {
    const v = await prisma.workflowVersion.findFirst({
      where: { workflowId: d.id, status: 'DRAFT' },
      orderBy: { version: 'desc' },
      select: { id: true, version: true, status: true },
    })

    if (!v) {
      results.push({ workflowId: d.id, name: d.name, published: false, reason: 'no_draft' })
      continue
    }

    await prisma.workflowVersion.update({
      where: { id: v.id },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
    })

    results.push({ workflowId: d.id, name: d.name, published: true, version: v.version })
  }

  return NextResponse.json({ ok: true, count: results.length, results })
}
