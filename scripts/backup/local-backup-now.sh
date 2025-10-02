#!/bin/bash

# 💻 BLACKRENT LOCAL BACKUP SCRIPT
# Vytvorenie lokálnej zálohy priamo na PC pre istotu
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
DATE_ONLY=$(date +"%Y-%m-%d")
PROJECT_ROOT="/Users/mikailpirgozi/Desktop/Cursor zalohy mac16/Blackrent Beta 2"
LOCAL_BACKUP_ROOT="$PROJECT_ROOT/local-backups"
TODAY_BACKUP_DIR="$LOCAL_BACKUP_ROOT/$DATE_ONLY"

# 🔧 Railway PostgreSQL konfigurácia
RAILWAY_HOST="trolley.proxy.rlwy.net"
RAILWAY_USER="postgres"
RAILWAY_PORT="13400"
RAILWAY_DB="railway"
RAILWAY_PASSWORD="nfwrpKxILRUMqunYTZJEhjudEstqLRGv"

echo -e "${PURPLE}💻 BLACKRENT LOCAL BACKUP${NC}"
echo -e "${BLUE}📅 Dátum: $DATE_ONLY${NC}"
echo -e "${BLUE}⏰ Čas: $(date +"%H:%M:%S")${NC}"
echo -e "${BLUE}📁 Backup adresár: $TODAY_BACKUP_DIR${NC}"
echo ""

# 🏗️ Vytvorenie backup adresárov
create_backup_dirs() {
    echo -e "${YELLOW}🏗️ Vytváram lokálne backup adresáre...${NC}"
    
    mkdir -p "$TODAY_BACKUP_DIR/database"
    mkdir -p "$TODAY_BACKUP_DIR/files"
    mkdir -p "$TODAY_BACKUP_DIR/config"
    mkdir -p "$LOCAL_BACKUP_ROOT/logs"
    
    echo -e "${GREEN}✅ Lokálne backup adresáre vytvorené${NC}"
}

# 🗄️ DATABÁZA - Railway PostgreSQL
backup_railway_database() {
    echo -e "${YELLOW}🗄️ Zálohujem Railway PostgreSQL databázu lokálne...${NC}"
    
    local backup_file="$TODAY_BACKUP_DIR/database/railway-blackrent-$TIMESTAMP.sql"
    local backup_compressed="$backup_file.gz"
    
    export PGPASSWORD="$RAILWAY_PASSWORD"
    
    echo -e "${BLUE}🔄 Pripájam sa k Railway databáze...${NC}"
    
    if pg_dump -h "$RAILWAY_HOST" -U "$RAILWAY_USER" -p "$RAILWAY_PORT" -d "$RAILWAY_DB" \
        --no-owner --no-privileges > "$backup_file" 2>/dev/null; then
        
        echo -e "${GREEN}✅ Databáza úspešne exportovaná${NC}"
        
        # Kompresia zálohy
        echo -e "${BLUE}📦 Komprimujem zálohu...${NC}"
        gzip "$backup_file"
        
        local size=$(du -h "$backup_compressed" | cut -f1)
        
        echo -e "${GREEN}✅ Railway databáza zálohovaná lokálne: $size${NC}"
        echo -e "${BLUE}📁 Umiestnenie: $backup_compressed${NC}"
        
        # Kontrola integrity
        if [ -s "$backup_compressed" ]; then
            echo -e "${GREEN}✅ Záloha databázy je validná${NC}"
        else
            echo -e "${RED}❌ Záloha databázy je prázdna!${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ Chyba pri zálohovaní Railway databázy${NC}"
        return 1
    fi
    
    unset PGPASSWORD
}

# 📁 KRITICKÉ SÚBORY A KONFIGURÁCIE
backup_critical_files() {
    echo -e "${YELLOW}📁 Zálohujem kritické súbory lokálne...${NC}"
    
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
        "src/components/"
        "src/services/"
        "src/utils/"
    )
    
    local archive_file="$TODAY_BACKUP_DIR/config/critical-files-$TIMESTAMP.tar.gz"
    
    # Vytvorenie archívu len z existujúcich súborov
    local existing_items=()
    for item in "${critical_items[@]}"; do
        if [ -e "$item" ]; then
            existing_items+=("$item")
        fi
    done
    
    if [ ${#existing_items[@]} -gt 0 ]; then
        echo -e "${BLUE}📦 Vytváram archív kritických súborov...${NC}"
        
        if tar -czf "$archive_file" "${existing_items[@]}" 2>/dev/null; then
            local size=$(du -h "$archive_file" | cut -f1)
            
            echo -e "${GREEN}✅ Kritické súbory zálohované lokálne: $size${NC}"
            echo -e "${BLUE}📁 Umiestnenie: $archive_file${NC}"
        else
            echo -e "${RED}❌ Chyba pri zálohovaní kritických súborov${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠️ Žiadne kritické súbory nenájdené${NC}"
    fi
}

# 📄 PROTOKOLY A DOKUMENTY (lokálne)
backup_protocols_documents() {
    echo -e "${YELLOW}📄 Zálohujem protokoly a dokumenty lokálne...${NC}"
    
    local items_to_backup=(
        "protocols/"
        "backend/local-storage/"
        "customer-website/public/assets/"
        "public/fonts/"
        "backend/postgres-backups/"
    )
    
    local archive_file="$TODAY_BACKUP_DIR/files/protocols-documents-$TIMESTAMP.tar.gz"
    local existing_items=()
    
    cd "$PROJECT_ROOT"
    
    for item in "${items_to_backup[@]}"; do
        if [ -e "$item" ]; then
            existing_items+=("$item")
        fi
    done
    
    if [ ${#existing_items[@]} -gt 0 ]; then
        echo -e "${BLUE}📦 Vytváram archív protokolov a dokumentov...${NC}"
        
        if tar -czf "$archive_file" "${existing_items[@]}" 2>/dev/null; then
            local size=$(du -h "$archive_file" | cut -f1)
            
            echo -e "${GREEN}✅ Protokoly a dokumenty zálohované lokálne: $size${NC}"
            echo -e "${BLUE}📁 Umiestnenie: $archive_file${NC}"
        else
            echo -e "${RED}❌ Chyba pri zálohovaní protokolov${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠️ Žiadne protokoly nenájdené${NC}"
    fi
}

# 📊 Štatistiky databázy
show_database_stats() {
    echo -e "${YELLOW}📊 Získavam štatistiky databázy...${NC}"
    
    export PGPASSWORD="$RAILWAY_PASSWORD"
    
    local stats_file="$TODAY_BACKUP_DIR/database/database-stats-$TIMESTAMP.txt"
    
    {
        echo "BLACKRENT DATABASE STATISTICS - $DATE_ONLY"
        echo "=========================================="
        echo "Timestamp: $(date)"
        echo "Database: $RAILWAY_DB"
        echo "Host: $RAILWAY_HOST"
        echo ""
        
        echo "TABLE COUNTS:"
        echo "============="
        
        # Získanie počtu záznamov z hlavných tabuliek
        psql -h "$RAILWAY_HOST" -U "$RAILWAY_USER" -p "$RAILWAY_PORT" -d "$RAILWAY_DB" \
            -c "SELECT 'Prenájmy' as tabulka, COUNT(*) as pocet FROM rentals 
                UNION ALL SELECT 'Vozidlá', COUNT(*) FROM vehicles 
                UNION ALL SELECT 'Zákazníci', COUNT(*) FROM customers 
                UNION ALL SELECT 'Firmy', COUNT(*) FROM companies 
                UNION ALL SELECT 'Protokoly', COUNT(*) FROM protocols 
                UNION ALL SELECT 'Náklady', COUNT(*) FROM expenses;" \
            -t 2>/dev/null || echo "Chyba pri získavaní štatistík"
        
        echo ""
        echo "DATABASE SIZE:"
        echo "=============="
        psql -h "$RAILWAY_HOST" -U "$RAILWAY_USER" -p "$RAILWAY_PORT" -d "$RAILWAY_DB" \
            -c "SELECT pg_size_pretty(pg_database_size('$RAILWAY_DB'));" \
            -t 2>/dev/null || echo "Nedostupné"
        
    } > "$stats_file"
    
    unset PGPASSWORD
    
    echo -e "${GREEN}✅ Štatistiky databázy uložené${NC}"
    echo -e "${BLUE}📁 Umiestnenie: $stats_file${NC}"
    
    # Zobrazenie štatistík
    echo ""
    echo -e "${BLUE}📊 AKTUÁLNE ŠTATISTIKY:${NC}"
    cat "$stats_file" | grep -A 20 "TABLE COUNTS:"
}

# 🧹 ČISTENIE STARÝCH LOKÁLNYCH ZÁLOH
cleanup_old_local_backups() {
    echo -e "${YELLOW}🧹 Čistím staré lokálne zálohy...${NC}"
    
    # Ponechať len posledných 14 dní záloh (dvojnásobne ako cloud)
    local days_to_keep=14
    local deleted_count=0
    
    if [ -d "$LOCAL_BACKUP_ROOT" ]; then
        # Vymazanie starých databázových záloh
        deleted_count=$(find "$LOCAL_BACKUP_ROOT" -type f -name "*.sql.gz" -mtime +$days_to_keep -delete -print 2>/dev/null | wc -l)
        
        # Vymazanie starých archívov
        deleted_count=$((deleted_count + $(find "$LOCAL_BACKUP_ROOT" -type f -name "*.tar.gz" -mtime +$days_to_keep -delete -print 2>/dev/null | wc -l)))
        
        # Vymazanie prázdnych adresárov
        find "$LOCAL_BACKUP_ROOT" -type d -empty -delete 2>/dev/null || true
        
        echo -e "${GREEN}✅ Vymazaných starých lokálnych záloh: $deleted_count${NC}"
    fi
}

# 📋 ZÁVEREČNÝ REPORT
generate_local_backup_report() {
    local backup_end_time=$(date +%s)
    local report_file="$LOCAL_BACKUP_ROOT/logs/local-backup-report-$DATE_ONLY.log"
    
    echo -e "${PURPLE}📋 ZÁVEREČNÝ LOKÁLNY BACKUP REPORT${NC}"
    echo ""
    
    # Celková veľkosť dnešných záloh
    if [ -d "$TODAY_BACKUP_DIR" ]; then
        local total_size=$(du -sh "$TODAY_BACKUP_DIR" 2>/dev/null | cut -f1 || echo "N/A")
        echo -e "${BLUE}💾 Celková veľkosť dnešných záloh: $total_size${NC}"
    fi
    
    # Zoznam vytvorených súborov
    echo -e "${BLUE}📁 Vytvorené zálohy:${NC}"
    if [ -d "$TODAY_BACKUP_DIR" ]; then
        find "$TODAY_BACKUP_DIR" -type f -exec ls -lh {} \; | while read line; do
            echo -e "   ${GREEN}$(echo "$line" | awk '{print $9 " (" $5 ")"}')"${NC}
        done
    fi
    
    # Uloženie reportu do súboru
    {
        echo "BLACKRENT LOCAL BACKUP REPORT - $DATE_ONLY"
        echo "=========================================="
        echo "Čas: $(date)"
        echo ""
        echo "Backup adresár: $TODAY_BACKUP_DIR"
        echo "Celková veľkosť: $(du -sh "$TODAY_BACKUP_DIR" 2>/dev/null | cut -f1 || echo "N/A")"
        echo ""
        echo "Vytvorené súbory:"
        find "$TODAY_BACKUP_DIR" -type f -exec ls -lh {} \; 2>/dev/null || echo "Žiadne súbory"
        echo ""
    } > "$report_file"
    
    echo -e "${GREEN}✅ Report uložený: $report_file${NC}"
    echo ""
    echo -e "${GREEN}🎉 LOKÁLNY BACKUP ÚSPEŠNE DOKONČENÝ!${NC}"
    echo -e "${BLUE}📁 Všetky zálohy sú uložené v: $TODAY_BACKUP_DIR${NC}"
}

# 🚀 HLAVNÁ FUNKCIA
main() {
    create_backup_dirs
    echo ""
    
    backup_railway_database
    echo ""
    
    backup_critical_files
    echo ""
    
    backup_protocols_documents
    echo ""
    
    show_database_stats
    echo ""
    
    cleanup_old_local_backups
    echo ""
    
    generate_local_backup_report
}

# Spustenie
main "$@"
