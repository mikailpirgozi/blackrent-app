#!/bin/bash

# Automatické sledovanie zmien a nasadenie na Railway
# Použitie: ./auto-watch-deploy.sh

echo "👁️ Automatické sledovanie zmien a nasadenie na Railway"
echo "====================================================="

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
    echo -e "${YELLOW}💡 Spusti: cd blackrent-new && ./auto-watch-deploy.sh${NC}"
    exit 1
fi

# Kontrola či je fswatch nainštalovaný (macOS)
if command -v fswatch >/dev/null 2>&1; then
    WATCHER="fswatch"
    echo -e "${GREEN}✅ Používam fswatch pre sledovanie zmien${NC}"
elif command -v inotifywait >/dev/null 2>&1; then
    WATCHER="inotify"
    echo -e "${GREEN}✅ Používam inotify pre sledovanie zmien${NC}"
else
    echo -e "${YELLOW}⚠️  Nenájdený fswatch ani inotify, používam polling${NC}"
    echo -e "${BLUE}💡 Pre lepšiu performance nainštaluj: brew install fswatch${NC}"
    WATCHER="poll"
fi

# Funkcia pre automatický deploy
auto_deploy() {
    echo ""
    echo -e "${PURPLE}🔄 Detekovaná zmena! Spúšťam automatické nasadenie...${NC}"
    echo -e "${BLUE}📝 Čas: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
    
    # Spustiť auto-deploy
    if ./auto-deploy.sh "auto: zmena detekovaná $(date '+%H:%M:%S')"; then
        echo -e "${GREEN}✅ Automatické nasadenie dokončené!${NC}"
        echo -e "${YELLOW}⏰ Railway nasadí zmeny za 2-5 minút${NC}"
    else
        echo -e "${RED}❌ Automatické nasadenie zlyhalo!${NC}"
    fi
    
    echo -e "${BLUE}👁️ Pokračujem v sledovaní zmien...${NC}"
    echo "=================================================="
}

# Nastavenie sledovaných priečinkov a súborov
WATCH_DIRS=(
    "src"
    "public" 
    "backend"
    "."
)

WATCH_PATTERNS=(
    "*.tsx"
    "*.ts" 
    "*.js"
    "*.jsx"
    "*.css"
    "*.json"
    "*.md"
    "Dockerfile"
)

# Vylúčené priečinky a súbory
EXCLUDE_PATTERNS=(
    "node_modules"
    ".git"
    "dist"
    "build"
    ".DS_Store"
    "*.log"
    "backups"
)

echo ""
echo -e "${BLUE}📁 Sledované priečinky:${NC}"
for dir in "${WATCH_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo -e "${GREEN}  ✅ $dir${NC}"
    else
        echo -e "${YELLOW}  ⚠️  $dir (neexistuje)${NC}"
    fi
done

echo ""
echo -e "${BLUE}📄 Sledované typy súborov:${NC}"
for pattern in "${WATCH_PATTERNS[@]}"; do
    echo -e "${GREEN}  📄 $pattern${NC}"
done

echo ""
echo -e "${PURPLE}🚀 Spúšťam automatické sledovanie...${NC}"
echo -e "${YELLOW}💡 Stlač Ctrl+C pre ukončenie${NC}"
echo "=================================================="

# Hlavná slučka podľa typu watchera
case $WATCHER in
    "fswatch")
        # macOS fswatch
        fswatch -o -r \
            --exclude=".git" \
            --exclude="node_modules" \
            --exclude="dist" \
            --exclude="build" \
            --exclude=".DS_Store" \
            --exclude="*.log" \
            --exclude="backups" \
            "${WATCH_DIRS[@]}" | while read num; do
            auto_deploy
        done
        ;;
        
    "inotify")
        # Linux inotify
        inotifywait -m -r -e create,modify,move,delete \
            --exclude="(.git|node_modules|dist|build|\.DS_Store|.*\.log|backups)" \
            "${WATCH_DIRS[@]}" | while read path action file; do
            # Kontrola či súbor matchuje naše patterny
            if [[ "$file" =~ \.(tsx?|jsx?|css|json|md)$ ]] || [[ "$file" == "Dockerfile" ]]; then
                auto_deploy
            fi
        done
        ;;
        
    "poll")
        # Fallback polling metóda
        echo -e "${BLUE}🔄 Používam polling každých 10 sekúnd...${NC}"
        
        # Uloženie pôvodného stavu súborov
        get_file_hashes() {
            find "${WATCH_DIRS[@]}" -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.js" -o -name "*.jsx" -o -name "*.css" -o -name "*.json" -o -name "*.md" -o -name "Dockerfile" \) \
            ! -path "*/node_modules/*" ! -path "*/.git/*" ! -path "*/dist/*" ! -path "*/build/*" ! -path "*/backups/*" \
            -exec stat -f "%N %m" {} \; 2>/dev/null | sort
        }
        
        LAST_STATE=$(get_file_hashes)
        
        while true; do
            sleep 10
            CURRENT_STATE=$(get_file_hashes)
            
            if [ "$CURRENT_STATE" != "$LAST_STATE" ]; then
                auto_deploy
                LAST_STATE=$(get_file_hashes)
            fi
        done
        ;;
esac

echo ""
echo -e "${GREEN}🏁 Auto-watch ukončený${NC}" 