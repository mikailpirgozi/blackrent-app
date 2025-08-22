#!/bin/bash

# 🔧 RESTORE R2 CREDENTIALS SCRIPT
# Obnoví posledné funkčné R2 credentials

BACKEND_ENV="backend/.env"
BACKUP_DIR="assets/configs/r2-backups"
LATEST_BACKUP="$BACKUP_DIR/latest-working.env"

echo "🔧 Obnovujem R2 credentials..."

if [ -f "$LATEST_BACKUP" ]; then
    echo "📋 Našiel som backup: $LATEST_BACKUP"
    
    # Backup aktuálneho .env
    cp "$BACKEND_ENV" "$BACKEND_ENV.before-restore"
    
    # Odstráň staré R2 variables
    grep -v "^R2_" "$BACKEND_ENV" > "$BACKEND_ENV.temp"
    
    # Pridaj funkčné R2 variables
    cat "$LATEST_BACKUP" >> "$BACKEND_ENV.temp"
    
    # Prepíš .env
    mv "$BACKEND_ENV.temp" "$BACKEND_ENV"
    
    echo "✅ R2 credentials obnovené z backup súboru"
    echo "🔄 Reštartuj backend: npm run dev:restart"
else
    echo "❌ Žiadny backup nenájdený v: $BACKUP_DIR"
    echo "🔍 Dostupné backupy:"
    ls -la "$BACKUP_DIR/" 2>/dev/null || echo "   (žiadne)"
fi
