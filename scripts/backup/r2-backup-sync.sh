#!/bin/bash

# 🌐 BLACKRENT R2 STORAGE BACKUP SYNC
# Synchronizácia a zálohovanie R2 Storage súborov
# Autor: BlackRent Team

set -e

# 🎨 Farby
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 📅 Konfigurácia
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
DATE_ONLY=$(date +"%Y-%m-%d")
BACKUP_ROOT="/Users/mikailpirgozi/Desktop/Cursor zalohy mac16/Blackrent Beta 2/backups"
R2_BACKUP_DIR="$BACKUP_ROOT/r2-storage/$DATE_ONLY"

# 🔧 R2 konfigurácia (z environment variables)
R2_ENDPOINT="https://9ccdca0d876e24bd9acefabe56f94f53.r2.cloudflarestorage.com"
R2_BUCKET_NAME="blackrent-storage"
R2_ACCESS_KEY_ID="101b1b96332f7216f917c269f2ae1fc8"
R2_SECRET_ACCESS_KEY="5d03a6a396171324658c402b8758f5bae2364fe0bb7e5cc91d6ea8661c34cc69"
R2_PUBLIC_URL="https://pub-4fec120a8a6a4a0cbadfa55f54b7e8a2.r2.dev"

echo -e "${BLUE}🌐 BLACKRENT R2 STORAGE BACKUP${NC}"
echo -e "${BLUE}📅 Dátum: $DATE_ONLY${NC}"
echo -e "${BLUE}📁 Backup dir: $R2_BACKUP_DIR${NC}"
echo ""

# 🏗️ Vytvorenie backup adresára
mkdir -p "$R2_BACKUP_DIR"

# 📊 Funkcia na získanie zoznamu súborov z R2
get_r2_file_list() {
    echo -e "${YELLOW}📋 Získavam zoznam súborov z R2 Storage...${NC}"
    
    local list_file="$R2_BACKUP_DIR/r2-file-list-$TIMESTAMP.txt"
    
    # Použitie AWS CLI pre R2 (S3-compatible)
    if command -v aws >/dev/null 2>&1; then
        AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" \
        AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
        aws s3 ls "s3://$R2_BUCKET_NAME" --recursive \
            --endpoint-url="$R2_ENDPOINT" > "$list_file" 2>/dev/null || {
            echo -e "${RED}❌ Chyba pri získavaní zoznamu súborov${NC}"
            return 1
        }
        
        local file_count=$(wc -l < "$list_file")
        local total_size=$(awk '{sum += $3} END {print sum}' "$list_file" | numfmt --to=iec)
        
        echo -e "${GREEN}✅ Zoznam súborov získaný${NC}"
        echo -e "${BLUE}📁 Počet súborov: $file_count${NC}"
        echo -e "${BLUE}💾 Celková veľkosť: $total_size${NC}"
        
        return 0
    else
        echo -e "${YELLOW}⚠️ AWS CLI nie je nainštalované${NC}"
        echo -e "${YELLOW}💡 Inštalácia: brew install awscli${NC}"
        return 1
    fi
}

# 📥 Funkcia na stiahnutie kritických súborov
download_critical_files() {
    echo -e "${YELLOW}📥 Sťahujem kritické súbory z R2...${NC}"
    
    if ! command -v aws >/dev/null 2>&1; then
        echo -e "${RED}❌ AWS CLI nie je dostupné${NC}"
        return 1
    fi
    
    local download_dir="$R2_BACKUP_DIR/files"
    mkdir -p "$download_dir"
    
    # Kritické kategórie súborov na stiahnutie
    local critical_patterns=(
        "protocols/"
        "vehicles/photos/"
        "documents/"
        "signatures/"
    )
    
    local downloaded_count=0
    local total_size=0
    
    for pattern in "${critical_patterns[@]}"; do
        echo -e "${YELLOW}📂 Sťahujem: $pattern${NC}"
        
        local pattern_dir="$download_dir/$pattern"
        mkdir -p "$pattern_dir"
        
        # Stiahnutie súborov pre danú kategóriu
        AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" \
        AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
        aws s3 sync "s3://$R2_BUCKET_NAME/$pattern" "$pattern_dir" \
            --endpoint-url="$R2_ENDPOINT" \
            --quiet 2>/dev/null || {
            echo -e "${YELLOW}⚠️ Žiadne súbory pre $pattern${NC}"
            continue
        }
        
        # Počítanie stiahnutých súborov
        local pattern_count=$(find "$pattern_dir" -type f | wc -l)
        downloaded_count=$((downloaded_count + pattern_count))
        
        if [ $pattern_count -gt 0 ]; then
            echo -e "${GREEN}✅ $pattern: $pattern_count súborov${NC}"
        fi
    done
    
    if [ $downloaded_count -gt 0 ]; then
        # Vytvorenie archívu
        local archive_file="$R2_BACKUP_DIR/r2-files-$TIMESTAMP.tar.gz"
        
        cd "$download_dir"
        tar -czf "$archive_file" . 2>/dev/null
        
        local archive_size=$(du -h "$archive_file" | cut -f1)
        
        echo -e "${GREEN}✅ R2 súbory zálohované: $archive_size${NC}"
        echo -e "${BLUE}📁 Celkom súborov: $downloaded_count${NC}"
        
        # Vymazanie dočasných súborov
        rm -rf "$download_dir"
        
        return 0
    else
        echo -e "${YELLOW}⚠️ Žiadne súbory na stiahnutie${NC}"
        return 1
    fi
}

# 🔍 Funkcia na analýzu R2 Storage
analyze_r2_storage() {
    echo -e "${YELLOW}🔍 Analyzujem R2 Storage...${NC}"
    
    local analysis_file="$R2_BACKUP_DIR/r2-analysis-$TIMESTAMP.txt"
    
    {
        echo "BLACKRENT R2 STORAGE ANALYSIS - $DATE_ONLY"
        echo "=========================================="
        echo "Timestamp: $(date)"
        echo "Bucket: $R2_BUCKET_NAME"
        echo "Endpoint: $R2_ENDPOINT"
        echo ""
        
        if [ -f "$R2_BACKUP_DIR/r2-file-list-$TIMESTAMP.txt" ]; then
            echo "SÚBORY PO KATEGÓRIÁCH:"
            echo "====================="
            
            # Analýza protokolov
            local protocols_count=$(grep -c "protocols/" "$R2_BACKUP_DIR/r2-file-list-$TIMESTAMP.txt" 2>/dev/null || echo "0")
            echo "Protokoly: $protocols_count súborov"
            
            # Analýza fotiek vozidiel
            local vehicle_photos_count=$(grep -c "vehicles/photos/" "$R2_BACKUP_DIR/r2-file-list-$TIMESTAMP.txt" 2>/dev/null || echo "0")
            echo "Fotky vozidiel: $vehicle_photos_count súborov"
            
            # Analýza dokumentov
            local documents_count=$(grep -c "documents/" "$R2_BACKUP_DIR/r2-file-list-$TIMESTAMP.txt" 2>/dev/null || echo "0")
            echo "Dokumenty: $documents_count súborov"
            
            # Analýza podpisov
            local signatures_count=$(grep -c "signatures/" "$R2_BACKUP_DIR/r2-file-list-$TIMESTAMP.txt" 2>/dev/null || echo "0")
            echo "Podpisy: $signatures_count súborov"
            
            echo ""
            echo "CELKOVÁ ŠTATISTIKA:"
            echo "=================="
            local total_files=$(wc -l < "$R2_BACKUP_DIR/r2-file-list-$TIMESTAMP.txt")
            local total_size=$(awk '{sum += $3} END {print sum}' "$R2_BACKUP_DIR/r2-file-list-$TIMESTAMP.txt" | numfmt --to=iec)
            echo "Celkom súborov: $total_files"
            echo "Celková veľkosť: $total_size"
        else
            echo "CHYBA: Zoznam súborov nie je dostupný"
        fi
        
    } > "$analysis_file"
    
    echo -e "${GREEN}✅ Analýza uložená: $analysis_file${NC}"
}

# 🚀 Hlavná funkcia
main() {
    if get_r2_file_list; then
        analyze_r2_storage
        
        if download_critical_files; then
            echo -e "${GREEN}🎉 R2 backup úspešne dokončený!${NC}"
        else
            echo -e "${YELLOW}⚠️ R2 backup dokončený s obmedzeniami${NC}"
        fi
    else
        echo -e "${RED}❌ R2 backup zlyhal${NC}"
        exit 1
    fi
}

# Kontrola parametrov
case "$1" in
    "list-only")
        get_r2_file_list
        analyze_r2_storage
        ;;
    "download-only")
        download_critical_files
        ;;
    *)
        main
        ;;
esac
