#!/bin/bash

# Skript na synchronizáciu produkčnej databázy s lokálnou PostgreSQL databázou
# Pre testovanie s rovnakými dátami ako v produkcii

set -e

echo "🔄 Synchronizácia produkčnej databázy s lokálnou..."

# Farby pre output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Konfigurácia
PRODUCTION_DB_URL="postgresql://postgres.hqfmuxhprppawmtfyhov:AKbUYZE2qW1gicKf@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"
LOCAL_DB_HOST="localhost"
LOCAL_DB_PORT="5432"
LOCAL_DB_NAME="blackrent"
LOCAL_DB_USER="postgres"
LOCAL_DB_PASSWORD="password"

BACKUP_DIR="./db-sync-backups"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/production-backup-$TIMESTAMP.sql"

echo -e "${BLUE}ℹ️ Konfigurácia:${NC}"
echo "   Produkčná DB: Railway PostgreSQL"
echo "   Lokálna DB: $LOCAL_DB_HOST:$LOCAL_DB_PORT/$LOCAL_DB_NAME"
echo "   Backup súbor: $BACKUP_FILE"
echo ""

# Vytvor backup adresár ak neexistuje
mkdir -p "$BACKUP_DIR"

# Funkcia na kontrolu, či je PostgreSQL dostupný
check_postgres() {
    local host=$1
    local port=$2
    local user=$3
    local dbname=$4
    
    if command -v pg_isready >/dev/null 2>&1; then
        if pg_isready -h "$host" -p "$port" -U "$user" -d "$dbname" >/dev/null 2>&1; then
            return 0
        else
            return 1
        fi
    else
        # Fallback ak pg_isready nie je dostupný
        return 0
    fi
}

# Kontrola lokálnej PostgreSQL
echo -e "${YELLOW}🔍 Kontrolujem lokálnu PostgreSQL...${NC}"
if ! check_postgres "$LOCAL_DB_HOST" "$LOCAL_DB_PORT" "$LOCAL_DB_USER" "$LOCAL_DB_NAME"; then
    echo -e "${RED}❌ Lokálna PostgreSQL nie je dostupná alebo databáza $LOCAL_DB_NAME neexistuje${NC}"
    echo -e "${YELLOW}💡 Spustite najprv:${NC}"
    echo "   brew services start postgresql"
    echo "   createdb -U $LOCAL_DB_USER $LOCAL_DB_NAME"
    exit 1
fi

echo -e "${GREEN}✅ Lokálna PostgreSQL je dostupná${NC}"

# 1. Stiahnuť dump z produkčnej databázy
echo -e "${YELLOW}📥 Sťahujem dáta z produkčnej databázy...${NC}"
if ! pg_dump "$PRODUCTION_DB_URL" \
    --no-owner \
    --no-privileges \
    --clean \
    --if-exists \
    --verbose \
    > "$BACKUP_FILE"; then
    echo -e "${RED}❌ Chyba pri sťahovaní produkčných dát${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Produkčné dáta úspešne stiahnuté do $BACKUP_FILE${NC}"

# Skontroluj, či backup súbor nie je prázdny
if [ ! -s "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ Backup súbor je prázdny${NC}"
    exit 1
fi

echo -e "${BLUE}📊 Veľkosť backup súboru: $(du -h "$BACKUP_FILE" | cut -f1)${NC}"

# 2. Vymazať existujúce dáta v lokálnej databáze
echo -e "${YELLOW}🗑️ Čistím lokálnu databázu...${NC}"
PGPASSWORD="$LOCAL_DB_PASSWORD" psql \
    -h "$LOCAL_DB_HOST" \
    -p "$LOCAL_DB_PORT" \
    -U "$LOCAL_DB_USER" \
    -d "$LOCAL_DB_NAME" \
    -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;" \
    --quiet

echo -e "${GREEN}✅ Lokálna databáza vyčistená${NC}"

# 3. Importovať produkčné dáta do lokálnej databázy
echo -e "${YELLOW}📤 Importujem produkčné dáta do lokálnej databázy...${NC}"
if ! PGPASSWORD="$LOCAL_DB_PASSWORD" psql \
    -h "$LOCAL_DB_HOST" \
    -p "$LOCAL_DB_PORT" \
    -U "$LOCAL_DB_USER" \
    -d "$LOCAL_DB_NAME" \
    -f "$BACKUP_FILE" \
    --quiet; then
    echo -e "${RED}❌ Chyba pri importe dát${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Dáta úspešne importované${NC}"

# 4. Skontroluj počet záznamov v hlavných tabuľkách
echo -e "${YELLOW}📊 Kontrolujem importované dáta...${NC}"

check_table_count() {
    local table=$1
    local count=$(PGPASSWORD="$LOCAL_DB_PASSWORD" psql \
        -h "$LOCAL_DB_HOST" \
        -p "$LOCAL_DB_PORT" \
        -U "$LOCAL_DB_USER" \
        -d "$LOCAL_DB_NAME" \
        -t -c "SELECT COUNT(*) FROM $table;" 2>/dev/null || echo "0")
    echo "   $table: $(echo $count | xargs) záznamov"
}

echo -e "${BLUE}Počet záznamov v tabuľkách:${NC}"
check_table_count "vehicles"
check_table_count "customers" 
check_table_count "rentals"
check_table_count "companies"
check_table_count "users"

# 5. Nastavenie environment variables pre lokálne testovanie
echo -e "${YELLOW}⚙️ Konfigurácia lokálneho prostredia...${NC}"

# Vytvor .env súbor pre backend ak neexistuje
if [ ! -f "backend/.env" ]; then
    echo -e "${BLUE}📝 Vytváram backend/.env súbor...${NC}"
    cat > backend/.env << EOF
# Lokálna PostgreSQL databáza - synchronizovaná s produkciou
DB_HOST=localhost
DB_PORT=5432
DB_NAME=blackrent
DB_USER=postgres
DB_PASSWORD=password

# JWT Secret
JWT_SECRET=blackrent-super-secret-jwt-key-2024

# Server Configuration
PORT=3001
NODE_ENV=development

# Version
VERSION=1.0.0-sync
EOF
    echo -e "${GREEN}✅ Backend .env súbor vytvorený${NC}"
else
    echo -e "${YELLOW}⚠️ Backend .env súbor už existuje, preskakujem...${NC}"
fi

# Cleanup starých backup súborov (starších ako 7 dní)
echo -e "${YELLOW}🧹 Čistím staré backup súbory...${NC}"
find "$BACKUP_DIR" -name "production-backup-*.sql" -mtime +7 -delete 2>/dev/null || true

echo ""
echo -e "${GREEN}🎉 Synchronizácia dokončená úspešne!${NC}"
echo ""
echo -e "${BLUE}📋 Ďalšie kroky:${NC}"
echo "1. Spustite backend: cd backend && npm run dev"
echo "2. Spustite frontend: npm start"
echo "3. Teraz máte rovnaké dáta ako v produkcii!"
echo ""
echo -e "${YELLOW}💡 Tipy:${NC}"
echo "• Backup je uložený v: $BACKUP_FILE"
echo "• Pre opätovnú synchronizáciu spustite: ./sync-production-db.sh"
echo "• Backend je nakonfigurovaný na localhost PostgreSQL"
echo "" 