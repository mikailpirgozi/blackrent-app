#!/bin/bash

# BlackRent Customer Website - Server Monitor
# Tento script monitoruje stav servera a automaticky ho reštartuje pri problémoch

set -e

# Farby pre výstup
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Konfigurácia
PORT=3002
CHECK_INTERVAL=30  # sekúnd
MAX_FAILURES=3
FAILURE_COUNT=0

log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Funkcia pre kontrolu stavu servera
check_server() {
    local http_status
    local response_time
    
    # HTTP status check
    http_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT/ 2>/dev/null || echo "000")
    
    if [ "$http_status" = "200" ]; then
        # Meranie response time
        response_time=$(curl -s -o /dev/null -w "%{time_total}" http://localhost:$PORT/ 2>/dev/null || echo "999")
        
        # Konverzia na milisekundy
        response_ms=$(python3 -c "print(int(float('$response_time') * 1000))" 2>/dev/null || echo "N/A")
        
        success "Server OK (HTTP: $http_status, Response: ${response_ms}ms)"
        FAILURE_COUNT=0
        return 0
    else
        error "Server nedostupný (HTTP: $http_status)"
        ((FAILURE_COUNT++))
        return 1
    fi
}

# Funkcia pre kontrolu portu
check_port() {
    if lsof -i:$PORT >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Funkcia pre reštart servera
restart_server() {
    warning "Reštartujem server..."
    
    # Ukončenie existujúcich procesov
    if lsof -ti:$PORT >/dev/null 2>&1; then
        lsof -ti:$PORT | xargs kill -9 2>/dev/null || true
        sleep 3
    fi
    
    # Spustenie nového servera
    cd "$(dirname "$0")/.."
    nohup ./scripts/stable-server.sh > server-monitor.log 2>&1 &
    
    # Čakanie na spustenie
    local wait_count=0
    while [ $wait_count -lt 30 ]; do
        if check_port; then
            success "Server úspešne reštartovaný"
            return 0
        fi
        sleep 2
        ((wait_count++))
    done
    
    error "Reštart servera zlyhal"
    return 1
}

# Funkcia pre monitoring loop
monitor_loop() {
    log "Spúšťam monitoring servera na porte $PORT"
    log "Interval kontroly: ${CHECK_INTERVAL}s"
    log "Max zlyhania pred reštartom: $MAX_FAILURES"
    echo "=================================================="
    
    while true; do
        if ! check_port; then
            error "Server proces nebeží na porte $PORT"
            restart_server
        elif ! check_server; then
            warning "Server zlyhal $FAILURE_COUNT/$MAX_FAILURES krát"
            
            if [ $FAILURE_COUNT -ge $MAX_FAILURES ]; then
                error "Dosiahnutý limit zlyhaní, reštartujem server"
                restart_server
                FAILURE_COUNT=0
            fi
        fi
        
        sleep $CHECK_INTERVAL
    done
}

# Funkcia pre zobrazenie stavu
show_status() {
    echo "BlackRent Customer Website - Server Status"
    echo "=========================================="
    
    if check_port; then
        success "Server proces beží na porte $PORT"
        
        if check_server; then
            success "Server odpovedá správne"
        else
            error "Server neodpovedá správne"
        fi
    else
        error "Server proces nebeží"
    fi
    
    echo ""
    echo "Procesy na porte $PORT:"
    lsof -i:$PORT 2>/dev/null || echo "Žiadne procesy"
}

# Hlavná logika
case "${1:-monitor}" in
    "monitor")
        monitor_loop
        ;;
    "status")
        show_status
        ;;
    "restart")
        restart_server
        ;;
    "stop")
        if lsof -ti:$PORT >/dev/null 2>&1; then
            log "Ukončujem server..."
            lsof -ti:$PORT | xargs kill -9 2>/dev/null || true
            success "Server ukončený"
        else
            warning "Server nebeží"
        fi
        ;;
    *)
        echo "Použitie: $0 [monitor|status|restart|stop]"
        echo ""
        echo "Príkazy:"
        echo "  monitor  - Spustí kontinuálny monitoring (default)"
        echo "  status   - Zobrazí aktuálny stav servera"
        echo "  restart  - Reštartuje server"
        echo "  stop     - Ukončí server"
        exit 1
        ;;
esac
