#!/bin/bash

# 🤖 BLACKRENT AUTOMATED BACKUP SETUP
# Nastavenie automatických denných záloh cez cron
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
BACKUP_SCRIPTS_DIR="$PROJECT_ROOT/scripts/backup"

echo -e "${PURPLE}🤖 BLACKRENT AUTOMATED BACKUP SETUP${NC}"
echo -e "${BLUE}📁 Project root: $PROJECT_ROOT${NC}"
echo ""

# 🔍 Kontrola existencie skriptov
check_backup_scripts() {
    echo -e "${YELLOW}🔍 Kontrolujem backup skripty...${NC}"
    
    local scripts=(
        "$BACKUP_SCRIPTS_DIR/daily-backup-master.sh"
        "$BACKUP_SCRIPTS_DIR/r2-backup-sync.sh"
    )
    
    local missing_scripts=()
    
    for script in "${scripts[@]}"; do
        if [ -f "$script" ]; then
            echo -e "${GREEN}✅ $(basename "$script")${NC}"
            
            # Nastavenie executable permissions
            chmod +x "$script"
        else
            echo -e "${RED}❌ $(basename "$script") - CHÝBA${NC}"
            missing_scripts+=("$script")
        fi
    done
    
    if [ ${#missing_scripts[@]} -gt 0 ]; then
        echo -e "${RED}❌ Chýbajú backup skripty. Vytvorte ich najprv.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Všetky backup skripty sú dostupné${NC}"
}

# 📝 Vytvorenie wrapper skriptu pre cron
create_cron_wrapper() {
    echo -e "${YELLOW}📝 Vytváram wrapper skript pre cron...${NC}"
    
    local wrapper_script="$BACKUP_SCRIPTS_DIR/cron-backup-wrapper.sh"
    
    cat > "$wrapper_script" << 'EOF'
#!/bin/bash

# 🤖 CRON WRAPPER pre BlackRent zálohy
# Tento skript zabezpečuje správne prostredie pre cron job

# Nastavenie PATH pre cron (dôležité pre pg_dump, aws cli, atď.)
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:$PATH"

# Nastavenie project root
PROJECT_ROOT="/Users/mikailpirgozi/Desktop/Cursor zalohy mac16/Blackrent Beta 2"
BACKUP_SCRIPTS_DIR="$PROJECT_ROOT/scripts/backup"
LOG_FILE="$PROJECT_ROOT/backups/logs/cron-backup-$(date +%Y-%m-%d).log"

# Vytvorenie log adresára
mkdir -p "$(dirname "$LOG_FILE")"

# Funkcia na logovanie
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

log "🚀 Spúšťam automatické zálohy..."

# Spustenie hlavného backup skriptu
if "$BACKUP_SCRIPTS_DIR/daily-backup-master.sh" >> "$LOG_FILE" 2>&1; then
    log "✅ Hlavné zálohy úspešné"
    
    # Spustenie R2 backup (neblokujúce)
    if "$BACKUP_SCRIPTS_DIR/r2-backup-sync.sh" >> "$LOG_FILE" 2>&1; then
        log "✅ R2 zálohy úspešné"
        log "🎉 Všetky zálohy dokončené úspešne"
        exit 0
    else
        log "⚠️ R2 zálohy zlyhali, ale hlavné zálohy sú OK"
        exit 0
    fi
else
    log "❌ Hlavné zálohy zlyhali"
    exit 1
fi
EOF
    
    chmod +x "$wrapper_script"
    
    echo -e "${GREEN}✅ Cron wrapper vytvorený: $wrapper_script${NC}"
}

# ⏰ Nastavenie cron job
setup_cron_job() {
    echo -e "${YELLOW}⏰ Nastavujem cron job...${NC}"
    
    local wrapper_script="$BACKUP_SCRIPTS_DIR/cron-backup-wrapper.sh"
    local cron_line="0 2 * * * $wrapper_script"
    
    # Kontrola existujúceho cron job
    if crontab -l 2>/dev/null | grep -q "$wrapper_script"; then
        echo -e "${YELLOW}⚠️ Cron job už existuje${NC}"
        
        echo -e "${BLUE}Aktuálny crontab:${NC}"
        crontab -l 2>/dev/null | grep -n "$wrapper_script" || true
        
        read -p "Chcete ho aktualizovať? (y/N): " -n 1 -r
        echo
        
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}❌ Cron job nebol zmenený${NC}"
            return 0
        fi
        
        # Odstránenie starého cron job
        crontab -l 2>/dev/null | grep -v "$wrapper_script" | crontab -
    fi
    
    # Pridanie nového cron job
    (crontab -l 2>/dev/null; echo "$cron_line") | crontab -
    
    echo -e "${GREEN}✅ Cron job nastavený:${NC}"
    echo -e "${BLUE}   $cron_line${NC}"
    echo -e "${BLUE}   (Každý deň o 2:00 ráno)${NC}"
}

# 📧 Nastavenie email notifikácií (voliteľné)
setup_email_notifications() {
    echo -e "${YELLOW}📧 Nastavenie email notifikácií...${NC}"
    
    read -p "Chcete nastaviť email notifikácie? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Zadajte email adresu: " email_address
        
        if [ -n "$email_address" ]; then
            # Vytvorenie email notifikačného skriptu
            local email_script="$BACKUP_SCRIPTS_DIR/email-notifications.sh"
            
            cat > "$email_script" << EOF
#!/bin/bash

# 📧 Email notifikácie pre BlackRent zálohy

EMAIL="$email_address"
PROJECT_NAME="BlackRent"

send_backup_notification() {
    local status="\$1"
    local log_file="\$2"
    local subject=""
    local body=""
    
    if [ "\$status" = "success" ]; then
        subject="✅ \$PROJECT_NAME - Zálohy úspešné"
        body="Denné zálohy boli úspešne dokončené.\\n\\nLog súbor: \$log_file"
    else
        subject="❌ \$PROJECT_NAME - Zálohy zlyhali"
        body="Denné zálohy zlyhali!\\n\\nSkontrolujte log súbor: \$log_file"
    fi
    
    # Použitie mail príkazu (ak je dostupný)
    if command -v mail >/dev/null 2>&1; then
        echo -e "\$body" | mail -s "\$subject" "\$EMAIL"
    else
        echo "Email notifikácia by bola odoslaná:"
        echo "To: \$EMAIL"
        echo "Subject: \$subject"
        echo "Body: \$body"
    fi
}

# Export funkcie pre použitie v iných skriptoch
export -f send_backup_notification
EOF
            
            chmod +x "$email_script"
            
            echo -e "${GREEN}✅ Email notifikácie nastavené pre: $email_address${NC}"
        else
            echo -e "${YELLOW}❌ Email adresa nebola zadaná${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️ Email notifikácie preskočené${NC}"
    fi
}

# 🧪 Test backup systému
test_backup_system() {
    echo -e "${YELLOW}🧪 Testujem backup systém...${NC}"
    
    read -p "Chcete spustiť test backup? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}🚀 Spúšťam test backup...${NC}"
        
        local wrapper_script="$BACKUP_SCRIPTS_DIR/cron-backup-wrapper.sh"
        
        if "$wrapper_script"; then
            echo -e "${GREEN}✅ Test backup úspešný!${NC}"
        else
            echo -e "${RED}❌ Test backup zlyhal${NC}"
            echo -e "${YELLOW}💡 Skontrolujte log súbory v backups/logs/${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️ Test backup preskočený${NC}"
    fi
}

# 📋 Zobrazenie súhrnu
show_summary() {
    echo ""
    echo -e "${PURPLE}📋 SÚHRN AUTOMATICKÝCH ZÁLOH${NC}"
    echo -e "${BLUE}================================${NC}"
    echo ""
    echo -e "${GREEN}✅ Backup skripty:${NC}"
    echo -e "   📄 daily-backup-master.sh - Hlavné zálohy"
    echo -e "   🌐 r2-backup-sync.sh - R2 Storage zálohy"
    echo -e "   🤖 cron-backup-wrapper.sh - Cron wrapper"
    echo ""
    echo -e "${GREEN}⏰ Harmonogram:${NC}"
    echo -e "   🕐 Každý deň o 2:00 ráno"
    echo -e "   📁 Zálohy sa ukladajú do: backups/"
    echo -e "   🧹 Staré zálohy sa automaticky mažú (7 dní)"
    echo ""
    echo -e "${GREEN}📊 Čo sa zálohuje:${NC}"
    echo -e "   🗄️ Railway PostgreSQL databáza"
    echo -e "   🗄️ Lokálna PostgreSQL databáza (ak existuje)"
    echo -e "   📁 Kritické súbory a konfigurácie"
    echo -e "   📄 Protokoly a dokumenty"
    echo -e "   🌐 R2 Storage súbory"
    echo ""
    echo -e "${BLUE}💡 Užitočné príkazy:${NC}"
    echo -e "   📋 Zobraziť cron jobs: ${YELLOW}crontab -l${NC}"
    echo -e "   📝 Editovať cron jobs: ${YELLOW}crontab -e${NC}"
    echo -e "   📊 Skontrolovať logy: ${YELLOW}ls -la backups/logs/${NC}"
    echo -e "   🧪 Manuálny test: ${YELLOW}./scripts/backup/cron-backup-wrapper.sh${NC}"
    echo ""
}

# 🚀 Hlavná funkcia
main() {
    check_backup_scripts
    echo ""
    
    create_cron_wrapper
    echo ""
    
    setup_cron_job
    echo ""
    
    setup_email_notifications
    echo ""
    
    test_backup_system
    
    show_summary
    
    echo -e "${GREEN}🎉 Automatické zálohy sú nastavené!${NC}"
}

# Spustenie
main "$@"
