import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// GET/POST /api/inventory/movements

const createSchema = z.object({
  stockItemId: z.string().min(1),
  movementType: z.enum(['IN', 'OUT', 'ADJUSTMENT', 'RETURN', 'DAMAGE']),
  quantity: z.number().positive(),
  unitCost: z.number().optional(),
  reference: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

export async function GET(request: NextRequest) {
  const session = await getSession(await cookies())
  if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  const sr = session.user.systemRole?.name
  const can = session.user.role === 'ADMIN' || sr === 'PROCUREMENT_MANAGER' || sr === 'WAREHOUSE_KEEPER' || sr === 'WAREHOUSE_MANAGER'
  if (!can) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const stockItemId = searchParams.get('stockItemId')

  const movements = await prisma.stockMovement.findMany({
    where: stockItemId ? { stockItemId } : {},
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: {
      stockItem: { select: { itemCode: true, itemName: true, unit: true } },
    },
  })

  return NextResponse.json({ movements })
}

export async function POST(request: NextRequest) {
  const session = await getSession(await cookies())
  if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  const sr = session.user.systemRole?.name
  const can = session.user.role === 'ADMIN' || sr === 'PROCUREMENT_MANAGER' || sr === 'WAREHOUSE_KEEPER' || sr === 'WAREHOUSE_MANAGER'
  if (!can) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const data = createSchema.parse({
    ...body,
    quantity: Number(body.quantity),
    unitCost: body.unitCost !== undefined ? Number(body.unitCost) : undefined,
  })

  try {
    const result = await prisma.$transaction(async (tx) => {
    const item = await tx.stockItem.findUnique({ where: { id: data.stockItemId } })
    if (!item) throw new Error('Stock item not found')

    const qty = data.quantity
    let delta = 0
    if (data.movementType === 'IN' || data.movementType === 'RETURN') delta = qty
    else if (data.movementType === 'OUT' || data.movementType === 'DAMAGE') delta = -qty
    else if (data.movementType === 'ADJUSTMENT') delta = qty // adjustment is direct delta

    // Update stock item summary
    const newStock = Number(item.currentStock) + delta

    // Enforce setting (optional): block negative stock when disabled
    const settings = await tx.inventorySettings.upsert({
      where: { id: 'default' },
      create: { id: 'default' },
      update: {},
      select: { allowNegativeStock: true },
    })

    if (!settings.allowNegativeStock && newStock < 0) {
      throw new Error('NEGATIVE_STOCK_NOT_ALLOWED')
    }

    const movement = await tx.stockMovement.create({
      data: {
        stockItemId: data.stockItemId,
        movementType: data.movementType,
        quantity: qty,
        unitCost: data.unitCost ?? null,
        reference: data.reference ?? null,
        notes: data.notes ?? null,
        movedBy: session.user!.displayName || session.user!.username || session.user!.id,
      },
    })
    const unitCost = data.unitCost !== undefined ? data.unitCost : Number(item.unitCost)
    const totalValue = Math.max(0, newStock) * unitCost

    const updated = await tx.stockItem.update({
      where: { id: item.id },
      data: {
        currentStock: newStock,
        unitCost,
        totalValue,
        lastRestockDate: data.movementType === 'IN' ? new Date() : item.lastRestockDate,
      },
    })

      return { movement, item: updated }
    })

    return NextResponse.json({ ok: true, ...result })
  } catch (e: any) {
    const msg = String(e?.message || '')
    if (msg.includes('NEGATIVE_STOCK_NOT_ALLOWED')) {
      return NextResponse.json({ error: 'لا يمكن الصرف لأن الرصيد غير كافٍ (تم تعطيل السماح بالسالب)' }, { status: 400 })
    }
    throw e
  }
}
