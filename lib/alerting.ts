/**
 * Alerting System
 * 
 * Sends alerts for critical events:
 * - Application errors
 * - Service degradation
 * - Database issues
 * - Security incidents
 * 
 * Supports multiple channels:
 * - Telegram (primary)
 * - Email (backup)
 * - Webhook (extensible)
 */

import logger from './logger';

/**
 * Alert severity levels
 */
export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

/**
 * Alert interface
 */
interface Alert {
  severity: AlertSeverity;
  title: string;
  message: string;
  metadata?: any;
  timestamp?: Date;
}

/**
 * Send Telegram alert
 */
async function sendTelegramAlert(alert: Alert): Promise<boolean> {
  // Check if Telegram is configured
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ALERT_CHAT_ID;

  if (!botToken || !chatId) {
    logger.warn('Telegram alerts not configured');
    return false;
  }

  try {
    // Format message
    const emoji = {
      [AlertSeverity.INFO]: 'ℹ️',
      [AlertSeverity.WARNING]: '⚠️',
      [AlertSeverity.ERROR]: '❌',
      [AlertSeverity.CRITICAL]: '🚨',
    }[alert.severity];

    const text = `${emoji} *${alert.title}*

${alert.message}

_${alert.timestamp?.toISOString() || new Date().toISOString()}_`;

    // Send via Telegram Bot API
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'Markdown',
          disable_web_page_preview: true,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Telegram API error: ${response.statusText}`);
    }

    logger.info('Telegram alert sent', { title: alert.title, severity: alert.severity });
    return true;
  } catch (error) {
    logger.error('Failed to send Telegram alert', {
      error: error instanceof Error ? error.message : 'Unknown error',
      alert,
    });
    return false;
  }
}

/**
 * Send email alert (placeholder)
 */
async function sendEmailAlert(alert: Alert): Promise<boolean> {
  // TODO: Implement email sending (SendGrid, Resend, etc.)
  logger.info('Email alert (not implemented)', { alert });
  return false;
}

/**
 * Send alert via webhook
 */
async function sendWebhookAlert(alert: Alert): Promise<boolean> {
  const webhookUrl = process.env.ALERT_WEBHOOK_URL;

  if (!webhookUrl) {
    return false;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alert),
    });

    return response.ok;
  } catch (error) {
    logger.error('Failed to send webhook alert', { error, alert });
    return false;
  }
}

/**
 * Main alert function
 */
export async function sendAlert(alert: Alert): Promise<void> {
  // Log the alert
  logger.log(
    alert.severity === AlertSeverity.CRITICAL || alert.severity === AlertSeverity.ERROR
      ? 'error'
      : 'warn',
    `[ALERT] ${alert.title}`,
    { ...alert }
  );

  // Send to all configured channels
  const promises: Promise<boolean>[] = [];

  // Telegram (primary)
  promises.push(sendTelegramAlert(alert));

  // Email (backup, for critical only)
  if (alert.severity === AlertSeverity.CRITICAL) {
    promises.push(sendEmailAlert(alert));
  }

  // Webhook (if configured)
  if (process.env.ALERT_WEBHOOK_URL) {
    promises.push(sendWebhookAlert(alert));
  }

  // Wait for all sends (fire and forget)
  await Promise.allSettled(promises);
}

/**
 * Predefined alerts
 */
export const Alerts = {
  /**
   * Database connection lost
   */
  async databaseDown(error?: string) {
    await sendAlert({
      severity: AlertSeverity.CRITICAL,
      title: 'Database Connection Lost',
      message: `قاعدة البيانات غير متصلة!\n\n${error || 'No details available'}`,
      timestamp: new Date(),
    });
  },

  /**
   * Database degraded (slow)
   */
  async databaseSlow(latency: number) {
    await sendAlert({
      severity: AlertSeverity.WARNING,
      title: 'Database Performance Degraded',
      message: `قاعدة البيانات بطيئة!\n\nLatency: ${latency.toFixed(2)}ms (expected < 100ms)`,
      timestamp: new Date(),
    });
  },

  /**
   * High error rate
   */
  async highErrorRate(errorRate: number, period: string) {
    await sendAlert({
      severity: AlertSeverity.ERROR,
      title: 'High Error Rate Detected',
      message: `معدل أخطاء عالي!\n\nError rate: ${errorRate.toFixed(1)}% in last ${period}`,
      timestamp: new Date(),
    });
  },

  /**
   * Memory usage high
   */
  async highMemoryUsage(usage: number) {
    await sendAlert({
      severity: AlertSeverity.WARNING,
      title: 'High Memory Usage',
      message: `استخدام الذاكرة عالي!\n\nMemory usage: ${usage.toFixed(1)}%`,
      timestamp: new Date(),
    });
  },

  /**
   * Application crashed
   */
  async applicationCrashed(error?: string) {
    await sendAlert({
      severity: AlertSeverity.CRITICAL,
      title: 'Application Crashed',
      message: `التطبيق توقف!\n\n${error || 'No details available'}`,
      timestamp: new Date(),
    });
  },

  /**
   * Suspicious activity detected
   */
  async suspiciousActivity(description: string, ip?: string) {
    await sendAlert({
      severity: AlertSeverity.ERROR,
      title: 'Suspicious Activity Detected',
      message: `نشاط مشبوه!\n\n${description}\n${ip ? `\nIP: ${ip}` : ''}`,
      timestamp: new Date(),
    });
  },

  /**
   * Backup failed
   */
  async backupFailed(error: string) {
    await sendAlert({
      severity: AlertSeverity.ERROR,
      title: 'Backup Failed',
      message: `فشل النسخ الاحتياطي!\n\n${error}`,
      timestamp: new Date(),
    });
  },

  /**
   * SSL certificate expiring soon
   */
  async sslExpiringSoon(daysLeft: number) {
    await sendAlert({
      severity: AlertSeverity.WARNING,
      title: 'SSL Certificate Expiring Soon',
      message: `شهادة SSL تنتهي قريباً!\n\nDays left: ${daysLeft}`,
      timestamp: new Date(),
    });
  },
};

/**
 * Usage Examples:
 * 
 * 1. Database down:
 * await Alerts.databaseDown('Connection refused');
 * 
 * 2. High error rate:
 * await Alerts.highErrorRate(5.2, '5 minutes');
 * 
 * 3. Custom alert:
 * await sendAlert({
 *   severity: AlertSeverity.CRITICAL,
 *   title: 'Payment Gateway Down',
 *   message: 'بوابة الدفع غير متاحة!',
 *   metadata: { gateway: 'stripe', error: 'timeout' }
 * });
 * 
 * 4. Suspicious activity:
 * await Alerts.suspiciousActivity('SQL injection attempt', '192.168.1.1');
 */

/**
 * Setup Instructions:
 * 
 * 1. Create Telegram bot:
 *    - Search @BotFather on Telegram
 *    - Send /newbot
 *    - Follow instructions
 *    - Copy bot token
 * 
 * 2. Get your chat ID:
 *    - Search @userinfobot on Telegram
 *    - Send /start
 *    - Copy your ID
 * 
 * 3. Update .env:
 *    TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
 *    TELEGRAM_ALERT_CHAT_ID=123456789
 * 
 * 4. Test:
 *    await sendAlert({
 *      severity: AlertSeverity.INFO,
 *      title: 'Test Alert',
 *      message: 'This is a test alert from Albassam Schools App'
 *    });
 */
