#!/bin/bash

# Database Refactoring Safety Test
# Testuje všetky databázové operácie pred a po refaktoringu

echo "🧪 DATABASE REFACTORING SAFETY TEST"
echo "===================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test counter
TESTS_TOTAL=0
TESTS_PASSED=0
TESTS_FAILED=0

# Get auth token
echo -e "${BLUE}🔐 Získavam autentifikačný token...${NC}"
TOKEN_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d '{"username":"admin","password":"Black123"}' http://localhost:3001/api/auth/login)
TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Nepodarilo sa získať token!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Token získaný${NC}"

# Test function
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_pattern="$3"
    
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    echo -e "${BLUE}Test $TESTS_TOTAL: $test_name${NC}"
    
    result=$(eval "$test_command" 2>/dev/null)
    
    if echo "$result" | grep -q "$expected_pattern"; then
        echo -e "${GREEN}✅ PASSED${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}❌ FAILED${NC}"
        echo -e "${YELLOW}Expected: $expected_pattern${NC}"
        echo -e "${YELLOW}Got: $result${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    echo ""
}

echo -e "${BLUE}📊 Testujem databázové operácie...${NC}"

# Test 1: Vehicles endpoint
run_test "Vehicles List" \
    "curl -s -H 'Authorization: Bearer $TOKEN' http://localhost:3001/api/vehicles | jq -r '.success // .length'" \
    "true\|[0-9]"

# Test 2: Rentals endpoint  
run_test "Rentals List" \
    "curl -s -H 'Authorization: Bearer $TOKEN' http://localhost:3001/api/rentals | jq -r '.success // .length'" \
    "true\|[0-9]"

# Test 3: Customers endpoint
run_test "Customers List" \
    "curl -s -H 'Authorization: Bearer $TOKEN' http://localhost:3001/api/customers | jq -r '.success // .length'" \
    "true\|[0-9]"

# Test 4: Companies endpoint
run_test "Companies List" \
    "curl -s -H 'Authorization: Bearer $TOKEN' http://localhost:3001/api/companies | jq -r '.success // .length'" \
    "true\|[0-9]"

# Test 5: Users endpoint
run_test "Users List" \
    "curl -s -H 'Authorization: Bearer $TOKEN' http://localhost:3001/api/users | jq -r '.success // .length'" \
    "true\|[0-9]"

# Test 6: Expenses endpoint
run_test "Expenses List" \
    "curl -s -H 'Authorization: Bearer $TOKEN' http://localhost:3001/api/expenses | jq -r '.success // .length'" \
    "true\|[0-9]"

# Test 7: Insurance endpoint
run_test "Insurance List" \
    "curl -s -H 'Authorization: Bearer $TOKEN' http://localhost:3001/api/insurances | jq -r '.success // .length'" \
    "true\|[0-9]"

# Test 8: Settlements endpoint
run_test "Settlements List" \
    "curl -s -H 'Authorization: Bearer $TOKEN' http://localhost:3001/api/settlements | jq -r '.success // .length'" \
    "true\|[0-9]"

# Test 9: Database connection
run_test "Database Health" \
    "curl -s http://localhost:3001/api/health | jq -r '.database'" \
    "PostgreSQL"

# Test 10: Count total records (should remain same)
VEHICLE_COUNT=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/vehicles | jq '. | length // 0')
RENTAL_COUNT=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/rentals | jq '. | length // 0')
CUSTOMER_COUNT=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/customers | jq '. | length // 0')

echo -e "${BLUE}📊 POČET ZÁZNAMOV:${NC}"
echo "Vehicles: $VEHICLE_COUNT"
echo "Rentals: $RENTAL_COUNT" 
echo "Customers: $CUSTOMER_COUNT"
echo ""

# Save counts for later comparison
echo "$VEHICLE_COUNT,$RENTAL_COUNT,$CUSTOMER_COUNT" > /tmp/db_counts_before.txt

# Results
echo "===================================="
echo -e "${BLUE}📊 VÝSLEDKY TESTOVANIA${NC}"
echo "===================================="
echo -e "Celkom testov: ${BLUE}$TESTS_TOTAL${NC}"
echo -e "Úspešné: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Neúspešné: ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 VŠETKY TESTY PREŠLI!${NC}"
    echo -e "${GREEN}✅ Databáza funguje správne${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}❌ NIEKTORÉ TESTY ZLYHALI!${NC}"
    exit 1
fi
