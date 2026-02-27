module.exports = {
  apps: [
    {
      name: 'albassam-app',
      script: 'npm',
      args: 'start',
      cwd: '/data/.openclaw/workspace/albassam-tasks',
      instances: 1,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/tmp/albassam-app-error.log',
      out_file: '/tmp/albassam-app-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DDTHH:mm:ss',
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000
    },
    {
      name: 'cloudflared',
      script: './cloudflared',
      // IMPORTANT:
      // - Do NOT hardcode tunnel token in this file.
      // - Provide it via environment variable CLOUDFLARED_TOKEN (e.g. sourced from .env on the host/container).
      // - Token rotation: update CLOUDFLARED_TOKEN then restart this PM2 process.
      args: `tunnel run --token ${process.env.CLOUDFLARED_TOKEN || ''}`,
      cwd: '/data/.openclaw/workspace/albassam-tasks',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,
      error_file: '/tmp/cloudflared-error.log',
      out_file: '/tmp/cloudflared-out.log',
      merge_logs: true
    }
  ]
};
