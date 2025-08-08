#!/bin/bash

# 🏥 BlackRent Diagnostics Hub
# Hlavný vstupný bod pre diagnostiku a riešenie problémov

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                🏥 BlackRent Diagnostics Hub                 ║${NC}"
echo -e "${CYAN}║              Rýchla diagnostika a riešenie                  ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Skontroluj či existujú diagnostické skripty
if [ ! -f "scripts/diagnostics/health-check.sh" ]; then
    echo -e "${RED}❌ Diagnostické skripty nenájdené!${NC}"
    echo -e "${YELLOW}💡 Spustite najprv setup diagnostických nástrojov.${NC}"
    exit 1
fi

# Menu
echo -e "${BLUE}Vyberte akciu:${NC}"
echo -e "${CYAN}1.${NC} 🔍 Úplná diagnostika (odporúčané)"
echo -e "${CYAN}2.${NC} 🔧 Automatické riešenie problémov"
echo -e "${CYAN}3.${NC} 🧹 Vyčistiť porty a procesy"
echo -e "${CYAN}4.${NC} 📊 Spustiť live monitoring"
echo -e "${CYAN}5.${NC} ⚡ Rýchly reštart aplikácie"
echo -e "${CYAN}6.${NC} 📋 Zobraziť logy"
echo -e "${CYAN}q.${NC} Ukončiť"
echo ""

while true; do
    read -p "Vaša voľba (1-6, q): " choice
    case $choice in
        1)
            echo -e "\n${BLUE}🔍 Spúšťam úplnú diagnostiku...${NC}"
            ./scripts/diagnostics/health-check.sh
            break
            ;;
        2)
            echo -e "\n${BLUE}🔧 Spúšťam automatické riešenie...${NC}"
            ./scripts/diagnostics/auto-fix.sh
            break
            ;;
        3)
            echo -e "\n${BLUE}🧹 Čistím porty a procesy...${NC}"
            ./scripts/diagnostics/cleanup-ports.sh
            break
            ;;
        4)
            echo -e "\n${BLUE}📊 Spúšťam live monitoring...${NC}"
            echo -e "${YELLOW}Stlačte Ctrl+C pre ukončenie${NC}"
            ./scripts/diagnostics/start-monitoring.sh
            break
            ;;
        5)
            echo -e "\n${BLUE}⚡ Reštartujem aplikáciu...${NC}"
            npm run dev:restart
            break
            ;;
        6)
            echo -e "\n${BLUE}📋 Posledné logy:${NC}"
            echo -e "${CYAN}=== Backend Log (posledných 20 riadkov) ===${NC}"
            tail -20 logs/backend.log 2>/dev/null || echo "Backend log nenájdený"
            echo ""
            echo -e "${CYAN}=== Frontend Log (posledných 20 riadkov) ===${NC}"
            tail -20 logs/frontend.log 2>/dev/null || echo "Frontend log nenájdený"
            break
            ;;
        q|Q)
            echo -e "\n${GREEN}👋 Dovidenia!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Neplatná voľba. Zadajte 1-6 alebo q.${NC}"
            ;;
    esac
done

echo ""
echo -e "${CYAN}💡 Pre rýchle spustenie konkrétnej diagnostiky:${NC}"
echo -e "   ${CYAN}./diagnose.sh${NC}           - Toto menu"
echo -e "   ${CYAN}./scripts/diagnostics/health-check.sh${NC} - Úplná diagnostika"
echo -e "   ${CYAN}./scripts/diagnostics/auto-fix.sh${NC}     - Auto-fix"
