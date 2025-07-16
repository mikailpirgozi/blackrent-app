#!/bin/bash

# 🔄 Synchronizácia lokálneho vývoja s Railway produkciou
# Tento script synchronizuje zmeny z src/ do railway-blackrent/src/

echo "🔄 Synchronizácia zmien do Railway produkcie..."

# Farby pre výstup
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Funkcia pre logy
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Kontrola existencie adresárov
if [ ! -d "src" ]; then
    log_error "Adresár src/ neexistuje!"
    exit 1
fi

if [ ! -d "railway-blackrent" ]; then
    log_error "Adresár railway-blackrent/ neexistuje!"
    exit 1
fi

# Synchronizácia súborov
log_info "Synchronizujem src/ → railway-blackrent/src/"

# Kopírovanie všetkých súborov
rsync -av --delete src/ railway-blackrent/src/

# Synchronizácia package.json ak boli pridané nové dependencies
if [ -f "package.json" ]; then
    log_info "Synchronizujem package.json"
    cp package.json railway-blackrent/
fi

# Synchronizácia public/ ak existuje
if [ -d "public" ]; then
    log_info "Synchronizujem public/"
    rsync -av --delete public/ railway-blackrent/public/
fi

# Synchronizácia backend/
if [ -d "backend" ]; then
    log_info "Synchronizujem backend/"
    rsync -av --delete backend/ railway-blackrent/backend/
fi

log_info "✅ Synchronizácia dokončená!"

# Automatické nasadenie na Railway (voliteľné)
read -p "Chcete automaticky nasadiť na Railway? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "🚀 Nasadzujem na Railway..."
    cd railway-blackrent
    
    # Kontrola či je Railway CLI nainštalované
    if ! command -v railway &> /dev/null; then
        log_error "Railway CLI nie je nainštalované!"
        log_info "Nainštalujte ho: npm install -g @railway/cli"
        exit 1
    fi
    
    # Kontrola prihlásenia
    if ! railway whoami &> /dev/null; then
        log_warn "Nie ste prihlásený do Railway!"
        log_info "Prihláste sa: railway login"
        exit 1
    fi
    
    # Build a deploy
    log_info "Building frontend..."
    npm run build
    
    log_info "Building backend..."
    cd backend
    npm run build
    cd ..
    
    log_info "Deploying to Railway..."
    railway up
    
    log_info "🎉 Nasadenie dokončené!"
else
    log_info "💡 Pre manuálne nasadenie spustite:"
    echo "   cd railway-blackrent"
    echo "   railway up"
fi

echo
log_info "📋 Ďalšie kroky:"
echo "   1. Commitnite zmeny: git add . && git commit -m 'Update'"
echo "   2. Push do GitHub: git push origin main"
echo "   3. GitHub Actions automaticky nasadí zmeny"
echo
echo "🔗 Užitočné linky:"
echo "   • Railway Dashboard: https://railway.app/dashboard"
echo "   • Live aplikácia: https://blackrent-app-production.up.railway.app/"
echo "   • GitHub Actions: https://github.com/YOUR_USERNAME/blackrent-new/actions" 