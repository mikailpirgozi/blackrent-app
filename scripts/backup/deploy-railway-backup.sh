#!/bin/bash

# 🚀 RAILWAY BACKUP DEPLOYMENT SCRIPT
# Automatické nastavenie Railway cron backup systému
# Autor: BlackRent Team

set -e

# 🎨 Farby
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

BACKUP_DIR="scripts/backup"

echo -e "${PURPLE}🚀 RAILWAY BACKUP DEPLOYMENT${NC}"
echo -e "${BLUE}📁 Backup directory: $BACKUP_DIR${NC}"
echo ""

# 🔍 Kontrola Railway CLI
check_railway_cli() {
    echo -e "${YELLOW}🔍 Kontrolujem Railway CLI...${NC}"
    
    if ! command -v railway >/dev/null 2>&1; then
        echo -e "${RED}❌ Railway CLI nie je nainštalované${NC}"
        echo -e "${YELLOW}💡 Inštalácia:${NC}"
        echo -e "   ${BLUE}npm install -g @railway/cli${NC}"
        echo -e "   ${BLUE}# alebo${NC}"
        echo -e "   ${BLUE}curl -fsSL https://railway.app/install.sh | sh${NC}"
        echo ""
        read -p "Chcete pokračovať bez Railway CLI? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
        return 1
    fi
    
    echo -e "${GREEN}✅ Railway CLI je nainštalované${NC}"
    return 0
}

# 🔐 Railway login
railway_login() {
    echo -e "${YELLOW}🔐 Railway prihlásenie...${NC}"
    
    if railway whoami >/dev/null 2>&1; then
        local user=$(railway whoami)
        echo -e "${GREEN}✅ Už ste prihlásený ako: $user${NC}"
    else
        echo -e "${YELLOW}🔑 Prihlasovanie do Railway...${NC}"
        railway login
        
        if railway whoami >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Úspešne prihlásený${NC}"
        else
            echo -e "${RED}❌ Prihlásenie zlyhalo${NC}"
            exit 1
        fi
    fi
}

# 🏗️ Vytvorenie Railway projektu
create_railway_project() {
    echo -e "${YELLOW}🏗️ Vytváram Railway projekt...${NC}"
    
    cd "$BACKUP_DIR"
    
    # Kontrola existujúceho projektu
    if [ -f ".railway/config.json" ]; then
        echo -e "${GREEN}✅ Railway projekt už existuje${NC}"
        return 0
    fi
    
    # Inicializácia nového projektu
    echo -e "${BLUE}📝 Inicializujem nový Railway projekt...${NC}"
    railway init --name "blackrent-backup"
    
    if [ -f ".railway/config.json" ]; then
        echo -e "${GREEN}✅ Railway projekt vytvorený${NC}"
    else
        echo -e "${RED}❌ Vytvorenie projektu zlyhalo${NC}"
        exit 1
    fi
    
    cd - >/dev/null
}

# ⚙️ Nastavenie environment variables
setup_environment_variables() {
    echo -e "${YELLOW}⚙️ Nastavujem environment variables...${NC}"
    
    cd "$BACKUP_DIR"
    
    local env_vars=(
        "PGHOST=trolley.proxy.rlwy.net"
        "PGUSER=postgres"
        "PGPORT=13400"
        "PGDATABASE=railway"
        "PGPASSWORD=nfwrpKxILRUMqunYTZJEhjudEstqLRGv"
        "R2_ENDPOINT=https://9ccdca0d876e24bd9acefabe56f94f53.r2.cloudflarestorage.com"
        "R2_BUCKET_NAME=blackrent-storage"
        "R2_ACCESS_KEY_ID=101b1b96332f7216f917c269f2ae1fc8"
        "R2_SECRET_ACCESS_KEY=5d03a6a396171324658c402b8758f5bae2364fe0bb7e5cc91d6ea8661c34cc69"
    )
    
    for env_var in "${env_vars[@]}"; do
        echo -e "${BLUE}🔧 Nastavujem: ${env_var%%=*}${NC}"
        railway variables set "$env_var" || {
            echo -e "${YELLOW}⚠️ Chyba pri nastavovaní $env_var${NC}"
        }
    done
    
    echo -e "${GREEN}✅ Environment variables nastavené${NC}"
    
    cd - >/dev/null
}

# 📦 Deploy na Railway
deploy_to_railway() {
    echo -e "${YELLOW}📦 Deploying na Railway...${NC}"
    
    cd "$BACKUP_DIR"
    
    # Kontrola potrebných súborov
    local required_files=(
        "railway-cron-backup.js"
        "package.json"
        "railway.json"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            echo -e "${RED}❌ Chýba súbor: $file${NC}"
            exit 1
        fi
    done
    
    echo -e "${BLUE}🚀 Spúšťam deployment...${NC}"
    railway up --detach
    
    echo -e "${GREEN}✅ Deployment dokončený${NC}"
    
    cd - >/dev/null
}

# 🧪 Test backup systému
test_backup_system() {
    echo -e "${YELLOW}🧪 Testujem backup systém...${NC}"
    
    cd "$BACKUP_DIR"
    
    echo -e "${BLUE}🔄 Spúšťam test backup...${NC}"
    railway run npm run backup
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Test backup úspešný!${NC}"
    else
        echo -e "${RED}❌ Test backup zlyhal${NC}"
        echo -e "${YELLOW}💡 Skontrolujte logy: railway logs${NC}"
    fi
    
    cd - >/dev/null
}

# 📊 Zobrazenie informácií o projekte
show_project_info() {
    echo -e "${YELLOW}📊 Informácie o Railway projekte...${NC}"
    
    cd "$BACKUP_DIR"
    
    echo -e "${BLUE}🔗 URL projektu:${NC}"
    railway status 2>/dev/null || echo "Nedostupné"
    
    echo -e "${BLUE}📋 Environment variables:${NC}"
    railway variables 2>/dev/null || echo "Nedostupné"
    
    echo -e "${BLUE}📝 Posledné logy:${NC}"
    railway logs --tail 10 2>/dev/null || echo "Žiadne logy"
    
    cd - >/dev/null
}

# 📋 Zobrazenie súhrnu
show_summary() {
    echo ""
    echo -e "${PURPLE}📋 RAILWAY BACKUP DEPLOYMENT SÚHRN${NC}"
    echo -e "${BLUE}=====================================${NC}"
    echo ""
    echo -e "${GREEN}✅ Čo bolo nastavené:${NC}"
    echo -e "   🚀 Railway projekt: blackrent-backup"
    echo -e "   ⏰ Cron job: Každý deň o 2:00 UTC"
    echo -e "   🗄️ Backup: Railway PostgreSQL databáza"
    echo -e "   ☁️ Upload: R2 Storage"
    echo -e "   🧹 Cleanup: Automatické mazanie starých záloh"
    echo ""
    echo -e "${GREEN}📊 Harmonogram:${NC}"
    echo -e "   🕐 Denné zálohy o 2:00 UTC (3:00 CET)"
    echo -e "   📁 Ukladanie do R2: backups/database/YYYY-MM-DD/"
    echo -e "   🗑️ Automatické mazanie po 7 dňoch"
    echo ""
    echo -e "${BLUE}💡 Užitočné príkazy:${NC}"
    echo -e "   📊 Status: ${YELLOW}cd $BACKUP_DIR && railway status${NC}"
    echo -e "   📝 Logy: ${YELLOW}cd $BACKUP_DIR && railway logs${NC}"
    echo -e "   🧪 Test: ${YELLOW}cd $BACKUP_DIR && railway run npm run backup${NC}"
    echo -e "   ⚙️ Variables: ${YELLOW}cd $BACKUP_DIR && railway variables${NC}"
    echo ""
    echo -e "${GREEN}🎉 Railway backup systém je aktívny!${NC}"
    echo -e "${BLUE}💾 Vaše dáta budú zálohované každý deň automaticky${NC}"
}

# 🚀 Hlavná funkcia
main() {
    # Kontrola Railway CLI
    if check_railway_cli; then
        railway_login
        create_railway_project
        setup_environment_variables
        deploy_to_railway
        
        echo ""
        read -p "Chcete spustiť test backup? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            test_backup_system
        fi
        
        show_project_info
    else
        echo -e "${YELLOW}⚠️ Pokračujem bez Railway CLI - manuálne nastavenie${NC}"
        echo ""
        echo -e "${BLUE}📋 MANUÁLNE KROKY:${NC}"
        echo -e "1. Nainštalujte Railway CLI: ${YELLOW}npm install -g @railway/cli${NC}"
        echo -e "2. Spustite znovu: ${YELLOW}$0${NC}"
    fi
    
    show_summary
}

# Spustenie
main "$@"
