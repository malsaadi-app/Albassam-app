/**
 * Workflow Escalation Cron Job
 * Runs daily to check for stale approvals and escalate them
 */

import cron from 'node-cron';
import { escalateStaleApprovals } from '../workflow-runtime';
import { prisma } from '../db';

let isRunning = false;

/**
 * Escalate stale workflow approvals
 * Runs daily at 9:00 AM
 */
export function startWorkflowEscalationCron() {
  // Run daily at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    if (isRunning) {
      console.log('[Workflow Escalation] Already running, skipping...');
      return;
    }

    isRunning = true;
    console.log('[Workflow Escalation] Starting escalation check...');

    try {
      const result = await escalateStaleApprovals();
      
      console.log(`[Workflow Escalation] ✅ Complete: ${result.escalated} approvals escalated`);
      
      if (result.escalated > 0) {
        console.log(`[Workflow Escalation] Escalated IDs:`, result.ids);
        
        // Send summary notification to admins
        const admins = await prisma.user.findMany({
          where: {
            OR: [
              { role: 'ADMIN' },
              { role: 'SUPER_ADMIN' }
            ]
          },
          select: { id: true }
        });

        for (const admin of admins) {
          await prisma.notification.create({
            data: {
              userId: admin.id,
              title: 'تصعيد تلقائي للطلبات المتأخرة',
              message: `تم تصعيد ${result.escalated} طلب متأخر تلقائياً`,
              type: 'WORKFLOW_ESCALATED',
              isRead: false
            }
          });
        }
      }
    } catch (error) {
      console.error('[Workflow Escalation] ❌ Error:', error);
    } finally {
      isRunning = false;
    }
  });

  console.log('[Workflow Escalation] Cron job started (runs daily at 9:00 AM)');
}

/**
 * Manually trigger escalation (for testing)
 */
export async function manualEscalation() {
  console.log('[Workflow Escalation] Manual trigger...');
  
  try {
    const result = await escalateStaleApprovals();
    console.log(`[Workflow Escalation] ✅ ${result.escalated} approvals escalated`);
    return result;
  } catch (error) {
    console.error('[Workflow Escalation] ❌ Error:', error);
    throw error;
  }
}
