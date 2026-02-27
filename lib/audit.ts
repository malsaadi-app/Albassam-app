import type { PrismaClient } from '@prisma/client';

export type HRRequestAuditAction =
  | 'REQUEST_CREATED'
  | 'REQUEST_UPDATED'
  | 'ATTACHMENT_UPLOADED'
  | 'ATTACHMENT_DELETED'
  | 'HR_RETURNED'
  | 'HR_FORWARDED'
  | 'ADMIN_APPROVED'
  | 'ADMIN_REJECTED'
  | 'DELEGATION_CREATED'
  | 'DELEGATION_CANCELED'
  | 'STEP_APPROVED'
  | 'APPROVED'
  | 'REJECTED';

export async function createHRRequestAuditLog(prisma: PrismaClient, data: {
  requestId: string;
  actorUserId: string;
  action: HRRequestAuditAction;
  message?: string | null;
  diffJson?: any;
}) {
  try {
    await (prisma as any).hRRequestAuditLog.create({
      data: {
        requestId: data.requestId,
        actorUserId: data.actorUserId,
        action: data.action,
        message: data.message || null,
        diffJson: data.diffJson ? JSON.stringify(data.diffJson) : null
      }
    });
  } catch (err) {
    // Don't fail main request if audit logging fails
    console.error('Audit log error:', err);
  }
}

export function diffObjects(before: Record<string, any>, after: Record<string, any>) {
  const changes: Record<string, { from: any; to: any }> = {};
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);

  for (const key of keys) {
    const b = before[key];
    const a = after[key];

    // Normalize Dates/string dates
    const nb = b instanceof Date ? b.toISOString() : b;
    const na = a instanceof Date ? a.toISOString() : a;

    if (JSON.stringify(nb) !== JSON.stringify(na)) {
      changes[key] = { from: nb, to: na };
    }
  }

  return changes;
}
