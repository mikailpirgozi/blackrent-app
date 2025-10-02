#!/bin/bash

# 📧 Email Monitoring Watchdog Script
# Zabezpečuje že email monitoring beží stále na produkčnej verzii

# Farby
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Konfigurácia
RAILWAY_API="https://blackrent-app-production-4d6f.up.railway.app/api"
LOCAL_API="http://localhost:3001/api"
CHECK_INTERVAL=300  # 5 minút
MAX_RETRIES=3

# Funkcia na získanie auth tokenu
get_auth_token() {
    local api_url=$1
    curl -s -X POST -H "Content-Type: application/json" \
         -d '{"username":"admin","password":"Black123"}' \
         "$api_url/auth/login" | grep -o '"token":"[^"]*"' | cut -d'"' -f4
}

# Funkcia na kontrolu IMAP statusu
check_imap_status() {
    local api_url=$1
    local token=$2
    
    curl -s -H "Authorization: Bearer $token" \
         "$api_url/email-imap/status" | \
         grep -o '"running":[^,]*' | cut -d':' -f2
}

# Funkcia na spustenie IMAP monitoringu
start_imap_monitoring() {
    local api_url=$1
    local token=$2
    
    echo -e "${BLUE}🚀 Spúšťam IMAP monitoring...${NC}"
    
    response=$(curl -s -H "Authorization: Bearer $token" \
                    -X POST "$api_url/email-imap/start")
    
    if [[ $response == *"success\":true"* ]]; then
        echo -e "${GREEN}✅ IMAP monitoring úspešne spustený${NC}"
        return 0
    else
        echo -e "${RED}❌ Chyba pri spustení IMAP monitoringu: $response${NC}"
        return 1
    fi
}

# Funkcia na kontrolu a opravu
check_and_fix() {
    local api_url=$1
    local env_name=$2
    
    echo -e "${BLUE}🔍 Kontrolujem $env_name email monitoring...${NC}"
    
    # Získanie tokenu
    token=$(get_auth_token "$api_url")
    if [[ -z "$token" ]]; then
        echo -e "${RED}❌ Nepodarilo sa získať auth token pre $env_name${NC}"
        return 1
    fi
    
    # Kontrola statusu
    running=$(check_imap_status "$api_url" "$token")
    
    if [[ "$running" == "true" ]]; then
        echo -e "${GREEN}✅ $env_name: Email monitoring beží správne${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️ $env_name: Email monitoring NEBEŽÍ!${NC}"
        
        # Pokus o opravu
        for ((i=1; i<=MAX_RETRIES; i++)); do
            echo -e "${BLUE}🔧 Pokus $i/$MAX_RETRIES o spustenie...${NC}"
            
            if start_imap_monitoring "$api_url" "$token"; then
                echo -e "${GREEN}✅ $env_name: Email monitoring opravený!${NC}"
                return 0
            fi
            
            if [[ $i -lt $MAX_RETRIES ]]; then
                echo -e "${YELLOW}⏳ Čakám 10 sekúnd pred ďalším pokusom...${NC}"
                sleep 10
            fi
        done
        
        echo -e "${RED}❌ $env_name: Nepodarilo sa opraviť email monitoring po $MAX_RETRIES pokusoch${NC}"
        return 1
    fi
}

# Hlavná funkcia watchdog
watchdog_loop() {
    echo -e "${GREEN}🐕 Email Monitoring Watchdog spustený${NC}"
    echo -e "${BLUE}📧 Kontrolujem každých $CHECK_INTERVAL sekúnd...${NC}"
    echo ""
    
    while true; do
        timestamp=$(date '+%Y-%m-%d %H:%M:%S')
        echo -e "${BLUE}⏰ [$timestamp] Spúšťam kontrolu...${NC}"
        
        # Kontrola localhost (ak beží)
        if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
            check_and_fix "$LOCAL_API" "LOCALHOST"
        else
            echo -e "${YELLOW}⚠️ LOCALHOST: Server nebeží, preskakujem${NC}"
        fi
        
        echo ""
        
        # Kontrola produkcie (Railway)
        check_and_fix "$RAILWAY_API" "PRODUKCIA"
        
        echo ""
        echo -e "${BLUE}⏳ Čakám $CHECK_INTERVAL sekúnd do ďalšej kontroly...${NC}"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        
        sleep $CHECK_INTERVAL
    done
}

# Jednorázová kontrola
single_check() {
    echo -e "${GREEN}🔍 Jednorázová kontrola email monitoringu${NC}"
    echo ""
    
    # Kontrola localhost
    if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
        check_and_fix "$LOCAL_API" "LOCALHOST"
    else
        echo -e "${YELLOW}⚠️ LOCALHOST: Server nebeží${NC}"
    fi
    
    echo ""
    
    # Kontrola produkcie
    check_and_fix "$RAILWAY_API" "PRODUKCIA"
}

# Spracovanie argumentov
case "${1:-}" in
    "watch"|"watchdog"|"")
        watchdog_loop
        ;;
    "check"|"status")
        single_check
        ;;
    "help"|"-h"|"--help")
        echo "📧 Email Monitoring Watchdog"
        echo ""
        echo "Použitie:"
        echo "  $0 [watch|check|help]"
        echo ""
        echo "Príkazy:"
        echo "  watch    - Spustí nekonečný watchdog (default)"
        echo "  check    - Jednorázová kontrola"
        echo "  help     - Zobrazí túto nápovedu"
        echo ""
        echo "Funkcie:"
        echo "  ✅ Automatická kontrola každých 5 minút"
        echo "  🔧 Automatické spustenie ak monitoring nebeží"
        echo "  🏠 Kontrola localhost aj produkcie"
        echo "  🔄 3 pokusy o opravu"
        echo "  📊 Detailné loggovanie"
        ;;
    *)
        echo -e "${RED}❌ Neznámy argument: $1${NC}"
        echo "Použite: $0 help"
        exit 1
        ;;
esac
