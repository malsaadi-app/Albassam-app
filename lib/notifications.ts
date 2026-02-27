// Notification utility functions
import { prisma } from './prisma';

export type NotificationType = 'task' | 'leave' | 'attendance' | 'purchase' | 'system' | 'mention';

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: any;
}

/**
 * Create a new notification
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        relatedId: params.actionUrl || params.metadata?.id, // Store URL or ID in relatedId
        isRead: false,
      },
    });

    // Send push notification if enabled
    await sendPushNotification(params.userId, {
      title: params.title,
      body: params.message,
      data: {
        url: params.actionUrl,
      },
    });

    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    throw error;
  }
}

/**
 * Create notifications for multiple users
 */
export async function createBulkNotifications(
  userIds: string[],
  params: Omit<CreateNotificationParams, 'userId'>
) {
  try {
    const notifications = await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type: params.type,
        title: params.title,
        message: params.message,
        relatedId: params.actionUrl || params.metadata?.id,
        isRead: false,
      })),
    });

    // Send push notifications
    for (const userId of userIds) {
      await sendPushNotification(userId, {
        title: params.title,
        body: params.message,
        data: {
          url: params.actionUrl,
        },
      });
    }

    return notifications;
  } catch (error) {
    console.error('Failed to create bulk notifications:', error);
    throw error;
  }
}

/**
 * Get user notifications
 */
export async function getUserNotifications(userId: string, limit = 50) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Get unread count
 */
export async function getUnreadCount(userId: string) {
  return prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string, userId: string) {
  return prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId, // Security: only update own notifications
    },
    data: {
      isRead: true,
    },
  });
}

/**
 * Mark all as read
 */
export async function markAllAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });
}

/**
 * Delete notification
 */
export async function deleteNotification(notificationId: string, userId: string) {
  return prisma.notification.deleteMany({
    where: {
      id: notificationId,
      userId, // Security: only delete own notifications
    },
  });
}

/**
 * Delete old notifications (cleanup job)
 */
export async function deleteOldNotifications(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  return prisma.notification.deleteMany({
    where: {
      createdAt: {
        lt: cutoffDate,
      },
      isRead: true, // Only delete read notifications
    },
  });
}

// ============================================
// Push Notifications (PWA)
// ============================================

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
}

/**
 * Send push notification to user
 * Note: Requires PushSubscription model in Prisma schema
 */
export async function sendPushNotification(userId: string, payload: PushPayload) {
  // TODO: Implement when PushSubscription model is added to schema
  console.log('Push notifications not yet implemented');
  return;
}

/**
 * Subscribe to push notifications
 * Note: Requires PushSubscription model in Prisma schema
 */
export async function subscribeToPush(userId: string, subscription: any) {
  // TODO: Implement when PushSubscription model is added to schema
  console.log('Push subscriptions not yet implemented');
  return null;
}

/**
 * Unsubscribe from push notifications
 * Note: Requires PushSubscription model in Prisma schema
 */
export async function unsubscribeFromPush(userId: string, endpoint: string) {
  // TODO: Implement when PushSubscription model is added to schema
  console.log('Push unsubscribe not yet implemented');
  return null;
}

// ============================================
// Notification Templates
// ============================================

export const NotificationTemplates = {
  // Task notifications
  taskAssigned: (taskTitle: string, assignerName: string, taskId: string) => ({
    type: 'task' as NotificationType,
    title: 'مهمة جديدة',
    message: `تم تعيين مهمة "${taskTitle}" لك من قبل ${assignerName}`,
    actionUrl: `/tasks/${taskId}`,
    actionLabel: 'عرض المهمة',
  }),

  taskDueSoon: (taskTitle: string, dueDate: string, taskId: string) => ({
    type: 'task' as NotificationType,
    title: 'موعد استحقاق قريب',
    message: `مهمة "${taskTitle}" مستحقة في ${dueDate}`,
    actionUrl: `/tasks/${taskId}`,
    actionLabel: 'عرض المهمة',
  }),

  taskCompleted: (taskTitle: string, completedBy: string) => ({
    type: 'task' as NotificationType,
    title: 'تم إكمال مهمة',
    message: `تم إكمال مهمة "${taskTitle}" بواسطة ${completedBy}`,
  }),

  // Leave notifications
  leaveApproved: (leaveType: string, startDate: string, leaveId: string) => ({
    type: 'leave' as NotificationType,
    title: 'تمت الموافقة على الإجازة',
    message: `تمت الموافقة على طلب إجازة ${leaveType} ابتداءً من ${startDate}`,
    actionUrl: `/hr/leaves/${leaveId}`,
    actionLabel: 'عرض الإجازة',
  }),

  leaveRejected: (leaveType: string, reason?: string) => ({
    type: 'leave' as NotificationType,
    title: 'تم رفض الإجازة',
    message: `تم رفض طلب إجازة ${leaveType}${reason ? `. السبب: ${reason}` : ''}`,
  }),

  leaveRequestPending: (employeeName: string, leaveType: string, leaveId: string) => ({
    type: 'leave' as NotificationType,
    title: 'طلب إجازة جديد',
    message: `طلب إجازة ${leaveType} من ${employeeName} بانتظار الموافقة`,
    actionUrl: `/hr/leaves/${leaveId}`,
    actionLabel: 'مراجعة الطلب',
  }),

  // Attendance notifications
  attendanceMissed: (date: string) => ({
    type: 'attendance' as NotificationType,
    title: 'تم تسجيل غياب',
    message: `لم يتم تسجيل حضور في تاريخ ${date}`,
    actionUrl: '/attendance',
    actionLabel: 'عرض الحضور',
  }),

  attendanceLate: (date: string, minutesLate: number) => ({
    type: 'attendance' as NotificationType,
    title: 'تأخير عن الدوام',
    message: `تم تسجيل تأخير ${minutesLate} دقيقة في ${date}`,
    actionUrl: '/attendance',
  }),

  // Purchase notifications
  purchaseApproved: (requestTitle: string, requestId: string) => ({
    type: 'purchase' as NotificationType,
    title: 'تمت الموافقة على طلب الشراء',
    message: `تمت الموافقة على طلب "${requestTitle}"`,
    actionUrl: `/procurement/purchase/${requestId}`,
    actionLabel: 'عرض الطلب',
  }),

  purchaseRejected: (requestTitle: string, reason?: string) => ({
    type: 'purchase' as NotificationType,
    title: 'تم رفض طلب الشراء',
    message: `تم رفض طلب "${requestTitle}"${reason ? `. السبب: ${reason}` : ''}`,
  }),

  // System notifications
  systemUpdate: (version: string) => ({
    type: 'system' as NotificationType,
    title: 'تحديث النظام',
    message: `تم تحديث النظام إلى الإصدار ${version}`,
  }),

  systemMaintenance: (startTime: string, duration: string) => ({
    type: 'system' as NotificationType,
    title: 'صيانة مجدولة',
    message: `سيكون النظام متوقفاً للصيانة في ${startTime} لمدة ${duration}`,
  }),

  // Mention notifications
  mentioned: (authorName: string, context: string, url: string) => ({
    type: 'mention' as NotificationType,
    title: 'تم ذكرك',
    message: `ذكرك ${authorName} في ${context}`,
    actionUrl: url,
    actionLabel: 'عرض',
  }),
};
