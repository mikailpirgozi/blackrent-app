#!/bin/bash

# BlackRent Complete Backup Script
# Tento script vytvorí kompletný backup celej BlackRent aplikácie

set -e  # Exit on any error

# Konfigurácia
BACKUP_DIR="/Users/mikailpirgozi/Desktop/Cursor zalohy mac16/Blackrent Beta 2"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_NAME="blackrent-complete-backup-${TIMESTAMP}"
BACKUP_PATH="${BACKUP_DIR}/complete-backups/${BACKUP_NAME}"

echo "🚀 Začínam kompletný backup BlackRent aplikácie..."
echo "📅 Čas: $(date)"
echo "📁 Cieľový adresár: ${BACKUP_PATH}"

# Vytvor backup adresár
mkdir -p "${BACKUP_PATH}"

# 1. BACKUP FRONTEND (Web aplikácia)
echo "📱 Zálohujem frontend (web aplikácia)..."
mkdir -p "${BACKUP_PATH}/frontend-web"
rsync -av --exclude='node_modules/' --exclude='dist/' --exclude='build/' "${BACKUP_DIR}/apps/web/" "${BACKUP_PATH}/frontend-web/"

# 2. BACKUP BACKEND
echo "⚙️ Zálohujem backend..."
mkdir -p "${BACKUP_PATH}/backend"
rsync -av --exclude='node_modules/' --exclude='dist/' --exclude='build/' "${BACKUP_DIR}/apps/backend/" "${BACKUP_PATH}/backend/"

# 3. BACKUP MOBILE APLIKÁCIE (bez iOS Pods)
echo "📱 Zálohujem mobile aplikáciu..."
mkdir -p "${BACKUP_PATH}/mobile"
rsync -av --exclude='ios/Pods/' --exclude='node_modules/' --exclude='android/build/' --exclude='android/.gradle/' "${BACKUP_DIR}/apps/mobile/" "${BACKUP_PATH}/mobile/"

# 4. BACKUP CUSTOMER WEBSITE
echo "🌐 Zálohujem customer website..."
mkdir -p "${BACKUP_PATH}/customer-website"
rsync -av --exclude='node_modules/' --exclude='.next/' --exclude='out/' "${BACKUP_DIR}/apps/customer-website/" "${BACKUP_PATH}/customer-website/"

# 5. BACKUP SHADCN TEST PROJEKT
echo "🧪 Zálohujem shadcn test projekt..."
mkdir -p "${BACKUP_PATH}/shadcn-test"
rsync -av --exclude='node_modules/' --exclude='dist/' --exclude='build/' "${BACKUP_DIR}/apps/shadcn-blackrent-test/" "${BACKUP_PATH}/shadcn-test/"

# 6. BACKUP ROOT KONFIGURAČNÉ SÚBORY
echo "⚙️ Zálohujem root konfiguračné súbory..."
[ -f "${BACKUP_DIR}/package.json" ] && cp "${BACKUP_DIR}/package.json" "${BACKUP_PATH}/"
[ -f "${BACKUP_DIR}/package-lock.json" ] && cp "${BACKUP_DIR}/package-lock.json" "${BACKUP_PATH}/"
[ -f "${BACKUP_DIR}/pnpm-lock.yaml" ] && cp "${BACKUP_DIR}/pnpm-lock.yaml" "${BACKUP_PATH}/"
[ -f "${BACKUP_DIR}/tsconfig.json" ] && cp "${BACKUP_DIR}/tsconfig.json" "${BACKUP_PATH}/"
[ -f "${BACKUP_DIR}/eslint.config.js" ] && cp "${BACKUP_DIR}/eslint.config.js" "${BACKUP_PATH}/"
[ -f "${BACKUP_DIR}/railway.json" ] && cp "${BACKUP_DIR}/railway.json" "${BACKUP_PATH}/"
[ -f "${BACKUP_DIR}/Dockerfile.railway" ] && cp "${BACKUP_DIR}/Dockerfile.railway" "${BACKUP_PATH}/"
[ -f "${BACKUP_DIR}/docker-compose.dev.yml" ] && cp "${BACKUP_DIR}/docker-compose.dev.yml" "${BACKUP_PATH}/"

# 7. BACKUP DOKUMENTÁCIE A PLÁNOV
echo "📚 Zálohujem dokumentáciu a plány..."
mkdir -p "${BACKUP_PATH}/docs"
cp "${BACKUP_DIR}"/*.md "${BACKUP_PATH}/docs/" 2>/dev/null || true
cp "${BACKUP_DIR}"/*.json "${BACKUP_PATH}/docs/" 2>/dev/null || true

# 8. BACKUP SKRIPTOV
echo "🔧 Zálohujem skripty..."
cp -r "${BACKUP_DIR}/scripts" "${BACKUP_PATH}/" 2>/dev/null || true

# 9. BACKUP DATABÁZY (ak existuje lokálna)
echo "🗄️ Zálohujem databázu..."
if [ -d "${BACKUP_DIR}/database" ]; then
    cp -r "${BACKUP_DIR}/database" "${BACKUP_PATH}/"
fi

# 10. BACKUP PROTOKOLOV
echo "📋 Zálohujem protokoly..."
if [ -d "${BACKUP_DIR}/protocols" ]; then
    cp -r "${BACKUP_DIR}/protocols" "${BACKUP_PATH}/"
fi

# 11. BACKUP ASSETS
echo "🎨 Zálohujem assets..."
if [ -d "${BACKUP_DIR}/assets" ]; then
    cp -r "${BACKUP_DIR}/assets" "${BACKUP_PATH}/"
fi

# 12. BACKUP PUBLIC SÚBORY
echo "🌍 Zálohujem public súbory..."
if [ -d "${BACKUP_DIR}/public" ]; then
    cp -r "${BACKUP_DIR}/public" "${BACKUP_PATH}/"
fi

# 13. BACKUP LOGS
echo "📊 Zálohujem logy..."
if [ -d "${BACKUP_DIR}/logs" ]; then
    cp -r "${BACKUP_DIR}/logs" "${BACKUP_PATH}/"
fi

# 14. BACKUP TESTS
echo "🧪 Zálohujem testy..."
if [ -d "${BACKUP_DIR}/tests" ]; then
    cp -r "${BACKUP_DIR}/tests" "${BACKUP_PATH}/"
fi

# 15. BACKUP PACKAGES (ak existuje, bez node_modules)
echo "📦 Zálohujem packages..."
if [ -d "${BACKUP_DIR}/packages" ]; then
    mkdir -p "${BACKUP_PATH}/packages"
    rsync -av --exclude='node_modules/' --exclude='dist/' --exclude='build/' "${BACKUP_DIR}/packages/" "${BACKUP_PATH}/packages/"
fi

# 16. BACKUP NGINX KONFIGURÁCIE
echo "🌐 Zálohujem nginx konfigurácie..."
if [ -d "${BACKUP_DIR}/nginx" ]; then
    cp -r "${BACKUP_DIR}/nginx" "${BACKUP_PATH}/"
fi

# 17. VYTVOR BACKUP INFO SÚBOR
echo "📝 Vytváram backup info súbor..."
cat > "${BACKUP_PATH}/BACKUP_INFO.txt" << EOF
BlackRent Complete Backup
========================

Dátum vytvorenia: $(date)
Verzia: Beta 2
Lokácia: ${BACKUP_PATH}

Obsahuje:
- Frontend web aplikácia (apps/web)
- Backend API (apps/backend) 
- Mobile aplikácia (apps/mobile)
- Customer website (apps/customer-website)
- Shadcn test projekt (apps/shadcn-blackrent-test)
- Všetky konfiguračné súbory
- Dokumentácia a plány
- Skripty
- Databáza (ak existuje lokálna)
- Protokoly
- Assets
- Public súbory
- Logy
- Testy
- Packages
- Nginx konfigurácie

Veľkosť: $(du -sh "${BACKUP_PATH}" | cut -f1)

Pre obnovenie:
1. Rozbaľte tento backup
2. Nainštalujte dependencies: npm install
3. Nastavte environment premenné
4. Spustite aplikáciu

EOF

# 18. VYTVOR ARCHÍV
echo "📦 Vytváram komprimovaný archív..."
cd "${BACKUP_DIR}/complete-backups"
tar -czf "${BACKUP_NAME}.tar.gz" "${BACKUP_NAME}"

# 19. VYMAŽ DOČASNÝ ADRESÁR
echo "🧹 Mažem dočasný adresár..."
rm -rf "${BACKUP_PATH}"

# 20. VÝSLEDOK
ARCHIVE_SIZE=$(du -sh "${BACKUP_NAME}.tar.gz" | cut -f1)
echo ""
echo "✅ Kompletný backup úspešne vytvorený!"
echo "📁 Archív: ${BACKUP_DIR}/complete-backups/${BACKUP_NAME}.tar.gz"
echo "📊 Veľkosť: ${ARCHIVE_SIZE}"
echo "⏰ Čas vytvorenia: $(date)"
echo ""
echo "Backup obsahuje:"
echo "- ✅ Frontend web aplikácia"
echo "- ✅ Backend API"
echo "- ✅ Mobile aplikácia" 
echo "- ✅ Customer website"
echo "- ✅ Shadcn test projekt"
echo "- ✅ Všetky konfiguračné súbory"
echo "- ✅ Dokumentácia a plány"
echo "- ✅ Skripty"
echo "- ✅ Databáza (ak existuje)"
echo "- ✅ Protokoly"
echo "- ✅ Assets"
echo "- ✅ Public súbory"
echo "- ✅ Logy"
echo "- ✅ Testy"
echo "- ✅ Packages"
echo "- ✅ Nginx konfigurácie"
echo ""
echo "🎉 Backup je pripravený na uloženie alebo prenos!"
