#!/bin/bash

# Backend Monitoring Script
# Automaticky reštartuje backend ak padne

PORT=3001
BACKEND_DIR="/Users/mikailpirgozi/Desktop/Cursor zalohy mac16/Blackrent Beta 2/backend"
CHECK_INTERVAL=30  # Kontrola každých 30 sekúnd

echo "🔍 Starting Backend Monitor..."
echo "📍 Monitoring port: $PORT"
echo "⏰ Check interval: ${CHECK_INTERVAL}s"

while true; do
    # Skontroluj či backend beží
    if lsof -i :$PORT | grep -q LISTEN; then
        # Backend beží, skontroluj či odpoveda
        if curl -s http://localhost:$PORT/api/health > /dev/null 2>&1; then
            echo "✅ [$(date '+%H:%M:%S')] Backend is healthy"
        else
            echo "⚠️ [$(date '+%H:%M:%S')] Backend not responding, restarting..."
            pkill -f "node.*backend"
            sleep 2
            cd "$BACKEND_DIR" && npm run dev &
        fi
    else
        echo "❌ [$(date '+%H:%M:%S')] Backend not running, starting..."
        cd "$BACKEND_DIR" && npm run dev &
    fi
    
    sleep $CHECK_INTERVAL
done
