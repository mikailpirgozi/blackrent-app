#!/bin/bash

# 🛠️ Auto-Recovery System pre BlackRent
# Automaticky rieši najčastejšie problémy bez manuálneho zásahu

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
RECOVERY_LOG="$LOG_DIR/auto-recovery.log"

# Logging
log_recovery() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$RECOVERY_LOG"
}

# Detekcia typu problému
detect_issue_type() {
    local issue_type="unknown"
    
    # Kontrola portov
    if ! curl -s -m 2 "http://localhost:3001/api/test-simple" >/dev/null 2>&1; then
        if lsof -i :3001 >/dev/null 2>&1; then
            issue_type="backend_unresponsive"
        else
            issue_type="backend_not_running"
        fi
    elif ! curl -s -m 2 "http://localhost:3000" >/dev/null 2>&1; then
        if lsof -i :3000 >/dev/null 2>&1; then
            issue_type="frontend_unresponsive"
        else
            issue_type="frontend_not_running"
        fi
    elif [ -f "$LOG_DIR/backend.log" ] && tail -20 "$LOG_DIR/backend.log" | grep -q "EADDRINUSE.*3001"; then
        issue_type="port_conflict"
    elif [ -f "$LOG_DIR/backend.log" ] && tail -20 "$LOG_DIR/backend.log" | grep -q "database.*connection.*failed"; then
        issue_type="database_connection"
    elif [ -f "$LOG_DIR/backend.log" ] && tail -20 "$LOG_DIR/backend.log" | grep -q "MODULE_NOT_FOUND"; then
        issue_type="missing_dependencies"
    else
        # Kontrola zombie procesov
        local zombie_count=$(ps aux | grep -E "(react-scripts|nodemon|ts-node)" | grep -v grep | wc -l)
        if [ $zombie_count -gt 5 ]; then
            issue_type="zombie_processes"
        fi
    fi
    
    echo "$issue_type"
}

# Riešenie backend problémov
fix_backend_not_running() {
    log_recovery "INFO" "Fixing: Backend not running"
    
    cd "$PROJECT_ROOT/backend"
    
    # Kontrola dependencies
    if [ ! -d "node_modules" ]; then
        log_recovery "INFO" "Installing backend dependencies..."
        npm install --silent
    fi
    
    # Spustenie
    export RUN_MIGRATIONS=false
    npm run dev > "$LOG_DIR/backend.log" 2>&1 &
    local pid=$!
    echo $pid > "$LOG_DIR/backend.pid"
    
    # Čakanie
    local timeout=30
    while [ $timeout -gt 0 ]; do
        if curl -s -m 2 "http://localhost:3001/api/test-simple" >/dev/null 2>&1; then
            log_recovery "INFO" "Backend successfully started"
            return 0
        fi
        sleep 2
        timeout=$((timeout-2))
    done
    
    log_recovery "ERROR" "Failed to start backend"
    return 1
}

# Riešenie frontend problémov
fix_frontend_not_running() {
    log_recovery "INFO" "Fixing: Frontend not running"
    
    cd "$PROJECT_ROOT"
    
    # Kontrola dependencies
    if [ ! -d "node_modules" ]; then
        log_recovery "INFO" "Installing frontend dependencies..."
        npm install --silent
    fi
    
    # Spustenie
    export BROWSER=none
    export CI=true
    npm start > "$LOG_DIR/frontend.log" 2>&1 &
    local pid=$!
    echo $pid > "$LOG_DIR/frontend.pid"
    
    # Čakanie
    local timeout=30
    while [ $timeout -gt 0 ]; do
        if curl -s -m 2 "http://localhost:3000" >/dev/null 2>&1; then
            log_recovery "INFO" "Frontend successfully started"
            return 0
        fi
        sleep 2
        timeout=$((timeout-2))
    done
    
    log_recovery "ERROR" "Failed to start frontend"
    return 1
}

# Riešenie port konfliktov
fix_port_conflict() {
    log_recovery "INFO" "Fixing: Port conflicts"
    
    # Kill procesy na konfliktných portoch
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
    lsof -ti:3002 | xargs kill -9 2>/dev/null || true
    
    sleep 5
    
    # Restart aplikácie
    cd "$PROJECT_ROOT"
    ./scripts/stable-start.sh
    
    log_recovery "INFO" "Port conflicts resolved"
}

# Riešenie zombie procesov
fix_zombie_processes() {
    log_recovery "INFO" "Fixing: Zombie processes"
    
    # Aggressive cleanup
    pkill -f "react-scripts" 2>/dev/null || true
    pkill -f "nodemon" 2>/dev/null || true
    pkill -f "ts-node" 2>/dev/null || true
    pkill -f "next dev" 2>/dev/null || true
    pkill -f "npm start" 2>/dev/null || true
    pkill -f "npm run dev" 2>/dev/null || true
    
    sleep 10
    
    # Cleanup PID files
    rm -f "$LOG_DIR"/*.pid
    
    # Restart
    cd "$PROJECT_ROOT"
    ./scripts/stable-start.sh
    
    log_recovery "INFO" "Zombie processes cleaned"
}

# Riešenie databázových problémov
fix_database_connection() {
    log_recovery "INFO" "Fixing: Database connection issues"
    
    # Test databázového pripojenia
    cd "$PROJECT_ROOT/backend"
    
    local db_test=$(timeout 10 node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT 1').then(() => {
  console.log('DB_OK');
  process.exit(0);
}).catch((err) => {
  console.log('DB_ERROR:', err.message);
  process.exit(1);
});
" 2>&1)
    
    if echo "$db_test" | grep -q "DB_OK"; then
        log_recovery "INFO" "Database connection is working, restarting backend..."
        
        # Restart len backend
        local backend_pid=$(cat "$LOG_DIR/backend.pid" 2>/dev/null || echo "")
        if [ -n "$backend_pid" ]; then
            kill $backend_pid 2>/dev/null || true
        fi
        
        sleep 5
        fix_backend_not_running
    else
        log_recovery "ERROR" "Database connection failed: $db_test"
        log_recovery "INFO" "This requires manual intervention - check DATABASE_URL"
        return 1
    fi
}

# Riešenie chýbajúcich dependencies
fix_missing_dependencies() {
    log_recovery "INFO" "Fixing: Missing dependencies"
    
    # Reinstall dependencies
    cd "$PROJECT_ROOT"
    log_recovery "INFO" "Reinstalling frontend dependencies..."
    npm install --silent
    
    cd "$PROJECT_ROOT/backend"
    log_recovery "INFO" "Reinstalling backend dependencies..."
    npm install --silent
    
    cd "$PROJECT_ROOT"
    
    # Restart aplikácie
    ./scripts/stable-start.sh
    
    log_recovery "INFO" "Dependencies reinstalled"
}

# Hlavná recovery funkcia
auto_recovery() {
    local issue_type=$(detect_issue_type)
    
    log_recovery "INFO" "Detected issue type: $issue_type"
    
    case "$issue_type" in
        "backend_not_running")
            fix_backend_not_running
            ;;
        "frontend_not_running")
            fix_frontend_not_running
            ;;
        "backend_unresponsive"|"frontend_unresponsive")
            log_recovery "INFO" "Service unresponsive, performing full restart..."
            cd "$PROJECT_ROOT"
            ./scripts/stable-start.sh
            ;;
        "port_conflict")
            fix_port_conflict
            ;;
        "zombie_processes")
            fix_zombie_processes
            ;;
        "database_connection")
            fix_database_connection
            ;;
        "missing_dependencies")
            fix_missing_dependencies
            ;;
        *)
            log_recovery "WARNING" "Unknown issue type, performing general fix..."
            cd "$PROJECT_ROOT"
            ./scripts/diagnostics/auto-fix.sh
            ;;
    esac
}

# Spustenie
echo -e "${CYAN}🛠️  BlackRent Auto-Recovery System${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

mkdir -p "$LOG_DIR"
cd "$PROJECT_ROOT"

log_recovery "INFO" "Auto-recovery started"

if auto_recovery; then
    log_recovery "INFO" "Auto-recovery completed successfully"
    echo -e "✅ ${GREEN}Auto-recovery úspešný!${NC}"
    exit 0
else
    log_recovery "ERROR" "Auto-recovery failed"
    echo -e "❌ ${RED}Auto-recovery zlyhal, potrebný manuálny zásah${NC}"
    exit 1
fi
