#!/bin/bash

# 🧹 Port Cleanup Script
# Vyčistí zombie procesy a uvoľní porty

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🧹 Čistenie portov a procesov...${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Funkcia na ukončenie procesov na porte
kill_port() {
    local port=$1
    local service=$2
    
    echo -e "🔍 Kontrolujem port $port ($service)..."
    
    if lsof -i :$port > /dev/null 2>&1; then
        echo -e "⚠️  Port $port je obsadený, ukončujem procesy..."
        
        # Získaj PID procesov na porte
        local pids=$(lsof -ti :$port)
        
        for pid in $pids; do
            local process_name=$(ps -p $pid -o comm= 2>/dev/null)
            echo "   └─ Ukončujem PID: $pid ($process_name)"
            
            # Pokús sa o graceful ukončenie
            kill -TERM $pid 2>/dev/null
            sleep 2
            
            # Ak proces stále beží, force kill
            if kill -0 $pid 2>/dev/null; then
                echo "   └─ Force killing PID: $pid"
                kill -KILL $pid 2>/dev/null
            fi
        done
        
        # Overenie
        sleep 1
        if lsof -i :$port > /dev/null 2>&1; then
            echo -e "   ❌ ${RED}Port $port stále obsadený${NC}"
        else
            echo -e "   ✅ ${GREEN}Port $port uvoľnený${NC}"
        fi
    else
        echo -e "   ✅ ${GREEN}Port $port je voľný${NC}"
    fi
}

# Vyčisti hlavné porty
kill_port 3000 "Frontend"
kill_port 3001 "Backend"

# Vyčisti všetky Node.js procesy súvisiace s projektom
echo ""
echo -e "🔍 Hľadám zombie Node.js procesy..."

zombie_pids=$(pgrep -f "node.*blackrent\|npm.*start\|react-scripts" 2>/dev/null)
if [ ! -z "$zombie_pids" ]; then
    echo -e "⚠️  Nájdené zombie procesy:"
    for pid in $zombie_pids; do
        local cmd=$(ps -p $pid -o args= 2>/dev/null | cut -c1-60)
        echo "   └─ PID: $pid - $cmd"
        kill -KILL $pid 2>/dev/null
    done
    echo -e "✅ ${GREEN}Zombie procesy vyčistené${NC}"
else
    echo -e "✅ ${GREEN}Žiadne zombie procesy${NC}"
fi

# Vyčisti PID súbory
echo ""
echo -e "🔍 Čistím PID súbory..."
rm -f logs/*.pid 2>/dev/null
echo -e "✅ ${GREEN}PID súbory vyčistené${NC}"

# Overenie stavu
echo ""
echo -e "${BLUE}📊 Finálny stav portov:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

for port in 3000 3001; do
    if lsof -i :$port > /dev/null 2>&1; then
        echo -e "Port $port: ${RED}OBSADENÝ${NC}"
    else
        echo -e "Port $port: ${GREEN}VOĽNÝ${NC}"
    fi
done

echo ""
echo -e "${GREEN}🎉 Čistenie dokončené! Porty sú pripravené na nové spustenie.${NC}"
echo -e "${BLUE}💡 Teraz môžete spustiť: npm run dev:restart${NC}"
