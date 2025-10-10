#!/bin/bash

# BlackRent Application Health Check Script
# Tento script kontroluje zdravie aplikácie

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

FRONTEND_PORT=3000
BACKEND_PORT=3001

echo -e "${BLUE}🏥 BlackRent Application Health Check${NC}"
echo -e "${BLUE}===================================${NC}"

# Function to check port
check_port() {
    local port=$1
    local service_name=$2
    
    if lsof -i :$port >/dev/null 2>&1; then
        echo -e "${GREEN}✅ $service_name is running on port $port${NC}"
        return 0
    else
        echo -e "${RED}❌ $service_name is NOT running on port $port${NC}"
        return 1
    fi
}

# Function to check HTTP endpoint
check_http_endpoint() {
    local url=$1
    local service_name=$2
    
    if curl -s --max-time 5 "$url" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ $service_name HTTP endpoint is responding${NC}"
        return 0
    else
        echo -e "${RED}❌ $service_name HTTP endpoint is NOT responding${NC}"
        return 1
    fi
}

# Function to check API health
check_api_health() {
    local response=$(curl -s --max-time 5 "http://localhost:$BACKEND_PORT/api/health" 2>/dev/null)
    
    if [ $? -eq 0 ] && echo "$response" | grep -q "success.*true"; then
        echo -e "${GREEN}✅ Backend API health check passed${NC}"
        echo -e "${BLUE}📋 API Response: $(echo "$response" | jq -r '.message' 2>/dev/null || echo 'OK')${NC}"
        return 0
    else
        echo -e "${RED}❌ Backend API health check failed${NC}"
        return 1
    fi
}

# Function to check WebSocket
check_websocket() {
    local response=$(curl -s --max-time 5 "http://localhost:$BACKEND_PORT/socket.io/" 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ WebSocket server is responding${NC}"
        return 0
    else
        echo -e "${RED}❌ WebSocket server is NOT responding${NC}"
        return 1
    fi
}

# Function to check process health
check_process_health() {
    local pattern=$1
    local service_name=$2
    
    if pgrep -f "$pattern" >/dev/null; then
        local pids=$(pgrep -f "$pattern")
        echo -e "${GREEN}✅ $service_name processes are running (PIDs: $pids)${NC}"
        return 0
    else
        echo -e "${RED}❌ $service_name processes are NOT running${NC}"
        return 1
    fi
}

# Main health checks
echo -e "${BLUE}🔍 Checking application health...${NC}"
echo

# Port checks
check_port $FRONTEND_PORT "Frontend"
check_port $BACKEND_PORT "Backend"
echo

# Process checks
check_process_health "vite" "Frontend Vite"
check_process_health "nodemon src/index.ts" "Backend Nodemon"
echo

# HTTP endpoint checks
check_http_endpoint "http://localhost:$FRONTEND_PORT" "Frontend"
check_http_endpoint "http://localhost:$BACKEND_PORT/api/health" "Backend API"
echo

# API health check
check_api_health
echo

# WebSocket check
check_websocket
echo

# Summary
echo -e "${BLUE}📊 Health Check Summary${NC}"
echo -e "${BLUE}======================${NC}"

# Count failures
failures=0

if ! check_port $FRONTEND_PORT "Frontend" >/dev/null 2>&1; then ((failures++)); fi
if ! check_port $BACKEND_PORT "Backend" >/dev/null 2>&1; then ((failures++)); fi
if ! check_http_endpoint "http://localhost:$FRONTEND_PORT" "Frontend" >/dev/null 2>&1; then ((failures++)); fi
if ! check_api_health >/dev/null 2>&1; then ((failures++)); fi

if [ $failures -eq 0 ]; then
    echo -e "${GREEN}🎉 All health checks passed! Application is healthy.${NC}"
    exit 0
else
    echo -e "${RED}⚠️  $failures health check(s) failed. Application needs attention.${NC}"
    exit 1
fi
