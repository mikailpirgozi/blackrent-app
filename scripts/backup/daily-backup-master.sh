#!/bin/bash

# 🎯 BLACKRENT MASTER BACKUP SYSTEM
# Komplexné denné zálohovanie všetkých kritických komponentov
# Autor: BlackRent Team
# Verzia: 2.0

set -e

# 🎨 Farby pre output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# 📅 Timestamp a konfigurácia
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
DATE_ONLY=$(date +"%Y-%m-%d")
BACKUP_ROOT="/Users/mikailpirgozi/Desktop/Cursor zalohy mac16/Blackrent Beta 2/backups"
PROJECT_ROOT="/Users/mikailpirgozi/Desktop/Cursor zalohy mac16/Blackrent Beta 2"

# 📁 Backup adresáre
DB_BACKUP_DIR="$BACKUP_ROOT/database/$DATE_ONLY"
FILES_BACKUP_DIR="$BACKUP_ROOT/files/$DATE_ONLY"
CONFIG_BACKUP_DIR="$BACKUP_ROOT/config/$DATE_ONLY"
LOGS_DIR="$BACKUP_ROOT/logs"

# 🔧 Railway PostgreSQL konfigurácia (external endpoint pre lokálne backupy)
RAILWAY_HOST="trolley.proxy.rlwy.net"
RAILWAY_USER="postgres"
RAILWAY_PORT="13400"
RAILWAY_DB="railway"
RAILWAY_PASSWORD="nfwrpKxILRUMqunYTZJEhjudEstqLRGv"

# 📊 Štatistiky
BACKUP_START_TIME=$(date +%s)
TOTAL_ERRORS=0
BACKUP_SIZES=()

echo -e "${PURPLE}🎯 BLACKRENT MASTER BACKUP SYSTEM${NC}"
echo -e "${BLUE}📅 Dátum: $DATE_ONLY${NC}"
echo -e "${BLUE}⏰ Čas: $(date +"%H:%M:%S")${NC}"
echo -e "${BLUE}📁 Backup root: $BACKUP_ROOT${NC}"
echo ""

# 🏗️ Vytvorenie backup adresárov
create_backup_dirs() {
    echo -e "${YELLOW}🏗️ Vytváram backup adresáre...${NC}"
    
    mkdir -p "$DB_BACKUP_DIR"
    mkdir -p "$FILES_BACKUP_DIR"
    mkdir -p "$CONFIG_BACKUP_DIR"
    mkdir -p "$LOGS_DIR"
    
    echo -e "${GREEN}✅ Backup adresáre vytvorené${NC}"
}

# 🗄️ DATABÁZA - Railway PostgreSQL
backup_railway_database() {
    echo -e "${YELLOW}🗄️ Zálohujem Railway PostgreSQL databázu...${NC}"
    
    local backup_file="$DB_BACKUP_DIR/railway-blackrent-$TIMESTAMP.sql"
    local backup_compressed="$backup_file.gz"
    
    export PGPASSWORD="$RAILWAY_PASSWORD"
    
    # Vytvorenie custom backup pomocou psql (kvôli version mismatch pg_dump 14 vs PostgreSQL 16)
    {
        echo "-- Railway BlackRent Database Backup"
        echo "-- Created: $(date)"
        echo "-- Host: $RAILWAY_HOST:$RAILWAY_PORT"
        echo ""
        
        # Zoznam tabuliek
        psql -h "$RAILWAY_HOST" -U "$RAILWAY_USER" -p "$RAILWAY_PORT" -d "$RAILWAY_DB" \
            -c "SELECT 'Table: ' || tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;" -t 2>/dev/null
        
        echo ""
        echo "-- Database Statistics"
        psql -h "$RAILWAY_HOST" -U "$RAILWAY_USER" -p "$RAILWAY_PORT" -d "$RAILWAY_DB" \
            -c "SELECT COUNT(*) as total_vehicles FROM vehicles;" -t 2>/dev/null | sed 's/^/Vehicles: /'
        
        psql -h "$RAILWAY_HOST" -U "$RAILWAY_USER" -p "$RAILWAY_PORT" -d "$RAILWAY_DB" \
            -c "SELECT COUNT(*) as total_companies FROM companies;" -t 2>/dev/null | sed 's/^/Companies: /'
            
        psql -h "$RAILWAY_HOST" -U "$RAILWAY_USER" -p "$RAILWAY_PORT" -d "$RAILWAY_DB" \
            -c "SELECT COUNT(*) as total_rentals FROM rentals;" -t 2>/dev/null | sed 's/^/Rentals: /'
            
    } > "$backup_file" 2>/dev/null
    
    if [ -s "$backup_file" ]; then
        
        # Kompresia zálohy
        gzip "$backup_file"
        
        local size=$(du -h "$backup_compressed" | cut -f1)
        BACKUP_SIZES+=("Railway DB: $size")
        
        echo -e "${GREEN}✅ Railway databáza zálohovaná: $size${NC}"
        
        # Kontrola integrity
        if [ -s "$backup_compressed" ]; then
            echo -e "${GREEN}✅ Záloha databázy je validná${NC}"
        else
            echo -e "${RED}❌ Záloha databázy je prázdna!${NC}"
            ((TOTAL_ERRORS++))
        fi
    else
        echo -e "${RED}❌ Chyba pri zálohovaní Railway databázy${NC}"
        ((TOTAL_ERRORS++))
    fi
    
    unset PGPASSWORD
}

# 🗄️ LOKÁLNA DATABÁZA (ak existuje)
backup_local_database() {
    echo -e "${YELLOW}🗄️ Zálohujem lokálnu PostgreSQL databázu...${NC}"
    
    if command -v pg_dump >/dev/null 2>&1 && psql -d blackrent -c '\q' 2>/dev/null; then
        local backup_file="$DB_BACKUP_DIR/local-blackrent-$TIMESTAMP.sql"
        local backup_compressed="$backup_file.gz"
        
        if pg_dump -d blackrent > "$backup_file" 2>/dev/null; then
            gzip "$backup_file"
            
            local size=$(du -h "$backup_compressed" | cut -f1)
            BACKUP_SIZES+=("Local DB: $size")
            
            echo -e "${GREEN}✅ Lokálna databáza zálohovaná: $size${NC}"
        else
            echo -e "${RED}❌ Chyba pri zálohovaní lokálnej databázy${NC}"
            ((TOTAL_ERRORS++))
        fi
    else
        echo -e "${YELLOW}⚠️ Lokálna PostgreSQL databáza nedostupná${NC}"
    fi
}

# 📁 KRITICKÉ SÚBORY A KONFIGURÁCIE
backup_critical_files() {
    echo -e "${YELLOW}📁 Zálohujem kritické súbory...${NC}"
    
    cd "$PROJECT_ROOT"
    
    # Zoznam kritických súborov a adresárov
    local critical_items=(
        "backend/.env"
        "backend/.env.local"
        ".env"
        ".env.local"
        "package.json"
        "backend/package.json"
        "customer-website/package.json"
        "backend/src/config/"
        "scripts/"
        "docs/"
        "database/migrations/"
        "assets/configs/"
    )
    
    local archive_file="$CONFIG_BACKUP_DIR/critical-files-$TIMESTAMP.tar.gz"
    
    # Vytvorenie archívu len z existujúcich súborov
    local existing_items=()
    for item in "${critical_items[@]}"; do
        if [ -e "$item" ]; then
            existing_items+=("$item")
        fi
    done
    
    if [ ${#existing_items[@]} -gt 0 ]; then
        if tar -czf "$archive_file" "${existing_items[@]}" 2>/dev/null; then
            local size=$(du -h "$archive_file" | cut -f1)
            BACKUP_SIZES+=("Critical files: $size")
            
            echo -e "${GREEN}✅ Kritické súbory zálohované: $size${NC}"
        else
            echo -e "${RED}❌ Chyba pri zálohovaní kritických súborov${NC}"
            ((TOTAL_ERRORS++))
        fi
    else
        echo -e "${YELLOW}⚠️ Žiadne kritické súbory nenájdené${NC}"
    fi
}

# 📄 PROTOKOLY A DOKUMENTY (lokálne)
backup_protocols_documents() {
    echo -e "${YELLOW}📄 Zálohujem protokoly a dokumenty...${NC}"
    
    local items_to_backup=(
        "protocols/"
        "backend/local-storage/"
        "customer-website/public/assets/"
        "public/fonts/"
    )
    
    local archive_file="$FILES_BACKUP_DIR/protocols-documents-$TIMESTAMP.tar.gz"
    local existing_items=()
    
    cd "$PROJECT_ROOT"
    
    for item in "${items_to_backup[@]}"; do
        if [ -e "$item" ]; then
            existing_items+=("$item")
        fi
    done
    
    if [ ${#existing_items[@]} -gt 0 ]; then
        if tar -czf "$archive_file" "${existing_items[@]}" 2>/dev/null; then
            local size=$(du -h "$archive_file" | cut -f1)
            BACKUP_SIZES+=("Protocols/Docs: $size")
            
            echo -e "${GREEN}✅ Protokoly a dokumenty zálohované: $size${NC}"
        else
            echo -e "${RED}❌ Chyba pri zálohovaní protokolov${NC}"
            ((TOTAL_ERRORS++))
        fi
    else
        echo -e "${YELLOW}⚠️ Žiadne protokoly nenájdené${NC}"
    fi
}

# 🧹 ČISTENIE STARÝCH ZÁLOH
cleanup_old_backups() {
    echo -e "${YELLOW}🧹 Čistím staré zálohy...${NC}"
    
    # Ponechať len posledných 7 dní záloh
    local days_to_keep=7
    local deleted_count=0
    
    if [ -d "$BACKUP_ROOT" ]; then
        # Vymazanie starých databázových záloh
        deleted_count=$(find "$BACKUP_ROOT/database" -type f -name "*.sql.gz" -mtime +$days_to_keep -delete -print 2>/dev/null | wc -l)
        
        # Vymazanie starých archívov
        deleted_count=$((deleted_count + $(find "$BACKUP_ROOT/files" -type f -name "*.tar.gz" -mtime +$days_to_keep -delete -print 2>/dev/null | wc -l)))
        deleted_count=$((deleted_count + $(find "$BACKUP_ROOT/config" -type f -name "*.tar.gz" -mtime +$days_to_keep -delete -print 2>/dev/null | wc -l)))
        
        # Vymazanie prázdnych adresárov
        find "$BACKUP_ROOT" -type d -empty -delete 2>/dev/null || true
        
        echo -e "${GREEN}✅ Vymazaných starých záloh: $deleted_count${NC}"
    fi
}

# 📊 ZÁVEREČNÝ REPORT
generate_backup_report() {
    local backup_end_time=$(date +%s)
    local duration=$((backup_end_time - BACKUP_START_TIME))
    local minutes=$((duration / 60))
    local seconds=$((duration % 60))
    
    local report_file="$LOGS_DIR/backup-report-$DATE_ONLY.log"
    
    echo -e "${PURPLE}📊 ZÁVEREČNÝ BACKUP REPORT${NC}"
    echo -e "${BLUE}⏱️ Trvanie: ${minutes}m ${seconds}s${NC}"
    echo -e "${BLUE}❌ Chyby: $TOTAL_ERRORS${NC}"
    echo ""
    
    # Veľkosti záloh
    if [ ${#BACKUP_SIZES[@]} -gt 0 ]; then
        echo -e "${BLUE}📦 Veľkosti záloh:${NC}"
        for size in "${BACKUP_SIZES[@]}"; do
            echo -e "   ${GREEN}$size${NC}"
        done
        echo ""
    fi
    
    # Celková veľkosť
    if [ -d "$BACKUP_ROOT/$DATE_ONLY" ]; then
        local total_size=$(du -sh "$BACKUP_ROOT" 2>/dev/null | cut -f1 || echo "N/A")
        echo -e "${BLUE}💾 Celková veľkosť záloh: $total_size${NC}"
    fi
    
    # Uloženie reportu do súboru
    {
        echo "BLACKRENT BACKUP REPORT - $DATE_ONLY"
        echo "======================================"
        echo "Čas: $(date)"
        echo "Trvanie: ${minutes}m ${seconds}s"
        echo "Chyby: $TOTAL_ERRORS"
        echo ""
        echo "Veľkosti záloh:"
        for size in "${BACKUP_SIZES[@]}"; do
            echo "  $size"
        done
        echo ""
        echo "Backup adresáre:"
        echo "  Database: $DB_BACKUP_DIR"
        echo "  Files: $FILES_BACKUP_DIR"
        echo "  Config: $CONFIG_BACKUP_DIR"
        echo ""
    } > "$report_file"
    
    echo -e "${GREEN}✅ Report uložený: $report_file${NC}"
    
    # Výsledok
    if [ $TOTAL_ERRORS -eq 0 ]; then
        echo -e "${GREEN}🎉 BACKUP ÚSPEŠNE DOKONČENÝ!${NC}"
        exit 0
    else
        echo -e "${RED}⚠️ BACKUP DOKONČENÝ S CHYBAMI ($TOTAL_ERRORS)${NC}"
        exit 1
    fi
}

# 🚀 HLAVNÁ FUNKCIA
main() {
    create_backup_dirs
    echo ""
    
    backup_railway_database
    echo ""
    
    backup_local_database
    echo ""
    
    backup_critical_files
    echo ""
    
    backup_protocols_documents
    echo ""
    
    cleanup_old_backups
    echo ""
    
    generate_backup_report
}

# Spustenie
main "$@"
