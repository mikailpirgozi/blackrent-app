#!/bin/bash

# 🗂️ BlackRent R2 Cleanup Helper Script
# Poskytuje jednoduché rozhranie pre vymazanie starých protokolov a súborov

set -e

API_URL="https://blackrent-app-production-4d6f.up.railway.app/api"
LOCAL_API_URL="http://localhost:3001/api"

# Farby pre výstup
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Help funkcia
show_help() {
    echo -e "${BLUE}🗂️ BlackRent R2 Cleanup Helper${NC}"
    echo ""
    echo "Použitie: $0 [OPTION] [TOKEN]"
    echo ""
    echo "OPTIONS:"
    echo "  analyze     - Analýza R2 súborov"
    echo "  clear-r2    - Vymazať všetky R2 súbory (NEVRATNÉ!)"
    echo "  reset-db    - Vymazať protokoly z databázy (NEVRATNÉ!)"
    echo "  full-reset  - Vymazať všetko - R2 + DB (NEVRATNÉ!)"
    echo "  help        - Zobrazí túto nápovedu"
    echo ""
    echo "EXAMPLES:"
    echo "  $0 analyze \$JWT_TOKEN"
    echo "  $0 clear-r2 \$JWT_TOKEN"
    echo "  $0 full-reset \$JWT_TOKEN"
    echo ""
    echo "⚠️  VAROVANIE: clear-r2, reset-db a full-reset sú NEVRATNÉ operácie!"
}

# Kontrola argumentov
if [ $# -lt 1 ]; then
    show_help
    exit 1
fi

OPERATION=$1
TOKEN=$2

if [ "$OPERATION" == "help" ]; then
    show_help
    exit 0
fi

if [ -z "$TOKEN" ] && [ "$OPERATION" != "help" ]; then
    echo -e "${RED}❌ Chýba JWT token!${NC}"
    echo "Získaj token z aplikácie (localStorage.blackrent_token) alebo sa prihlás cez API"
    echo ""
    echo "Príklad získania tokenu:"
    echo "curl -s -X POST \"$API_URL/auth/login\" \\"
    echo "  -H \"Content-Type: application/json\" \\"
    echo "  -d '{\"username\": \"admin\", \"password\": \"Black123\"}' | jq -r '.token'"
    exit 1
fi

# Detekcia prostredia (local vs production)
if curl -s "$LOCAL_API_URL/health" > /dev/null 2>&1; then
    BASE_URL="$LOCAL_API_URL"
    echo -e "${YELLOW}🏠 Detected LOCAL environment${NC}"
else
    BASE_URL="$API_URL"
    echo -e "${BLUE}☁️ Using PRODUCTION environment${NC}"
fi

# Spoločné hlavičky
AUTH_HEADER="Authorization: Bearer $TOKEN"

case $OPERATION in
    "analyze")
        echo -e "${BLUE}📊 Analyzing R2 storage...${NC}"
        curl -s -H "$AUTH_HEADER" "$BASE_URL/cleanup/r2-analyze" | jq '.'
        ;;
        
    "clear-r2")
        echo -e "${RED}🧹 WARNING: This will DELETE ALL R2 files!${NC}"
        echo -e "${YELLOW}Are you sure? Type 'yes' to continue:${NC}"
        read -r confirm
        
        if [ "$confirm" != "yes" ]; then
            echo -e "${GREEN}✅ Operation cancelled${NC}"
            exit 0
        fi
        
        echo -e "${RED}🗑️ Deleting all R2 files...${NC}"
        curl -s -X DELETE \
            -H "$AUTH_HEADER" \
            -H "Content-Type: application/json" \
            -d '{"confirm": "DELETE_ALL_R2_FILES"}' \
            "$BASE_URL/cleanup/r2-clear-all" | jq '.'
        ;;
        
    "reset-db")
        echo -e "${RED}🗃️ WARNING: This will DELETE ALL protocols from database!${NC}"
        echo -e "${YELLOW}Are you sure? Type 'DELETE_PROTOCOLS' to continue:${NC}"
        read -r confirm
        
        if [ "$confirm" != "DELETE_PROTOCOLS" ]; then
            echo -e "${GREEN}✅ Operation cancelled${NC}"
            exit 0
        fi
        
        echo -e "${RED}🗑️ Deleting all protocols from database...${NC}"
        curl -s -X DELETE \
            -H "$AUTH_HEADER" \
            -H "Content-Type: application/json" \
            -d '{"confirm": "DELETE_ALL_PROTOCOLS"}' \
            "$BASE_URL/cleanup/reset-protocols" | jq '.'
        ;;
        
    "full-reset")
        echo -e "${RED}💥 WARNING: This is a FULL RESET - ALL R2 files AND database protocols will be DELETED!${NC}"
        echo -e "${YELLOW}This is IRREVERSIBLE! Type 'FULL_RESET_CONFIRMED' to continue:${NC}"
        read -r confirm
        
        if [ "$confirm" != "FULL_RESET_CONFIRMED" ]; then
            echo -e "${GREEN}✅ Operation cancelled${NC}"
            exit 0
        fi
        
        echo -e "${RED}🗑️ Step 1/2: Deleting all R2 files...${NC}"
        curl -s -X DELETE \
            -H "$AUTH_HEADER" \
            -H "Content-Type: application/json" \
            -d '{"confirm": "DELETE_ALL_R2_FILES"}' \
            "$BASE_URL/cleanup/r2-clear-all" | jq '.'
            
        echo ""
        echo -e "${RED}🗑️ Step 2/2: Deleting all protocols from database...${NC}"
        curl -s -X DELETE \
            -H "$AUTH_HEADER" \
            -H "Content-Type: application/json" \
            -d '{"confirm": "DELETE_ALL_PROTOCOLS"}' \
            "$BASE_URL/cleanup/reset-protocols" | jq '.'
            
        echo ""
        echo -e "${GREEN}✅ Full reset completed! You can now create new protocols with organized structure.${NC}"
        ;;
        
    *)
        echo -e "${RED}❌ Unknown operation: $OPERATION${NC}"
        show_help
        exit 1
        ;;
esac

echo -e "${GREEN}✅ Operation completed${NC}"