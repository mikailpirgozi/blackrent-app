#!/bin/bash

###############################################################################
# BlackRent PostgreSQL Database Restore Script
# 
# Obnoví databázu z backup súboru (SQL alebo Custom formát)
#
# Usage: 
#   npm run restore:db -- /path/to/backup.sql
#   npm run restore:db -- /path/to/backup.dump
###############################################################################

set -e

# Farby pre output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Railway PostgreSQL credentials
PGHOST="trolley.proxy.rlwy.net"
PGPORT="13400"
PGUSER="postgres"
PGPASSWORD="nfwrpKxILRUMqunYTZJEhjudEstqLRGv"
PGDATABASE="railway"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}         BlackRent Database Restore Tool${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Prioritize PostgreSQL 16 binaries (Railway uses PG 16.8)
if [ -d "/opt/homebrew/opt/postgresql@16/bin" ]; then
    export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
elif [ -d "/usr/local/opt/postgresql@16/bin" ]; then
    export PATH="/usr/local/opt/postgresql@16/bin:$PATH"
fi

# Kontrola argumentu
if [ -z "$1" ]; then
    echo -e "${RED}❌ Error: Musíš zadať cestu k backup súboru!${NC}"
    echo ""
    echo -e "${YELLOW}Usage:${NC}"
    echo -e "  npm run restore:db -- /path/to/backup.sql"
    echo -e "  npm run restore:db -- /path/to/backup.dump"
    echo ""
    echo -e "${YELLOW}Dostupné backupy:${NC}"
    BACKUP_DIR="$HOME/Desktop/blackrent-backups"
    if [ -d "$BACKUP_DIR" ]; then
        ls -lh "$BACKUP_DIR"/*.{sql,dump} 2>/dev/null || echo "  (žiadne backupy)"
    fi
    exit 1
fi

BACKUP_FILE="$1"

# Kontrola či súbor existuje
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ Error: Súbor neexistuje: ${BACKUP_FILE}${NC}"
    exit 1
fi

# Detekcia formátu
EXTENSION="${BACKUP_FILE##*.}"
if [ "$EXTENSION" = "sql" ]; then
    FORMAT="SQL"
    TOOL="psql"
elif [ "$EXTENSION" = "dump" ]; then
    FORMAT="Custom"
    TOOL="pg_restore"
else
    echo -e "${RED}❌ Error: Neznámy formát súboru. Podporované: .sql, .dump${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Restore informácie:${NC}"
echo -e "   Súbor: ${GREEN}${BACKUP_FILE}${NC}"
echo -e "   Formát: ${GREEN}${FORMAT}${NC}"
echo -e "   Nástroj: ${GREEN}${TOOL}${NC}"
echo -e "   Veľkosť: ${GREEN}$(du -h "$BACKUP_FILE" | cut -f1)${NC}"
echo ""

# Varovanie
echo -e "${RED}⚠️  VAROVANIE: Táto operácia PREPÍŠE všetky dáta v databáze!${NC}"
echo -e "${YELLOW}   Cieľová databáza: ${PGHOST}:${PGPORT}/${PGDATABASE}${NC}"
echo ""
read -p "Naozaj chceš pokračovať? (napíš 'YES' pre potvrdenie): " CONFIRM

if [ "$CONFIRM" != "YES" ]; then
    echo -e "${YELLOW}❌ Restore zrušený používateľom.${NC}"
    exit 0
fi

echo ""

# Export credentials
export PGPASSWORD="$PGPASSWORD"

# Test pripojenia
echo -e "${YELLOW}🔄 Testujem pripojenie k databáze...${NC}"
if ! psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${RED}❌ Chyba: Nepodarilo sa pripojiť k databáze!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Pripojenie úspešné!${NC}"
echo ""

# Restore podľa formátu
if [ "$FORMAT" = "SQL" ]; then
    echo -e "${YELLOW}🔄 Spúšťam SQL restore...${NC}"
    psql \
      -h "$PGHOST" \
      -p "$PGPORT" \
      -U "$PGUSER" \
      -d "$PGDATABASE" \
      < "$BACKUP_FILE"
else
    echo -e "${YELLOW}🔄 Spúšťam Custom restore...${NC}"
    pg_restore \
      -h "$PGHOST" \
      -p "$PGPORT" \
      -U "$PGUSER" \
      -d "$PGDATABASE" \
      --clean \
      --if-exists \
      --verbose \
      "$BACKUP_FILE"
fi

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Restore úspešne dokončený!${NC}"
    echo ""
    
    # Overenie
    echo -e "${YELLOW}📊 Overujem databázu...${NC}"
    TABLE_COUNT=$(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)
    VEHICLE_COUNT=$(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -t -c "SELECT COUNT(*) FROM vehicles;" 2>/dev/null | xargs || echo "N/A")
    
    echo -e "   Počet tabuliek: ${GREEN}${TABLE_COUNT}${NC}"
    echo -e "   Počet vozidiel: ${GREEN}${VEHICLE_COUNT}${NC}"
else
    echo ""
    echo -e "${RED}❌ Chyba pri restore!${NC}"
    exit 1
fi

# Cleanup
unset PGPASSWORD

echo ""
echo -e "${GREEN}✓ Hotovo!${NC}"
echo ""

