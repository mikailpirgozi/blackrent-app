#!/bin/bash

# PostgreSQL automatické zálohovanie pre Blackrent aplikáciu

BACKUP_DIR="backend/postgres-backups"
DB_NAME="blackrent"
TIMESTAMP=$(date +"%Y-%m-%dT%H-%M-%S")

# Vytvorenie backup priečinka
mkdir -p "$BACKUP_DIR"

echo "🐘 PostgreSQL zálohovanie pre Blackrent"
echo "📁 Backup priečinok: $BACKUP_DIR"
echo "🗄️  Databáza: $DB_NAME"

case "$1" in
  "backup"|"")
    BACKUP_FILE="$BACKUP_DIR/blackrent-backup-$TIMESTAMP.sql"
    echo "💾 Vytváram zálohu: $BACKUP_FILE"
    
    if pg_dump -d "$DB_NAME" > "$BACKUP_FILE"; then
      echo "✅ Záloha úspešne vytvorená: $(du -h "$BACKUP_FILE" | cut -f1)"
      
      # Vymazanie starších záloh (ponechať len 20 najnovších)
      ls -t "$BACKUP_DIR"/blackrent-backup-*.sql 2>/dev/null | tail -n +21 | xargs rm -f 2>/dev/null
      
      BACKUP_COUNT=$(ls "$BACKUP_DIR"/blackrent-backup-*.sql 2>/dev/null | wc -l)
      echo "📊 Celkový počet záloh: $BACKUP_COUNT"
    else
      echo "❌ Chyba pri vytváraní zálohy"
      exit 1
    fi
    ;;
    
  "restore")
    if [ -z "$2" ]; then
      echo "❌ Použitie: $0 restore <backup-file>"
      echo "📂 Dostupné zálohy:"
      ls -1t "$BACKUP_DIR"/blackrent-backup-*.sql 2>/dev/null | head -10
      exit 1
    fi
    
    RESTORE_FILE="$2"
    if [ ! -f "$RESTORE_FILE" ]; then
      RESTORE_FILE="$BACKUP_DIR/$2"
    fi
    
    if [ ! -f "$RESTORE_FILE" ]; then
      echo "❌ Súbor $RESTORE_FILE neexistuje"
      exit 1
    fi
    
    echo "🔄 Obnovujem databázu z: $RESTORE_FILE"
    echo "⚠️  POZOR: Toto vymaže všetky aktuálne dáta!"
    read -p "💭 Pokračovať? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      # Zastavenie backend procesov
      pkill -f "ts-node.*index.ts" 2>/dev/null
      pkill -f "nodemon.*index.ts" 2>/dev/null
      sleep 2
      
      # Vytvorenie zálohy pred obnovením
      SAFETY_BACKUP="$BACKUP_DIR/blackrent-before-restore-$TIMESTAMP.sql"
      echo "🛡️  Vytváram zálohu pred obnovením: $SAFETY_BACKUP"
      pg_dump -d "$DB_NAME" > "$SAFETY_BACKUP"
      
      # Obnovenie
      if psql -d "$DB_NAME" < "$RESTORE_FILE"; then
        echo "✅ Databáza úspešne obnovená"
        echo "🔄 Reštartujte backend server"
      else
        echo "❌ Chyba pri obnovovaní databázy"
        echo "🛡️  Záloha pred obnovením: $SAFETY_BACKUP"
        exit 1
      fi
    else
      echo "❌ Obnovenie zrušené"
    fi
    ;;
    
  "list")
    echo "📂 Dostupné zálohy:"
    if [ ! -d "$BACKUP_DIR" ]; then
      echo "❌ Žiadne zálohy nenájdené"
      exit 1
    fi
    
    ls -lht "$BACKUP_DIR"/blackrent-backup-*.sql 2>/dev/null | head -20 | while read line; do
      echo "   $line"
    done
    ;;
    
  "cleanup")
    DAYS=${2:-7}
    echo "🧹 Mažem zálohy staršie ako $DAYS dní..."
    
    DELETED=$(find "$BACKUP_DIR" -name "blackrent-backup-*.sql" -mtime +$DAYS -delete -print | wc -l)
    echo "🗑️  Vymazaných záloh: $DELETED"
    ;;
    
  "auto-backup")
    # Pre automatické spúšťanie (cron job)
    BACKUP_FILE="$BACKUP_DIR/blackrent-auto-$TIMESTAMP.sql"
    
    if pg_dump -d "$DB_NAME" > "$BACKUP_FILE" 2>/dev/null; then
      # Vymazanie starších auto záloh (ponechať len 7 najnovších)
      ls -t "$BACKUP_DIR"/blackrent-auto-*.sql 2>/dev/null | tail -n +8 | xargs rm -f 2>/dev/null
      
      # Log pre automatické zálohy
      echo "$(date): Auto backup created - $BACKUP_FILE" >> "$BACKUP_DIR/auto-backup.log"
    fi
    ;;
    
  "compare")
    echo "📊 Porovnanie SQLite vs PostgreSQL dát:"
    echo ""
    
    if [ -f "backend/blackrent.db" ]; then
      echo "📦 SQLite tabuľky:"
      sqlite3 backend/blackrent.db ".tables" 2>/dev/null | tr ' ' '\n' | sort
      echo ""
      echo "📦 SQLite záznamy:"
      sqlite3 backend/blackrent.db "SELECT 'vehicles: ' || COUNT(*) FROM vehicles UNION ALL SELECT 'rentals: ' || COUNT(*) FROM rentals UNION ALL SELECT 'customers: ' || COUNT(*) FROM customers;" 2>/dev/null
    else
      echo "📦 SQLite: Databáza neexistuje"
    fi
    
    echo ""
    echo "🐘 PostgreSQL tabuľky:"
    psql -d "$DB_NAME" -c "\dt" -t | awk '{print $3}' | grep -v '^$' | sort
    echo ""
    echo "🐘 PostgreSQL záznamy:"
    psql -d "$DB_NAME" -c "SELECT 'vehicles: ' || COUNT(*) FROM vehicles UNION ALL SELECT 'rentals: ' || COUNT(*) FROM rentals UNION ALL SELECT 'customers: ' || COUNT(*) FROM customers;" -t 2>/dev/null | grep -v '^$'
    ;;
    
  *)
    echo "❌ Použitie: $0 {backup|restore|list|cleanup|auto-backup|compare}"
    echo ""
    echo "💾 backup           - Vytvorí zálohu databázy"
    echo "🔄 restore <file>   - Obnoví databázu zo zálohy"
    echo "📂 list             - Zobrazí dostupné zálohy"
    echo "🧹 cleanup [days]   - Vymaže zálohy staršie ako X dní (default: 7)"
    echo "🤖 auto-backup     - Automatická záloha (pre cron)"
    echo "📊 compare          - Porovná SQLite vs PostgreSQL dáta"
    echo ""
    echo "💡 Pre automatické zálohy pridajte do crontab:"
    echo "   0 2 * * * cd $(pwd) && ./backend/postgres-backup.sh auto-backup"
    exit 1
    ;;
esac 