#!/bin/bash

# 🔄 BLACKRENT BACKUP SCRIPT
# Zálohuje kritické súbory pred veľkými zmenami

BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "💾 Vytváram zálohu kritických súborov..."

# Zálohujeme kľúčové súbory
cp "src/app/page.tsx" "$BACKUP_DIR/"
cp "src/components/anima/sections/FeaturedItemsSection/FeaturedItemsSection.tsx" "$BACKUP_DIR/"
cp "src/components/anima/sections/ContactSection/ContactSection.tsx" "$BACKUP_DIR/"
cp "package.json" "$BACKUP_DIR/"

echo "✅ Záloha vytvorená v: $BACKUP_DIR"
echo "📋 Zálohované súbory:"
ls -la "$BACKUP_DIR"

# Vytvoríme info súbor
cat > "$BACKUP_DIR/backup-info.txt" << EOF
BLACKRENT BACKUP INFO
====================
Dátum: $(date)
Verzia: $(git rev-parse HEAD 2>/dev/null || echo "No git")
Popis: Automatická záloha pred zmenami

Zálohované súbory:
- page.tsx (hlavná stránka)
- FeaturedItemsSection.tsx (hero, filter, vehicle cards)
- ContactSection.tsx (FAQ, contact, footer)
- package.json (npm skripty)

Pre obnovenie:
cp backups/YYYYMMDD_HHMMSS/page.tsx src/app/
EOF

echo "📄 Info súbor vytvorený: $BACKUP_DIR/backup-info.txt"
