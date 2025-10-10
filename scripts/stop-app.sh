#!/bin/bash

# BlackRent Application Stop Script
# Tento script zabezpečuje čisté zastavenie aplikácie

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_ROOT="/Users/mikailpirgozi/Desktop/Cursor zalohy mac16/Blackrent Beta 2"

echo -e "${BLUE}🛑 BlackRent Application Stop Script${NC}"
echo -e "${BLUE}===================================${NC}"

# Function to kill processes by PID file
kill_by_pid_file() {
    local pid_file=$1
    local service_name=$2
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 $pid 2>/dev/null; then
            echo -e "${YELLOW}🔍 Stopping $service_name (PID: $pid)...${NC}"
            kill $pid
            sleep 2
            
            # Force kill if still running
            if kill -0 $pid 2>/dev/null; then
                echo -e "${YELLOW}⚠️  Force killing $service_name...${NC}"
                kill -9 $pid
            fi
            
            echo -e "${GREEN}✅ $service_name stopped${NC}"
        else
            echo -e "${YELLOW}⚠️  $service_name was not running${NC}"
        fi
        rm -f "$pid_file"
    else
        echo -e "${YELLOW}⚠️  No PID file found for $service_name${NC}"
    fi
}

# Function to kill processes by port
kill_by_port() {
    local port=$1
    local service_name=$2
    
    if lsof -i :$port >/dev/null 2>&1; then
        echo -e "${YELLOW}🔍 Killing processes on port $port ($service_name)...${NC}"
        lsof -ti :$port | xargs kill -9 2>/dev/null || true
        sleep 1
        echo -e "${GREEN}✅ Port $port cleared${NC}"
    else
        echo -e "${GREEN}✅ Port $port is already free${NC}"
    fi
}

# Function to kill processes by name pattern
kill_by_pattern() {
    local pattern=$1
    local service_name=$2
    
    if pgrep -f "$pattern" >/dev/null; then
        echo -e "${YELLOW}🔍 Killing $service_name processes...${NC}"
        pkill -f "$pattern"
        sleep 2
        
        # Force kill if still running
        if pgrep -f "$pattern" >/dev/null; then
            echo -e "${YELLOW}⚠️  Force killing remaining $service_name processes...${NC}"
            pkill -9 -f "$pattern"
        fi
        
        echo -e "${GREEN}✅ $service_name processes killed${NC}"
    else
        echo -e "${GREEN}✅ No $service_name processes found${NC}"
    fi
}

# Stop by PID files first
kill_by_pid_file "$PROJECT_ROOT/backend.pid" "Backend"
kill_by_pid_file "$PROJECT_ROOT/frontend.pid" "Frontend"

# Kill by port (backup method)
kill_by_port 3001 "Backend"
kill_by_port 3000 "Frontend"

# Kill by process patterns (final cleanup)
kill_by_pattern "nodemon src/index.ts" "Backend Nodemon"
kill_by_pattern "ts-node src/index.ts" "Backend TS-Node"
kill_by_pattern "vite" "Frontend Vite"

# Clean up log files
echo -e "${YELLOW}🧹 Cleaning up log files...${NC}"
rm -f "$PROJECT_ROOT/backend.log"
rm -f "$PROJECT_ROOT/frontend.log"

echo -e "${GREEN}🎉 BlackRent Application stopped successfully!${NC}"
echo -e "${BLUE}📋 All processes and ports have been cleaned up${NC}"
