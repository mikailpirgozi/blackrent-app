#!/bin/bash

# Automatické nasadenie na Railway
# Použitie: ./auto-deploy.sh [commit_message]

echo "🚀 Automatické nasadenie na Railway + GitHub"
echo "==========================================="

# Farby
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Custom commit message alebo default
COMMIT_MSG=${1:-"deploy: automatické nasadenie $(date '+%Y-%m-%d %H:%M:%S')"}

# Kontrola, či sme v správnom priečinku
if [ ! -f "railway.json" ]; then
    echo -e "${RED}❌ Musíš byť v blackrent-new priečinku!${NC}"
    echo -e "${YELLOW}💡 Spusti: cd blackrent-new && ./auto-deploy.sh${NC}"
    exit 1
fi

# Kontrola git repository
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}🔧 Inicializujem git repository...${NC}"
    git init
    git remote add origin https://github.com/mikailpirgozi/blackrent-app.git 2>/dev/null || true
fi

# Kontrola potrebných súborov
echo -e "${BLUE}📋 Kontrolujem potrebné súbory...${NC}"

required_files=("Dockerfile" "package.json" "railway.json" "src/App.tsx")
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ Chýba súbor: $file${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ Všetky súbory sú v poriadku${NC}"

# Kontrola git stavu
echo -e "${BLUE}🔍 Kontrolujem git stav...${NC}"
git status --porcelain

# Automatické pridanie všetkých zmien
echo -e "${PURPLE}📦 Pridávam všetky zmeny...${NC}"
git add -A

# Zobrazenie zmien
if [ -z "$(git diff --cached --name-only)" ]; then
    echo -e "${YELLOW}⚠️  Žiadne nové zmeny na commit${NC}"
    echo -e "${BLUE}🔄 Kontrolujem či treba force push...${NC}"
else
    echo -e "${GREEN}📝 Nájdené zmeny:${NC}"
    git diff --cached --name-only | head -10 | while read file; do
        echo -e "${BLUE}  📄 $file${NC}"
    done
    
    # Commit zmien
    echo -e "${PURPLE}💾 Commitujem zmeny...${NC}"
    if git commit -m "$COMMIT_MSG"; then
        echo -e "${GREEN}✅ Commit úspešný!${NC}"
    else
        echo -e "${RED}❌ Commit zlyhal!${NC}"
        exit 1
    fi
fi

# Push na GitHub s force (kvôli Railway auto-deploy)
echo -e "${BLUE}🚀 Pushjem na GitHub...${NC}"
echo -e "${YELLOW}⚠️  Používam --force-with-lease pre bezpečný force push${NC}"

if git push origin main --force-with-lease; then
    echo -e "${GREEN}✅ Push úspešný!${NC}"
elif git push origin main --force; then
    echo -e "${YELLOW}⚠️  Použitý fallback force push${NC}"
    echo -e "${GREEN}✅ Push úspešný s force!${NC}"
else
    echo -e "${RED}❌ Push zlyhal!${NC}"
    echo -e "${YELLOW}💡 Skús manuálne: git push origin main --force${NC}"
    exit 1
fi

# Status a odkazy
echo ""
echo -e "${GREEN}🎉 Nasadenie spustené!${NC}"
echo -e "${PURPLE}========================================${NC}"
echo -e "${BLUE}📱 Railway URL: ${NC}${YELLOW}https://blackrent-app-production-4d6f.up.railway.app${NC}"
echo -e "${BLUE}📊 Dashboard: ${NC}${YELLOW}https://railway.app/project/your-project${NC}"
echo -e "${BLUE}💾 GitHub: ${NC}${YELLOW}https://github.com/mikailpirgozi/blackrent-app${NC}"
echo ""
echo -e "${YELLOW}⏰ Railway nasadí zmeny za 2-5 minút${NC}"
echo -e "${PURPLE}🔍 Môžeš sledovať progress na Railway dashboard${NC}"

# Monitoring deployment (voliteľne)
echo ""
read -p "💡 Chceš sledovať deployment? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}🔍 Monitoring deployment každých 30 sekúnd...${NC}"
    echo -e "${YELLOW}Stlač Ctrl+C pre ukončenie${NC}"
    echo ""
    
    for i in {1..20}; do
        echo -e "${BLUE}⏰ $(date +%H:%M:%S) - Test $i/20...${NC}"
        
        HTTP_STATUS=$(curl -s -I https://blackrent-app-production-4d6f.up.railway.app/ | grep HTTP | head -1)
        
        if echo "$HTTP_STATUS" | grep -q "200"; then
            echo -e "${GREEN}✅ $HTTP_STATUS - Aplikácia beží!${NC}"
            break
        elif echo "$HTTP_STATUS" | grep -q "500"; then
            echo -e "${YELLOW}⚠️ $HTTP_STATUS - Deployment prebieha...${NC}"
        else
            echo -e "${RED}❌ $HTTP_STATUS${NC}"
        fi
        
        sleep 30
    done
fi

echo ""
echo -e "${GREEN}🚀 Auto-deploy kompletné!${NC}" 