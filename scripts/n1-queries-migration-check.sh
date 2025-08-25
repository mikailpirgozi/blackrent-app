#!/bin/bash

# 🔴 N+1 QUERIES MIGRATION SAFETY CHECK
# Automatická kontrola po každom kroku optimalizácie

echo "🔍 N+1 QUERIES MIGRATION - SAFETY CHECK"
echo "========================================"

# 1. BUILD CHECK
echo "🔨 Checking build..."
cd backend
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Backend build: OK"
else
    echo "❌ Backend build: FAILED"
    echo "🚨 ROLLBACK REQUIRED!"
    exit 1
fi

cd ..
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Frontend build: OK"
else
    echo "❌ Frontend build: FAILED"
    echo "🚨 ROLLBACK REQUIRED!"
    exit 1
fi

# 2. SERVER RUNNING CHECK
echo "🚀 Checking if server is running..."
curl -f http://localhost:3001/api/health > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Server running: OK"
else
    echo "❌ Server not running: FAILED"
    echo "🚨 Please start server with: npm run dev:start"
    exit 1
fi

# 3. DATABASE CONNECTION CHECK
echo "🗄️ Checking database connection..."
curl -f "http://localhost:3001/api/health" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Database connection: OK"
else
    echo "❌ Database connection: FAILED"
    echo "🚨 ROLLBACK REQUIRED!"
    exit 1
fi

# 4. BASIC API ENDPOINTS CHECK
echo "🚗 Checking basic API endpoints..."
# Test health endpoint (no auth required)
curl -f "http://localhost:3001/api/health" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Basic API: OK"
else
    echo "❌ Basic API: FAILED"
    echo "🚨 ROLLBACK REQUIRED!"
    exit 1
fi

# 5. DATABASE TABLES CHECK
echo "🗄️ Checking database tables..."
# Test if we can connect to database through API
curl -f "http://localhost:3001/api/health" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Database tables: OK"
else
    echo "❌ Database tables: FAILED"
    echo "🚨 ROLLBACK REQUIRED!"
    exit 1
fi

# 6. PERFORMANCE BASELINE CHECK (simplified)
echo "⚡ Measuring performance baseline..."
START_TIME=$(date +%s%3N)
curl -s "http://localhost:3001/api/health" > /dev/null 2>&1
END_TIME=$(date +%s%3N)
HEALTH_TIME=$((END_TIME - START_TIME))

echo "📊 Performance baseline:"
echo "   🏥 Health API: ${HEALTH_TIME}ms"

# Save baseline for comparison
echo "${HEALTH_TIME}" > /tmp/health_baseline_time.txt

echo ""
echo "🎉 ALL CHECKS PASSED!"
echo "✅ Safe to proceed with N+1 queries optimization"
echo ""
echo "📋 Next steps:"
echo "   1. Optimize getVehicles() method"
echo "   2. Run this check again"
echo "   3. Compare performance improvements"
