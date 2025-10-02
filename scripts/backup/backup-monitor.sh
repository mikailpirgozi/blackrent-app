#!/bin/bash

# 📊 BLACKRENT BACKUP MONITORING SYSTEM
# Monitoring a kontrola stavu záloh
# Autor: BlackRent Team

set -e

# 🎨 Farby
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

PROJECT_ROOT="/Users/mikailpirgozi/Desktop/Cursor zalohy mac16/Blackrent Beta 2"
BACKUP_ROOT="$PROJECT_ROOT/backups"
LOGS_DIR="$BACKUP_ROOT/logs"

echo -e "${PURPLE}📊 BLACKRENT BACKUP MONITORING${NC}"
echo -e "${BLUE}📁 Backup root: $BACKUP_ROOT${NC}"
echo ""

# 📈 Kontrola stavu záloh
check_backup_status() {
    echo -e "${YELLOW}📈 Kontrolujem stav záloh...${NC}"
    
    local today=$(date +"%Y-%m-%d")
    local yesterday=$(date -d "yesterday" +"%Y-%m-%d" 2>/dev/null || date -v-1d +"%Y-%m-%d")
    
    # Kontrola dnešných záloh
    echo -e "${BLUE}🗓️ Dnešné zálohy ($today):${NC}"
    
    local backup_dirs=(
        "$BACKUP_ROOT/database/$today"
        "$BACKUP_ROOT/files/$today"
        "$BACKUP_ROOT/config/$today"
        "$BACKUP_ROOT/r2-storage/$today"
    )
    
    local today_backups_exist=false
    
    for dir in "${backup_dirs[@]}"; do
        local dir_name=$(basename "$(dirname "$dir")")
        
        if [ -d "$dir" ] && [ "$(ls -A "$dir" 2>/dev/null)" ]; then
            local file_count=$(find "$dir" -type f | wc -l)
            local dir_size=$(du -sh "$dir" 2>/dev/null | cut -f1)
            echo -e "   ${GREEN}✅ $dir_name: $file_count súborov ($dir_size)${NC}"
            today_backups_exist=true
        else
            echo -e "   ${RED}❌ $dir_name: Žiadne zálohy${NC}"
        fi
    done
    
    if [ "$today_backups_exist" = false ]; then
        echo -e "${YELLOW}⚠️ Žiadne dnešné zálohy nenájdené${NC}"
        
        # Kontrola včerajších záloh
        echo -e "${BLUE}🗓️ Včerajšie zálohy ($yesterday):${NC}"
        
        local yesterday_dirs=(
            "$BACKUP_ROOT/database/$yesterday"
            "$BACKUP_ROOT/files/$yesterday"
            "$BACKUP_ROOT/config/$yesterday"
            "$BACKUP_ROOT/r2-storage/$yesterday"
        )
        
        for dir in "${yesterday_dirs[@]}"; do
            local dir_name=$(basename "$(dirname "$dir")")
            
            if [ -d "$dir" ] && [ "$(ls -A "$dir" 2>/dev/null)" ]; then
                local file_count=$(find "$dir" -type f | wc -l)
                local dir_size=$(du -sh "$dir" 2>/dev/null | cut -f1)
                echo -e "   ${GREEN}✅ $dir_name: $file_count súborov ($dir_size)${NC}"
            else
                echo -e "   ${RED}❌ $dir_name: Žiadne zálohy${NC}"
            fi
        done
    fi
}

# 📝 Analýza log súborov
analyze_backup_logs() {
    echo -e "${YELLOW}📝 Analyzujem backup logy...${NC}"
    
    if [ ! -d "$LOGS_DIR" ]; then
        echo -e "${RED}❌ Log adresár neexistuje: $LOGS_DIR${NC}"
        return 1
    fi
    
    # Najnovší log súbor
    local latest_log=$(find "$LOGS_DIR" -name "*.log" -type f -exec ls -t {} + | head -1)
    
    if [ -n "$latest_log" ]; then
        echo -e "${BLUE}📄 Najnovší log: $(basename "$latest_log")${NC}"
        
        # Kontrola chýb v logu
        local error_count=$(grep -c "❌\|ERROR\|FAILED" "$latest_log" 2>/dev/null || echo "0")
        local success_count=$(grep -c "✅\|SUCCESS\|COMPLETED" "$latest_log" 2>/dev/null || echo "0")
        
        echo -e "${BLUE}📊 Log štatistiky:${NC}"
        echo -e "   ${GREEN}✅ Úspešné operácie: $success_count${NC}"
        echo -e "   ${RED}❌ Chyby: $error_count${NC}"
        
        if [ "$error_count" -gt 0 ]; then
            echo -e "${RED}⚠️ Posledné chyby:${NC}"
            grep "❌\|ERROR\|FAILED" "$latest_log" | tail -3 | while read line; do
                echo -e "   ${RED}$line${NC}"
            done
        fi
        
        # Posledné úspešné zálohy
        echo -e "${BLUE}🕐 Posledné úspešné operácie:${NC}"
        grep "✅.*backup\|✅.*záloha" "$latest_log" | tail -3 | while read line; do
            echo -e "   ${GREEN}$line${NC}"
        done
        
    else
        echo -e "${YELLOW}⚠️ Žiadne log súbory nenájdené${NC}"
    fi
}

# 💾 Kontrola veľkosti záloh
check_backup_sizes() {
    echo -e "${YELLOW}💾 Kontrolujem veľkosti záloh...${NC}"
    
    if [ ! -d "$BACKUP_ROOT" ]; then
        echo -e "${RED}❌ Backup adresár neexistuje${NC}"
        return 1
    fi
    
    # Celková veľkosť všetkých záloh
    local total_size=$(du -sh "$BACKUP_ROOT" 2>/dev/null | cut -f1)
    echo -e "${BLUE}💾 Celková veľkosť záloh: $total_size${NC}"
    
    # Veľkosti podľa kategórií
    local categories=("database" "files" "config" "r2-storage" "logs")
    
    for category in "${categories[@]}"; do
        local category_dir="$BACKUP_ROOT/$category"
        
        if [ -d "$category_dir" ]; then
            local category_size=$(du -sh "$category_dir" 2>/dev/null | cut -f1)
            local file_count=$(find "$category_dir" -type f | wc -l)
            echo -e "   ${BLUE}📁 $category: $category_size ($file_count súborov)${NC}"
        fi
    done
    
    # Najväčšie súbory
    echo -e "${BLUE}📊 Najväčšie backup súbory:${NC}"
    find "$BACKUP_ROOT" -type f -exec du -h {} + 2>/dev/null | sort -hr | head -5 | while read size file; do
        local filename=$(basename "$file")
        echo -e "   ${YELLOW}$size - $filename${NC}"
    done
}

# ⏰ Kontrola cron job
check_cron_status() {
    echo -e "${YELLOW}⏰ Kontrolujem cron job...${NC}"
    
    local cron_jobs=$(crontab -l 2>/dev/null | grep -c "backup" || echo "0")
    
    if [ "$cron_jobs" -gt 0 ]; then
        echo -e "${GREEN}✅ Cron job pre zálohy je aktívny${NC}"
        echo -e "${BLUE}📋 Aktívne backup cron jobs:${NC}"
        crontab -l 2>/dev/null | grep "backup" | while read line; do
            echo -e "   ${BLUE}$line${NC}"
        done
    else
        echo -e "${RED}❌ Žiadny cron job pre zálohy nenájdený${NC}"
        echo -e "${YELLOW}💡 Spustite: ./scripts/backup/setup-automated-backups.sh${NC}"
    fi
}

# 🔍 Kontrola integrity záloh
check_backup_integrity() {
    echo -e "${YELLOW}🔍 Kontrolujem integritu záloh...${NC}"
    
    local today=$(date +"%Y-%m-%d")
    local corrupted_files=0
    local total_files=0
    
    # Kontrola SQL záloh
    if [ -d "$BACKUP_ROOT/database/$today" ]; then
        find "$BACKUP_ROOT/database/$today" -name "*.sql.gz" -type f | while read backup_file; do
            total_files=$((total_files + 1))
            
            if gzip -t "$backup_file" 2>/dev/null; then
                echo -e "   ${GREEN}✅ $(basename "$backup_file")${NC}"
            else
                echo -e "   ${RED}❌ $(basename "$backup_file") - POŠKODENÝ${NC}"
                corrupted_files=$((corrupted_files + 1))
            fi
        done
    fi
    
    # Kontrola tar.gz archívov
    find "$BACKUP_ROOT" -name "*.tar.gz" -type f -mtime -1 | while read archive_file; do
        total_files=$((total_files + 1))
        
        if tar -tzf "$archive_file" >/dev/null 2>&1; then
            echo -e "   ${GREEN}✅ $(basename "$archive_file")${NC}"
        else
            echo -e "   ${RED}❌ $(basename "$archive_file") - POŠKODENÝ${NC}"
            corrupted_files=$((corrupted_files + 1))
        fi
    done
    
    if [ "$total_files" -eq 0 ]; then
        echo -e "${YELLOW}⚠️ Žiadne zálohy na kontrolu${NC}"
    elif [ "$corrupted_files" -eq 0 ]; then
        echo -e "${GREEN}✅ Všetky zálohy sú v poriadku${NC}"
    else
        echo -e "${RED}❌ Nájdených $corrupted_files poškodených záloh z $total_files${NC}"
    fi
}

# 📊 Generovanie reportu
generate_monitoring_report() {
    echo -e "${YELLOW}📊 Generujem monitoring report...${NC}"
    
    local report_file="$LOGS_DIR/backup-monitoring-$(date +%Y-%m-%d_%H-%M-%S).txt"
    
    {
        echo "BLACKRENT BACKUP MONITORING REPORT"
        echo "=================================="
        echo "Dátum: $(date)"
        echo "Generované: $(date '+%Y-%m-%d %H:%M:%S')"
        echo ""
        
        echo "STAV ZÁLOH:"
        echo "==========="
        
        # Dnešné zálohy
        local today=$(date +"%Y-%m-%d")
        echo "Dnešné zálohy ($today):"
        
        local backup_dirs=(
            "$BACKUP_ROOT/database/$today"
            "$BACKUP_ROOT/files/$today"
            "$BACKUP_ROOT/config/$today"
            "$BACKUP_ROOT/r2-storage/$today"
        )
        
        for dir in "${backup_dirs[@]}"; do
            local dir_name=$(basename "$(dirname "$dir")")
            
            if [ -d "$dir" ] && [ "$(ls -A "$dir" 2>/dev/null)" ]; then
                local file_count=$(find "$dir" -type f | wc -l)
                local dir_size=$(du -sh "$dir" 2>/dev/null | cut -f1)
                echo "  ✅ $dir_name: $file_count súborov ($dir_size)"
            else
                echo "  ❌ $dir_name: Žiadne zálohy"
            fi
        done
        
        echo ""
        echo "VEĽKOSTI ZÁLOH:"
        echo "==============="
        local total_size=$(du -sh "$BACKUP_ROOT" 2>/dev/null | cut -f1)
        echo "Celková veľkosť: $total_size"
        
        echo ""
        echo "CRON STATUS:"
        echo "============"
        local cron_jobs=$(crontab -l 2>/dev/null | grep -c "backup" || echo "0")
        if [ "$cron_jobs" -gt 0 ]; then
            echo "✅ Cron job aktívny ($cron_jobs jobs)"
        else
            echo "❌ Žiadny cron job"
        fi
        
        echo ""
        echo "POSLEDNÉ LOGY:"
        echo "=============="
        local latest_log=$(find "$LOGS_DIR" -name "*.log" -type f -exec ls -t {} + | head -1)
        if [ -n "$latest_log" ]; then
            echo "Najnovší log: $(basename "$latest_log")"
            local error_count=$(grep -c "❌\|ERROR\|FAILED" "$latest_log" 2>/dev/null || echo "0")
            echo "Chyby v logu: $error_count"
        else
            echo "Žiadne logy"
        fi
        
    } > "$report_file"
    
    echo -e "${GREEN}✅ Report uložený: $report_file${NC}"
}

# 🚀 Hlavná funkcia
main() {
    case "$1" in
        "status")
            check_backup_status
            ;;
        "logs")
            analyze_backup_logs
            ;;
        "sizes")
            check_backup_sizes
            ;;
        "cron")
            check_cron_status
            ;;
        "integrity")
            check_backup_integrity
            ;;
        "report")
            generate_monitoring_report
            ;;
        *)
            # Kompletný monitoring
            check_backup_status
            echo ""
            
            analyze_backup_logs
            echo ""
            
            check_backup_sizes
            echo ""
            
            check_cron_status
            echo ""
            
            check_backup_integrity
            echo ""
            
            generate_monitoring_report
            
            echo ""
            echo -e "${PURPLE}📊 MONITORING DOKONČENÝ${NC}"
            echo -e "${BLUE}💡 Použitie: $0 {status|logs|sizes|cron|integrity|report}${NC}"
            ;;
    esac
}

# Spustenie
main "$@"
