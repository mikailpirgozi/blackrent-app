#!/bin/bash

# 🔄 Process Manager pre BlackRent
# Pokročilé spravovanie procesov s prevenciou zombie procesov

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
PROCESS_LOG="$LOG_DIR/process-manager.log"

# Logging
log_process() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$PROCESS_LOG"
}

# Inteligentné ukončenie procesov
smart_kill() {
    local pid=$1
    local service_name=$2
    local timeout=${3:-30}
    
    if [ -z "$pid" ] || ! kill -0 "$pid" 2>/dev/null; then
        log_process "INFO" "$service_name process not running or already stopped"
        return 0
    fi
    
    log_process "INFO" "Gracefully stopping $service_name (PID: $pid)"
    
    # 1. Pokus o graceful shutdown
    kill -TERM "$pid" 2>/dev/null || true
    
    # Čakanie na graceful shutdown
    local wait_time=0
    while [ $wait_time -lt $timeout ]; do
        if ! kill -0 "$pid" 2>/dev/null; then
            log_process "INFO" "$service_name stopped gracefully"
            return 0
        fi
        sleep 1
        wait_time=$((wait_time + 1))
    done
    
    # 2. Force kill ak graceful neprešiel
    log_process "WARNING" "$service_name didn't stop gracefully, force killing..."
    kill -KILL "$pid" 2>/dev/null || true
    
    # Čakanie na force kill
    sleep 3
    if ! kill -0 "$pid" 2>/dev/null; then
        log_process "INFO" "$service_name force killed successfully"
        return 0
    else
        log_process "ERROR" "Failed to kill $service_name (PID: $pid)"
        return 1
    fi
}

# Čistenie zombie procesov
cleanup_zombies() {
    log_process "INFO" "Cleaning up zombie processes..."
    
    # BlackRent špecifické procesy
    local blackrent_processes=$(pgrep -f "blackrent\|react-scripts\|nodemon\|ts-node" 2>/dev/null || true)
    
    if [ -n "$blackrent_processes" ]; then
        echo "$blackrent_processes" | while read -r pid; do
            if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
                local cmd=$(ps -p "$pid" -o comm= 2>/dev/null || echo "unknown")
                log_process "INFO" "Cleaning zombie process: $pid ($cmd)"
                smart_kill "$pid" "Zombie-$cmd" 10
            fi
        done
    fi
    
    # Čistenie node procesov na BlackRent portoch
    local port_processes=$(lsof -ti:3000,3001,3002 2>/dev/null || true)
    if [ -n "$port_processes" ]; then
        echo "$port_processes" | while read -r pid; do
            if [ -n "$pid" ]; then
                local cmd=$(ps -p "$pid" -o comm= 2>/dev/null || echo "unknown")
                log_process "INFO" "Cleaning port process: $pid ($cmd)"
                smart_kill "$pid" "Port-$cmd" 5
            fi
        done
    fi
    
    log_process "INFO" "Zombie cleanup completed"
}

# Monitorovanie procesov
monitor_processes() {
    local backend_pid=$(cat "$LOG_DIR/backend.pid" 2>/dev/null || echo "")
    local frontend_pid=$(cat "$LOG_DIR/frontend.pid" 2>/dev/null || echo "")
    
    # Kontrola backend
    if [ -n "$backend_pid" ]; then
        if kill -0 "$backend_pid" 2>/dev/null; then
            local backend_mem=$(ps -p "$backend_pid" -o %mem= 2>/dev/null | tr -d ' ' || echo "0")
            local backend_cpu=$(ps -p "$backend_pid" -o %cpu= 2>/dev/null | tr -d ' ' || echo "0")
            
            # Kontrola vysokého využitia zdrojov
            if (( $(echo "$backend_mem > 80" | bc -l 2>/dev/null || echo "0") )); then
                log_process "WARNING" "Backend high memory usage: ${backend_mem}%"
            fi
            
            if (( $(echo "$backend_cpu > 90" | bc -l 2>/dev/null || echo "0") )); then
                log_process "WARNING" "Backend high CPU usage: ${backend_cpu}%"
            fi
        else
            log_process "ERROR" "Backend process died unexpectedly (PID: $backend_pid)"
            rm -f "$LOG_DIR/backend.pid"
        fi
    fi
    
    # Kontrola frontend
    if [ -n "$frontend_pid" ]; then
        if kill -0 "$frontend_pid" 2>/dev/null; then
            local frontend_mem=$(ps -p "$frontend_pid" -o %mem= 2>/dev/null | tr -d ' ' || echo "0")
            local frontend_cpu=$(ps -p "$frontend_pid" -o %cpu= 2>/dev/null | tr -d ' ' || echo "0")
            
            if (( $(echo "$frontend_mem > 80" | bc -l 2>/dev/null || echo "0") )); then
                log_process "WARNING" "Frontend high memory usage: ${frontend_mem}%"
            fi
            
            if (( $(echo "$frontend_cpu > 90" | bc -l 2>/dev/null || echo "0") )); then
                log_process "WARNING" "Frontend high CPU usage: ${frontend_cpu}%"
            fi
        else
            log_process "ERROR" "Frontend process died unexpectedly (PID: $frontend_pid)"
            rm -f "$LOG_DIR/frontend.pid"
        fi
    fi
}

# Preventívne údržba
preventive_maintenance() {
    log_process "INFO" "Running preventive maintenance..."
    
    # Čistenie starých logov (starších ako 7 dní)
    find "$LOG_DIR" -name "*.log" -mtime +7 -delete 2>/dev/null || true
    
    # Čistenie tmp súborov
    find /tmp -name "*blackrent*" -mtime +1 -delete 2>/dev/null || true
    
    # Optimalizácia npm cache
    cd "$PROJECT_ROOT"
    npm cache clean --force --silent 2>/dev/null || true
    
    cd "$PROJECT_ROOT/backend"
    npm cache clean --force --silent 2>/dev/null || true
    
    log_process "INFO" "Preventive maintenance completed"
}

# Hlavná funkcia
main() {
    local action=${1:-"monitor"}
    
    mkdir -p "$LOG_DIR"
    
    case "$action" in
        "cleanup")
            echo -e "${CYAN}🧹 Cleaning up zombie processes...${NC}"
            cleanup_zombies
            ;;
        "monitor")
            echo -e "${CYAN}📊 Monitoring processes...${NC}"
            monitor_processes
            ;;
        "maintain")
            echo -e "${CYAN}🔧 Running preventive maintenance...${NC}"
            preventive_maintenance
            ;;
        "full")
            echo -e "${CYAN}🔄 Full process management cycle...${NC}"
            cleanup_zombies
            sleep 2
            monitor_processes
            sleep 2
            preventive_maintenance
            ;;
        *)
            echo -e "${YELLOW}Usage: $0 [cleanup|monitor|maintain|full]${NC}"
            echo ""
            echo -e "${CYAN}Available actions:${NC}"
            echo -e "  cleanup  - Clean zombie processes"
            echo -e "  monitor  - Monitor current processes"
            echo -e "  maintain - Run preventive maintenance"
            echo -e "  full     - Run all actions"
            exit 1
            ;;
    esac
}

# Signal handlers
cleanup_handler() {
    log_process "INFO" "Process manager stopping"
    exit 0
}

trap cleanup_handler SIGINT SIGTERM

# Spustenie
main "$@"
