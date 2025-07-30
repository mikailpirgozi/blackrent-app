#!/bin/bash

# BlackRent Development Startup Script
echo "🚀 Spúšťam BlackRent aplikáciu..."

# Funkcia pre čistenie procesov
cleanup() {
    echo "🧹 Ukončujem procesy..."
    pkill -f "react-scripts" 2>/dev/null
    pkill -f "nodemon" 2>/dev/null  
    pkill -f "ts-node" 2>/dev/null
    sleep 2
    echo "✅ Procesy ukončené"
}

# Čistenie pri ukončení skriptu
trap cleanup EXIT

# Čistenie existujúcich procesov
cleanup

# Kontrola portov
if lsof -i :3001 > /dev/null 2>&1; then
    echo "⚠️  Port 3001 je obsadený, ukončujem proces..."
    lsof -ti:3001 | xargs kill -9 2>/dev/null
fi

if lsof -i :3000 > /dev/null 2>&1; then
    echo "⚠️  Port 3000 je obsadený, ukončujem proces..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null
fi

echo "🔧 Porty vyčistené"

# Spustenie backendu
echo "🚀 Spúšťam backend server..."
cd backend
npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Čakanie na backend
echo "⏳ Čakám na backend server..."
timeout=60
while [ $timeout -gt 0 ]; do
    if curl -s http://localhost:3001/api/auth/test > /dev/null 2>&1; then
        echo "✅ Backend je pripravený!"
        break
    fi
    sleep 1
    timeout=$((timeout-1))
done

if [ $timeout -eq 0 ]; then
    echo "❌ Backend sa nespustil do 60 sekúnd"
    exit 1
fi

# Spustenie frontendu
echo "🎨 Spúšťam frontend aplikáciu..."
npm start > logs/frontend.log 2>&1 &
FRONTEND_PID=$!

# Čakanie na frontend
echo "⏳ Čakám na frontend..."
timeout=60
while [ $timeout -gt 0 ]; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo "✅ Frontend je pripravený!"
        break
    fi
    sleep 1
    timeout=$((timeout-1))
done

echo ""
echo "🎉 BlackRent aplikácia je spustená!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend:  http://localhost:3001"
echo ""
echo "📊 Prihlasovacie údaje:"
echo "   Username: admin"  
echo "   Password: Black123"
echo ""
echo "💡 Pre ukončenie stlačte Ctrl+C"
echo ""

# Sledovanie logov
echo "📋 Sledovanie logov (posledných 10 riadkov):"
tail -f logs/backend.log logs/frontend.log 