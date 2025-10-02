#!/bin/bash

# Railway Deployment Monitor - Local Logging Version
LOG_FILE="./logs/railway-monitor.log"
mkdir -p ./logs

echo "🚂 Railway Monitor starting at $(date)"
echo "📊 Monitoring: https://blackrent-app-production-4d6f.up.railway.app"

while true; do
    response=$(curl -s -o /dev/null -w "%{http_code}" https://blackrent-app-production-4d6f.up.railway.app/)
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    if [ "$response" != "200" ]; then
        # Log alert locally
        echo "[$timestamp] ⚠️  ALERT: Railway returned HTTP $response" | tee -a "$LOG_FILE"
        echo "[$timestamp] 🚨 Railway service may be down!" | tee -a "$LOG_FILE"
    else
        echo "[$timestamp] ✅ Railway OK (HTTP $response)" >> "$LOG_FILE"
    fi
    
    sleep 60
done
