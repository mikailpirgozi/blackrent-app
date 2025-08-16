#!/bin/bash

# BlackRent Customer Website - Stable Server Script
# Tento script zabezpečuje stabilné spúšťanie servera s automatickým riešením problémov

set -e

echo "🚀 BlackRent Customer Website - Stable Server Startup"
echo "=================================================="

# Farby pre výstup
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funkcia pre loggovanie
log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Kontrola či sme v správnom adresári
if [ ! -f "package.json" ]; then
    error "Nie ste v customer-website adresári!"
    exit 1
fi

# Kontrola či existuje Next.js config
if [ ! -f "next.config.js" ]; then
    error "next.config.js súbor neexistuje!"
    exit 1
fi

# Funkcia pre čistenie portov
cleanup_ports() {
    log "Čistenie portov..."
    
    # Ukončenie procesov na porte 3002
    if lsof -ti:3002 >/dev/null 2>&1; then
        warning "Port 3002 je obsadený, ukončujem procesy..."
        lsof -ti:3002 | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
    
    success "Porty vyčistené"
}

# Funkcia pre validáciu assets
validate_assets() {
    log "Validácia assets..."
    
    # Kontrola kritických SVG súborov
    local missing_assets=()
    
    if [ ! -f "public/figma-assets/union-18.svg" ]; then
        missing_assets+=("union-18.svg")
    fi
    
    if [ ! -f "public/figma-assets/icon-24-px-filled-120.svg" ]; then
        missing_assets+=("icon-24-px-filled-120.svg")
    fi
    
    if [ ! -f "public/figma-assets/icon-24-px-132.svg" ]; then
        missing_assets+=("icon-24-px-132.svg")
    fi
    
    if [ ${#missing_assets[@]} -gt 0 ]; then
        warning "Chýbajúce assets: ${missing_assets[*]}"
        log "Vytváram náhradné súbory..."
        
        # Vytvorenie náhradných súborov
        cd public/figma-assets/
        
        if [ ! -f "union-18.svg" ] && [ -f "union-1.svg" ]; then
            cp union-1.svg union-18.svg
        fi
        
        if [ ! -f "icon-24-px-filled-120.svg" ] && [ -f "arrow-small-down.svg" ]; then
            cp arrow-small-down.svg icon-24-px-filled-120.svg
        fi
        
        if [ ! -f "icon-24-px-132.svg" ] && [ -f "icon-16px-arrow-down.svg" ]; then
            cp icon-16px-arrow-down.svg icon-24-px-132.svg
        fi
        
        cd ../..
        success "Náhradné assets vytvorené"
    else
        success "Všetky assets sú k dispozícii"
    fi
}

# Funkcia pre čistenie cache
clean_cache() {
    log "Čistenie cache..."
    
    if [ -d ".next" ]; then
        rm -rf .next
        success "Next.js cache vyčistená"
    fi
    
    if [ -d "node_modules/.cache" ]; then
        rm -rf node_modules/.cache
        success "Node modules cache vyčistená"
    fi
}

# Funkcia pre kontrolu dependencies
check_dependencies() {
    log "Kontrola dependencies..."
    
    if [ ! -d "node_modules" ]; then
        warning "node_modules neexistuje, inštalujem dependencies..."
        npm install
    fi
    
    success "Dependencies sú v poriadku"
}

# Funkcia pre spustenie servera
start_server() {
    log "Spúšťam server na porte 3002..."
    
    # Nastavenie environment premenných pre stabilitu
    export NODE_ENV=development
    export NEXT_TELEMETRY_DISABLED=1
    export FORCE_COLOR=1
    
    # Spustenie servera s error handling
    npm run dev 2>&1 | while IFS= read -r line; do
        echo "[$(date '+%H:%M:%S')] $line"
        
        # Detekcia chýb a automatické riešenie
        if [[ "$line" == *"EADDRINUSE"* ]]; then
            error "Port 3002 je obsadený!"
            cleanup_ports
            exit 1
        fi
        
        if [[ "$line" == *"MODULE_NOT_FOUND"* ]]; then
            error "Chýbajúci modul!"
            exit 1
        fi
        
        if [[ "$line" == *"Ready in"* ]]; then
            success "Server je pripravený na http://localhost:3002"
        fi
    done
}

# Hlavná logika
main() {
    log "Začínam stable server startup..."
    
    # 1. Čistenie portov
    cleanup_ports
    
    # 2. Validácia assets
    validate_assets
    
    # 3. Kontrola dependencies
    check_dependencies
    
    # 4. Čistenie cache (voliteľné)
    if [ "$1" = "--clean" ]; then
        clean_cache
    fi
    
    # 5. Spustenie servera
    start_server
}

# Spustenie s error handling
trap 'error "Script prerušený"; exit 1' INT TERM

main "$@"
