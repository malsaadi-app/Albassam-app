import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// GET/POST /api/inventory/items

const createSchema = z.object({
  itemCode: z.string().min(1),
  itemName: z.string().min(1),
  category: z.string().min(1),
  unit: z.string().min(1),
  minStock: z.number().optional(),
  maxStock: z.number().nullable().optional(),
  location: z.string().nullable().optional(),
  unitCost: z.number().optional(),
  notes: z.string().nullable().optional(),
})

export async function GET(request: NextRequest) {
  const session = await getSession(await cookies())
  if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const q = (searchParams.get('q') || '').trim()
  const category = (searchParams.get('category') || '').trim()

  const items = await prisma.stockItem.findMany({
    where: {
      ...(category ? { category } : {}),
      ...(q
        ? {
            OR: [
              { itemCode: { contains: q, mode: 'insensitive' } },
              { itemName: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: [{ category: 'asc' }, { itemName: 'asc' }],
  })

  return NextResponse.json({ items })
}

export async function POST(request: NextRequest) {
  const session = await getSession(await cookies())
  if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const data = createSchema.parse({
    ...body,
    minStock: body.minStock !== undefined ? Number(body.minStock) : undefined,
    maxStock: body.maxStock !== undefined && body.maxStock !== null ? Number(body.maxStock) : body.maxStock,
    unitCost: body.unitCost !== undefined ? Number(body.unitCost) : undefined,
  })

  const created = await prisma.stockItem.create({
    data: {
      itemCode: data.itemCode,
      itemName: data.itemName,
      category: data.category,
      unit: data.unit,
      minStock: data.minStock ?? 0,
      maxStock: data.maxStock ?? null,
      location: data.location ?? null,
      unitCost: data.unitCost ?? 0,
      notes: data.notes ?? null,
      currentStock: 0,
      totalValue: 0,
    },
  })

  return NextResponse.json({ ok: true, item: created })
}
