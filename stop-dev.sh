#!/bin/bash

echo "🛑 Ukončujem BlackRent aplikáciu..."

# Vytvorenie logs adresára ak neexistuje
mkdir -p logs

# Ukončenie procesov pomocou PID súborov (graceful)
if [ -f "logs/backend.pid" ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo "🔧 Ukončujem backend proces (PID: $BACKEND_PID)..."
        kill $BACKEND_PID 2>/dev/null
        sleep 1
        # Ak proces ešte beží, násilne ukončiť
        if kill -0 $BACKEND_PID 2>/dev/null; then
            kill -9 $BACKEND_PID 2>/dev/null
        fi
    fi
    rm -f logs/backend.pid
fi

if [ -f "logs/frontend.pid" ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)  
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "🔧 Ukončujem frontend proces (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID 2>/dev/null
        sleep 1
        # Ak proces ešte beží, násilne ukončiť
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            kill -9 $FRONTEND_PID 2>/dev/null
        fi
    fi
    rm -f logs/frontend.pid
fi

# Fallback - ukončenie všetkých súvisiacich procesov
echo "🧹 Dodatočné čistenie procesov..."
pkill -f "react-scripts" 2>/dev/null
pkill -f "nodemon" 2>/dev/null  
pkill -f "ts-node" 2>/dev/null

# Násilne ukončenie ak je potrebné
if lsof -i :3001 > /dev/null 2>&1; then
    echo "🔧 Ukončujem zvyšné procesy na porte 3001..."
    lsof -ti:3001 | xargs kill -9 2>/dev/null
fi

if lsof -i :3000 > /dev/null 2>&1; then
    echo "🔧 Ukončujem zvyšné procesy na porte 3000..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null
fi

sleep 2

# Verifikácia
if ! lsof -i :3001 > /dev/null 2>&1 && ! lsof -i :3000 > /dev/null 2>&1; then
    echo "✅ BlackRent aplikácia úspešne ukončená"
else
    echo "⚠️  Niektoré procesy možno ešte bežia"
fi 