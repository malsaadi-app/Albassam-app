import { TaskStatus } from '@prisma/client';
import prisma from '@/lib/prisma';

type NotificationType = 'TASK_ASSIGNED' | 'TASK_STATUS_CHANGED' | 'COMMENT_MENTION' | 'NEW_COMMENT' | 'TASK_OVERDUE' | 'TASK_DUE_SOON' | 'DAILY_SUMMARY';

interface NotificationParams {
  type: NotificationType;
  userId: string;
  taskTitle?: string;
  taskId?: string;
  status?: TaskStatus;
  assignedBy?: string;
  commentAuthor?: string;
  commentContent?: string;
  summaryData?: {
    newTasks: number;
    inProgressTasks: number;
    overdueTasks: number;
  };
}

const statusTextMap: Record<TaskStatus, string> = {
  NEW: 'جديد',
  IN_PROGRESS: 'قيد التنفيذ',
  ON_HOLD: 'بانتظار',
  DONE: 'مكتمل'
};

export async function sendTelegramNotification(params: NotificationParams): Promise<void> {
  try {
    const user = await prisma.user.findUnique({ 
      where: { id: params.userId },
      select: { telegramId: true, notificationsEnabled: true }
    });

    if (!user || !user.telegramId || !user.notificationsEnabled) {
      console.log(`Notifications disabled or no Telegram ID for user ${params.userId}`);
      return;
    }

    let message = '';

    switch (params.type) {
      case 'TASK_ASSIGNED':
        message = `🆕 مهمة جديدة!\n\n`;
        message += `📋 ${params.taskTitle}\n`;
        if (params.assignedBy) {
          message += `👤 من: ${params.assignedBy}\n`;
        }
        message += `\n🔗 https://app.albassam-app.com/tasks`;
        break;

      case 'TASK_STATUS_CHANGED':
        if (params.status) {
          message = `🔔 تحديث حالة المهمة\n\n`;
          message += `📋 ${params.taskTitle}\n`;
          message += `📊 الحالة: ${statusTextMap[params.status]}\n`;
          message += `\n🔗 https://app.albassam-app.com/tasks`;
        }
        break;

      case 'COMMENT_MENTION':
        message = `💬 ذكرك ${params.commentAuthor} في تعليق\n\n`;
        message += `📋 ${params.taskTitle}\n`;
        if (params.commentContent) {
          message += `📝 "${params.commentContent}..."\n`;
        }
        message += `\n🔗 https://app.albassam-app.com/tasks`;
        break;

      case 'NEW_COMMENT':
        message = `💬 تعليق جديد من ${params.commentAuthor}\n\n`;
        message += `📋 ${params.taskTitle}\n`;
        message += `\n🔗 https://app.albassam-app.com/tasks`;
        break;

      case 'TASK_OVERDUE':
        message = `⚠️ مهمة متأخرة!\n\n`;
        message += `📋 ${params.taskTitle}\n`;
        message += `⏰ الوقت المحدد قد انقضى\n`;
        message += `\n🔗 https://app.albassam-app.com/tasks`;
        break;

      case 'TASK_DUE_SOON':
        message = `⏰ تذكير: مهمة قريبة الموعد\n\n`;
        message += `📋 ${params.taskTitle}\n`;
        message += `📅 تنتهي خلال 24 ساعة\n`;
        message += `\n🔗 https://app.albassam-app.com/tasks`;
        break;

      case 'DAILY_SUMMARY':
        if (params.summaryData) {
          message = `📊 ملخصك اليومي\n\n`;
          message += `🆕 ${params.summaryData.newTasks} مهام جديدة\n`;
          message += `⚙️ ${params.summaryData.inProgressTasks} قيد التنفيذ\n`;
          message += `⚠️ ${params.summaryData.overdueTasks} متأخرة\n`;
          message += `\n🔗 https://app.albassam-app.com/tasks`;
        }
        break;
    }

    if (!message) return;

    // This should integrate with your OpenClaw message tool
    // For now, we'll use a placeholder that can be replaced with actual implementation
    console.log(`Telegram notification for ${user.telegramId}: ${message}`);
    
    // TODO: Integrate with OpenClaw message tool
    // await sendMessage(user.telegramId, message);

  } catch (error) {
    console.error('Error sending Telegram notification:', error);
    // Don't throw - notifications are non-critical
  }
}

export async function notifyAdminOfStatusChange(
  taskId: string, 
  taskTitle: string, 
  newStatus: TaskStatus,
  changedBy: string
): Promise<void> {
  try {
    const admins = await prisma.user.findMany({
      where: { 
        role: 'ADMIN',
        notificationsEnabled: true,
        telegramId: { not: null }
      },
      select: { telegramId: true, username: true }
    });

    for (const admin of admins) {
      if (!admin.telegramId) continue;

      const message = `🔔 تحديث من ${changedBy}\n\n` +
                     `📋 ${taskTitle}\n` +
                     `📊 الحالة الجديدة: ${statusTextMap[newStatus]}\n\n` +
                     `🔗 https://app.albassam-app.com/tasks`;

      console.log(`Telegram notification for admin ${admin.telegramId}: ${message}`);
      
      // TODO: Integrate with OpenClaw message tool
      // await sendMessage(admin.telegramId, message);
    }
  } catch (error) {
    console.error('Error notifying admin:', error);
  }
}
