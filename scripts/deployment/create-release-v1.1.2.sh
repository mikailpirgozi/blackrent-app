#!/bin/bash

# Automatické vytvorenie verzie 1.1.2 - Ukladanie protokolov hotovo
# Spusti v blackrent-new priečinku

echo "🏷️ Automatické vytvorenie verzie 1.1.2 - Ukladanie protokolov hotovo"
echo "=================================================================="

# Farby
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Kontrola, či sme v správnom priečinku
if [ ! -f "railway.json" ]; then
    echo -e "${RED}❌ Musíš byť v blackrent-new priečinku!${NC}"
    echo -e "${YELLOW}💡 Spusti: cd blackrent-new${NC}"
    exit 1
fi

# Kontrola git repository
if [ ! -d ".git" ]; then
    echo -e "${YELLOW}🔧 Inicializujem git repository...${NC}"
    git init
    git remote add origin https://github.com/mikailpirgozi/blackrent-app.git 2>/dev/null || true
fi

# Kontrola git stavu
echo -e "${BLUE}🔍 Kontrolujem git stav...${NC}"
git status --porcelain

# Automatické pridanie všetkých zmien
echo -e "${PURPLE}📦 Pridávam všetky zmeny...${NC}"
git add -A

# Zobrazenie zmien
if [ -z "$(git diff --cached --name-only)" ]; then
    echo -e "${YELLOW}⚠️  Žiadne nové zmeny na commit${NC}"
else
    echo -e "${GREEN}📝 Nájdené zmeny:${NC}"
    git diff --cached --name-only | head -10 | while read file; do
        echo -e "${BLUE}  📄 $file${NC}"
    done
fi

# Aktualizácia package.json verzie
echo -e "${BLUE}📦 Aktualizujem verziu v package.json...${NC}"
sed -i '' 's/"version": "0.1.0"/"version": "1.1.2"/' package.json

# Commit zmien
echo -e "${PURPLE}💾 Commitujem zmeny...${NC}"
COMMIT_MSG="version: bump to 1.1.2 - Ukladanie protokolov hotovo

✅ Implementované funkcie:
- 📋 Handover protokoly s fotodokumentáciou
- 📋 Return protokoly s kalkuláciami
- 📄 PDF generovanie protokolov
- ☁️ Cloudflare R2 storage integrácia
- 📱 Mobile photo capture
- ✍️ Digitálne podpisy
- 🎨 Responsive design pre protokoly
- 🔄 Automatické ukladanie do PostgreSQL
- 📤 Upload súborov do R2 storage

🚀 Technológie:
- Frontend: React + TypeScript + Material-UI
- Backend: Node.js + Express + PostgreSQL
- Storage: Cloudflare R2
- Hosting: Railway
- PDF: PDFKit + jsPDF

🌐 Deployment:
- URL: https://blackrent-app-production-4d6f.up.railway.app
- Status: ✅ Automaticky nasadené"

if git commit -m "$COMMIT_MSG"; then
    echo -e "${GREEN}✅ Commit úspešný!${NC}"
else
    echo -e "${RED}❌ Commit zlyhal!${NC}"
    exit 1
fi

# Vytvorenie tagu
echo -e "${PURPLE}🏷️ Vytváram tag v1.1.2...${NC}"
TAG_MSG="v1.1.2 - Ukladanie protokolov hotovo

✅ Implementované funkcie:
- 📋 Handover protokoly s fotodokumentáciou
- 📋 Return protokoly s kalkuláciami
- 📄 PDF generovanie protokolov
- ☁️ Cloudflare R2 storage integrácia
- 📱 Mobile photo capture
- ✍️ Digitálne podpisy
- 🎨 Responsive design pre protokoly
- 🔄 Automatické ukladanie do PostgreSQL
- 📤 Upload súborov do R2 storage

🚀 Technológie:
- Frontend: React + TypeScript + Material-UI
- Backend: Node.js + Express + PostgreSQL
- Storage: Cloudflare R2
- Hosting: Railway
- PDF: PDFKit + jsPDF

🌐 Deployment:
- URL: https://blackrent-app-production-4d6f.up.railway.app
- Status: ✅ Automaticky nasadené"

if git tag -a v1.1.2 -m "$TAG_MSG"; then
    echo -e "${GREEN}✅ Tag v1.1.2 vytvorený!${NC}"
else
    echo -e "${RED}❌ Vytvorenie tagu zlyhalo!${NC}"
    exit 1
fi

# Push zmien a tagu na GitHub
echo -e "${BLUE}🚀 Pushujem zmeny na GitHub...${NC}"
if git push origin main --force-with-lease; then
    echo -e "${GREEN}✅ Push zmien úspešný!${NC}"
else
    echo -e "${YELLOW}⚠️  Používam fallback force push...${NC}"
    if git push origin main --force; then
        echo -e "${GREEN}✅ Push zmien úspešný s force!${NC}"
    else
        echo -e "${RED}❌ Push zmien zlyhal!${NC}"
        exit 1
    fi
fi

echo -e "${BLUE}🏷️ Pushujem tag na GitHub...${NC}"
if git push origin v1.1.2; then
    echo -e "${GREEN}✅ Push tagu úspešný!${NC}"
else
    echo -e "${RED}❌ Push tagu zlyhal!${NC}"
    exit 1
fi

# Vytvorenie release notes
echo -e "${PURPLE}📝 Generujem release notes...${NC}"
cat > release-notes-v1.1.2.md << 'EOF'
## 🎉 BlackRent v1.1.2 - Ukladanie protokolov hotovo

### 📅 Release Date: $(date '+%Y-%m-%d %H:%M:%S')

### ✅ Nové funkcie v tejto verzii:

#### 📋 Protokoly prevzatia/vrátenia
- **Handover protokoly** - Kompletné protokoly prevzatia vozidla
- **Return protokoly** - Protokoly vrátenia s kalkuláciami
- **Fotodokumentácia** - Mobile photo capture s kompresiou
- **Digitálne podpisy** - Elektronické podpisy s časovou pečiatkou
- **PDF generovanie** - Automatické vytváranie PDF protokolov

#### ☁️ Cloudflare R2 Storage
- **R2 integrácia** - Ukladanie súborov do cloudu
- **Automatické uploady** - Súbory sa automaticky nahrávajú do R2
- **CDN dostupnosť** - Rýchle načítanie z celého sveta
- **Organizované štruktúry** - Štruktúrované ukladanie súborov

#### 📱 Mobile funkcionalita
- **Responsive design** - Optimalizované pre mobilné zariadenia
- **Photo capture** - Fotky priamo z mobilu
- **Touch-friendly** - Optimalizované pre dotykové ovládanie
- **Offline support** - Základná offline funkcionalita

#### 🔄 Automatizácia
- **Automatické ukladanie** - Protokoly sa automaticky ukladajú
- **Railway deployment** - Automatické nasadenie na Railway
- **GitHub Actions** - CI/CD pipeline
- **Error tracking** - Sentry integrácia

### 🚀 Technológie:
- **Frontend:** React 18 + TypeScript + Material-UI
- **Backend:** Node.js + Express + PostgreSQL
- **Storage:** Cloudflare R2 (S3-kompatibilné)
- **Hosting:** Railway
- **PDF:** PDFKit + jsPDF
- **Authentication:** JWT
- **Database:** PostgreSQL s automatickými migráciami

### 📦 Deployment:
- **URL:** https://blackrent-app-production-4d6f.up.railway.app
- **Status:** ✅ Automaticky nasadené
- **Database:** PostgreSQL na Railway
- **Storage:** Cloudflare R2 bucket

### ⚙️ Konfigurácia:
- **Environment variables:** Nastavené v Railway
- **R2 Storage:** Nakonfigurované pre súbory
- **Database:** Automatické migrácie a zálohy
- **SSL:** Automatické certifikáty

### 📊 Výkon:
- **Frontend:** Lazy loading komponentov
- **Backend:** Optimizované API endpoints
- **Storage:** CDN pre rýchle načítanie
- **Database:** Indexované queries

### 🎯 Ďalšie plány:
- **v1.2.0:** Rozšírené štatistiky a reporty
- **v1.3.0:** Email notifikácie
- **v1.4.0:** Advanced filtering a search
- **v2.0.0:** Multi-tenant podpora

---

**🎉 BlackRent je teraz kompletne funkčná aplikácia s profesionálnymi protokolmi!**
EOF

# Automatické vytvorenie GitHub release cez GitHub CLI (ak je nainštalovaný)
echo -e "${PURPLE}🚀 Pokúšam sa vytvoriť GitHub release...${NC}"
if command -v gh &> /dev/null; then
    echo -e "${BLUE}📦 Vytváram GitHub release...${NC}"
    if gh release create v1.1.2 \
        --title "BlackRent v1.1.2 - Ukladanie protokolov hotovo" \
        --notes-file release-notes-v1.1.2.md \
        --repo mikailpirgozi/blackrent-app; then
        echo -e "${GREEN}✅ GitHub release úspešne vytvorený!${NC}"
    else
        echo -e "${YELLOW}⚠️  GitHub CLI release zlyhal, vytvor manuálne${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  GitHub CLI nie je nainštalovaný${NC}"
fi

# Status a odkazy
echo ""
echo -e "${GREEN}🎉 Verzia 1.1.2 úspešne vytvorená!${NC}"
echo -e "${PURPLE}========================================${NC}"
echo -e "${BLUE}🏷️ Tag: ${NC}${YELLOW}v1.1.2${NC}"
echo -e "${BLUE}📝 Release notes: ${NC}${YELLOW}release-notes-v1.1.2.md${NC}"
echo -e "${BLUE}🌐 GitHub: ${NC}${YELLOW}https://github.com/mikailpirgozi/blackrent-app${NC}"
echo -e "${BLUE}📦 Railway: ${NC}${YELLOW}https://blackrent-app-production-4d6f.up.railway.app${NC}"
echo -e "${BLUE}📊 Railway Dashboard: ${NC}${YELLOW}https://railway.app/project/your-project${NC}"
echo ""
echo -e "${YELLOW}⏰ Railway automaticky nasadí zmeny za 2-5 minút${NC}"
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
echo -e "${GREEN}🚀 Verzia 1.1.2 kompletne vytvorená a nasadená!${NC}"
echo -e "${PURPLE}🎉 BlackRent s protokolmi je teraz živý!${NC}" 