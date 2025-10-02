#!/bin/bash

# 🛡️ BlackRent Keep-Alive System
# Udržuje server a databázu nepretržite v chode

echo "🛡️ Spúšťam BlackRent Keep-Alive System..."

# Funkcia pre automatický reštart
auto_restart() {
    echo "🔄 Automatický reštart detekovaný..."
    npm run dev:stop > /dev/null 2>&1
    sleep 3
    npm run dev:start
    echo "✅ Aplikácia reštartovaná"
}

# Funkcia pre kontrolu zdravia
health_check() {
    # Kontrola backend portu
    if ! lsof -i :3001 > /dev/null 2>&1; then
        echo "❌ Backend down - reštartujem..."
        auto_restart
        return 1
    fi
    
    # Kontrola frontend portu  
    if ! lsof -i :3000 > /dev/null 2>&1; then
        echo "❌ Frontend down - reštartujem..."
        auto_restart
        return 1
    fi
    
    # Kontrola API - musí vrátiť JSON, nie HTML
    API_RESPONSE=$(curl -s http://localhost:3001/api/health 2>/dev/null)
    if [[ ! "$API_RESPONSE" =~ "success" ]] || [[ "$API_RESPONSE" =~ "<!DOCTYPE html>" ]]; then
        echo "❌ API nereaguje správne (vracia HTML namiesto JSON) - reštartujem..."
        auto_restart
        return 1
    fi
    
    return 0
}

# Hlavný keep-alive loop
while true; do
    if health_check; then
        echo "✅ [$(date '+%H:%M:%S')] Všetko beží správne"
    fi
    sleep 30  # Kontrola každých 30 sekúnd
done
