#!/bin/bash

# 🐕 Setup Email Monitoring Watchdog
# Nastavenie automatického monitoringu email systému

# Farby
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🐕 Email Monitoring Watchdog Setup${NC}"
echo "═══════════════════════════════════════"
echo ""

# Kontrola či script existuje
WATCHDOG_SCRIPT="./scripts/monitoring/email-monitoring-watchdog.sh"
if [[ ! -f "$WATCHDOG_SCRIPT" ]]; then
    echo -e "${RED}❌ Watchdog script neexistuje: $WATCHDOG_SCRIPT${NC}"
    exit 1
fi

# Nastavenie práv
chmod +x "$WATCHDOG_SCRIPT"
echo -e "${GREEN}✅ Executable práva nastavené${NC}"

# Test jednorázovej kontroly
echo -e "${BLUE}🧪 Testujem watchdog script...${NC}"
"$WATCHDOG_SCRIPT" check

echo ""
echo -e "${GREEN}🎯 Watchdog je pripravený!${NC}"
echo ""
echo -e "${YELLOW}📋 Dostupné príkazy:${NC}"
echo ""
echo "# Jednorázová kontrola:"
echo "npm run email:check"
echo ""
echo "# Spustenie watchdog (nekonečná slučka):"
echo "npm run email:watch"
echo ""
echo "# Manuálne spustenie:"
echo "./scripts/monitoring/email-monitoring-watchdog.sh watch"
echo ""
echo -e "${BLUE}💡 ODPORÚČANIE:${NC}"
echo "Pre produkčný server spustite watchdog na pozadí:"
echo "nohup npm run email:watch > logs/email-watchdog.log 2>&1 &"
echo ""
echo -e "${GREEN}✅ Setup dokončený!${NC}"
