#!/bin/bash

echo "🚀 Nastavujem PostgreSQL databázu pre Blackrent..."

# Kontrola či je PostgreSQL nainštalovaný
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL nie je nainštalovaný"
    echo "📦 Inštalujem PostgreSQL..."
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install postgresql@14
            brew services start postgresql@14
        else
            echo "❌ Homebrew nie je nainštalovaný. Nainštalujte PostgreSQL manuálne."
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        sudo apt-get update
        sudo apt-get install -y postgresql postgresql-contrib
        sudo systemctl start postgresql
        sudo systemctl enable postgresql
    else
        echo "❌ Nepodporovaný operačný systém"
        exit 1
    fi
fi

echo "✅ PostgreSQL je nainštalovaný"

# Vytvorenie databázy a používateľa
echo "🗄️ Vytváram databázu..."

# Vytvorenie .env súboru ak neexistuje
if [ ! -f .env ]; then
    echo "📝 Vytváram .env súbor..."
    cp env.example .env
fi

# Vytvorenie databázy
psql -U postgres -c "CREATE DATABASE blackrent;" 2>/dev/null || echo "Databáza už existuje"
psql -U postgres -c "CREATE USER postgres WITH PASSWORD 'password';" 2>/dev/null || echo "Používateľ už existuje"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE blackrent TO postgres;" 2>/dev/null || echo "Privilegiá už existujú"

echo "✅ Databáza je pripravená"

# Inštalácia závislostí
echo "📦 Inštalujem závislosti..."
npm install

echo "🎉 Nastavenie dokončené!"
echo ""
echo "🔑 Admin prihlásenie:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "🚀 Spustite server príkazom: npm run dev" 