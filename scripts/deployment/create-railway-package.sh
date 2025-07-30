#!/bin/bash

# Script na vytvorenie Railway.app deployment package
# Použitie: ./create-railway-package.sh

echo "🚂 Príprava Railway.app deployment package"
echo "=========================================="

# Farby
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Názov výstupného priečinka
PACKAGE_DIR="railway-blackrent"

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
cp package.json "$PACKAGE_DIR/"
cp package-lock.json "$PACKAGE_DIR/"
cp tsconfig.json "$PACKAGE_DIR/"

# Kopírovanie priečinkov
echo -e "${BLUE}📁 Kopírujem frontend súbory...${NC}"

# Kontrola existencie public/
if [ ! -d "public/" ]; then
    echo -e "${YELLOW}❌ Chýba priečinok public/ v hlavnom projekte!${NC}"
    echo -e "${YELLOW}   Skopíruj ho späť alebo obnov z backupu a spusti skript znova.${NC}"
    exit 1
fi

cp -r src/ "$PACKAGE_DIR/"
cp -r public/ "$PACKAGE_DIR/"

echo -e "${BLUE}📁 Kopírujem backend súbory...${NC}"
mkdir -p "$PACKAGE_DIR/backend"
cp backend/package.json "$PACKAGE_DIR/backend/"
cp backend/package-lock.json "$PACKAGE_DIR/backend/"
cp backend/tsconfig.json "$PACKAGE_DIR/backend/"
cp -r backend/src/ "$PACKAGE_DIR/backend/"

# Railway specific súbory
echo -e "${BLUE}🚂 Vytváram Railway konfiguráciu...${NC}"
cat > "$PACKAGE_DIR/railway.json" << EOF
{
  "\$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 300
  },
  "variables": {
    "NODE_ENV": "production"
  }
}
EOF

# README pre Railway
cat > "$PACKAGE_DIR/README-RAILWAY.md" << EOF
# 🚂 Railway.app Deployment

## Nasadenie na Railway.app

1. **Vytvorte GitHub repository** a uploadujte tieto súbory
2. **Railway.app** → New Project → Deploy from GitHub repo
3. **Add PostgreSQL service**
4. **Nastavte environment variables**:
   - NODE_ENV=production
   - JWT_SECRET=your-secret-key

## Environment Variables

Railway automaticky nastaví:
- DATABASE_URL (PostgreSQL connection)
- PORT (server port)
- RAILWAY_STATIC_URL (doména)

## Features

✅ FREE 500 hodín/mesiac
✅ PostgreSQL included  
✅ Automatické SSL
✅ Custom doména
✅ Zero-config deployment

## Po nasadení

Aplikácia bude dostupná na:
- https://your-app.railway.app
- Admin: admin / admin123

Vytvorené: $(date)
EOF

# .gitignore pre Railway
cat > "$PACKAGE_DIR/.gitignore" << EOF
node_modules/
build/
dist/
.env
.env.local
.env.production
*.log
logs/
backup/
.DS_Store
*.db
*.sqlite3
EOF

# Nastavenie práv
chmod +x "$PACKAGE_DIR"/*.sh 2>/dev/null || true

# Informácie o vytvorenom package
echo ""
echo -e "${GREEN}✅ Railway package úspešne vytvorený!${NC}"
echo ""
echo -e "${BLUE}📁 Priečinok:${NC} $PACKAGE_DIR/"
echo -e "${BLUE}📊 Veľkosť:${NC} $(du -sh $PACKAGE_DIR | cut -f1)"
echo ""
echo -e "${YELLOW}📋 Obsah:${NC}"
find "$PACKAGE_DIR" -type f | head -15
echo ""
echo -e "${GREEN}🚀 Ďalšie kroky:${NC}"
echo "1. Vytvorte GitHub repository"
echo "2. Upload priečinok '$PACKAGE_DIR' na GitHub"
echo "3. Railway.app → New Project → Deploy from GitHub"
echo "4. Add PostgreSQL service"
echo "5. Otvorte aplikáciu"
echo ""
echo -e "${BLUE}🌐 Po nasadení:${NC}"
echo "- Aplikácia: https://your-app.railway.app"
echo "- Admin: admin / admin123"
echo "- ZDARMA prvých 500 hodín!" 