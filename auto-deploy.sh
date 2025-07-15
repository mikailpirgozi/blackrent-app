#!/bin/bash

# Automatické nasadenie na Railway
# Použitie: ./auto-deploy.sh

echo "🚀 Automatické nasadenie na Railway"
echo "================================="

# Farby
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Kontrola, či sme v správnom priečinku
if [ ! -f "railway.json" ]; then
    echo -e "${RED}❌ Musíš byť v priečinku railway-blackrent!${NC}"
    exit 1
fi

# Kontrola git repository
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Nie je to git repository!${NC}"
    exit 1
fi

# Kontrola potrebných súborov
echo -e "${BLUE}📋 Kontrolujem potrebné súbory...${NC}"

required_files=("Dockerfile" "package.json" "railway.json")
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ Chýba súbor: $file${NC}"
        exit 1
    fi
done

# Kontrola priečinkov
required_dirs=("backend" "components" "context" "services" "public")
for dir in "${required_dirs[@]}"; do
    if [ ! -d "$dir" ]; then
        echo -e "${RED}❌ Chýba priečinok: $dir${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ Všetky súbory sú v poriadku${NC}"

# Kontrola git stavu
echo -e "${BLUE}🔍 Kontrolujem git stav...${NC}"
if [ -z "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}⚠️  Žiadne zmeny na commit${NC}"
else
    echo -e "${GREEN}✅ Zmeny nájdené, commitovanie...${NC}"
    
    # Automatický commit
    git add -A
    git commit -m "deploy: automatické nasadenie $(date '+%Y-%m-%d %H:%M:%S')"
fi

# Push na GitHub
echo -e "${BLUE}🚀 Pushjem na GitHub...${NC}"
if git push origin main --force; then
    echo -e "${GREEN}✅ Push úspešný!${NC}"
else
    echo -e "${RED}❌ Push zlyhal!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Nasadenie dokončené!${NC}"
echo -e "${BLUE}📱 Railway automaticky nasadí zmeny za 2-3 minúty${NC}"
echo -e "${BLUE}🌐 URL: https://blackrent-app-production.up.railway.app${NC}"
echo ""
echo -e "${YELLOW}💡 Môžeš sledovať deployment na Railway dashboard${NC}" 