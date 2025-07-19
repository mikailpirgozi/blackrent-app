#!/bin/bash

# 🧪 Test Monitoring Scripts
echo "🧪 Testing All Monitoring Scripts"
echo "================================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Create logs directory
mkdir -p ./logs

echo "📁 Created logs directory"

# Test each monitoring script for 10 seconds
echo ""
echo "1️⃣  Testing Railway Monitor (10 seconds)..."
timeout 10s ./railway-monitor.sh &
RAILWAY_PID=$!
sleep 10
kill $RAILWAY_PID 2>/dev/null
wait $RAILWAY_PID 2>/dev/null

if [ -f "./logs/railway-monitor.log" ]; then
    echo -e "${GREEN}✅ Railway Monitor: OK${NC}"
    echo "Last entry: $(tail -1 ./logs/railway-monitor.log)"
else
    echo -e "${RED}❌ Railway Monitor: FAILED${NC}"
fi

echo ""
echo "2️⃣  Testing Database Monitor (10 seconds)..."
timeout 10s ./db-monitor.sh &
DB_PID=$!
sleep 10  
kill $DB_PID 2>/dev/null
wait $DB_PID 2>/dev/null

if [ -f "./logs/database-monitor.log" ]; then
    echo -e "${GREEN}✅ Database Monitor: OK${NC}"
    echo "Last entry: $(tail -1 ./logs/database-monitor.log)"
else
    echo -e "${RED}❌ Database Monitor: FAILED${NC}"
fi

echo ""
echo "3️⃣  Testing Performance Monitor (10 seconds)..."
timeout 10s ./performance-monitor.sh &
PERF_PID=$!
sleep 10
kill $PERF_PID 2>/dev/null  
wait $PERF_PID 2>/dev/null

if [ -f "./logs/performance-monitor.log" ]; then
    echo -e "${GREEN}✅ Performance Monitor: OK${NC}"
    echo "Last entry: $(tail -1 ./logs/performance-monitor.log)"
else
    echo -e "${RED}❌ Performance Monitor: FAILED${NC}"
fi

echo ""
echo "4️⃣  Testing Error Tracker (10 seconds)..."
timeout 10s ./error-tracker.sh &
ERROR_PID=$!
sleep 10
kill $ERROR_PID 2>/dev/null
wait $ERROR_PID 2>/dev/null

if [ -f "./logs/error-tracker.log" ]; then
    echo -e "${GREEN}✅ Error Tracker: OK${NC}" 
    echo "Last entry: $(tail -1 ./logs/error-tracker.log)"
else
    echo -e "${RED}❌ Error Tracker: FAILED${NC}"
fi

echo ""
echo "📊 Log Files Summary:"
echo "===================="
for log in ./logs/*.log; do
    if [ -f "$log" ]; then
        lines=$(wc -l < "$log")
        echo "📄 $(basename $log): $lines lines"
    fi
done

echo ""
echo "🎯 Test Complete!"
echo "📁 Check ./logs/ directory for detailed logs"
echo "🔍 Use 'tail -f ./logs/*.log' to monitor in real-time" 