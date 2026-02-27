import type { PrismaClient } from '@prisma/client';

export async function getActiveDelegationForUser(prisma: PrismaClient, userId: string) {
  const now = new Date();
  return prisma.hRDelegation.findFirst({
    where: {
      delegateToUserId: userId,
      active: true,
      startAt: { lte: now },
      endAt: { gte: now }
    },
    orderBy: { startAt: 'desc' }
  });
}

export async function isDelegatedViewer(prisma: PrismaClient, userId: string): Promise<boolean> {
  const d = await getActiveDelegationForUser(prisma, userId);
  return !!d;
}

/**
 * Idempotently sends in-app notifications when delegations start/end.
 * Triggered opportunistically (e.g., on /api/auth/me) to avoid cron.
 */
export async function syncDelegationNotifications(prisma: PrismaClient, userId: string) {
  const now = new Date();
  const delegations = await prisma.hRDelegation.findMany({
    where: {
      delegateToUserId: userId,
      OR: [
        { startNotifiedAt: null },
        { endNotifiedAt: null }
      ]
    }
  });

  for (const d of delegations) {
    if (!d.startNotifiedAt && d.active && d.startAt <= now && d.endAt >= now) {
      await prisma.notification.create({
        data: {
          userId,
          title: 'تم تفعيل التفويض',
          message: 'تم منحك صلاحية الاطلاع (قراءة فقط) على طلبات الموارد البشرية خلال فترة التفويض.',
          type: 'delegation_started',
          relatedId: d.id,
          isRead: false
        }
      });
      
      await prisma.hRDelegation.update({
        where: { id: d.id },
        data: { startNotifiedAt: now }
      });
    }

    const ended = !d.active || d.endAt < now;
    if (!d.endNotifiedAt && ended) {
      await prisma.notification.create({
        data: {
          userId,
          title: 'انتهى التفويض',
          message: 'انتهت صلاحية التفويض للاطلاع على الطلبات.',
          type: 'delegation_ended',
          relatedId: d.id,
          isRead: false
        }
      });
      
      await prisma.hRDelegation.update({
        where: { id: d.id },
        data: { endNotifiedAt: now }
      });
    }
  }
}
