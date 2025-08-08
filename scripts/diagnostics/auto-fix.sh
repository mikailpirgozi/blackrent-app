#!/bin/bash

# 🔧 Auto-Fix Script
# Automatické riešenie najčastejších problémov

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
echo -e "${CYAN}║                    🔧 Auto-Fix System                       ║${NC}"
echo -e "${CYAN}║              Automatické riešenie problémov                 ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

cd "$PROJECT_ROOT" || exit 1

# 1. DIAGNOSTIKA PROBLÉMOV
echo -e "${BLUE}🔍 1. DIAGNOSTIKA AKTUÁLNYCH PROBLÉMOV${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

problems_found=()

# Kontrola portov
if ! lsof -i :3001 > /dev/null 2>&1; then
    problems_found+=("backend_down")
    echo -e "❌ Backend nebeží (port 3001)"
fi

if ! lsof -i :3000 > /dev/null 2>&1; then
    problems_found+=("frontend_down")
    echo -e "❌ Frontend nebeží (port 3000)"
fi

# Kontrola zombie procesov
zombie_count=$(pgrep -f "node.*defunct\|npm.*defunct" 2>/dev/null | wc -l)
if [ $zombie_count -gt 0 ]; then
    problems_found+=("zombie_processes")
    echo -e "⚠️  Zombie procesy: $zombie_count"
fi

# Kontrola PID súborov
if ls logs/*.pid > /dev/null 2>&1; then
    stale_pids=$(ls logs/*.pid 2>/dev/null | wc -l)
    if [ $stale_pids -gt 0 ]; then
        problems_found+=("stale_pids")
        echo -e "⚠️  Staré PID súbory: $stale_pids"
    fi
fi

# Kontrola node_modules
if [ ! -d "node_modules" ] || [ ! -d "backend/node_modules" ]; then
    problems_found+=("missing_dependencies")
    echo -e "❌ Chýbajúce závislosti (node_modules)"
fi

if [ ${#problems_found[@]} -eq 0 ]; then
    echo -e "✅ ${GREEN}Žiadne problémy nenájdené!${NC}"
    echo -e "${BLUE}💡 Ak máte problémy, spustite manuálne: npm run dev:restart${NC}"
    exit 0
fi

# 2. AUTOMATICKÉ RIEŠENIA
echo ""
echo -e "${BLUE}🔧 2. AUTOMATICKÉ RIEŠENIA${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Riešenie zombie procesov
if [[ " ${problems_found[@]} " =~ " zombie_processes " ]]; then
    echo -e "🧹 Čistím zombie procesy..."
    ./scripts/diagnostics/cleanup-ports.sh
    sleep 2
fi

# Riešenie starých PID súborov
if [[ " ${problems_found[@]} " =~ " stale_pids " ]]; then
    echo -e "🗑️  Odstraňujem staré PID súbory..."
    rm -f logs/*.pid
    echo -e "✅ PID súbory vyčistené"
fi

# Riešenie chýbajúcich závislostí
if [[ " ${problems_found[@]} " =~ " missing_dependencies " ]]; then
    echo -e "📦 Inštalujem chýbajúce závislosti..."
    
    if [ ! -d "node_modules" ]; then
        echo -e "   └─ Frontend dependencies..."
        npm install --silent
    fi
    
    if [ ! -d "backend/node_modules" ]; then
        echo -e "   └─ Backend dependencies..."
        cd backend && npm install --silent && cd ..
    fi
    
    echo -e "✅ Závislosti nainštalované"
fi

# Riešenie neaktívnych služieb
if [[ " ${problems_found[@]} " =~ " backend_down " ]] || [[ " ${problems_found[@]} " =~ " frontend_down " ]]; then
    echo -e "🚀 Spúšťam aplikáciu..."
    
    # Najprv sa uisti, že všetko je ukončené
    npm run dev:stop > /dev/null 2>&1
    sleep 3
    
    # Spusti aplikáciu
    echo -e "   └─ Spúšťam BlackRent aplikáciu..."
    npm run dev:restart
    
    # Počkaj na spustenie
    echo -e "   └─ Čakám na spustenie služieb..."
    sleep 10
    
    # Overenie
    backend_ok=false
    frontend_ok=false
    
    for i in {1..12}; do  # 60 sekúnd (12 * 5)
        if lsof -i :3001 > /dev/null 2>&1; then
            backend_ok=true
        fi
        
        if lsof -i :3000 > /dev/null 2>&1; then
            frontend_ok=true
        fi
        
        if $backend_ok && $frontend_ok; then
            break
        fi
        
        echo -e "   └─ Čakám... ($i/12)"
        sleep 5
    done
    
    if $backend_ok && $frontend_ok; then
        echo -e "✅ ${GREEN}Aplikácia úspešne spustená!${NC}"
    else
        echo -e "⚠️  ${YELLOW}Aplikácia sa nespustila úplne. Skúste manuálne.${NC}"
    fi
fi

# 3. POST-FIX VERIFIKÁCIA
echo ""
echo -e "${BLUE}🔍 3. VERIFIKÁCIA OPRÁV${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Skontroluj porty
backend_status="❌"
frontend_status="❌"
api_status="❌"

if lsof -i :3001 > /dev/null 2>&1; then
    backend_status="✅"
    echo -e "✅ Backend: ${GREEN}BEŽÍ${NC} (port 3001)"
    
    # Test API
    api_response=$(curl -s -m 5 "http://localhost:3001/api/test-simple" 2>/dev/null)
    if echo "$api_response" | grep -q "success.*true"; then
        api_status="✅"
        echo -e "✅ API: ${GREEN}FUNKČNÉ${NC}"
    else
        echo -e "❌ API: ${RED}NEFUNKČNÉ${NC}"
    fi
else
    echo -e "❌ Backend: ${RED}NEBEŽÍ${NC}"
fi

if lsof -i :3000 > /dev/null 2>&1; then
    frontend_status="✅"
    echo -e "✅ Frontend: ${GREEN}BEŽÍ${NC} (port 3000)"
else
    echo -e "❌ Frontend: ${RED}NEBEŽÍ${NC}"
fi

# Skontroluj procesy
node_processes=$(pgrep -f "node" | wc -l)
echo -e "📊 Node.js procesy: $node_processes"

# 4. FINÁLNE ODPORÚČANIA
echo ""
echo -e "${PURPLE}💡 4. FINÁLNE ODPORÚČANIA${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$backend_status" = "✅" ] && [ "$frontend_status" = "✅" ] && [ "$api_status" = "✅" ]; then
    echo -e "🎉 ${GREEN}VŠETKO JE OPRAVENÉ A FUNKČNÉ!${NC}"
    echo -e "${CYAN}📱 Frontend: http://localhost:3000${NC}"
    echo -e "${CYAN}🔧 Backend:  http://localhost:3001${NC}"
    echo -e "${CYAN}👤 Login: admin / Black123${NC}"
else
    echo -e "⚠️  ${YELLOW}NIEKTORÉ PROBLÉMY PRETRVÁVAJÚ${NC}"
    echo ""
    echo -e "${CYAN}Manuálne riešenia:${NC}"
    echo -e "   🔄 Kompletný reštart: ${CYAN}npm run dev:restart${NC}"
    echo -e "   🧹 Vyčistiť porty:    ${CYAN}./scripts/diagnostics/cleanup-ports.sh${NC}"
    echo -e "   📊 Diagnostika:      ${CYAN}./scripts/diagnostics/health-check.sh${NC}"
    echo -e "   📱 Monitoring:       ${CYAN}./scripts/diagnostics/start-monitoring.sh${NC}"
fi

echo ""
echo -e "${CYAN}Auto-fix dokončený. Pre kontinuálny monitoring spustite:${NC}"
echo -e "${CYAN}./scripts/diagnostics/start-monitoring.sh${NC}"
