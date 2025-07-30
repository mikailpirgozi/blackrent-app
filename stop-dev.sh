#!/bin/bash

echo "🛑 Ukončujem BlackRent aplikáciu..."

# Ukončenie všetkých súvisiacich procesov
echo "🧹 Čistenie procesov..."
pkill -f "react-scripts" 2>/dev/null
pkill -f "nodemon" 2>/dev/null  
pkill -f "ts-node" 2>/dev/null

# Násilne ukončenie ak je potrebné
if lsof -i :3001 > /dev/null 2>&1; then
    echo "🔧 Ukončujem procesy na porte 3001..."
    lsof -ti:3001 | xargs kill -9 2>/dev/null
fi

if lsof -i :3000 > /dev/null 2>&1; then
    echo "🔧 Ukončujem procesy na porte 3000..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null
fi

sleep 2

# Verifikácia
if ! lsof -i :3001 > /dev/null 2>&1 && ! lsof -i :3000 > /dev/null 2>&1; then
    echo "✅ BlackRent aplikácia úspešne ukončená"
else
    echo "⚠️  Niektoré procesy možno ešte bežia"
fi 