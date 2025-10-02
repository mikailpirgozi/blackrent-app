#!/bin/bash

# 🚂 Railway Environment Variables Check Script
# Kontrola či sú nastavené všetky potrebné SMTP variables

echo "🚂 Railway Environment Variables Check"
echo "====================================="

# Farby
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Kontrola Railway CLI
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI nie je nainštalované${NC}"
    echo "Inštalujte: npm install -g @railway/cli"
    exit 1
fi

# Kontrola prihlásenia
if ! railway whoami &> /dev/null; then
    echo -e "${RED}❌ Nie ste prihlásený do Railway${NC}"
    echo "Spustite: railway login"
    exit 1
fi

echo -e "${GREEN}✅ Railway CLI je pripravené${NC}"
echo ""

# Zoznam potrebných SMTP variables
REQUIRED_VARS=(
    "EMAIL_SEND_PROTOCOLS"
    "SMTP_HOST"
    "SMTP_PORT"
    "SMTP_SECURE"
    "SMTP_USER"
    "SMTP_PASS"
    "SMTP_FROM_NAME"
)

echo -e "${BLUE}🔍 Kontrolujem SMTP environment variables...${NC}"
echo ""

MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if railway variables get "$var" &> /dev/null; then
        echo -e "${GREEN}✅ $var${NC} - nastavené"
    else
        echo -e "${RED}❌ $var${NC} - CHÝBA!"
        MISSING_VARS+=("$var")
    fi
done

echo ""

if [ ${#MISSING_VARS[@]} -eq 0 ]; then
    echo -e "${GREEN}🎉 Všetky SMTP variables sú nastavené!${NC}"
    echo ""
    echo -e "${BLUE}📧 Testovanie SMTP pripojenia...${NC}"
    echo "Skontrolujte Railway logs pre SMTP connection test."
else
    echo -e "${RED}❌ Chýbajú tieto environment variables:${NC}"
    for var in "${MISSING_VARS[@]}"; do
        echo -e "${RED}   - $var${NC}"
    done
    echo ""
    echo -e "${YELLOW}🔧 Pridajte chýbajúce variables pomocou:${NC}"
    echo ""
    echo "railway variables set EMAIL_SEND_PROTOCOLS=true"
    echo "railway variables set SMTP_HOST=smtp.m1.websupport.sk"
    echo "railway variables set SMTP_PORT=465"
    echo "railway variables set SMTP_SECURE=true"
    echo "railway variables set SMTP_USER=info@blackrent.sk"
    echo "railway variables set SMTP_PASS=your-websupport-password"
    echo "railway variables set SMTP_FROM_NAME=\"BlackRent System\""
    echo ""
fi

# Kontrola ďalších dôležitých variables
echo -e "${BLUE}🔍 Kontrolujem ďalšie dôležité variables...${NC}"
echo ""

OTHER_VARS=(
    "NODE_ENV"
    "DATABASE_URL"
    "R2_ENDPOINT"
    "R2_ACCESS_KEY_ID"
    "R2_SECRET_ACCESS_KEY"
    "R2_BUCKET_NAME"
)

for var in "${OTHER_VARS[@]}"; do
    if railway variables get "$var" &> /dev/null; then
        echo -e "${GREEN}✅ $var${NC} - nastavené"
    else
        echo -e "${YELLOW}⚠️  $var${NC} - chýba (môže byť voliteľné)"
    fi
done

echo ""
echo -e "${BLUE}📊 Pre zobrazenie všetkých variables spustite:${NC}"
echo "railway variables"
