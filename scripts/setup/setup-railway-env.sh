#!/bin/bash

# 🚂 Railway Environment Variables Setup Script
# Automatické nastavenie všetkých potrebných environment variables

echo "🚂 Railway Environment Variables Setup"
echo "======================================"

# Farby
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
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

# Základné environment variables
echo -e "${BLUE}🔧 Nastavujem základné environment variables...${NC}"

railway variables set NODE_ENV=production
railway variables set PORT=5001
railway variables set JWT_SECRET=blackrent-super-secret-jwt-key-production-2024

echo -e "${GREEN}✅ Základné variables nastavené${NC}"

# CORS a Frontend variables
echo -e "${BLUE}🌐 Nastavujem CORS a Frontend variables...${NC}"

railway variables set FRONTEND_URL=https://blackrent-app.vercel.app
railway variables set RAILWAY_STATIC_URL=https://blackrent-app-production-4d6f.up.railway.app

echo -e "${GREEN}✅ CORS variables nastavené${NC}"

# R2 Storage variables (vyžaduje manuálne zadanie)
echo -e "${YELLOW}☁️  R2 Storage variables vyžadujú manuálne nastavenie${NC}"
echo ""
echo "Pre nastavenie R2 Storage potrebujete:"
echo "1. Cloudflare R2 bucket"
echo "2. API credentials"
echo "3. Public URL"
echo ""
echo "Nastavte tieto variables manuálne v Railway dashboard:"
echo ""
echo "R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com"
echo "R2_ACCESS_KEY_ID=your-access-key-id"
echo "R2_SECRET_ACCESS_KEY=your-secret-access-key"
echo "R2_BUCKET_NAME=blackrent-storage"
echo "R2_ACCOUNT_ID=your-cloudflare-account-id"
echo "R2_PUBLIC_URL=https://pub-xyz.r2.dev"
echo ""

# Monitoring variables (voliteľné)
read -p "Chcete nastaviť monitoring variables? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}🔔 Nastavujem monitoring variables...${NC}"
    
    railway variables set ENABLE_MONITORING=true
    
    read -p "Máte Sentry DSN pre backend? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Zadajte Sentry DSN: " sentry_dsn
        railway variables set SENTRY_DSN_BACKEND="$sentry_dsn"
        echo -e "${GREEN}✅ Sentry DSN nastavené${NC}"
    fi
    
    echo -e "${GREEN}✅ Monitoring variables nastavené${NC}"
fi

# Zobrazenie aktuálnych variables
echo -e "${BLUE}📋 Aktuálne environment variables:${NC}"
railway variables

echo ""
echo -e "${GREEN}✅ Environment variables setup dokončené!${NC}"
echo ""
echo -e "${YELLOW}🚨 DÔLEŽITÉ:${NC}"
echo "1. Nastavte R2 Storage variables manuálne v Railway dashboard"
echo "2. Redeploy aplikáciu: railway up"
echo "3. Otestujte protokoly: https://blackrent-app.vercel.app"
echo ""
echo -e "${BLUE}🧪 Testovanie:${NC}"
echo "curl https://blackrent-app-production-4d6f.up.railway.app/api/health"
echo ""
echo -e "${GREEN}🎯 Po nastavení R2 Storage budú všetky problémy vyriešené!${NC}" 