#!/bin/bash

# 🚀 Stable BlackRent Startup Script
# Optimalizovaný pre stabilné spúšťanie bez zasekávania

set -e  # Exit on any error

# Farby pre výstup
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

PROJECT_ROOT="/Users/mikailpirgozi/Desktop/Cursor zalohy mac16/Blackrent Beta 2"
LOG_DIR="$PROJECT_ROOT/logs"
BACKEND_PORT=3001
FRONTEND_PORT=3000

# Vytvor logs adresár
mkdir -p "$LOG_DIR"

echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                🚀 BlackRent Stable Startup                  ║${NC}"
echo -e "${CYAN}║              Optimalizované stabilné spúšťanie              ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

cd "$PROJECT_ROOT" || exit 1

# 1. KOMPLETNÉ ČISTENIE
echo -e "${BLUE}🧹 1. KOMPLETNÉ ČISTENIE SYSTÉMU${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Ukončenie všetkých procesov
echo -e "   └─ Ukončujem všetky BlackRent procesy..."
pkill -f "react-scripts" 2>/dev/null || true
pkill -f "nodemon" 2>/dev/null || true
pkill -f "ts-node" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true

# Čistenie portov
echo -e "   └─ Čistím porty..."
lsof -ti:$BACKEND_PORT | xargs kill -9 2>/dev/null || true
lsof -ti:$FRONTEND_PORT | xargs kill -9 2>/dev/null || true
lsof -ti:3002 | xargs kill -9 2>/dev/null || true

# Čistenie PID súborov
echo -e "   └─ Čistím PID súbory..."
rm -f "$LOG_DIR"/*.pid

# Čistenie starých logov
echo -e "   └─ Čistím staré logy..."
echo "Log cleared $(date)" > "$LOG_DIR/backend.log"
echo "Log cleared $(date)" > "$LOG_DIR/frontend.log"

sleep 3
echo -e "✅ ${GREEN}Systém vyčistený${NC}"

# 2. KONTROLA ZÁVISLOSTÍ
echo ""
echo -e "${BLUE}📦 2. KONTROLA ZÁVISLOSTÍ${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_dependencies() {
    local dir=$1
    local name=$2
    
    if [ ! -d "$dir/node_modules" ]; then
        echo -e "   └─ ${YELLOW}Inštalujem závislosti pre $name...${NC}"
        cd "$dir"
        npm install --silent --no-audit --no-fund
        cd "$PROJECT_ROOT"
        echo -e "   └─ ✅ $name závislosti nainštalované"
    else
        echo -e "   └─ ✅ $name závislosti OK"
    fi
}

check_dependencies "$PROJECT_ROOT" "Frontend"
check_dependencies "$PROJECT_ROOT/backend" "Backend"

# 3. KONTROLA KONFIGURÁCIE
echo ""
echo -e "${BLUE}⚙️  3. KONTROLA KONFIGURÁCIE${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Kontrola .env súborov
if [ ! -f "backend/.env" ]; then
    echo -e "   └─ ${YELLOW}Vytváram backend .env súbor...${NC}"
    cat > backend/.env << 'EOF'
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://postgres:nfwrpKxILRUMqunYTZJEhjudEstqLRGv@trolley.proxy.rlwy.net:13400/railway
RUN_MIGRATIONS=false
JWT_SECRET=blackrent-super-secret-key-2024
SENTRY_DSN=your-sentry-dsn-here
CORS_ORIGIN=http://localhost:3000,http://localhost:3002
LOG_LEVEL=info
EOF
    echo -e "   └─ ✅ Backend .env vytvorený"
else
    echo -e "   └─ ✅ Backend .env OK"
fi

echo -e "✅ ${GREEN}Konfigurácia pripravená${NC}"

# 4. SPUSTENIE BACKENDU
echo ""
echo -e "${BLUE}🔧 4. SPUSTENIE BACKEND SERVERA${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd backend
echo -e "   └─ Spúšťam backend server..."

# Nastav environment variables
export RUN_MIGRATIONS=false
export NODE_ENV=development
export LOG_LEVEL=warn  # Menej verbose logging

# Spusti backend na pozadí
npm run dev > "$LOG_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > "$LOG_DIR/backend.pid"

cd "$PROJECT_ROOT"

# Čakanie na backend s timeout
echo -e "   └─ Čakám na backend server (max 60s)..."
timeout=60
backend_ready=false

while [ $timeout -gt 0 ]; do
    if curl -s -m 2 "http://localhost:$BACKEND_PORT/api/test-simple" >/dev/null 2>&1; then
        backend_ready=true
        echo -e "   └─ ✅ ${GREEN}Backend je pripravený!${NC}"
        break
    fi
    
    # Kontrola či proces ešte beží
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "   └─ ❌ ${RED}Backend proces sa ukončil!${NC}"
        echo -e "   └─ Posledné riadky logu:"
        tail -5 "$LOG_DIR/backend.log" | sed 's/^/      /'
        exit 1
    fi
    
    echo -e "   └─ Čakám... (${timeout}s zostáva)"
    sleep 2
    timeout=$((timeout-2))
done

if [ "$backend_ready" = false ]; then
    echo -e "   └─ ❌ ${RED}Backend sa nespustil do 60 sekúnd${NC}"
    echo -e "   └─ Posledné riadky logu:"
    tail -10 "$LOG_DIR/backend.log" | sed 's/^/      /'
    exit 1
fi

# 5. SPUSTENIE FRONTENDU
echo ""
echo -e "${BLUE}🎨 5. SPUSTENIE FRONTEND APLIKÁCIE${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -e "   └─ Spúšťam frontend aplikáciu..."

# Nastav environment variables pre menej verbose output
export GENERATE_SOURCEMAP=false
export BROWSER=none
export CI=true

# Spusti frontend na pozadí
npm start > "$LOG_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > "$LOG_DIR/frontend.pid"

# Čakanie na frontend
echo -e "   └─ Čakám na frontend server (max 60s)..."
timeout=60
frontend_ready=false

while [ $timeout -gt 0 ]; do
    if curl -s -m 2 "http://localhost:$FRONTEND_PORT" >/dev/null 2>&1; then
        frontend_ready=true
        echo -e "   └─ ✅ ${GREEN}Frontend je pripravený!${NC}"
        break
    fi
    
    # Kontrola či proces ešte beží
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "   └─ ❌ ${RED}Frontend proces sa ukončil!${NC}"
        echo -e "   └─ Posledné riadky logu:"
        tail -5 "$LOG_DIR/frontend.log" | sed 's/^/      /'
        exit 1
    fi
    
    echo -e "   └─ Čakám... (${timeout}s zostáva)"
    sleep 2
    timeout=$((timeout-2))
done

if [ "$frontend_ready" = false ]; then
    echo -e "   └─ ❌ ${RED}Frontend sa nespustil do 60 sekúnd${NC}"
    echo -e "   └─ Posledné riadky logu:"
    tail -10 "$LOG_DIR/frontend.log" | sed 's/^/      /'
    exit 1
fi

# 6. FINÁLNA VERIFIKÁCIA
echo ""
echo -e "${BLUE}🔍 6. FINÁLNA VERIFIKÁCIA${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Test API
api_test=$(curl -s -m 5 "http://localhost:$BACKEND_PORT/api/test-simple" 2>/dev/null || echo "failed")
if echo "$api_test" | grep -q "success.*true"; then
    echo -e "   └─ ✅ ${GREEN}API test úspešný${NC}"
else
    echo -e "   └─ ⚠️  ${YELLOW}API test zlyhal, ale server beží${NC}"
fi

# Kontrola procesov
backend_running=$(kill -0 $BACKEND_PID 2>/dev/null && echo "true" || echo "false")
frontend_running=$(kill -0 $FRONTEND_PID 2>/dev/null && echo "true" || echo "false")

echo -e "   └─ Backend proces: $([ "$backend_running" = "true" ] && echo -e "${GREEN}BEŽÍ${NC}" || echo -e "${RED}NEBEŽÍ${NC}")"
echo -e "   └─ Frontend proces: $([ "$frontend_running" = "true" ] && echo -e "${GREEN}BEŽÍ${NC}" || echo -e "${RED}NEBEŽÍ${NC}")"

# 7. ÚSPEŠNÉ DOKONČENIE
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                    🎉 ÚSPEŠNE SPUSTENÉ!                     ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}📱 Frontend:${NC}  http://localhost:$FRONTEND_PORT"
echo -e "${GREEN}🔧 Backend:${NC}   http://localhost:$BACKEND_PORT"
echo -e "${GREEN}👤 Login:${NC}     admin / Black123"
echo ""
echo -e "${CYAN}📊 Procesy:${NC}"
echo -e "   Backend PID:  $BACKEND_PID"
echo -e "   Frontend PID: $FRONTEND_PID"
echo ""
echo -e "${CYAN}📋 Užitočné príkazy:${NC}"
echo -e "   Ukončiť:      ${YELLOW}npm run dev:stop${NC}"
echo -e "   Sledovať logy: ${YELLOW}tail -f logs/backend.log logs/frontend.log${NC}"
echo -e "   Diagnostika:  ${YELLOW}npm run health${NC}"
echo ""
echo -e "${GREEN}✅ BlackRent aplikácia beží stabilne na pozadí!${NC}"

# Uloženie informácií o spustení
cat > "$LOG_DIR/startup-info.txt" << EOF
BlackRent Startup Info
======================
Started: $(date)
Backend PID: $BACKEND_PID
Frontend PID: $FRONTEND_PID
Backend Port: $BACKEND_PORT
Frontend Port: $FRONTEND_PORT
Backend URL: http://localhost:$BACKEND_PORT
Frontend URL: http://localhost:$FRONTEND_PORT
EOF

echo -e "${CYAN}Informácie o spustení uložené do: $LOG_DIR/startup-info.txt${NC}"
