import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const updateSchema = z.object({
  allowNegativeStock: z.boolean(),
})

// GET/PUT /api/settings/inventory
export async function GET() {
  const session = await getSession(await cookies())
  if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

  const row = await prisma.inventorySettings.upsert({
    where: { id: 'default' },
    create: { id: 'default' },
    update: {},
  })

  return NextResponse.json({ settings: row })
}

export async function PUT(request: NextRequest) {
  const session = await getSession(await cookies())
  if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const data = updateSchema.parse({ allowNegativeStock: !!body.allowNegativeStock })

  const updated = await prisma.inventorySettings.update({
    where: { id: 'default' },
    data: {
      allowNegativeStock: data.allowNegativeStock,
      updatedBy: session.user.id,
    },
  })

  return NextResponse.json({ ok: true, settings: updated })
}
