#!/bin/bash

###############################################################################
# BlackRent PostgreSQL Database Backup Script
# 
# Vytvorí kompletný backup Railway PostgreSQL databázy v dvoch formátoch:
# 1. SQL dump (textový, ľahko čitateľný)
# 2. Custom PostgreSQL format (komprimovaný, rýchlejší restore)
#
# Usage: npm run backup:db
###############################################################################

set -e  # Exit on error

# Farby pre output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Railway PostgreSQL credentials
PGHOST="trolley.proxy.rlwy.net"
PGPORT="13400"
PGUSER="postgres"
PGPASSWORD="nfwrpKxILRUMqunYTZJEhjudEstqLRGv"
PGDATABASE="railway"

# Backup directory na Desktop
BACKUP_DIR="$HOME/Desktop/blackrent-backups"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_NAME="blackrent_backup_${TIMESTAMP}"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}         BlackRent Database Backup Tool${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Prioritize PostgreSQL 16 binaries (Railway uses PG 16.8)
if [ -d "/opt/homebrew/opt/postgresql@16/bin" ]; then
    export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
elif [ -d "/usr/local/opt/postgresql@16/bin" ]; then
    export PATH="/usr/local/opt/postgresql@16/bin:$PATH"
fi

# Kontrola či existuje pg_dump
if ! command -v pg_dump &> /dev/null; then
    echo -e "${RED}❌ Error: pg_dump nie je nainštalovaný!${NC}"
    echo -e "${YELLOW}Nainštaluj PostgreSQL client:${NC}"
    echo -e "  macOS:   ${GREEN}brew install postgresql@16${NC}"
    echo -e "  Ubuntu:  ${GREEN}sudo apt-get install postgresql-client-16${NC}"
    exit 1
fi

# Overenie verzie
PG_VERSION=$(pg_dump --version | grep -oE '[0-9]+' | head -1)
if [ "$PG_VERSION" -lt 16 ]; then
    echo -e "${YELLOW}⚠️  Upozornenie: Railway používa PostgreSQL 16, ale tvoj pg_dump je verzia ${PG_VERSION}${NC}"
    echo -e "${YELLOW}   Odporúčam: brew install postgresql@16${NC}"
    echo ""
fi

# Vytvorenie backup adresára ak neexistuje
echo -e "${YELLOW}📁 Vytváram backup adresár...${NC}"
mkdir -p "$BACKUP_DIR"
echo -e "${GREEN}✓ Adresár vytvorený: ${BACKUP_DIR}${NC}"
echo ""

# Export environment variables pre pg_dump
export PGPASSWORD="$PGPASSWORD"

echo -e "${YELLOW}🔄 Pripájam sa k Railway PostgreSQL databáze...${NC}"
echo -e "   Host: ${PGHOST}"
echo -e "   Port: ${PGPORT}"
echo -e "   Database: ${PGDATABASE}"
echo -e "   User: ${PGUSER}"
echo ""

# Test pripojenia
if ! psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${RED}❌ Chyba: Nepodarilo sa pripojiť k databáze!${NC}"
    echo -e "${YELLOW}Skontroluj Railway credentials a sieťové pripojenie.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Pripojenie úspešné!${NC}"
echo ""

# Získanie info o databáze
echo -e "${YELLOW}📊 Získavam informácie o databáze...${NC}"
TABLE_COUNT=$(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs)
VEHICLE_COUNT=$(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -t -c "SELECT COUNT(*) FROM vehicles;" 2>/dev/null | xargs || echo "N/A")
COMPANY_COUNT=$(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -t -c "SELECT COUNT(*) FROM companies;" 2>/dev/null | xargs || echo "N/A")

echo -e "   Počet tabuliek: ${GREEN}${TABLE_COUNT}${NC}"
echo -e "   Počet vozidiel: ${GREEN}${VEHICLE_COUNT}${NC}"
echo -e "   Počet firiem: ${GREEN}${COMPANY_COUNT}${NC}"
echo ""

# ============================================================================
# BACKUP 1: SQL Format (textový, ľahko čitateľný)
# ============================================================================
echo -e "${YELLOW}💾 Vytváram SQL backup (textový formát)...${NC}"
SQL_FILE="${BACKUP_DIR}/${BACKUP_NAME}.sql"

pg_dump \
  -h "$PGHOST" \
  -p "$PGPORT" \
  -U "$PGUSER" \
  -d "$PGDATABASE" \
  --format=plain \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  --file="$SQL_FILE" 2>/dev/null

if [ -f "$SQL_FILE" ]; then
    SQL_SIZE=$(du -h "$SQL_FILE" | cut -f1)
    echo -e "${GREEN}✓ SQL backup vytvorený: ${SQL_FILE}${NC}"
    echo -e "   Veľkosť: ${GREEN}${SQL_SIZE}${NC}"
else
    echo -e "${RED}❌ Chyba pri vytváraní SQL backupu!${NC}"
    exit 1
fi
echo ""

# ============================================================================
# BACKUP 2: Custom Format (komprimovaný, rýchlejší restore)
# ============================================================================
echo -e "${YELLOW}💾 Vytváram Custom backup (komprimovaný formát)...${NC}"
CUSTOM_FILE="${BACKUP_DIR}/${BACKUP_NAME}.dump"

pg_dump \
  -h "$PGHOST" \
  -p "$PGPORT" \
  -U "$PGUSER" \
  -d "$PGDATABASE" \
  --format=custom \
  --compress=9 \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  --file="$CUSTOM_FILE" 2>/dev/null

if [ -f "$CUSTOM_FILE" ]; then
    CUSTOM_SIZE=$(du -h "$CUSTOM_FILE" | cut -f1)
    echo -e "${GREEN}✓ Custom backup vytvorený: ${CUSTOM_FILE}${NC}"
    echo -e "   Veľkosť: ${GREEN}${CUSTOM_SIZE}${NC}"
else
    echo -e "${RED}❌ Chyba pri vytváraní Custom backupu!${NC}"
    exit 1
fi
echo ""

# ============================================================================
# BACKUP 3: Metadata súbor (informácie o backupe)
# ============================================================================
echo -e "${YELLOW}📝 Vytváram metadata súbor...${NC}"
METADATA_FILE="${BACKUP_DIR}/${BACKUP_NAME}_metadata.txt"

cat > "$METADATA_FILE" << EOF
BlackRent Database Backup Metadata
=====================================

Backup Created: $(date +"%Y-%m-%d %H:%M:%S")
Timestamp: ${TIMESTAMP}

Database Information:
-------------------------------------
Host: ${PGHOST}
Port: ${PGPORT}
Database: ${PGDATABASE}
User: ${PGUSER}

Statistics:
-------------------------------------
Total Tables: ${TABLE_COUNT}
Vehicles: ${VEHICLE_COUNT}
Companies: ${COMPANY_COUNT}

Backup Files:
-------------------------------------
SQL Format: ${BACKUP_NAME}.sql (${SQL_SIZE})
Custom Format: ${BACKUP_NAME}.dump (${CUSTOM_SIZE})

Restore Instructions:
-------------------------------------

1. Restore z SQL súboru:
   psql -h HOST -p PORT -U USER -d DATABASE < ${BACKUP_NAME}.sql

2. Restore z Custom súboru:
   pg_restore -h HOST -p PORT -U USER -d DATABASE --clean --if-exists ${BACKUP_NAME}.dump

3. Restore s Railway credentials:
   
   SQL:
   PGPASSWORD=nfwrpKxILRUMqunYTZJEhjudEstqLRGv \\
   psql -h trolley.proxy.rlwy.net -p 13400 -U postgres -d railway < ${BACKUP_NAME}.sql
   
   Custom:
   PGPASSWORD=nfwrpKxILRUMqunYTZJEhjudEstqLRGv \\
   pg_restore -h trolley.proxy.rlwy.net -p 13400 -U postgres -d railway \\
   --clean --if-exists ${BACKUP_NAME}.dump

Notes:
-------------------------------------
- SQL formát je textový, ľahko čitateľný v editore
- Custom formát je komprimovaný, rýchlejší pre veľké databázy
- Backup obsahuje schému + všetky dáta
- --clean flag odstráni existujúce objekty pred restore
- --if-exists zabráni chybám ak objekt neexistuje

EOF

echo -e "${GREEN}✓ Metadata vytvorené: ${METADATA_FILE}${NC}"
echo ""

# ============================================================================
# SUMMARY
# ============================================================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Backup úspešne dokončený!${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}📁 Backup lokácia:${NC}"
echo -e "   ${GREEN}${BACKUP_DIR}/${NC}"
echo ""
echo -e "${YELLOW}📦 Vytvorené súbory:${NC}"
echo -e "   1. ${GREEN}${BACKUP_NAME}.sql${NC} (${SQL_SIZE}) - SQL textový formát"
echo -e "   2. ${GREEN}${BACKUP_NAME}.dump${NC} (${CUSTOM_SIZE}) - PostgreSQL custom formát"
echo -e "   3. ${GREEN}${BACKUP_NAME}_metadata.txt${NC} - Informácie o backupe"
echo ""
echo -e "${YELLOW}💡 Tip:${NC} Pre restore použij návod v metadata súbore"
echo ""

# Cleanup
unset PGPASSWORD

# Otvorenie adresára v Finder (macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo -e "${YELLOW}📂 Otváram Finder...${NC}"
    open "$BACKUP_DIR"
fi

echo -e "${GREEN}✓ Hotovo!${NC}"
echo ""

