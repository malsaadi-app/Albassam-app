import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const updateSchema = z.object({
  itemName: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  unit: z.string().min(1).optional(),
  minStock: z.number().optional(),
  maxStock: z.number().nullable().optional(),
  location: z.string().nullable().optional(),
  unitCost: z.number().optional(),
  notes: z.string().nullable().optional(),
})

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(await cookies())
  if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const data = updateSchema.parse({
    ...body,
    minStock: body.minStock !== undefined ? Number(body.minStock) : undefined,
    maxStock: body.maxStock !== undefined && body.maxStock !== null ? Number(body.maxStock) : body.maxStock,
    unitCost: body.unitCost !== undefined ? Number(body.unitCost) : undefined,
  })

  const updated = await prisma.stockItem.update({
    where: { id },
    data,
  })

  return NextResponse.json({ ok: true, item: updated })
}
