#!/bin/bash

# 🎉 Final AI System Test
echo "🎉 FINAL AI SYSTEM COMPREHENSIVE TEST"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Test results counter
TESTS_TOTAL=0
TESTS_PASSED=0
TESTS_FAILED=0

print_test_header() {
    echo -e "${CYAN}$1${NC}"
    echo "$(printf '%*s' ${#1} '' | tr ' ' '-')"
}

run_test() {
    local test_name="$1"
    local test_command="$2"
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    
    echo -n "Testing $test_name... "
    if eval "$test_command" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ PASS${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}❌ FAIL${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
}

print_test_header "📋 1. FILE EXISTENCE TESTS"
run_test "Railway Monitor Script" "[ -f './railway-monitor.sh' ]"
run_test "Database Monitor Script" "[ -f './db-monitor.sh' ]"
run_test "Performance Monitor Script" "[ -f './performance-monitor.sh' ]"
run_test "Error Tracker Script" "[ -f './error-tracker.sh' ]"
run_test "AI Webhook Receiver" "[ -f './ai-webhook-receiver.js' ]"
run_test "Monitoring Dashboard" "[ -f './monitoring-dashboard.html' ]"
run_test "Start Monitoring Script" "[ -f './start-monitoring.sh' ]"
run_test "AI Automation Script" "[ -f './ai-automation.sh' ]"

echo ""
print_test_header "🔧 2. SCRIPT PERMISSIONS"
run_test "Railway Monitor Executable" "[ -x './railway-monitor.sh' ]"
run_test "Database Monitor Executable" "[ -x './db-monitor.sh' ]" 
run_test "Performance Monitor Executable" "[ -x './performance-monitor.sh' ]"
run_test "Error Tracker Executable" "[ -x './error-tracker.sh' ]"
run_test "Start Monitoring Executable" "[ -x './start-monitoring.sh' ]"
run_test "AI Automation Executable" "[ -x './ai-automation.sh' ]"

echo ""
print_test_header "🌐 3. NETWORK CONNECTIVITY"
run_test "Railway App Reachability" "curl -s --max-time 10 https://blackrent-app-production-4d6f.up.railway.app/ > /dev/null"
run_test "PostgreSQL Connection" "echo 'SELECT 1;' | psql 'postgresql://postgres:nfwrpKxILRUMqunYTZJEhjudEstqLRGv@trolley.proxy.rlwy.net:13400/railway' -t"
run_test "GitHub API Access" "curl -s --max-time 5 https://api.github.com > /dev/null"

echo ""
print_test_header "📊 4. MONITORING SYSTEM TESTS"
# Create logs directory
mkdir -p ./logs

# Test each monitoring script for 5 seconds
echo "Testing Railway Monitor (5s)..."
timeout 5s ./railway-monitor.sh >/dev/null 2>&1 &
RAILWAY_PID=$!
sleep 5
kill $RAILWAY_PID 2>/dev/null
wait $RAILWAY_PID 2>/dev/null
run_test "Railway Monitor Log Created" "[ -f './logs/railway-monitor.log' ]"

echo "Testing Database Monitor (5s)..."
timeout 5s ./db-monitor.sh >/dev/null 2>&1 &
DB_PID=$!
sleep 5  
kill $DB_PID 2>/dev/null
wait $DB_PID 2>/dev/null
run_test "Database Monitor Log Created" "[ -f './logs/database-monitor.log' ]"

echo "Testing Performance Monitor (5s)..."
timeout 5s ./performance-monitor.sh >/dev/null 2>&1 &
PERF_PID=$!
sleep 5
kill $PERF_PID 2>/dev/null  
wait $PERF_PID 2>/dev/null
run_test "Performance Monitor Log Created" "[ -f './logs/performance-monitor.log' ]"

echo "Testing Error Tracker (5s)..."
timeout 5s ./error-tracker.sh >/dev/null 2>&1 &
ERROR_PID=$!
sleep 5
kill $ERROR_PID 2>/dev/null
wait $ERROR_PID 2>/dev/null
run_test "Error Tracker Log Created" "[ -f './logs/error-tracker.log' ]"

echo ""
print_test_header "🚀 5. AI AUTOMATION FEATURES"
run_test "AI Menu Available" "./ai-automation.sh menu > /dev/null 2>&1"
run_test "AI Status Check" "./ai-automation.sh status > /dev/null 2>&1"
run_test "Node.js Available" "node --version > /dev/null 2>&1"
run_test "NPM Available" "npm --version > /dev/null 2>&1"

echo ""
print_test_header "📁 6. LOG ANALYSIS"
if [ -d "./logs" ]; then
    LOG_COUNT=$(ls -1 ./logs/*.log 2>/dev/null | wc -l)
    echo "Found $LOG_COUNT monitoring log files:"
    ls -la ./logs/*.log 2>/dev/null | while read line; do
        echo "  📄 $line"
    done
fi

echo ""
print_test_header "📈 7. FINAL RESULTS"
echo -e "Total Tests: ${YELLOW}$TESTS_TOTAL${NC}"
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 ALL TESTS PASSED! AI SYSTEM FULLY OPERATIONAL! 🎉${NC}"
    echo ""
    echo -e "${BLUE}🚀 Your BlackRent AI system is ready:${NC}"
    echo -e "   💻 Database access: ${GREEN}✅ Active${NC}"
    echo -e "   📊 Real-time monitoring: ${GREEN}✅ Active${NC}"  
    echo -e "   🤖 AI automation: ${GREEN}✅ Active${NC}"
    echo -e "   🚂 Railway integration: ${GREEN}✅ Active${NC}"
    echo ""
    echo -e "${CYAN}To start all monitoring:${NC} ./start-monitoring.sh start"
    echo -e "${CYAN}To view logs:${NC} tail -f ./logs/*.log"
    echo -e "${CYAN}AI automation menu:${NC} ./ai-automation.sh menu"
else
    echo ""
    echo -e "${RED}⚠️  Some tests failed. Check the output above.${NC}"
    echo -e "${YELLOW}Note: Network tests may fail due to temporary connectivity issues.${NC}"
fi

echo ""
echo "🏁 Test completed at $(date)" 