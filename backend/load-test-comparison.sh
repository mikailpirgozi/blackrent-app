#!/bin/bash

# Load Testing Comparison Script
# Express vs Fastify performance testing using autocannon

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Load Testing: Express vs Fastify${NC}\n"

# Check if autocannon is installed
if ! command -v autocannon &> /dev/null; then
    echo -e "${YELLOW}⚠️  autocannon not found. Installing globally...${NC}"
    npm install -g autocannon
fi

# Configuration
EXPRESS_URL="http://localhost:3000"
FASTIFY_URL="http://localhost:3001"
CONNECTIONS=100
DURATION=30
TEST_TOKEN="${TEST_TOKEN:-}"

# Test endpoints
declare -a ENDPOINTS=(
    "/api/debug/test-connection"
    "/api/vehicles"
    "/api/rentals"
    "/api/customers"
)

# Results directory
RESULTS_DIR="./performance-results"
mkdir -p "$RESULTS_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo -e "${GREEN}Configuration:${NC}"
echo "  Connections: $CONNECTIONS"
echo "  Duration: ${DURATION}s"
echo "  Token: ${TEST_TOKEN:+✅ Set}${TEST_TOKEN:-❌ Not set}"
echo ""

# Function to run autocannon test
run_test() {
    local url=$1
    local name=$2
    local endpoint=$3
    local output_file=$4
    
    echo -e "\n${BLUE}Testing ${name}: ${endpoint}${NC}"
    
    if [ -n "$TEST_TOKEN" ]; then
        autocannon \
            -c $CONNECTIONS \
            -d $DURATION \
            -H "Authorization: Bearer $TEST_TOKEN" \
            "${url}${endpoint}" \
            > "$output_file" 2>&1
    else
        autocannon \
            -c $CONNECTIONS \
            -d $DURATION \
            "${url}${endpoint}" \
            > "$output_file" 2>&1
    fi
    
    # Extract key metrics
    echo -e "${GREEN}Results:${NC}"
    grep -E "Req/Sec|Latency" "$output_file" | head -2
}

# Test each endpoint
for endpoint in "${ENDPOINTS[@]}"; do
    echo -e "\n${YELLOW}========================================${NC}"
    echo -e "${YELLOW}Testing: ${endpoint}${NC}"
    echo -e "${YELLOW}========================================${NC}"
    
    # Express test
    EXPRESS_OUTPUT="${RESULTS_DIR}/express_${TIMESTAMP}_$(echo $endpoint | sed 's/\//_/g').txt"
    run_test "$EXPRESS_URL" "Express" "$endpoint" "$EXPRESS_OUTPUT"
    
    # Wait a bit between tests
    sleep 2
    
    # Fastify test
    FASTIFY_OUTPUT="${RESULTS_DIR}/fastify_${TIMESTAMP}_$(echo $endpoint | sed 's/\//_/g').txt"
    run_test "$FASTIFY_URL" "Fastify" "$endpoint" "$FASTIFY_OUTPUT"
    
    sleep 2
done

# Generate comparison report
echo -e "\n\n${BLUE}========================================${NC}"
echo -e "${BLUE}📊 COMPARISON SUMMARY${NC}"
echo -e "${BLUE}========================================${NC}\n"

REPORT_FILE="${RESULTS_DIR}/comparison_report_${TIMESTAMP}.md"

cat > "$REPORT_FILE" << EOF
# Load Testing Comparison Report
**Date:** $(date)
**Configuration:** $CONNECTIONS connections, ${DURATION}s duration

## Results

EOF

for endpoint in "${ENDPOINTS[@]}"; do
    endpoint_slug=$(echo $endpoint | sed 's/\//_/g')
    EXPRESS_FILE="${RESULTS_DIR}/express_${TIMESTAMP}_${endpoint_slug}.txt"
    FASTIFY_FILE="${RESULTS_DIR}/fastify_${TIMESTAMP}_${endpoint_slug}.txt"
    
    echo -e "${GREEN}${endpoint}${NC}"
    echo "### $endpoint" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    if [ -f "$EXPRESS_FILE" ] && [ -f "$FASTIFY_FILE" ]; then
        EXPRESS_RPS=$(grep "Req/Sec" "$EXPRESS_FILE" | head -1 | awk '{print $2}')
        FASTIFY_RPS=$(grep "Req/Sec" "$FASTIFY_FILE" | head -1 | awk '{print $2}')
        
        EXPRESS_LAT=$(grep "Latency" "$EXPRESS_FILE" | head -1 | awk '{print $2}')
        FASTIFY_LAT=$(grep "Latency" "$FASTIFY_FILE" | head -1 | awk '{print $2}')
        
        echo "  Express: ${EXPRESS_RPS} req/s, ${EXPRESS_LAT}ms latency"
        echo "  Fastify: ${FASTIFY_RPS} req/s, ${FASTIFY_LAT}ms latency"
        
        echo "| Metric | Express | Fastify |" >> "$REPORT_FILE"
        echo "|--------|---------|---------|" >> "$REPORT_FILE"
        echo "| Req/Sec | ${EXPRESS_RPS} | ${FASTIFY_RPS} |" >> "$REPORT_FILE"
        echo "| Latency | ${EXPRESS_LAT}ms | ${FASTIFY_LAT}ms |" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
    else
        echo "  ❌ Results not found"
        echo "**Error:** Results not found" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
    fi
done

echo -e "\n${GREEN}✅ Load testing complete!${NC}"
echo -e "${BLUE}📄 Full report saved to: ${REPORT_FILE}${NC}"
echo -e "${BLUE}📁 Raw results in: ${RESULTS_DIR}${NC}\n"

# Cleanup old results (keep last 5)
echo -e "${YELLOW}🧹 Cleaning up old results...${NC}"
cd "$RESULTS_DIR"
ls -t comparison_report_*.md 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null || true
cd - > /dev/null

echo -e "${GREEN}Done!${NC}\n"

