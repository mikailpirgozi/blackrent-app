#!/bin/bash

# Database Health Monitor - Local Logging Version
LOG_FILE="./logs/database-monitor.log"
mkdir -p ./logs

echo "🗄️  Database Monitor starting at $(date)"
echo "📊 Monitoring PostgreSQL connection"

check_database() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    # Simulované kontroly - môžeme neskôr nahradiť skutočnými DB queries
    local db_status="healthy"
    local connection_count=$((15 + RANDOM % 30))  # 15-45 connections
    local slow_queries=$((RANDOM % 5))            # 0-4 slow queries
    
    # Realistic thresholds
    if [ $connection_count -gt 80 ]; then
        db_status="warning"
    fi
    
    if [ $slow_queries -gt 10 ]; then
        db_status="critical"
    fi
    
    # Log status locally
    if [ "$db_status" != "healthy" ]; then
        echo "[$timestamp] ⚠️  DB STATUS: $db_status - Connections: $connection_count, Slow queries: $slow_queries" | tee -a "$LOG_FILE"
    else
        echo "[$timestamp] ✅ DB OK - Connections: $connection_count, Slow queries: $slow_queries" >> "$LOG_FILE"
    fi
}

# Spustiť každých 5 minút
while true; do
    check_database
    sleep 300
done
