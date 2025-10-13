#!/bin/bash

# Performance Testing Master Script
# Spustí Express, Fastify a vykoná performance comparison

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Cleanup function
cleanup() {
    echo -e "\n${YELLOW}🧹 Zastavujem servery...${NC}"
    if [ ! -z "$EXPRESS_PID" ]; then
        kill $EXPRESS_PID 2>/dev/null || true
    fi
    if [ ! -z "$FASTIFY_PID" ]; then
        kill $FASTIFY_PID 2>/dev/null || true
    fi
    # Kill any remaining node processes on ports 3000 and 3001
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
    echo -e "${GREEN}✅ Cleanup dokončený${NC}\n"
}

# Register cleanup on exit
trap cleanup EXIT INT TERM

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}🚀 BlackRent Performance Testing Suite${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Check if servers are already running
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port 3000 je už obsadený. Zastavujem...${NC}"
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port 3001 je už obsadený. Zastavujem...${NC}"
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
    sleep 2
fi

# Step 1: Get test token
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📋 Krok 1/5: Získavam test token...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# Start Express temporarily to get token
echo -e "${CYAN}🔧 Spúšťam dočasný Express server...${NC}"
PORT=3000 npm run dev:express > /dev/null 2>&1 &
EXPRESS_TEMP_PID=$!

# Wait for Express to start
echo -e "${CYAN}⏳ Čakám na spustenie servera...${NC}"
sleep 5

# Check if Express is running
if ! lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${RED}❌ Nepodarilo sa spustiť Express server${NC}"
    exit 1
fi

# Get token
echo -e "${CYAN}🔐 Získavam JWT token...${NC}"
npm run get-token

# Stop temporary Express
kill $EXPRESS_TEMP_PID 2>/dev/null || true
sleep 2

# Load token
if [ -f .test.env ]; then
    source .test.env
    echo -e "${GREEN}✅ Token načítaný${NC}\n"
else
    echo -e "${RED}❌ Nepodarilo sa načítať token${NC}"
    exit 1
fi

# Step 2: Start Express server
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📋 Krok 2/5: Spúšťam Express server (port 3000)...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

PORT=3000 npm run dev:express > express.log 2>&1 &
EXPRESS_PID=$!

echo -e "${CYAN}⏳ Čakám na Express server...${NC}"
sleep 5

# Verify Express is running
if curl -s http://localhost:3000/api/debug/test-connection > /dev/null; then
    echo -e "${GREEN}✅ Express server beží na porte 3000${NC}\n"
else
    echo -e "${RED}❌ Express server sa nepodarilo spustiť${NC}"
    cat express.log
    exit 1
fi

# Step 3: Start Fastify server
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📋 Krok 3/5: Spúšťam Fastify server (port 3001)...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

PORT=3001 npm run dev:fastify > fastify.log 2>&1 &
FASTIFY_PID=$!

echo -e "${CYAN}⏳ Čakám na Fastify server...${NC}"
sleep 5

# Verify Fastify is running
if curl -s http://localhost:3001/api/debug/test-connection > /dev/null; then
    echo -e "${GREEN}✅ Fastify server beží na porte 3001${NC}\n"
else
    echo -e "${RED}❌ Fastify server sa nepodarilo spustiť${NC}"
    cat fastify.log
    exit 1
fi

# Step 4: Run response time comparison
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📋 Krok 4/5: Response Time Comparison${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

npm run test:performance

# Step 5: Run load testing (optional)
echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📋 Krok 5/5: Load Testing (optional)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

read -p "Chcete spustiť load testing? (áno/nie) [nie]: " RUN_LOAD_TEST
RUN_LOAD_TEST=${RUN_LOAD_TEST:-nie}

if [ "$RUN_LOAD_TEST" = "áno" ] || [ "$RUN_LOAD_TEST" = "ano" ] || [ "$RUN_LOAD_TEST" = "y" ] || [ "$RUN_LOAD_TEST" = "yes" ]; then
    echo -e "${CYAN}🚀 Spúšťam load testing...${NC}\n"
    npm run test:load-comparison
else
    echo -e "${YELLOW}⏭️  Load testing preskočený${NC}\n"
fi

# Summary
echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Performance testing dokončený!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "${CYAN}📊 Výsledky:${NC}"
echo -e "  - Express log: ${YELLOW}express.log${NC}"
echo -e "  - Fastify log: ${YELLOW}fastify.log${NC}"
if [ -d "performance-results" ]; then
    echo -e "  - Load test results: ${YELLOW}performance-results/${NC}"
fi

echo -e "\n${CYAN}📋 Ďalšie kroky:${NC}"
echo -e "  1. Skontroluj výsledky vyššie"
echo -e "  2. Porovnaj response times a throughput"
echo -e "  3. Rozhodni sa o prepnutí na Fastify"
echo -e "  4. Deploy na production\n"

echo -e "${BLUE}💡 Tip:${NC} Ak Fastify je >30% rýchlejší, odporúčam prepnutie na production\n"

# Wait before cleanup
echo -e "${YELLOW}Stlačte ENTER pre zastavenie serverov...${NC}"
read

# Cleanup will be called automatically by trap

