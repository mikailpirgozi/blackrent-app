#!/bin/bash

# BlackRent Customer Website Startup Script - OPTIMIZED
# This ensures the server ALWAYS starts from the correct directory with robust error handling

set -e  # Exit on any error

# Colors for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory (works even if called from elsewhere)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CUSTOMER_WEBSITE_DIR="$SCRIPT_DIR/customer-website"

echo -e "${BLUE}🚀 Starting BlackRent Customer Website...${NC}"
echo -e "${YELLOW}📁 Script location: $SCRIPT_DIR${NC}"
echo -e "${YELLOW}🎯 Target directory: $CUSTOMER_WEBSITE_DIR${NC}"

# Check if customer-website directory exists
if [ ! -d "$CUSTOMER_WEBSITE_DIR" ]; then
    echo -e "${RED}❌ Error: customer-website directory not found at $CUSTOMER_WEBSITE_DIR${NC}"
    echo -e "${RED}   Please make sure you're running this script from the BlackRent Beta 2 directory${NC}"
    exit 1
fi

# Change to customer-website directory
cd "$CUSTOMER_WEBSITE_DIR"
echo -e "${GREEN}📁 Changed to: $(pwd)${NC}"

# Verify package.json exists
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found in $(pwd)${NC}"
    echo -e "${RED}   This doesn't appear to be a valid Node.js project directory${NC}"
    exit 1
fi

# Verify it's the correct package.json (check for Next.js)
if ! grep -q "next" package.json; then
    echo -e "${RED}❌ Error: This doesn't appear to be a Next.js project${NC}"
    echo -e "${RED}   Expected to find 'next' in package.json${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Found valid Next.js package.json${NC}"

# Check if port 3002 is already in use
if lsof -i :3002 >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port 3002 is already in use. Attempting to kill existing process...${NC}"
    pkill -f "next dev -p 3002" || true
    sleep 2
    
    # Check again
    if lsof -i :3002 >/dev/null 2>&1; then
        echo -e "${RED}❌ Error: Could not free port 3002. Please manually stop the process using port 3002${NC}"
        echo -e "${YELLOW}   You can run: lsof -i :3002 to see what's using the port${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Port 3002 is now free${NC}"
fi

# Clear npm cache to avoid issues
echo -e "${YELLOW}🧹 Clearing npm cache...${NC}"
npm cache clean --force >/dev/null 2>&1 || true

echo -e "${GREEN}🔧 Starting Next.js development server...${NC}"
echo -e "${BLUE}🌐 Server will be available at: http://localhost:3002${NC}"
echo -e "${YELLOW}💡 Press Ctrl+C to stop the server${NC}"
echo ""

# Start the development server
exec npm run dev
