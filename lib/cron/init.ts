/**
 * Cron Jobs Initialization
 * Import and start all cron jobs here
 */

import { startWorkflowEscalationCron } from './workflow-escalation';

let initialized = false;

export function initializeCronJobs() {
  if (initialized) {
    console.log('[Cron] Already initialized, skipping...');
    return;
  }

  console.log('[Cron] Initializing cron jobs...');

  try {
    // Start workflow escalation cron
    startWorkflowEscalationCron();

    // Add more cron jobs here as needed
    // Example:
    // startAnotherCron();

    initialized = true;
    console.log('[Cron] ✅ All cron jobs initialized successfully');
  } catch (error) {
    console.error('[Cron] ❌ Error initializing cron jobs:', error);
  }
}
