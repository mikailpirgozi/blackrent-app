#!/bin/bash

# 🐕 BlackRent Watchdog Script
# Automaticky monitoruje a reštartuje servery ak sa zasekne

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
WATCHDOG_LOG="$LOG_DIR/watchdog.log"
BACKEND_PORT=3001
FRONTEND_PORT=3000

# Konfigurácia
CHECK_INTERVAL=30  # Kontrola každých 30 sekúnd
MAX_FAILURES=3     # Maximálne 3 zlyhania pred reštartom
RESPONSE_TIMEOUT=10 # Timeout pre HTTP požiadavky

# Counters
backend_failures=0
frontend_failures=0

# Vytvor logs adresár
mkdir -p "$LOG_DIR"

# Logging funkcia
log_message() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$WATCHDOG_LOG"
}

# Kontrola či proces beží
check_process() {
    local pid_file=$1
    local service_name=$2
    
    if [ ! -f "$pid_file" ]; then
        log_message "ERROR" "$service_name PID file not found: $pid_file"
        return 1
    fi
    
    local pid=$(cat "$pid_file" 2>/dev/null)
    if [ -z "$pid" ]; then
        log_message "ERROR" "$service_name PID file is empty"
        return 1
    fi
    
    if ! kill -0 "$pid" 2>/dev/null; then
        log_message "ERROR" "$service_name process (PID: $pid) is not running"
        return 1
    fi
    
    return 0
}

# Kontrola HTTP odpovede
check_http() {
    local url=$1
    local service_name=$2
    
    local response=$(curl -s -m "$RESPONSE_TIMEOUT" -w "%{http_code}" -o /dev/null "$url" 2>/dev/null || echo "000")
    
    if [ "$response" = "200" ] || [ "$response" = "000" ]; then
        return 0
    else
        log_message "WARNING" "$service_name HTTP check failed: $response"
        return 1
    fi
}

# Reštart služby
restart_service() {
    local service=$1
    
    log_message "INFO" "Restarting $service..."
    
    cd "$PROJECT_ROOT"
    
    # Ukončenie aktuálnych procesov
    ./stop-dev.sh >/dev/null 2>&1 || true
    sleep 5
    
    # Spustenie cez stabilný script
    ./scripts/stable-start.sh >/dev/null 2>&1 &
    
    # Čakanie na spustenie
    sleep 30
    
    # Verifikácia
    if check_process "$LOG_DIR/backend.pid" "Backend" && check_process "$LOG_DIR/frontend.pid" "Frontend"; then
        log_message "INFO" "Services restarted successfully"
        backend_failures=0
        frontend_failures=0
        return 0
    else
        log_message "ERROR" "Service restart failed"
        return 1
    fi
}

# Hlavná watchdog slučka
watchdog_loop() {
    log_message "INFO" "BlackRent Watchdog started (PID: $$)"
    log_message "INFO" "Check interval: ${CHECK_INTERVAL}s, Max failures: $MAX_FAILURES"
    
    while true; do
        local backend_ok=true
        local frontend_ok=true
        
        # Kontrola backend procesu
        if ! check_process "$LOG_DIR/backend.pid" "Backend"; then
            backend_ok=false
            backend_failures=$((backend_failures + 1))
        fi
        
        # Kontrola backend HTTP
        if [ "$backend_ok" = true ]; then
            if ! check_http "http://localhost:$BACKEND_PORT/api/test-simple" "Backend"; then
                backend_ok=false
                backend_failures=$((backend_failures + 1))
            fi
        fi
        
        # Kontrola frontend procesu
        if ! check_process "$LOG_DIR/frontend.pid" "Frontend"; then
            frontend_ok=false
            frontend_failures=$((frontend_failures + 1))
        fi
        
        # Kontrola frontend HTTP
        if [ "$frontend_ok" = true ]; then
            if ! check_http "http://localhost:$FRONTEND_PORT" "Frontend"; then
                frontend_ok=false
                frontend_failures=$((frontend_failures + 1))
            fi
        fi
        
        # Resetovanie počítadiel ak je všetko OK
        if [ "$backend_ok" = true ]; then
            if [ $backend_failures -gt 0 ]; then
                log_message "INFO" "Backend recovered, resetting failure counter"
                backend_failures=0
            fi
        fi
        
        if [ "$frontend_ok" = true ]; then
            if [ $frontend_failures -gt 0 ]; then
                log_message "INFO" "Frontend recovered, resetting failure counter"
                frontend_failures=0
            fi
        fi
        
        # Reštart ak je potrebný
        if [ $backend_failures -ge $MAX_FAILURES ] || [ $frontend_failures -ge $MAX_FAILURES ]; then
            log_message "WARNING" "Max failures reached (Backend: $backend_failures, Frontend: $frontend_failures)"
            
            if restart_service "BlackRent"; then
                log_message "INFO" "Services restarted successfully"
            else
                log_message "ERROR" "Service restart failed, will try again in next cycle"
            fi
        fi
        
        # Status report každých 10 cyklov (5 minút)
        if [ $(($(date +%s) % 300)) -lt $CHECK_INTERVAL ]; then
            log_message "INFO" "Status: Backend failures: $backend_failures, Frontend failures: $frontend_failures"
        fi
        
        sleep $CHECK_INTERVAL
    done
}

# Signal handlers
cleanup() {
    log_message "INFO" "Watchdog stopping (received signal)"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Kontrola či už beží iný watchdog
if pgrep -f "watchdog.sh" | grep -v $$ >/dev/null; then
    echo -e "${YELLOW}⚠️  Iný watchdog už beží. Ukončujem duplicitný proces.${NC}"
    exit 1
fi

# Spustenie
echo -e "${CYAN}🐕 BlackRent Watchdog${NC}"
echo -e "${CYAN}Monitorovanie každých ${CHECK_INTERVAL}s${NC}"
echo -e "${CYAN}Logy: $WATCHDOG_LOG${NC}"
echo -e "${CYAN}Pre ukončenie: Ctrl+C${NC}"
echo ""

# Kontrola či servery bežia
if ! check_process "$LOG_DIR/backend.pid" "Backend" || ! check_process "$LOG_DIR/frontend.pid" "Frontend"; then
    echo -e "${YELLOW}⚠️  Servery nebežia, spúšťam ich...${NC}"
    cd "$PROJECT_ROOT"
    ./scripts/stable-start.sh
    sleep 10
fi

# Spustenie watchdog slučky
watchdog_loop
