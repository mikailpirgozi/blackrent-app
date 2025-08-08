#!/bin/bash

# 🏥 BlackRent Health Check & Diagnostics System
# Komplexná diagnostika aplikácie pre rýchle riešenie problémov

# Farby pre výstup
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Konfigurácia
PROJECT_ROOT="/Users/mikailpirgozi/Desktop/Cursor zalohy mac16/Blackrent Beta 2"
BACKEND_PORT=3001
FRONTEND_PORT=3000
LOG_DIR="$PROJECT_ROOT/logs"
DIAGNOSTICS_LOG="$LOG_DIR/diagnostics.log"

# Vytvor logs adresár ak neexistuje
mkdir -p "$LOG_DIR"

# Logging funkcia
log_message() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" >> "$DIAGNOSTICS_LOG"
}

# Header
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                  🏥 BlackRent Health Check                   ║${NC}"
echo -e "${CYAN}║              Diagnostika & Riešenie problémov                ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# 1. KONTROLA PORTOV
echo -e "${BLUE}🔍 1. KONTROLA PORTOV${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_port() {
    local port=$1
    local service=$2
    
    if lsof -i :$port > /dev/null 2>&1; then
        local pid=$(lsof -ti :$port)
        local process=$(ps -p $pid -o comm= 2>/dev/null)
        echo -e "✅ Port $port ($service): ${GREEN}AKTÍVNY${NC} - PID: $pid, Process: $process"
        log_message "INFO" "Port $port ($service) is active - PID: $pid"
        return 0
    else
        echo -e "❌ Port $port ($service): ${RED}NEAKTÍVNY${NC}"
        log_message "ERROR" "Port $port ($service) is not active"
        return 1
    fi
}

BACKEND_OK=$(check_port $BACKEND_PORT "Backend")
FRONTEND_OK=$(check_port $FRONTEND_PORT "Frontend")

# 2. KONTROLA PROCESOV
echo ""
echo -e "${BLUE}🔍 2. KONTROLA PROCESOV${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_process() {
    local pattern=$1
    local service=$2
    
    local processes=$(pgrep -f "$pattern" | wc -l)
    if [ $processes -gt 0 ]; then
        echo -e "✅ $service: ${GREEN}$processes procesov beží${NC}"
        pgrep -f "$pattern" | while read pid; do
            local cmd=$(ps -p $pid -o args= 2>/dev/null | cut -c1-80)
            echo "   └─ PID: $pid - $cmd"
        done
        log_message "INFO" "$service has $processes running processes"
    else
        echo -e "❌ $service: ${RED}Žiadne procesy${NC}"
        log_message "ERROR" "$service has no running processes"
    fi
}

check_process "node.*backend" "Backend Node.js"
check_process "react-scripts start" "Frontend React"
check_process "npm.*start" "NPM procesy"

# 3. KONTROLA ZOMBIE PROCESOV
echo ""
echo -e "${BLUE}🔍 3. KONTROLA ZOMBIE PROCESOV${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

zombie_processes=$(ps aux | grep -E "(node|npm)" | grep -v grep | grep -E "(defunct|<zombie>)" | wc -l)
if [ $zombie_processes -gt 0 ]; then
    echo -e "⚠️  Nájdených ${YELLOW}$zombie_processes zombie procesov${NC}"
    ps aux | grep -E "(node|npm)" | grep -v grep | grep -E "(defunct|<zombie>)"
    log_message "WARNING" "Found $zombie_processes zombie processes"
else
    echo -e "✅ ${GREEN}Žiadne zombie procesy${NC}"
    log_message "INFO" "No zombie processes found"
fi

# 4. KONTROLA PAMÄTE A CPU
echo ""
echo -e "${BLUE}🔍 4. KONTROLA SYSTÉMOVÝCH ZDROJOV${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Pamäť
memory_usage=$(ps aux | grep -E "(node|npm)" | grep -v grep | awk '{sum+=$4} END {printf "%.1f", sum}')
echo -e "💾 Pamäť používaná Node.js procesmi: ${CYAN}${memory_usage:-0}%${NC}"

# CPU
cpu_usage=$(ps aux | grep -E "(node|npm)" | grep -v grep | awk '{sum+=$3} END {printf "%.1f", sum}')
echo -e "⚡ CPU používané Node.js procesmi: ${CYAN}${cpu_usage:-0}%${NC}"

# Disk space
disk_usage=$(df -h "$PROJECT_ROOT" | awk 'NR==2 {print $5}')
echo -e "💿 Disk usage: ${CYAN}$disk_usage${NC}"

log_message "INFO" "System resources - Memory: ${memory_usage:-0}%, CPU: ${cpu_usage:-0}%, Disk: $disk_usage"

# 5. KONTROLA DATABÁZY
echo ""
echo -e "${BLUE}🔍 5. KONTROLA DATABÁZY${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$BACKEND_OK" = "0" ]; then
    # Test databázového pripojenia
    db_test=$(curl -s -m 5 "http://localhost:$BACKEND_PORT/api/test-simple" 2>/dev/null)
    if echo "$db_test" | grep -q "success.*true"; then
        echo -e "✅ Databáza: ${GREEN}PRIPOJENÁ${NC}"
        log_message "INFO" "Database connection successful"
    else
        echo -e "❌ Databáza: ${RED}PROBLÉM S PRIPOJENÍM${NC}"
        echo "   Odpoveď: $db_test"
        log_message "ERROR" "Database connection failed: $db_test"
    fi
else
    echo -e "⚠️  Databáza: ${YELLOW}NEMOŽNO TESTOVAŤ (backend nebeží)${NC}"
    log_message "WARNING" "Cannot test database - backend not running"
fi

# 6. KONTROLA LOGOV NA CHYBY
echo ""
echo -e "${BLUE}🔍 6. ANALÝZA CHÝB V LOGOCH${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

analyze_log() {
    local log_file=$1
    local service=$2
    
    if [ -f "$log_file" ]; then
        local errors=$(grep -i "error\|exception\|failed\|crash" "$log_file" | tail -5)
        local warnings=$(grep -i "warning\|warn" "$log_file" | tail -3)
        
        if [ ! -z "$errors" ]; then
            echo -e "❌ ${RED}$service - Posledné chyby:${NC}"
            echo "$errors" | while read line; do
                echo "   └─ $line"
            done
            log_message "ERROR" "$service has recent errors"
        elif [ ! -z "$warnings" ]; then
            echo -e "⚠️  ${YELLOW}$service - Posledné varovania:${NC}"
            echo "$warnings" | while read line; do
                echo "   └─ $line"
            done
            log_message "WARNING" "$service has recent warnings"
        else
            echo -e "✅ ${GREEN}$service - Žiadne chyby${NC}"
            log_message "INFO" "$service logs are clean"
        fi
    else
        echo -e "⚠️  ${YELLOW}$service - Log súbor neexistuje${NC}"
        log_message "WARNING" "$service log file does not exist"
    fi
}

analyze_log "$LOG_DIR/backend.log" "Backend"
analyze_log "$LOG_DIR/frontend.log" "Frontend"

# 7. ODPORÚČANIA A RIEŠENIA
echo ""
echo -e "${PURPLE}🔧 7. ODPORÚČANIA A RIEŠENIA${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

recommendations=()

if [ "$BACKEND_OK" != "0" ]; then
    recommendations+=("🔴 Backend nebeží - Spustiť: 'npm run dev:restart' alebo 'cd backend && npm start'")
fi

if [ "$FRONTEND_OK" != "0" ]; then
    recommendations+=("🔴 Frontend nebeží - Spustiť: 'npm start' alebo 'npm run dev:restart'")
fi

if [ $zombie_processes -gt 0 ]; then
    recommendations+=("🟡 Zombie procesy - Vyčistiť: 'npm run dev:stop && sleep 2 && npm run dev:restart'")
fi

if [ $(echo "${memory_usage:-0} > 50" | bc -l 2>/dev/null || echo 0) -eq 1 ]; then
    recommendations+=("🟡 Vysoké využitie pamäte - Reštart aplikácie môže pomôcť")
fi

if [ ${#recommendations[@]} -eq 0 ]; then
    echo -e "✅ ${GREEN}Všetko vyzerá v poriadku!${NC}"
    log_message "INFO" "All systems healthy"
else
    for rec in "${recommendations[@]}"; do
        echo -e "$rec"
    done
fi

# 8. RÝCHLE RIEŠENIA
echo ""
echo -e "${PURPLE}⚡ 8. RÝCHLE PRÍKAZY PRE RIEŠENIE${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${CYAN}🔄 Kompletný reštart:${NC}     npm run dev:restart"
echo -e "${CYAN}🛑 Ukončiť všetko:${NC}       npm run dev:stop"
echo -e "${CYAN}🧹 Vyčistiť porty:${NC}       ./scripts/diagnostics/cleanup-ports.sh"
echo -e "${CYAN}📊 Monitoring:${NC}           ./scripts/diagnostics/start-monitoring.sh"
echo -e "${CYAN}🔍 Znovu diagnostika:${NC}    ./scripts/diagnostics/health-check.sh"

# Summary
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                      📊 SÚHRN STAVU                         ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"

if [ "$BACKEND_OK" = "0" ] && [ "$FRONTEND_OK" = "0" ] && [ $zombie_processes -eq 0 ]; then
    echo -e "🎉 ${GREEN}APLIKÁCIA JE ZDRAVÁ A PRIPRAVENÁ NA PRÁCU!${NC}"
    log_message "INFO" "Application is healthy and ready"
else
    echo -e "⚠️  ${YELLOW}APLIKÁCIA MÁ PROBLÉMY - POZRITE ODPORÚČANIA VYŠŠIE${NC}"
    log_message "WARNING" "Application has issues that need attention"
fi

echo ""
echo -e "${CYAN}Diagnostický log uložený do: $DIAGNOSTICS_LOG${NC}"
echo -e "${CYAN}Pre kontinuálny monitoring spustite: ./scripts/diagnostics/start-monitoring.sh${NC}"
