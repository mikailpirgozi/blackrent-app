#!/bin/bash

# BlackRent Master Backup Script
# Tento script spustí všetky backupy: kód, databáza, R2 storage

set -e  # Exit on any error

# Konfigurácia
BACKUP_DIR="/Users/mikailpirgozi/Desktop/Cursor zalohy mac16/Blackrent Beta 2"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
MASTER_BACKUP_NAME="blackrent-master-backup-${TIMESTAMP}"

echo "🚀 BLACKRENT MASTER BACKUP"
echo "=========================="
echo "📅 Čas: $(date)"
echo "📁 Cieľový adresár: ${BACKUP_DIR}"
echo "🏷️ Názov: ${MASTER_BACKUP_NAME}"
echo ""

# Vytvor master backup adresár
mkdir -p "${BACKUP_DIR}/master-backups/${MASTER_BACKUP_NAME}"

# 1. BACKUP KÓDU (FRONTEND + BACKEND + MOBILE + CUSTOMER WEBSITE)
echo "📱 1/3 ZÁLOHUJEM KÓD..."
echo "========================"
"${BACKUP_DIR}/create-complete-backup.sh"
echo "✅ Kód zálohovaný!"
echo ""

# 2. BACKUP DATABÁZY
echo "🗄️ 2/3 ZÁLOHUJEM DATABÁZU..."
echo "============================="
"${BACKUP_DIR}/backup-production-database.sh"
echo "✅ Databáza zálohovaná!"
echo ""

# 3. BACKUP R2 STORAGE
echo "☁️ 3/3 ZÁLOHUJEM R2 STORAGE..."
echo "==============================="
"${BACKUP_DIR}/backup-r2-storage.sh"
echo "✅ R2 storage zálohovaný!"
echo ""

# 4. ZORGANIZUJ VŠETKY BACKUPY
echo "📦 ORGANIZUJEM BACKUPY..."
echo "========================"

# Presuň všetky backupy do master adresára
mv "${BACKUP_DIR}/complete-backups"/*.tar.gz "${BACKUP_DIR}/master-backups/${MASTER_BACKUP_NAME}/" 2>/dev/null || true
mv "${BACKUP_DIR}/database-backups"/*.tar.gz "${BACKUP_DIR}/master-backups/${MASTER_BACKUP_NAME}/" 2>/dev/null || true
mv "${BACKUP_DIR}/r2-backups"/*.tar.gz "${BACKUP_DIR}/master-backups/${MASTER_BACKUP_NAME}/" 2>/dev/null || true

# 5. VYTVOR MASTER INFO SÚBOR
echo "📝 Vytváram master info súbor..."
cat > "${BACKUP_DIR}/master-backups/${MASTER_BACKUP_NAME}/MASTER_BACKUP_INFO.txt" << EOF
BlackRent Master Backup
======================

Dátum vytvorenia: $(date)
Verzia: Beta 2
Lokácia: ${BACKUP_DIR}/master-backups/${MASTER_BACKUP_NAME}

Tento master backup obsahuje:

1. KOMPLETNÝ KÓD
   - Frontend web aplikácia (apps/web)
   - Backend API (apps/backend)
   - Mobile aplikácia (apps/mobile)
   - Customer website (apps/customer-website)
   - Shadcn test projekt
   - Všetky konfiguračné súbory
   - Dokumentácia a plány
   - Skripty

2. PRODUKČNÁ DATABÁZA
   - Kompletný dump databázy
   - Protokoly (handover/return)
   - Prenájmy a ich dokumenty
   - Vozidlá a ich fotky
   - Zákazníci a firmy
   - Náklady a pozície
   - Všetky používateľské dáta

3. R2 STORAGE
   - Všetky protokoly
   - Všetky fotky vozidiel
   - Všetky dokumenty prenájmov
   - Všetky PDF protokoly
   - Všetky podpisy
   - Všetky assety

SÚBORY V TOMTO BACKUP:
EOF

# Pridaj zoznam súborov
ls -lh "${BACKUP_DIR}/master-backups/${MASTER_BACKUP_NAME}"/*.tar.gz >> "${BACKUP_DIR}/master-backups/${MASTER_BACKUP_NAME}/MASTER_BACKUP_INFO.txt"

cat >> "${BACKUP_DIR}/master-backups/${MASTER_BACKUP_NAME}/MASTER_BACKUP_INFO.txt" << EOF

PRE OBNOVENIE:
==============

1. Rozbaľte všetky archívy
2. Nainštalujte dependencies: npm install
3. Nastavte environment premenné
4. Obnovte databázu z SQL dump
5. Nastavte R2 storage
6. Spustite aplikáciu

DÔLEŽITÉ:
- Tento backup obsahuje VŠETKY dáta
- Všetky protokoly, prenájmy, vozidlá
- Všetky fotky a dokumenty
- Kompletný kód aplikácie
- Produkčná databáza

Veľkosť celého backup:
EOF

# Pridaj celkovú veľkosť
du -sh "${BACKUP_DIR}/master-backups/${MASTER_BACKUP_NAME}" >> "${BACKUP_DIR}/master-backups/${MASTER_BACKUP_NAME}/MASTER_BACKUP_INFO.txt"

# 6. VYTVOR MASTER ARCHÍV
echo "📦 Vytváram master archív..."
cd "${BACKUP_DIR}/master-backups"
tar -czf "${MASTER_BACKUP_NAME}.tar.gz" "${MASTER_BACKUP_NAME}"

# 7. VYMAŽ DOČASNÝ ADRESÁR
echo "🧹 Mažem dočasný adresár..."
rm -rf "${MASTER_BACKUP_NAME}"

# 8. VÝSLEDOK
ARCHIVE_SIZE=$(du -sh "${MASTER_BACKUP_NAME}.tar.gz" | cut -f1)
echo ""
echo "🎉 MASTER BACKUP ÚSPEŠNE DOKONČENÝ!"
echo "=================================="
echo "📁 Archív: ${BACKUP_DIR}/master-backups/${MASTER_BACKUP_NAME}.tar.gz"
echo "📊 Veľkosť: ${ARCHIVE_SIZE}"
echo "⏰ Čas vytvorenia: $(date)"
echo ""
echo "✅ OBSAHUJE VŠETKO:"
echo "   📱 Kompletný kód aplikácie"
echo "   🗄️ Produkčná databáza"
echo "   ☁️ R2 storage (fotky, dokumenty)"
echo "   📋 Všetky protokoly"
echo "   🚗 Všetky vozidlá"
echo "   👥 Všetkých zákazníkov"
echo "   💰 Všetky prenájmy"
echo "   📄 Všetky dokumenty"
echo ""
echo "🎯 Tento backup obsahuje KOMPLETNÚ BlackRent aplikáciu!"
echo "   Môžete z neho obnoviť celú aplikáciu na novom serveri."
echo ""
echo "💾 Backup je pripravený na uloženie alebo prenos!"
