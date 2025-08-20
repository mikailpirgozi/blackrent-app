#!/bin/bash

# 📊 Continuous Health Monitor pre BlackRent
# Neustále monitoruje zdravie aplikácie a automaticky rieši problémy

set -e

# Farby
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

PROJECT_ROOT="/Users/mikailpirgozi/Desktop/Cursor zalohy mac16/Blackrent Beta 2"
LOG_DIR="$PROJECT_ROOT/logs"
MONITOR_LOG="$LOG_DIR/continuous-monitor.log"

# Konfigurácia
CHECK_INTERVAL=15      # Kontrola každých 15 sekúnd
HEALTH_CHECK_INTERVAL=300  # Kompletná health kontrola každých 5 minút
AUTO_FIX_ENABLED=true
MAX_AUTO_FIXES=3       # Maximálne 3 auto-fixy za hodinu
NOTIFICATION_ENABLED=true

# Counters
auto_fixes_count=0
last_auto_fix_time=0

# Logging
log_monitor() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$MONITOR_LOG"
}

# Kontrola či môžeme robiť auto-fix
can_auto_fix() {
    local current_time=$(date +%s)
    local time_diff=$((current_time - last_auto_fix_time))
    
    # Reset counter každú hodinu
    if [ $time_diff -gt 3600 ]; then
        auto_fixes_count=0
        last_auto_fix_time=$current_time
    fi
    
    if [ $auto_fixes_count -ge $MAX_AUTO_FIXES ]; then
        log_monitor "WARNING" "Max auto-fixes reached for this hour ($auto_fixes_count/$MAX_AUTO_FIXES)"
        return 1
    fi
    
    return 0
}

# Rýchla kontrola služieb
quick_health_check() {
    local backend_ok=false
    local frontend_ok=false
    local api_ok=false
    
    # Kontrola procesov
    if [ -f "$LOG_DIR/backend.pid" ]; then
        local backend_pid=$(cat "$LOG_DIR/backend.pid" 2>/dev/null || echo "")
        if [ -n "$backend_pid" ] && kill -0 "$backend_pid" 2>/dev/null; then
            backend_ok=true
        fi
    fi
    
    if [ -f "$LOG_DIR/frontend.pid" ]; then
        local frontend_pid=$(cat "$LOG_DIR/frontend.pid" 2>/dev/null || echo "")
        if [ -n "$frontend_pid" ] && kill -0 "$frontend_pid" 2>/dev/null; then
            frontend_ok=true
        fi
    fi
    
    # Kontrola API
    if [ "$backend_ok" = true ]; then
        local api_response=$(curl -s -m 3 "http://localhost:3001/api/test-simple" 2>/dev/null || echo "failed")
        if echo "$api_response" | grep -q "success.*true"; then
            api_ok=true
        fi
    fi
    
    # Return status
    if [ "$backend_ok" = true ] && [ "$frontend_ok" = true ] && [ "$api_ok" = true ]; then
        return 0  # Všetko OK
    else
        log_monitor "WARNING" "Health check failed - Backend: $backend_ok, Frontend: $frontend_ok, API: $api_ok"
        return 1  # Problém
    fi
}

# Automatické riešenie problémov
auto_fix_issues() {
    if ! can_auto_fix; then
        return 1
    fi
    
    log_monitor "INFO" "Starting auto-fix (attempt $((auto_fixes_count + 1))/$MAX_AUTO_FIXES)"
    
    cd "$PROJECT_ROOT"
    
    # Spustenie auto-fix scriptu
    if ./scripts/diagnostics/auto-fix.sh >> "$MONITOR_LOG" 2>&1; then
        auto_fixes_count=$((auto_fixes_count + 1))
        last_auto_fix_time=$(date +%s)
        log_monitor "INFO" "Auto-fix successful"
        
        # Notifikácia
        if [ "$NOTIFICATION_ENABLED" = true ]; then
            osascript -e 'display notification "BlackRent aplikácia bola automaticky opravená" with title "Auto-Fix Successful"' 2>/dev/null || true
        fi
        
        return 0
    else
        log_monitor "ERROR" "Auto-fix failed"
        return 1
    fi
}

# Kompletná health kontrola
full_health_check() {
    log_monitor "INFO" "Running full health check..."
    
    cd "$PROJECT_ROOT"
    ./scripts/diagnostics/health-check.sh >> "$MONITOR_LOG" 2>&1
    
    local exit_code=$?
    if [ $exit_code -eq 0 ]; then
        log_monitor "INFO" "Full health check passed"
    else
        log_monitor "WARNING" "Full health check found issues"
    fi
    
    return $exit_code
}

# Hlavná monitoring slučka
main_loop() {
    log_monitor "INFO" "Continuous Monitor started (PID: $$)"
    log_monitor "INFO" "Quick check interval: ${CHECK_INTERVAL}s, Full check interval: ${HEALTH_CHECK_INTERVAL}s"
    
    local last_full_check=0
    local consecutive_failures=0
    
    while true; do
        local current_time=$(date +%s)
        
        # Rýchla kontrola
        if quick_health_check; then
            consecutive_failures=0
            # Tichý úspech - logujeme len každých 5 minút
            if [ $((current_time % 300)) -lt $CHECK_INTERVAL ]; then
                log_monitor "INFO" "All services healthy"
            fi
        else
            consecutive_failures=$((consecutive_failures + 1))
            log_monitor "WARNING" "Health check failed (consecutive failures: $consecutive_failures)"
            
            # Auto-fix po 2 neúspešných pokusoch
            if [ $consecutive_failures -ge 2 ] && [ "$AUTO_FIX_ENABLED" = true ]; then
                log_monitor "INFO" "Attempting auto-fix due to consecutive failures"
                
                if auto_fix_issues; then
                    consecutive_failures=0
                    sleep 30  # Daj čas na stabilizáciu
                else
                    log_monitor "ERROR" "Auto-fix failed, manual intervention may be required"
                    
                    # Kritická notifikácia
                    if [ "$NOTIFICATION_ENABLED" = true ]; then
                        osascript -e 'display notification "BlackRent aplikácia má problémy a auto-fix zlyhal" with title "Manual Intervention Required"' 2>/dev/null || true
                    fi
                fi
            fi
        fi
        
        # Kompletná health kontrola každých 5 minút
        if [ $((current_time - last_full_check)) -ge $HEALTH_CHECK_INTERVAL ]; then
            full_health_check
            last_full_check=$current_time
        fi
        
        sleep $CHECK_INTERVAL
    done
}

# Signal handlers
cleanup() {
    log_monitor "INFO" "Continuous Monitor stopping (received signal)"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Kontrola či už beží
if pgrep -f "continuous-monitor.sh" | grep -v $$ >/dev/null; then
    echo -e "${YELLOW}⚠️  Continuous monitor už beží${NC}"
    exit 1
fi

# Vytvorenie logs adresára
mkdir -p "$LOG_DIR"

# Spustenie
echo -e "${GREEN}Starting continuous monitoring...${NC}"
echo -e "${CYAN}Logs: $MONITOR_LOG${NC}"
echo -e "${CYAN}Pre ukončenie: Ctrl+C${NC}"
echo ""

main_loop
