#!/bin/bash

# Script na prepínanie medzi SQLite a PostgreSQL databázami

echo "🔄 Prepínanie databázy pre Blackrent aplikáciu"
echo ""

case "$1" in
  "sqlite")
    echo "📦 Prepínam na SQLite databázu..."
    
    # Zastav PostgreSQL backend
    pkill -f "ts-node.*index.ts" 2>/dev/null
    pkill -f "nodemon.*index.ts" 2>/dev/null
    
    # Spust SQLite backend
    echo "🚀 Spúšťam SQLite backend..."
    cd "$(dirname "$0")"
    node src/index.js &
    
    echo "✅ SQLite backend beží na porte 5001"
    echo "🔗 Health check: http://localhost:5001/health"
    echo "⚠️  Poznámka: SQLite nemá autentifikáciu"
    ;;
    
  "postgresql"|"postgres")
    echo "🐘 Prepínam na PostgreSQL databázu..."
    
    # Zastav SQLite backend
    pkill -f "node.*index.js" 2>/dev/null
    
    # Skontroluj PostgreSQL
    if ! command -v psql &> /dev/null; then
        echo "❌ PostgreSQL nie je nainštalovaný"
        echo "📦 Inštalujte: brew install postgresql@14"
        exit 1
    fi
    
    # Skontroluj či PostgreSQL beží
    if ! pg_isready -q; then
        echo "🔄 Spúšťam PostgreSQL službu..."
        brew services start postgresql@14
        sleep 2
    fi
    
    # Vytvor databázu ak neexistuje
    createdb blackrent 2>/dev/null || echo "ℹ️  Databáza blackrent už existuje"
    
    # Spust PostgreSQL backend
    echo "🚀 Spúšťam PostgreSQL backend..."
    cd "$(dirname "$0")"
    npm run dev &
    
    echo "✅ PostgreSQL backend beží na porte 5001"
    echo "🔗 Health check: http://localhost:5001/health"
    echo "🔐 Admin prihlásenie: admin / admin123"
    ;;
    
  "status")
    echo "📊 Stav databáz:"
    echo ""
    
    # SQLite
    if [ -f "blackrent.db" ]; then
        echo "📦 SQLite: ✅ Databáza existuje"
        sqlite3 blackrent.db "SELECT COUNT(*) as vehicles FROM vehicles;" 2>/dev/null | grep -v "no such table" || echo "📦 SQLite: ⚠️  Prázdna databáza"
    else
        echo "📦 SQLite: ❌ Databáza neexistuje"
    fi
    
    # PostgreSQL
    if pg_isready -q; then
        echo "🐘 PostgreSQL: ✅ Služba beží"
        psql -d blackrent -c "SELECT COUNT(*) as vehicles FROM vehicles;" 2>/dev/null | grep -v "no such table" || echo "🐘 PostgreSQL: ⚠️  Prázdna databáza"
    else
        echo "🐘 PostgreSQL: ❌ Služba nebeží"
    fi
    
    # Backend procesy
    echo ""
    echo "🖥️  Backend procesy:"
    if pgrep -f "node.*index.js" > /dev/null; then
        echo "📦 SQLite backend: ✅ Beží"
    else
        echo "📦 SQLite backend: ❌ Nebeží"
    fi
    
    if pgrep -f "ts-node.*index.ts" > /dev/null || pgrep -f "nodemon.*index.ts" > /dev/null; then
        echo "🐘 PostgreSQL backend: ✅ Beží"
    else
        echo "🐘 PostgreSQL backend: ❌ Nebeží"
    fi
    ;;
    
  *)
    echo "❌ Použitie: $0 {sqlite|postgresql|status}"
    echo ""
    echo "📦 sqlite     - Spustí SQLite backend (bez autentifikácie)"
    echo "🐘 postgresql - Spustí PostgreSQL backend (s autentifikáciou)"
    echo "📊 status     - Zobrazí stav databáz a procesov"
    echo ""
    echo "💡 Pre hosting odporúčam PostgreSQL"
    exit 1
    ;;
esac 