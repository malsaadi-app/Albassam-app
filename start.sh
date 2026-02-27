#!/bin/bash
set -e

echo "[$(date)] Starting Albassam app with PM2..."

command -v pm2 >/dev/null 2>&1 || npm i -g pm2

cd /data/.openclaw/workspace/albassam-tasks

pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

pm2 list
