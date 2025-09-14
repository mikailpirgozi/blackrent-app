#!/bin/bash

# BlackRent Customer Website - Comprehensive Health Check
# Tento script vykonáva kompletnú diagnostiku aplikácie

set -e

# Farby pre výstup
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Počítadlá
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0

log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

error() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((FAILED_CHECKS++))
}

success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((PASSED_CHECKS++))
}

warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
    ((WARNING_CHECKS++))
}

check() {
    ((TOTAL_CHECKS++))
}

# Header
echo -e "${CYAN}=================================================="
echo -e "BlackRent Customer Website - Health Check"
echo -e "$(date '+%Y-%m-%d %H:%M:%S')"
echo -e "==================================================${NC}"
echo ""

# 1. Základné kontroly súborov
echo -e "${CYAN}📁 Kontrola súborov a adresárov${NC}"
echo "----------------------------------------"

check
if [ -f "package.json" ]; then
    success "package.json existuje"
else
    error "package.json neexistuje"
fi

check
if [ -f "next.config.js" ]; then
    success "next.config.js existuje"
else
    error "next.config.js neexistuje"
fi

check
if [ -f ".env.local" ]; then
    success ".env.local existuje"
else
    warning ".env.local neexistuje"
fi

check
if [ -d "src" ]; then
    success "src adresár existuje"
else
    error "src adresár neexistuje"
fi

check
if [ -d "public" ]; then
    success "public adresár existuje"
else
    error "public adresár neexistuje"
fi

echo ""

# 2. Kontrola dependencies
echo -e "${CYAN}📦 Kontrola dependencies${NC}"
echo "----------------------------------------"

check
if [ -d "node_modules" ]; then
    success "node_modules existuje"
    
    # Kontrola veľkosti
    size=$(du -sh node_modules 2>/dev/null | cut -f1)
    log "Veľkosť node_modules: $size"
else
    error "node_modules neexistuje - spustite 'npm install'"
fi

check
if [ -f "package-lock.json" ]; then
    success "package-lock.json existuje"
else
    warning "package-lock.json neexistuje"
fi

echo ""

# 3. Kontrola assets
echo -e "${CYAN}🖼️  Kontrola assets${NC}"
echo "----------------------------------------"

check
if [ -d "public/figma-assets" ]; then
    success "figma-assets adresár existuje"
    
    # Počet súborov
    count=$(find public/figma-assets -name "*.svg" | wc -l)
    log "Počet SVG súborov: $count"
else
    error "figma-assets adresár neexistuje"
fi

# Kontrola kritických assets
critical_assets=("union-18.svg" "icon-24-px-filled-120.svg" "icon-24-px-132.svg")
for asset in "${critical_assets[@]}"; do
    check
    if [ -f "public/figma-assets/$asset" ]; then
        success "Kritický asset $asset existuje"
    else
        error "Kritický asset $asset chýba"
    fi
done

echo ""

# 4. Kontrola portov
echo -e "${CYAN}🌐 Kontrola portov a sieťových služieb${NC}"
echo "----------------------------------------"

check
if lsof -i:3002 >/dev/null 2>&1; then
    success "Port 3002 je obsadený (server beží)"
    
    # Detaily procesu
    process_info=$(lsof -i:3002 | grep LISTEN | head -1)
    if [ -n "$process_info" ]; then
        log "Proces: $process_info"
    fi
else
    warning "Port 3002 nie je obsadený (server nebeží)"
fi

check
if command -v curl >/dev/null 2>&1; then
    http_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/ 2>/dev/null || echo "000")
    if [ "$http_status" = "200" ]; then
        success "HTTP odpoveď: $http_status (OK)"
        
        # Response time
        response_time=$(curl -s -o /dev/null -w "%{time_total}" http://localhost:3002/ 2>/dev/null || echo "999")
        response_ms=$(python3 -c "print(int(float('$response_time') * 1000))" 2>/dev/null || echo "N/A")
        log "Response time: ${response_ms}ms"
    else
        error "HTTP odpoveď: $http_status (CHYBA)"
    fi
else
    warning "curl nie je nainštalovaný - nemôžem testovať HTTP"
fi

echo ""

# 5. Kontrola TypeScript a linting
echo -e "${CYAN}🔍 Kontrola kódu${NC}"
echo "----------------------------------------"

check
if npm run type-check >/dev/null 2>&1; then
    success "TypeScript type check prešiel"
else
    warning "TypeScript type check zlyhal"
fi

check
if npm run lint >/dev/null 2>&1; then
    success "ESLint prešiel bez chýb"
else
    warning "ESLint našiel problémy"
fi

echo ""

# 6. Kontrola build procesu
echo -e "${CYAN}🏗️  Kontrola build procesu${NC}"
echo "----------------------------------------"

check
if [ -d ".next" ]; then
    success ".next build adresár existuje"
    
    # Veľkosť build
    size=$(du -sh .next 2>/dev/null | cut -f1)
    log "Veľkosť build: $size"
else
    warning ".next build adresár neexistuje"
fi

# Test build (rýchly)
check
log "Testujem build proces..."
if timeout 60 npm run build >/dev/null 2>&1; then
    success "Build proces úspešný"
else
    error "Build proces zlyhal alebo trval príliš dlho"
fi

echo ""

# 7. Kontrola performance
echo -e "${CYAN}⚡ Performance kontroly${NC}"
echo "----------------------------------------"

# Memory usage
if command -v ps >/dev/null 2>&1; then
    node_processes=$(ps aux | grep -E "node.*3002" | grep -v grep | wc -l)
    log "Počet Node.js procesov: $node_processes"
    
    if [ "$node_processes" -gt 0 ]; then
        memory_usage=$(ps aux | grep -E "node.*3002" | grep -v grep | awk '{sum+=$6} END {print sum/1024}')
        log "Spotreba pamäte: ${memory_usage}MB"
    fi
fi

# Disk space
disk_usage=$(df -h . | tail -1 | awk '{print $5}')
log "Využitie disku: $disk_usage"

echo ""

# 8. Finálne zhrnutie
echo -e "${CYAN}📊 Zhrnutie${NC}"
echo "----------------------------------------"
echo -e "Celkový počet kontrol: ${TOTAL_CHECKS}"
echo -e "${GREEN}Úspešné: ${PASSED_CHECKS}${NC}"
echo -e "${YELLOW}Varovania: ${WARNING_CHECKS}${NC}"
echo -e "${RED}Zlyhania: ${FAILED_CHECKS}${NC}"

echo ""

# Výpočet skóre
if [ $TOTAL_CHECKS -gt 0 ]; then
    score=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
    
    if [ $score -ge 90 ]; then
        echo -e "${GREEN}🎉 Zdravie aplikácie: VÝBORNÉ (${score}%)${NC}"
        exit_code=0
    elif [ $score -ge 75 ]; then
        echo -e "${YELLOW}⚠️  Zdravie aplikácie: DOBRÉ (${score}%)${NC}"
        exit_code=0
    elif [ $score -ge 50 ]; then
        echo -e "${YELLOW}⚠️  Zdravie aplikácie: PRIEMERNÉ (${score}%)${NC}"
        exit_code=1
    else
        echo -e "${RED}❌ Zdravie aplikácie: ZLÉ (${score}%)${NC}"
        exit_code=2
    fi
else
    echo -e "${RED}❌ Nemohol som vykonať žiadne kontroly${NC}"
    exit_code=3
fi

echo ""

# Odporúčania
if [ $FAILED_CHECKS -gt 0 ] || [ $WARNING_CHECKS -gt 3 ]; then
    echo -e "${CYAN}💡 Odporúčania:${NC}"
    
    if [ $FAILED_CHECKS -gt 0 ]; then
        echo "• Opravte kritické chyby označené ako [FAIL]"
    fi
    
    if [ $WARNING_CHECKS -gt 3 ]; then
        echo "• Riešte varovania pre lepšiu stabilitu"
    fi
    
    echo "• Spustite 'npm run dev:stable' pre stabilné spustenie"
    echo "• Použite 'npm run monitor' pre kontinuálne sledovanie"
    echo ""
fi

exit $exit_code
