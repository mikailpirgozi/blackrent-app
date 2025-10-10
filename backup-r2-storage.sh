#!/bin/bash

# BlackRent R2 Storage Backup Script
# Tento script zálohuje všetky súbory z Cloudflare R2 storage

set -e  # Exit on any error

# Konfigurácia
BACKUP_DIR="/Users/mikailpirgozi/Desktop/Cursor zalohy mac16/Blackrent Beta 2"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_NAME="blackrent-r2-storage-${TIMESTAMP}"

# R2 konfigurácia (treba nastaviť environment premenné)
R2_ACCOUNT_ID="${R2_ACCOUNT_ID}"
R2_ACCESS_KEY_ID="${R2_ACCESS_KEY_ID}"
R2_SECRET_ACCESS_KEY="${R2_SECRET_ACCESS_KEY}"
R2_BUCKET_NAME="${R2_BUCKET_NAME:-blackrent-storage}"

echo "☁️ Začínam backup R2 storage..."
echo "📅 Čas: $(date)"
echo "🪣 Bucket: ${R2_BUCKET_NAME}"

# Skontroluj či sú nastavené environment premenné
if [ -z "$R2_ACCOUNT_ID" ] || [ -z "$R2_ACCESS_KEY_ID" ] || [ -z "$R2_SECRET_ACCESS_KEY" ]; then
    echo "❌ Chyba: R2 environment premenné nie sú nastavené!"
    echo "Nastavte:"
    echo "export R2_ACCOUNT_ID='your-account-id'"
    echo "export R2_ACCESS_KEY_ID='your-access-key'"
    echo "export R2_SECRET_ACCESS_KEY='your-secret-key'"
    echo "export R2_BUCKET_NAME='blackrent-storage'"
    exit 1
fi

# Vytvor backup adresár
mkdir -p "${BACKUP_DIR}/r2-backups"

# 1. NAKONFIGURUJ AWS CLI PRE R2
echo "⚙️ Konfigurujem AWS CLI pre R2..."
export AWS_ACCESS_KEY_ID="${R2_ACCESS_KEY_ID}"
export AWS_SECRET_ACCESS_KEY="${R2_SECRET_ACCESS_KEY}"
export AWS_DEFAULT_REGION="auto"

# 2. BACKUP CELÉHO BUCKETU
echo "📦 Zálohujem celý R2 bucket..."
aws s3 sync \
  "s3://${R2_BUCKET_NAME}" \
  "${BACKUP_DIR}/r2-backups/${BACKUP_NAME}" \
  --endpoint-url "https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com" \
  --verbose

# 3. BACKUP ŠPECIFICKÝCH ADRESÁROV
echo "📋 Zálohujem špecifické adresáre..."

# Protokoly
echo "📄 Zálohujem protokoly..."
aws s3 sync \
  "s3://${R2_BUCKET_NAME}/protocols" \
  "${BACKUP_DIR}/r2-backups/${BACKUP_NAME}-protocols" \
  --endpoint-url "https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com" \
  --verbose

# Vozidlá
echo "🚗 Zálohujem vozidlá..."
aws s3 sync \
  "s3://${R2_BUCKET_NAME}/vehicles" \
  "${BACKUP_DIR}/r2-backups/${BACKUP_NAME}-vehicles" \
  --endpoint-url "https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com" \
  --verbose

# Prenájmy
echo "📋 Zálohujem prenájmy..."
aws s3 sync \
  "s3://${R2_BUCKET_NAME}/rentals" \
  "${BACKUP_DIR}/r2-backups/${BACKUP_NAME}-rentals" \
  --endpoint-url "https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com" \
  --verbose

# Dokumenty
echo "📄 Zálohujem dokumenty..."
aws s3 sync \
  "s3://${R2_BUCKET_NAME}/documents" \
  "${BACKUP_DIR}/r2-backups/${BACKUP_NAME}-documents" \
  --endpoint-url "https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com" \
  --verbose

# 4. VYTVOR STORAGE INFO SÚBOR
echo "📝 Vytváram storage info súbor..."
cat > "${BACKUP_DIR}/r2-backups/${BACKUP_NAME}-info.txt" << EOF
BlackRent R2 Storage Backup
==========================

Dátum vytvorenia: $(date)
Zdroj: Cloudflare R2
Bucket: ${R2_BUCKET_NAME}
Account ID: ${R2_ACCOUNT_ID}

Adresáre v tomto backup:
- ${BACKUP_NAME}/ (kompletný bucket)
- ${BACKUP_NAME}-protocols/ (protokoly)
- ${BACKUP_NAME}-vehicles/ (vozidlá)
- ${BACKUP_NAME}-rentals/ (prenájmy)
- ${BACKUP_NAME}-documents/ (dokumenty)

Obsahuje:
- Všetky protokoly (handover/return)
- Všetky fotky vozidiel
- Všetky dokumenty prenájmov
- Všetky PDF protokoly
- Všetky podpisy
- Všetky assety

Veľkosť súborov:
EOF

# 5. PRIDAJ VEĽKOSTI SÚBOROV
du -sh "${BACKUP_DIR}/r2-backups/${BACKUP_NAME}"* >> "${BACKUP_DIR}/r2-backups/${BACKUP_NAME}-info.txt"

# 6. VYTVOR ARCHÍV
echo "📦 Vytváram komprimovaný archív..."
cd "${BACKUP_DIR}/r2-backups"
tar -czf "${BACKUP_NAME}.tar.gz" "${BACKUP_NAME}"*

# 7. VYMAŽ DOČASNÉ ADRESÁRE
echo "🧹 Mažem dočasné adresáre..."
rm -rf "${BACKUP_NAME}" "${BACKUP_NAME}"-* "${BACKUP_NAME}-info.txt"

# 8. VÝSLEDOK
ARCHIVE_SIZE=$(du -sh "${BACKUP_NAME}.tar.gz" | cut -f1)
echo ""
echo "✅ R2 storage úspešne zálohovaný!"
echo "📁 Archív: ${BACKUP_DIR}/r2-backups/${BACKUP_NAME}.tar.gz"
echo "📊 Veľkosť: ${ARCHIVE_SIZE}"
echo "⏰ Čas vytvorenia: $(date)"
echo ""
echo "Backup obsahuje:"
echo "- ✅ Všetky protokoly (handover/return)"
echo "- ✅ Všetky fotky vozidiel"
echo "- ✅ Všetky dokumenty prenájmov"
echo "- ✅ Všetky PDF protokoly"
echo "- ✅ Všetky podpisy"
echo "- ✅ Všetky assety"
echo "- ✅ Kompletný R2 bucket"
echo ""
echo "🎉 R2 storage backup je pripravený!"
