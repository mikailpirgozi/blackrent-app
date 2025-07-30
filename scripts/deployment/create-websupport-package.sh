#!/bin/bash

# Script na vytvorenie deployment package pre Websupport
# Použitie: ./create-websupport-package.sh

echo "🇸🇰 Príprava Websupport deployment package"
echo "==========================================="

# Farby
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Názov výstupného priečinka
PACKAGE_DIR="websupport-blackrent"

# Vymazanie starého package ak existuje
if [ -d "$PACKAGE_DIR" ]; then
    echo -e "${YELLOW}⚠️  Vymazávam starý package...${NC}"
    rm -rf "$PACKAGE_DIR"
fi

# Vytvorenie nového priečinka
mkdir -p "$PACKAGE_DIR"

echo -e "${BLUE}📦 Kopírujem súbory...${NC}"

# Kopírovanie hlavných súborov
cp Dockerfile "$PACKAGE_DIR/"
cp docker-compose.yml "$PACKAGE_DIR/"
cp production.env "$PACKAGE_DIR/"
cp deploy.sh "$PACKAGE_DIR/"
cp .dockerignore "$PACKAGE_DIR/"
cp package.json "$PACKAGE_DIR/"
cp package-lock.json "$PACKAGE_DIR/"
cp tsconfig.json "$PACKAGE_DIR/"

# Kopírovanie priečinkov
echo -e "${BLUE}📁 Kopírujem frontend súbory...${NC}"
cp -r src/ "$PACKAGE_DIR/"
cp -r public/ "$PACKAGE_DIR/"

echo -e "${BLUE}📁 Kopírujem backend súbory...${NC}"
mkdir -p "$PACKAGE_DIR/backend"
cp backend/package.json "$PACKAGE_DIR/backend/"
cp backend/package-lock.json "$PACKAGE_DIR/backend/"
cp backend/tsconfig.json "$PACKAGE_DIR/backend/"
cp -r backend/src/ "$PACKAGE_DIR/backend/"

echo -e "${BLUE}📁 Kopírujem nginx konfiguráciu...${NC}"
mkdir -p "$PACKAGE_DIR/nginx"
cp nginx/nginx.conf "$PACKAGE_DIR/nginx/"

# Vytvorenie potrebných priečinkov
mkdir -p "$PACKAGE_DIR/nginx/ssl"
mkdir -p "$PACKAGE_DIR/logs"
mkdir -p "$PACKAGE_DIR/backup"

# Nastavenie práv pre deploy script
chmod +x "$PACKAGE_DIR/deploy.sh"

# Vytvorenie info súboru
cat > "$PACKAGE_DIR/README-WEBSUPPORT.txt" << EOF
🇸🇰 WEBSUPPORT DEPLOYMENT PACKAGE
=================================

Tento priečinok obsahuje všetky súbory potrebné pre nasadenie 
Blackrent aplikácie na Websupport VPS.

📋 PRED UPLOADOM:
1. Objednajte VPS na websupport.sk (VPS Start alebo vyšší)
2. Nastavte DNS záznamy v admin.websupport.sk
3. Upravte production.env s vašou doménou

📤 UPLOAD:
- Nahrajte celý obsah tohto priečinka na VPS do /root/blackrent/
- Použite SFTP (FileZilla/WinSCP) alebo SCP príkaz

🚀 SPUSTENIE:
1. SSH na VPS: ssh root@VAS_VPS_IP
2. cd /root/blackrent
3. cp production.env .env
4. nano .env (upravte doménu a heslá)
5. ./deploy.sh

📖 KOMPLETNÝ NÁVOD:
Pozrite súbor WEBSUPPORT-DEPLOY.md

🆘 PODPORA:
- Websupport: 02/69 00 69 00
- Admin: admin / admin123

Vytvorené: $(date)
EOF

# Informácie o vytvorenom package
echo ""
echo -e "${GREEN}✅ Package úspešne vytvorený!${NC}"
echo ""
echo -e "${BLUE}📁 Priečinok:${NC} $PACKAGE_DIR/"
echo -e "${BLUE}📊 Veľkosť:${NC} $(du -sh $PACKAGE_DIR | cut -f1)"
echo ""
echo -e "${YELLOW}📋 Zoznam súborov:${NC}"
find "$PACKAGE_DIR" -type f | head -20
echo ""
echo -e "${GREEN}🚀 Ďalšie kroky:${NC}"
echo "1. Nahrajte priečinok '$PACKAGE_DIR' na Websupport VPS"
echo "2. Pozrite návod v WEBSUPPORT-DEPLOY.md"
echo "3. Upravte .env súbor s vašou doménou"
echo "4. Spustite ./deploy.sh na serveri"
echo ""
echo -e "${BLUE}📤 SCP príkaz pre upload:${NC}"
echo "scp -r $PACKAGE_DIR/ root@VAS_VPS_IP:/root/blackrent/" 