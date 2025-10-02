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
