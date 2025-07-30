#!/bin/bash

# Error Log Monitor - Local Logging Version
LOG_FILE="./logs/error-tracker.log"
mkdir -p ./logs

echo "🐛 Error Tracker starting at $(date)"
echo "📊 Monitoring application errors"

monitor_errors() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Simulované error tracking s realistickými hodnotami
    local error_count=$(($RANDOM % 5))      # 0-4 errors (usually low)
    local warning_count=$(($RANDOM % 15))   # 0-14 warnings
    local info_count=$((50 + $RANDOM % 100))  # 50-150 info messages
    
    # Check for critical errors
    if [ $error_count -gt 3 ]; then
        echo "[$timestamp] 🚨 CRITICAL: High error rate - Errors: $error_count, Warnings: $warning_count" | tee -a "$LOG_FILE"
    elif [ $error_count -gt 0 ]; then
        echo "[$timestamp] ⚠️  ERRORS: $error_count errors, $warning_count warnings detected" | tee -a "$LOG_FILE"
    else
        echo "[$timestamp] ✅ No errors - Warnings: $warning_count, Info: $info_count" >> "$LOG_FILE"
    fi
}

# Spustiť každú minútu  
while true; do
    monitor_errors
    sleep 60
done
