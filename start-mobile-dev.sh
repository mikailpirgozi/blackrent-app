#!/bin/bash

# BlackRent Mobile Development Script
echo "📱 Spúšťam BlackRent pre mobilné testovanie..."

# Získanie IP adresy
LOCAL_IP=$(ipconfig getifaddr en0 || ipconfig getifaddr en1)
if [ -z "$LOCAL_IP" ]; then
    echo "❌ Nemôžem získať IP adresu"
    exit 1
fi

echo "🌐 Lokálna IP adresa: $LOCAL_IP"

# Čistenie procesov
cleanup() {
    echo "🧹 Ukončujem procesy..."
    pkill -f "react-scripts" 2>/dev/null
    pkill -f "nodemon" 2>/dev/null  
    pkill -f "ts-node" 2>/dev/null
    sleep 2
    echo "✅ Procesy ukončené"
}

trap cleanup SIGINT SIGTERM
cleanup

# Čistenie portov
if lsof -i :3001 > /dev/null 2>&1; then
    echo "⚠️  Port 3001 je obsadený, ukončujem proces..."
    lsof -ti:3001 | xargs kill -9 2>/dev/null
fi

if lsof -i :3000 > /dev/null 2>&1; then
    echo "⚠️  Port 3000 je obsadený, ukončujem proces..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null
fi

# Vytvorenie logs adresára ak neexistuje
mkdir -p logs

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

# Spustenie frontendu s HOST=0.0.0.0 pre mobilný prístup
echo "🎨 Spúšťam frontend pre mobilný prístup..."
HOST=0.0.0.0 PORT=3000 npm start > logs/frontend.log 2>&1 &
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
echo "🎉 BlackRent aplikácia je spustená pre mobilné testovanie!"
echo ""
echo "📱 Prístup z počítača:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:3001"
echo ""
echo "📱 Prístup z telefónu (rovnaká Wi-Fi sieť):"
echo "   Frontend: http://$LOCAL_IP:3000"
echo "   Backend:  http://$LOCAL_IP:3001"
echo ""
echo "📊 Prihlasovacie údaje:"
echo "   Username: admin"  
echo "   Password: Black123"
echo ""
echo "💡 Pre ukončenie stlač Ctrl+C"
echo "📋 Pre sledovanie logov: tail -f logs/backend.log logs/frontend.log"

# Uloženie PID procesov
echo $BACKEND_PID > logs/backend.pid
echo $FRONTEND_PID > logs/frontend.pid

# Čakanie na ukončenie
wait

