/**
 * Next.js Instrumentation
 * Runs when the server starts
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initializeCronJobs } = await import('./lib/cron/init');
    
    // Initialize cron jobs
    initializeCronJobs();
  }
}
