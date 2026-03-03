import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { z } from 'zod'
import { getSession } from '@/lib/session'
import { createPurchaseRequestAuditLog } from '@/lib/procurementAudit'

const schema = z.object({
  lines: z
    .array(
      z.object({
        stockItemId: z.string().min(1),
        quantity: z.number().positive(),
        unitCost: z.number().optional(),
        notes: z.string().nullable().optional(),
      })
    )
    .min(1),
  comment: z.string().optional(),
})

// POST /api/procurement/requests/:id/warehouse-issue
// Performs inventory OUT movements for a purchase request and advances the workflow step.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession(await cookies())
  if (!session.user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })

  const { id } = await params
  const raw = await request.json().catch(() => ({}))

  const purchaseRequest = await prisma.purchaseRequest.findUnique({
    where: { id },
    select: { id: true, requestNumber: true, requestedById: true, category: true, currentWorkflowStep: true, status: true },
  })
  if (!purchaseRequest) return NextResponse.json({ error: 'الطلب غير موجود' }, { status: 404 })

  // Builder-first: ensure current step is WAREHOUSE_ISSUE and user is assigned
  const stepIndex = purchaseRequest.currentWorkflowStep ?? 0
  const { resolveProcurementAssigneesFromBuilder, getProcurementStepDefinitionFromBuilder } = await import('@/lib/procurementWorkflowBuilderRouting')

  const stepDef = await getProcurementStepDefinitionFromBuilder({
    requestType: 'PURCHASE_REQUEST',
    requestedByUserId: purchaseRequest.requestedById,
    category: String(purchaseRequest.category),
    stepIndex,
  })

  if (!stepDef || stepDef.stepType !== 'WAREHOUSE_ISSUE') {
    return NextResponse.json({ error: 'هذه الخطوة ليست صرف مخزون (builder)' }, { status: 400 })
  }

  const assignees = await resolveProcurementAssigneesFromBuilder({
    requestedByUserId: purchaseRequest.requestedById,
    category: String(purchaseRequest.category),
    stepIndex,
  })

  const allowed = (assignees?.userIds || [])
  if (!allowed.includes(session.user.id) && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'غير مصرح لك بالصرف' }, { status: 403 })
  }

  // Enforce comment policy
  if (stepDef.requireComment && (!raw.comment || String(raw.comment).trim().length === 0)) {
    return NextResponse.json({ error: 'التعليق إلزامي لهذه الخطوة' }, { status: 400 })
  }

  const body = schema.parse({
    ...raw,
    lines: (raw.lines || []).map((l: any) => ({
      ...l,
      quantity: Number(l.quantity),
      unitCost: l.unitCost !== undefined ? Number(l.unitCost) : undefined,
    })),
  })

  try {
    const result = await prisma.$transaction(async (tx) => {
      const settings = await tx.inventorySettings.upsert({
        where: { id: 'default' },
        create: { id: 'default' },
        update: {},
        select: { allowNegativeStock: true },
      })

      // Apply movements
      for (const line of body.lines) {
        const item = await tx.stockItem.findUnique({ where: { id: line.stockItemId } })
        if (!item) throw new Error('STOCK_ITEM_NOT_FOUND')

        const newStock = Number(item.currentStock) - Number(line.quantity)
        if (!settings.allowNegativeStock && newStock < 0) throw new Error('NEGATIVE_STOCK_NOT_ALLOWED')

        const unitCost = line.unitCost !== undefined ? line.unitCost : Number(item.unitCost)
        const totalValue = Math.max(0, newStock) * unitCost

        await tx.stockMovement.create({
          data: {
            stockItemId: item.id,
            movementType: 'OUT',
            quantity: Number(line.quantity),
            unitCost: line.unitCost ?? null,
            reference: purchaseRequest.requestNumber,
            notes: line.notes ?? null,
            movedBy: session.user!.displayName || session.user!.username || session.user!.id,
          },
        })

        await tx.stockItem.update({
          where: { id: item.id },
          data: {
            currentStock: newStock,
            unitCost,
            totalValue,
          },
        })
      }

      // Advance workflow step (builder-first needs steps count)
      const ctx = await tx.workflowRule.findFirst({
        where: {
          enabled: true,
          requestType: 'PURCHASE_REQUEST',
          branchId: (await tx.employee.findUnique({ where: { userId: purchaseRequest.requestedById }, select: { branchId: true } }))?.branchId || undefined,
          workflowVersion: { status: 'PUBLISHED' },
        } as any,
        orderBy: { createdAt: 'desc' },
        select: { workflowVersionId: true, conditionsJson: true },
      })

      const totalSteps = ctx?.workflowVersionId
        ? await tx.workflowStepDefinition.count({ where: { workflowVersionId: ctx.workflowVersionId } })
        : stepIndex + 1

      const nextStepIndex = stepIndex + 1
      const isLast = nextStepIndex >= totalSteps

      const updated = await tx.purchaseRequest.update({
        where: { id: purchaseRequest.id },
        data: {
          currentWorkflowStep: nextStepIndex,
          status: isLast ? 'IN_PROGRESS' : purchaseRequest.status,
          reviewNotes: body.comment ? String(body.comment) : null,
        },
      })

      return { updated, nextStepIndex, isLast }
    })

    // Audit
    await createPurchaseRequestAuditLog(prisma as any, {
      requestId: purchaseRequest.id,
      actorUserId: session.user.id,
      action: 'WAREHOUSE_ISSUE',
      message: `تم صرف مواد من المخزون للطلب ${purchaseRequest.requestNumber} (${body.lines.length} صنف/أصناف).${body.comment ? ` ${body.comment}` : ''}`,
    })

    return NextResponse.json({ ok: true, ...result })
  } catch (e: any) {
    const msg = String(e?.message || '')
    if (msg.includes('NEGATIVE_STOCK_NOT_ALLOWED')) {
      return NextResponse.json({ error: 'لا يمكن الصرف لأن الرصيد غير كافٍ (تم تعطيل السماح بالسالب)' }, { status: 400 })
    }
    if (msg.includes('STOCK_ITEM_NOT_FOUND')) {
      return NextResponse.json({ error: 'الصنف غير موجود في المخزون' }, { status: 400 })
    }
    console.error('warehouse-issue error', e)
    return NextResponse.json({ error: 'حدث خطأ أثناء الصرف' }, { status: 500 })
  }
}
