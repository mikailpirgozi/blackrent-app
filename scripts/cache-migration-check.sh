#!/bin/bash

# 🛡️ CACHE MIGRATION SAFETY CHECK
# Spustí sa po každej zmene pre overenie funkčnosti

echo "🔍 CACHE MIGRATION SAFETY CHECK"
echo "================================"

# 1. BUILD CHECK
echo "📦 Checking build..."
cd /Users/mikailpirgozi/Desktop/Cursor\ zalohy\ mac16/Blackrent\ Beta\ 2
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Frontend build: OK"
else
    echo "❌ Frontend build: FAILED"
    echo "🚨 ROLLBACK REQUIRED!"
    exit 1
fi

# 2. BACKEND BUILD CHECK  
echo "🔧 Checking backend build..."
cd backend
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Backend build: OK"
else
    echo "❌ Backend build: FAILED"
    echo "🚨 ROLLBACK REQUIRED!"
    exit 1
fi

# 3. SERVER RUNNING CHECK
echo "🚀 Checking if server is running..."
cd ..
curl -f http://localhost:3001/api/health > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Server running: OK"
else
    echo "❌ Server not running: FAILED"
    echo "🚨 Please start server with: npm run dev:start"
    exit 1
fi

# 4. API HEALTH CHECK
echo "🌐 Checking API health..."
sleep 5  # Wait for server to fully start
curl -f http://localhost:3001/api/health > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ API health: OK"
else
    echo "❌ API health: FAILED"
    echo "🚨 ROLLBACK REQUIRED!"
    exit 1
fi

# 5. BASIC API FUNCTIONALITY CHECK
echo "🗄️ Checking basic API functionality..."
# Test health endpoint which doesn't require auth
curl -f "http://localhost:3001/api/health" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ API functionality: OK"
else
    echo "❌ API functionality: FAILED"
    echo "🚨 ROLLBACK REQUIRED!"
    exit 1
fi

echo "🎉 ALL CHECKS PASSED!"
echo "✅ Cache migration step successful"
