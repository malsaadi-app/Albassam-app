#!/bin/bash
# Health Monitor - Checks app status and alerts on issues

# Configuration
APP_NAME="albassam-app"
APP_URL="http://localhost:3000"
MAX_RESTARTS=5
ALERT_FILE="/tmp/albassam-health-alert.log"

echo "🏥 Health Monitor - $(date)"
echo "================================"

# Check PM2 process
PM2_STATUS=$(pm2 jlist | jq -r ".[] | select(.name==\"$APP_NAME\") | .pm2_env.status" 2>/dev/null)
RESTART_COUNT=$(pm2 jlist | jq -r ".[] | select(.name==\"$APP_NAME\") | .pm2_env.restart_time" 2>/dev/null)

if [ "$PM2_STATUS" != "online" ]; then
    echo "❌ CRITICAL: App is not online (status: $PM2_STATUS)"
    echo "$(date): App offline - status: $PM2_STATUS" >> "$ALERT_FILE"
    exit 1
fi

echo "✅ PM2 Status: $PM2_STATUS"
echo "📊 Restart Count: $RESTART_COUNT"

# Check if restart count is abnormally high
if [ "$RESTART_COUNT" -gt "$MAX_RESTARTS" ]; then
    echo "⚠️  WARNING: High restart count detected ($RESTART_COUNT restarts)"
    echo "App may be crash-looping!"
fi

# HTTP Health Check
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL" --max-time 5)

if [ "$HTTP_CODE" != "200" ]; then
    echo "❌ CRITICAL: HTTP health check failed (code: $HTTP_CODE)"
    echo "$(date): HTTP check failed - code: $HTTP_CODE" >> "$ALERT_FILE"
    exit 1
fi

echo "✅ HTTP Health: OK (200)"

# Memory Check
MEMORY_MB=$(pm2 jlist | jq -r ".[] | select(.name==\"$APP_NAME\") | .monit.memory" 2>/dev/null)
MEMORY_MB=$((MEMORY_MB / 1024 / 1024))

echo "💾 Memory Usage: ${MEMORY_MB}MB"

if [ "$MEMORY_MB" -gt 1000 ]; then
    echo "⚠️  WARNING: High memory usage (${MEMORY_MB}MB)"
fi

# CPU Check
CPU_PERCENT=$(pm2 jlist | jq -r ".[] | select(.name==\"$APP_NAME\") | .monit.cpu" 2>/dev/null)
echo "⚡ CPU Usage: ${CPU_PERCENT}%"

# Response Time Check
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" "$APP_URL")
echo "⏱️  Response Time: ${RESPONSE_TIME}s"

echo ""
echo "✅ All health checks passed"
echo "Last check: $(date)" > /tmp/albassam-last-health-check.txt

exit 0
