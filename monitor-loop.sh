#!/bin/bash
# Continuous monitoring loop - runs auto-restart.sh every minute

while true; do
    /data/.openclaw/workspace/albassam-tasks/auto-restart.sh
    sleep 60
done
