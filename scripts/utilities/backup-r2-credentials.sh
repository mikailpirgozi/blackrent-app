#!/bin/bash

# 🔐 BACKUP R2 CREDENTIALS SCRIPT
# Automaticky zálohuje funkčné R2 credentials

BACKEND_ENV="backend/.env"
BACKUP_DIR="assets/configs/r2-backups"
TIMESTAMP=$(date +%s)

echo "🔐 Zálohujem R2 credentials..."

# Vytvor backup adresár
mkdir -p "$BACKUP_DIR"

# Skontroluj či R2 funguje
echo "🧪 Testujem R2 connection..."
RESPONSE=$(curl -s -X GET "http://localhost:3001/api/files/status" 2>/dev/null)

if echo "$RESPONSE" | grep -q '"success":true'; then
    echo "✅ R2 funguje - vytváram backup..."
    
    # Extrahuj R2 variables
    grep "^R2_" "$BACKEND_ENV" > "$BACKUP_DIR/working-r2-credentials-$TIMESTAMP.env"
    
    # Vytvor "latest" symlink
    ln -sf "working-r2-credentials-$TIMESTAMP.env" "$BACKUP_DIR/latest-working.env"
    
    echo "✅ R2 credentials zálohované do: $BACKUP_DIR/working-r2-credentials-$TIMESTAMP.env"
    echo "🔗 Latest working: $BACKUP_DIR/latest-working.env"
else
    echo "❌ R2 nefunguje - backup sa nevytvára"
    exit 1
fi
