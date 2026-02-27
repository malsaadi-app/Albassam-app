#!/bin/bash
# Auto-restart script for albassam-app + cloudflared tunnel
# Runs every minute to check if services are running

APP_DIR="/data/.openclaw/workspace/albassam-tasks"
LOG_FILE="/tmp/auto-restart.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Check if PM2 process is running
PM2_STATUS=$(cd "$APP_DIR" && pm2 jlist 2>/dev/null | grep -c '"status":"online"')

if [ "$PM2_STATUS" -eq 0 ]; then
    log "⚠️  PM2 app not running, restarting..."
    cd "$APP_DIR"
    pm2 restart albassam-app 2>&1 >> "$LOG_FILE" || pm2 start npm --name "albassam-app" -- start 2>&1 >> "$LOG_FILE"
    log "✅ PM2 restarted"
else
    log "✓ PM2 app is running"
fi

# Check if cloudflared tunnel is running
TUNNEL_PID=$(ps aux | grep "cloudflared tunnel" | grep -v grep | awk '{print $2}')

if [ -z "$TUNNEL_PID" ]; then
    log "⚠️  Cloudflared tunnel not running, restarting..."
    cd "$APP_DIR"
    nohup cloudflared tunnel --config cloudflared-config.yml run > /tmp/tunnel.log 2>&1 &
    sleep 3
    log "✅ Cloudflared restarted"
else
    log "✓ Cloudflared tunnel is running (PID: $TUNNEL_PID)"
fi

# Check if site is responding
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://app.albassam-app.com --max-time 10)
if [ "$HTTP_CODE" != "200" ]; then
    log "⚠️  Site returned $HTTP_CODE, forcing restart..."
    cd "$APP_DIR"
    pm2 restart albassam-app 2>&1 >> "$LOG_FILE"
    sleep 5
    log "✅ Forced restart completed"
else
    log "✓ Site is responding (200 OK)"
fi
