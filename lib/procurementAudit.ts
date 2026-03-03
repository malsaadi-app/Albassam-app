import type { PrismaClient } from '@prisma/client'

export type PurchaseRequestAuditAction =
  | 'REQUEST_CREATED'
  | 'STEP_APPROVED'
  | 'APPROVED'
  | 'REJECTED'
  | 'WAREHOUSE_ISSUE'
  | 'UPDATED'

export async function createPurchaseRequestAuditLog(prisma: PrismaClient, data: {
  requestId: string
  actorUserId: string
  action: PurchaseRequestAuditAction
  message?: string | null
  diffJson?: any
}) {
  try {
    await (prisma as any).purchaseRequestAuditLog.create({
      data: {
        requestId: data.requestId,
        actorUserId: data.actorUserId,
        action: data.action,
        message: data.message || null,
        diffJson: data.diffJson ? JSON.stringify(data.diffJson) : null,
      },
    })
  } catch (err) {
    console.error('Purchase audit log error:', err)
  }
}
