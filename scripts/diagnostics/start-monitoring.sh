#!/bin/bash

# 📊 Real-time Application Monitoring
# Kontinuálny monitoring aplikácie s automatickými upozorneniami

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

PROJECT_ROOT="/Users/mikailpirgozi/Desktop/Cursor zalohy mac16/Blackrent Beta 2"
LOG_DIR="$PROJECT_ROOT/logs"
MONITOR_LOG="$LOG_DIR/monitoring.log"

# Vytvor logs adresár ak neexistuje
mkdir -p "$LOG_DIR"

echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                  📊 BlackRent Live Monitor                   ║${NC}"
echo -e "${CYAN}║                Stlačte Ctrl+C pre ukončenie                 ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Cleanup pri ukončení
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Ukončujem monitoring...${NC}"
    exit 0
}
trap cleanup SIGINT SIGTERM

# Monitoring loop
monitor_cycle=0
while true; do
    monitor_cycle=$((monitor_cycle + 1))
    timestamp=$(date '+%H:%M:%S')
    
    # Clear screen každých 10 cyklov (50 sekúnd)
    if [ $((monitor_cycle % 10)) -eq 1 ]; then
        clear
        echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${CYAN}║                  📊 BlackRent Live Monitor                   ║${NC}"
        echo -e "${CYAN}║                Stlačte Ctrl+C pre ukončenie                 ║${NC}"
        echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
        echo ""
    fi
    
    echo -e "${BLUE}[$timestamp] Cyklus #$monitor_cycle${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # 1. Port Status
    backend_status="❌"
    frontend_status="❌"
    
    if lsof -i :3001 > /dev/null 2>&1; then
        backend_status="✅"
    fi
    
    if lsof -i :3000 > /dev/null 2>&1; then
        frontend_status="✅"
    fi
    
    echo -e "🔌 Porty: Backend $backend_status (3001) | Frontend $frontend_status (3000)"
    
    # 2. API Health Check
    api_status="❌"
    if [ "$backend_status" = "✅" ]; then
        api_response=$(curl -s -m 3 "http://localhost:3001/api/test-simple" 2>/dev/null)
        if echo "$api_response" | grep -q "success.*true"; then
            api_status="✅"
        fi
    fi
    echo -e "🌐 API: $api_status"
    
    # 3. Resource Usage
    memory_usage=$(ps aux | grep -E "(node|npm)" | grep -v grep | awk '{sum+=$4} END {printf "%.1f", sum}')
    cpu_usage=$(ps aux | grep -E "(node|npm)" | grep -v grep | awk '{sum+=$3} END {printf "%.1f", sum}')
    
    memory_color=$GREEN
    cpu_color=$GREEN
    
    if (( $(echo "${memory_usage:-0} > 30" | bc -l 2>/dev/null || echo 0) )); then
        memory_color=$YELLOW
    fi
    if (( $(echo "${memory_usage:-0} > 50" | bc -l 2>/dev/null || echo 0) )); then
        memory_color=$RED
    fi
    
    if (( $(echo "${cpu_usage:-0} > 50" | bc -l 2>/dev/null || echo 0) )); then
        cpu_color=$YELLOW
    fi
    if (( $(echo "${cpu_usage:-0} > 80" | bc -l 2>/dev/null || echo 0) )); then
        cpu_color=$RED
    fi
    
    echo -e "💾 Pamäť: ${memory_color}${memory_usage:-0}%${NC} | ⚡ CPU: ${cpu_color}${cpu_usage:-0}%${NC}"
    
    # 4. Process Count
    node_processes=$(pgrep -f "node" | wc -l)
    npm_processes=$(pgrep -f "npm" | wc -l)
    echo -e "🔧 Procesy: Node.js ($node_processes) | NPM ($npm_processes)"
    
    # 5. Recent Errors (len ak existujú)
    if [ -f "$LOG_DIR/backend.log" ]; then
        recent_errors=$(tail -50 "$LOG_DIR/backend.log" | grep -i "error\|exception" | wc -l)
        if [ $recent_errors -gt 0 ]; then
            echo -e "⚠️  ${YELLOW}Backend chyby (posledných 50 riadkov): $recent_errors${NC}"
        fi
    fi
    
    if [ -f "$LOG_DIR/frontend.log" ]; then
        recent_frontend_errors=$(tail -50 "$LOG_DIR/frontend.log" | grep -i "error\|failed" | wc -l)
        if [ $recent_frontend_errors -gt 0 ]; then
            echo -e "⚠️  ${YELLOW}Frontend chyby (posledných 50 riadkov): $recent_frontend_errors${NC}"
        fi
    fi
    
    # 6. Automatic Alerts
    alerts=()
    
    if [ "$backend_status" = "❌" ]; then
        alerts+=("🚨 Backend nebeží!")
    fi
    
    if [ "$frontend_status" = "❌" ]; then
        alerts+=("🚨 Frontend nebeží!")
    fi
    
    if [ "$api_status" = "❌" ] && [ "$backend_status" = "✅" ]; then
        alerts+=("🚨 API nereaguje!")
    fi
    
    if (( $(echo "${memory_usage:-0} > 70" | bc -l 2>/dev/null || echo 0) )); then
        alerts+=("⚠️ Vysoké využitie pamäte!")
    fi
    
    if (( $(echo "${cpu_usage:-0} > 90" | bc -l 2>/dev/null || echo 0) )); then
        alerts+=("⚠️ Vysoké využitie CPU!")
    fi
    
    # Zobraz alerts
    if [ ${#alerts[@]} -gt 0 ]; then
        echo ""
        echo -e "${RED}🚨 UPOZORNENIA:${NC}"
        for alert in "${alerts[@]}"; do
            echo -e "   $alert"
        done
    fi
    
    # 7. Quick Actions (každých 5 cyklov)
    if [ $((monitor_cycle % 5)) -eq 0 ]; then
        echo ""
        echo -e "${PURPLE}⚡ Rýchle akcie:${NC}"
        echo -e "   ${CYAN}Ctrl+C${NC} - Ukončiť monitoring"
        echo -e "   ${CYAN}./scripts/diagnostics/health-check.sh${NC} - Úplná diagnostika"
        echo -e "   ${CYAN}npm run dev:restart${NC} - Reštart aplikácie"
    fi
    
    # Log do súboru
    echo "[$timestamp] Backend:$backend_status Frontend:$frontend_status API:$api_status Memory:${memory_usage:-0}% CPU:${cpu_usage:-0}%" >> "$MONITOR_LOG"
    
    echo ""
    sleep 5
done
