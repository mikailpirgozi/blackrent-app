#!/bin/bash

# 🐛 Debug Mode Script
# Spustí aplikáciu s rozšíreným debugovaním a logovaním

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

PROJECT_ROOT="/Users/mikailpirgozi/Desktop/Cursor zalohy mac16/Blackrent Beta 2"
LOG_DIR="$PROJECT_ROOT/logs"

echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                    🐛 Debug Mode                            ║${NC}"
echo -e "${CYAN}║              Rozšírené debugovanie a logovanie              ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

cd "$PROJECT_ROOT" || exit 1

# Vytvor debug logs adresár
mkdir -p "$LOG_DIR/debug"

echo -e "${BLUE}🔧 Nastavujem debug prostredie...${NC}"

# 1. Vyčisti existujúce procesy
echo -e "🧹 Čistím existujúce procesy..."
npm run dev:stop > /dev/null 2>&1
./scripts/diagnostics/cleanup-ports.sh > /dev/null 2>&1

# 2. Nastav debug premenné
export NODE_ENV=development
export DEBUG=*
export REACT_APP_DEBUG=true
export VERBOSE=true

echo -e "✅ Debug premenné nastavené"

# 3. Spusti backend s debug logovaním
echo -e "🚀 Spúšťam backend v debug režime..."
cd backend
nohup npm start 2>&1 | tee "$LOG_DIR/debug/backend-debug.log" &
BACKEND_PID=$!
echo $BACKEND_PID > "$LOG_DIR/backend.pid"
cd ..

# 4. Počkaj na backend
echo -e "⏳ Čakám na backend..."
for i in {1..30}; do
    if curl -s http://localhost:3001/api/test-simple > /dev/null 2>&1; then
        echo -e "✅ Backend pripravený"
        break
    fi
    sleep 2
    echo -e "   └─ Čakám... ($i/30)"
done

# 5. Spusti frontend s debug logovaním
echo -e "🎨 Spúšťam frontend v debug režime..."
nohup npm start 2>&1 | tee "$LOG_DIR/debug/frontend-debug.log" &
FRONTEND_PID=$!
echo $FRONTEND_PID > "$LOG_DIR/frontend.pid"

# 6. Počkaj na frontend
echo -e "⏳ Čakám na frontend..."
for i in {1..60}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo -e "✅ Frontend pripravený"
        break
    fi
    sleep 2
    echo -e "   └─ Čakám... ($i/60)"
done

# 7. Spusti real-time monitoring
echo -e "📊 Spúšťam debug monitoring..."
nohup ./scripts/diagnostics/start-monitoring.sh > "$LOG_DIR/debug/monitoring-debug.log" 2>&1 &
MONITOR_PID=$!
echo $MONITOR_PID > "$LOG_DIR/monitor.pid"

echo ""
echo -e "${GREEN}🎉 DEBUG REŽIM AKTIVOVANÝ!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${CYAN}📱 Frontend:${NC}      http://localhost:3000"
echo -e "${CYAN}🔧 Backend:${NC}       http://localhost:3001"
echo -e "${CYAN}👤 Login:${NC}         admin / Black123"
echo ""
echo -e "${PURPLE}📋 Debug logy:${NC}"
echo -e "   Backend:    tail -f logs/debug/backend-debug.log"
echo -e "   Frontend:   tail -f logs/debug/frontend-debug.log"
echo -e "   Monitoring: tail -f logs/debug/monitoring-debug.log"
echo ""
echo -e "${PURPLE}🔧 Debug príkazy:${NC}"
echo -e "   Sledovať všetky logy: tail -f logs/debug/*.log"
echo -e "   Ukončiť debug:        npm run dev:stop"
echo -e "   Diagnostika:          npm run health"
echo ""
echo -e "${YELLOW}💡 Debug režim beží na pozadí s rozšíreným logovaním${NC}"
echo -e "${YELLOW}   Pre ukončenie použite: npm run dev:stop${NC}"
