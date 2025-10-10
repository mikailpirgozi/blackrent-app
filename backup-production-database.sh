#!/bin/bash

# BlackRent Production Database Backup Script
# Tento script zálohuje produkčnú databázu z Railway

set -e  # Exit on any error

# Konfigurácia
BACKUP_DIR="/Users/mikailpirgozi/Desktop/Cursor zalohy mac16/Blackrent Beta 2"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_NAME="blackrent-production-db-${TIMESTAMP}"

# Railway PostgreSQL pripojenie
PGHOST="trolley.proxy.rlwy.net"
PGPORT="13400"
PGUSER="postgres"
PGDATABASE="railway"
PGPASSWORD="nfwrpKxILRUMqunYTZJEhjudEstqLRGv"

echo "🗄️ Začínam backup produkčnej databázy z Railway..."
echo "📅 Čas: $(date)"
echo "🌐 Host: ${PGHOST}:${PGPORT}"
echo "📊 Databáza: ${PGDATABASE}"

# Vytvor backup adresár
mkdir -p "${BACKUP_DIR}/database-backups"

# 1. BACKUP CELÉJ DATABÁZY (SQL dump)
echo "📦 Vytváram SQL dump celej databázy..."
PGPASSWORD="${PGPASSWORD}" pg_dump \
  -h "${PGHOST}" \
  -p "${PGPORT}" \
  -U "${PGUSER}" \
  -d "${PGDATABASE}" \
  --verbose \
  --no-password \
  --format=custom \
  --compress=9 \
  --file="${BACKUP_DIR}/database-backups/${BACKUP_NAME}.dump"

# 2. BACKUP CELÉJ DATABÁZY (SQL text format)
echo "📄 Vytváram SQL text dump..."
PGPASSWORD="${PGPASSWORD}" pg_dump \
  -h "${PGHOST}" \
  -p "${PGPORT}" \
  -U "${PGUSER}" \
  -d "${PGDATABASE}" \
  --verbose \
  --no-password \
  --format=plain \
  --file="${BACKUP_DIR}/database-backups/${BACKUP_NAME}.sql"

# 3. BACKUP ŠPECIFICKÝCH TABULIEK (najdôležitejšie dáta)
echo "📋 Zálohujem špecifické tabuľky..."

# Protokoly (handover/return)
PGPASSWORD="${PGPASSWORD}" pg_dump \
  -h "${PGHOST}" \
  -p "${PGPORT}" \
  -U "${PGUSER}" \
  -d "${PGDATABASE}" \
  --verbose \
  --no-password \
  --format=plain \
  --table=protocols \
  --table=protocol_photos \
  --table=protocol_signatures \
  --file="${BACKUP_DIR}/database-backups/${BACKUP_NAME}-protocols.sql"

# Prenájmy
PGPASSWORD="${PGPASSWORD}" pg_dump \
  -h "${PGHOST}" \
  -p "${PGPORT}" \
  -U "${PGUSER}" \
  -d "${PGDATABASE}" \
  --verbose \
  --no-password \
  --format=plain \
  --table=rentals \
  --table=rental_photos \
  --table=rental_documents \
  --file="${BACKUP_DIR}/database-backups/${BACKUP_NAME}-rentals.sql"

# Vozidlá
PGPASSWORD="${PGPASSWORD}" pg_dump \
  -h "${PGHOST}" \
  -p "${PGPORT}" \
  -U "${PGUSER}" \
  -d "${PGDATABASE}" \
  --verbose \
  --no-password \
  --format=plain \
  --table=vehicles \
  --table=vehicle_photos \
  --table=vehicle_documents \
  --file="${BACKUP_DIR}/database-backups/${BACKUP_NAME}-vehicles.sql"

# Zákazníci a firmy
PGPASSWORD="${PGPASSWORD}" pg_dump \
  -h "${PGHOST}" \
  -p "${PGPORT}" \
  -U "${PGUSER}" \
  -d "${PGDATABASE}" \
  --verbose \
  --no-password \
  --format=plain \
  --table=customers \
  --table=companies \
  --table=users \
  --file="${BACKUP_DIR}/database-backups/${BACKUP_NAME}-customers-companies.sql"

# Náklady a pozície
PGPASSWORD="${PGPASSWORD}" pg_dump \
  -h "${PGHOST}" \
  -p "${PGPORT}" \
  -U "${PGUSER}" \
  -d "${PGDATABASE}" \
  --verbose \
  --no-password \
  --format=plain \
  --table=expenses \
  --table=positions \
  --file="${BACKUP_DIR}/database-backups/${BACKUP_NAME}-expenses-positions.sql"

# 4. VYTVOR DATABASE INFO SÚBOR
echo "📝 Vytváram database info súbor..."
cat > "${BACKUP_DIR}/database-backups/${BACKUP_NAME}-info.txt" << EOF
BlackRent Production Database Backup
===================================

Dátum vytvorenia: $(date)
Zdroj: Railway PostgreSQL
Host: ${PGHOST}:${PGPORT}
Databáza: ${PGDATABASE}

Súbory v tomto backup:
- ${BACKUP_NAME}.dump (kompletný dump v custom formáte)
- ${BACKUP_NAME}.sql (kompletný dump v SQL formáte)
- ${BACKUP_NAME}-protocols.sql (protokoly)
- ${BACKUP_NAME}-rentals.sql (prenájmy)
- ${BACKUP_NAME}-vehicles.sql (vozidlá)
- ${BACKUP_NAME}-customers-companies.sql (zákazníci a firmy)
- ${BACKUP_NAME}-expenses-positions.sql (náklady a pozície)

Pre obnovenie:
1. Kompletný dump: pg_restore -d target_database ${BACKUP_NAME}.dump
2. SQL dump: psql -d target_database -f ${BACKUP_NAME}.sql
3. Špecifické tabuľky: psql -d target_database -f ${BACKUP_NAME}-[table].sql

Veľkosť súborov:
EOF

# 5. PRIDAJ VEĽKOSTI SÚBOROV
ls -lh "${BACKUP_DIR}/database-backups/${BACKUP_NAME}"* >> "${BACKUP_DIR}/database-backups/${BACKUP_NAME}-info.txt"

# 6. VYTVOR ARCHÍV
echo "📦 Vytváram komprimovaný archív..."
cd "${BACKUP_DIR}/database-backups"
tar -czf "${BACKUP_NAME}.tar.gz" "${BACKUP_NAME}"*

# 7. VYMAŽ DOČASNÉ SÚBORY
echo "🧹 Mažem dočasné súbory..."
rm -f "${BACKUP_NAME}.dump" "${BACKUP_NAME}.sql" "${BACKUP_NAME}"-*.sql "${BACKUP_NAME}-info.txt"

# 8. VÝSLEDOK
ARCHIVE_SIZE=$(du -sh "${BACKUP_NAME}.tar.gz" | cut -f1)
echo ""
echo "✅ Produkčná databáza úspešne zálohovaná!"
echo "📁 Archív: ${BACKUP_DIR}/database-backups/${BACKUP_NAME}.tar.gz"
echo "📊 Veľkosť: ${ARCHIVE_SIZE}"
echo "⏰ Čas vytvorenia: $(date)"
echo ""
echo "Backup obsahuje:"
echo "- ✅ Kompletný dump databázy (custom + SQL formát)"
echo "- ✅ Protokoly (handover/return)"
echo "- ✅ Prenájmy a ich dokumenty"
echo "- ✅ Vozidlá a ich fotky"
echo "- ✅ Zákazníci a firmy"
echo "- ✅ Náklady a pozície"
echo "- ✅ Všetky používateľské dáta"
echo ""
echo "🎉 Databázový backup je pripravený!"
