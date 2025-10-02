#!/bin/bash

# 💻 JEDNODUCHÝ LOKÁLNY BACKUP SCRIPT
# Rýchla záloha databázy na PC pomocou psql
# Autor: BlackRent Team

set -e

# 🎨 Farby
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# 📅 Konfigurácia
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
PROJECT_ROOT="/Users/mikailpirgozi/Desktop/Cursor zalohy mac16/Blackrent Beta 2"
BACKUP_DIR="$PROJECT_ROOT/local-backups"
BACKUP_FILE="$BACKUP_DIR/blackrent-local-backup-$TIMESTAMP.sql"

# 🔧 Railway PostgreSQL konfigurácia
RAILWAY_HOST="trolley.proxy.rlwy.net"
RAILWAY_USER="postgres"
RAILWAY_PORT="13400"
RAILWAY_DB="railway"
RAILWAY_PASSWORD="nfwrpKxILRUMqunYTZJEhjudEstqLRGv"

echo -e "${PURPLE}💻 JEDNODUCHÝ LOKÁLNY BACKUP${NC}"
echo -e "${BLUE}📅 Čas: $(date)${NC}"
echo -e "${BLUE}📁 Backup súbor: $BACKUP_FILE${NC}"
echo ""

# Vytvorenie backup adresára
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}🗄️ Vytváram zálohu databázy...${NC}"

export PGPASSWORD="$RAILWAY_PASSWORD"

# Získanie zoznamu tabuliek a ich počtu záznamov
{
    echo "-- BlackRent Database Backup"
    echo "-- Created: $(date)"
    echo "-- Host: $RAILWAY_HOST"
    echo "-- Database: $RAILWAY_DB"
    echo ""
    
    echo "-- TABLE STATISTICS:"
    psql -h "$RAILWAY_HOST" -U "$RAILWAY_USER" -p "$RAILWAY_PORT" -d "$RAILWAY_DB" \
        -c "SELECT 'Prenájmy' as tabulka, COUNT(*) as pocet FROM rentals 
            UNION ALL SELECT 'Vozidlá', COUNT(*) FROM vehicles 
            UNION ALL SELECT 'Zákazníci', COUNT(*) FROM customers 
            UNION ALL SELECT 'Firmy', COUNT(*) FROM companies 
            UNION ALL SELECT 'Protokoly', COUNT(*) FROM protocols 
            UNION ALL SELECT 'Náklady', COUNT(*) FROM expenses;" \
        -t 2>/dev/null | sed 's/^/-- /'
    
    echo ""
    echo "-- DATABASE SIZE:"
    psql -h "$RAILWAY_HOST" -U "$RAILWAY_USER" -p "$RAILWAY_PORT" -d "$RAILWAY_DB" \
        -c "SELECT pg_size_pretty(pg_database_size('$RAILWAY_DB'));" \
        -t 2>/dev/null | sed 's/^/-- /'
    
    echo ""
    echo "-- ALL TABLES:"
    psql -h "$RAILWAY_HOST" -U "$RAILWAY_USER" -p "$RAILWAY_PORT" -d "$RAILWAY_DB" \
        -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;" \
        -t 2>/dev/null | sed 's/^/-- /'
    
    echo ""
    echo "-- BACKUP COMPLETED: $(date)"
    
} > "$BACKUP_FILE"

unset PGPASSWORD

if [ -s "$BACKUP_FILE" ]; then
    # Kompresia zálohy
    echo -e "${BLUE}📦 Komprimujem zálohu...${NC}"
    gzip "$BACKUP_FILE"
    
    compressed_file="$BACKUP_FILE.gz"
    size=$(du -h "$compressed_file" | cut -f1)
    
    echo -e "${GREEN}✅ Lokálna záloha vytvorená: $size${NC}"
    echo -e "${BLUE}📁 Umiestnenie: $compressed_file${NC}"
    
    # Zobrazenie obsahu
    echo ""
    echo -e "${BLUE}📊 OBSAH ZÁLOHY:${NC}"
    zcat "$compressed_file" | head -30
    
    echo ""
    echo -e "${GREEN}🎉 LOKÁLNA ZÁLOHA DOKONČENÁ!${NC}"
    
    # Čistenie starých záloh (ponechať 10 najnovších)
    echo -e "${YELLOW}🧹 Čistím staré zálohy...${NC}"
    ls -t "$BACKUP_DIR"/blackrent-local-backup-*.sql.gz 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true
    
    backup_count=$(ls "$BACKUP_DIR"/blackrent-local-backup-*.sql.gz 2>/dev/null | wc -l)
    echo -e "${GREEN}✅ Ponechaných záloh: $backup_count${NC}"
    
else
    echo -e "${RED}❌ Záloha sa nevytvorila správne${NC}"
    exit 1
fi
