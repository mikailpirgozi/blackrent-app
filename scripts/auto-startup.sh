#!/bin/bash

# 🚀 Auto-Startup System pre BlackRent
# Automaticky spúšťa aplikáciu pri štarte systému a zabezpečuje kontinuálny chod

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

echo -e "${CYAN}🚀 BlackRent Auto-Startup System${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd "$PROJECT_ROOT"

# 1. Kontrola či už beží
if [ -f "$LOG_DIR/backend.pid" ] && [ -f "$LOG_DIR/frontend.pid" ]; then
    backend_pid=$(cat "$LOG_DIR/backend.pid" 2>/dev/null || echo "")
    frontend_pid=$(cat "$LOG_DIR/frontend.pid" 2>/dev/null || echo "")
    
    if [ -n "$backend_pid" ] && kill -0 "$backend_pid" 2>/dev/null && \
       [ -n "$frontend_pid" ] && kill -0 "$frontend_pid" 2>/dev/null; then
        echo -e "✅ ${GREEN}Aplikácia už beží!${NC}"
        echo -e "📱 Frontend: http://localhost:3000"
        echo -e "🔧 Backend: http://localhost:3001"
        exit 0
    fi
fi

# 2. Spustenie aplikácie
echo -e "🔄 Spúšťam BlackRent aplikáciu..."
./scripts/stable-start.sh

# 3. Spustenie watchdog na pozadí
echo -e "🐕 Spúšťam watchdog monitoring..."
nohup ./scripts/watchdog.sh > "$LOG_DIR/watchdog.log" 2>&1 &
WATCHDOG_PID=$!
echo $WATCHDOG_PID > "$LOG_DIR/watchdog.pid"

echo ""
echo -e "${GREEN}✅ Auto-startup dokončený!${NC}"
echo -e "📱 Frontend: http://localhost:3000"
echo -e "🔧 Backend: http://localhost:3001"
echo -e "🐕 Watchdog: PID $WATCHDOG_PID"
echo ""
echo -e "${CYAN}Aplikácia teraz beží automaticky s watchdog monitorovaním!${NC}"
