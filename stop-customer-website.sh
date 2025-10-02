#!/bin/bash

# BlackRent Customer Website Stop Script
# This safely stops the customer website development server

# Colors for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🛑 Stopping BlackRent Customer Website...${NC}"

# Check if port 3002 is in use
if lsof -i :3002 >/dev/null 2>&1; then
    echo -e "${YELLOW}🔍 Found process using port 3002${NC}"
    
    # Show what's running on port 3002
    echo -e "${YELLOW}📋 Process details:${NC}"
    lsof -i :3002
    
    echo -e "${YELLOW}⏹️  Stopping Next.js development server...${NC}"
    pkill -f "next dev -p 3002" || true
    
    # Wait a moment for graceful shutdown
    sleep 2
    
    # Force kill if still running
    if lsof -i :3002 >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Graceful shutdown failed, force killing...${NC}"
        pkill -9 -f "next dev -p 3002" || true
        sleep 1
    fi
    
    # Final check
    if lsof -i :3002 >/dev/null 2>&1; then
        echo -e "${RED}❌ Error: Could not stop the process on port 3002${NC}"
        echo -e "${YELLOW}   You may need to manually stop it:${NC}"
        echo -e "${YELLOW}   lsof -i :3002${NC}"
        echo -e "${YELLOW}   kill -9 <PID>${NC}"
        exit 1
    else
        echo -e "${GREEN}✅ Successfully stopped BlackRent Customer Website${NC}"
    fi
else
    echo -e "${GREEN}✅ No process found running on port 3002${NC}"
fi

echo -e "${BLUE}🎯 Customer website server is now stopped${NC}"
