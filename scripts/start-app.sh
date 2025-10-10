#!/bin/bash

# BlackRent Application Startup Script
# Tento script zabezpečuje stabilné spustenie aplikácie

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_PORT=3000
BACKEND_PORT=3001
PROJECT_ROOT="/Users/mikailpirgozi/Desktop/Cursor zalohy mac16/Blackrent Beta 2"
BACKEND_DIR="$PROJECT_ROOT/apps/backend"
FRONTEND_DIR="$PROJECT_ROOT/apps/web"

echo -e "${BLUE}🚀 BlackRent Application Startup Script${NC}"
echo -e "${BLUE}=====================================${NC}"

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -i :$port >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill processes on specific ports
kill_port_processes() {
    local port=$1
    echo -e "${YELLOW}🔍 Checking port $port...${NC}"
    
    if check_port $port; then
        echo -e "${YELLOW}⚠️  Port $port is in use. Killing processes...${NC}"
        lsof -ti :$port | xargs kill -9 2>/dev/null || true
        sleep 2
        
        if check_port $port; then
            echo -e "${RED}❌ Failed to free port $port${NC}"
            exit 1
        else
            echo -e "${GREEN}✅ Port $port is now free${NC}"
        fi
    else
        echo -e "${GREEN}✅ Port $port is free${NC}"
    fi
}

# Function to start backend
start_backend() {
    echo -e "${BLUE}🔧 Starting Backend...${NC}"
    cd "$BACKEND_DIR"
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
        npm install
    fi
    
    # Start backend in background
    npm run dev > "$PROJECT_ROOT/backend.log" 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > "$PROJECT_ROOT/backend.pid"
    
    # Wait for backend to start
    echo -e "${YELLOW}⏳ Waiting for backend to start...${NC}"
    for i in {1..30}; do
        if curl -s http://localhost:$BACKEND_PORT/api/health >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Backend is running on port $BACKEND_PORT${NC}"
            return 0
        fi
        sleep 2
        echo -n "."
    done
    
    echo -e "${RED}❌ Backend failed to start${NC}"
    return 1
}

# Function to start frontend
start_frontend() {
    echo -e "${BLUE}🎨 Starting Frontend...${NC}"
    cd "$FRONTEND_DIR"
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
        npm install
    fi
    
    # Start frontend in background
    npm run dev > "$PROJECT_ROOT/frontend.log" 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > "$PROJECT_ROOT/frontend.pid"
    
    # Wait for frontend to start
    echo -e "${YELLOW}⏳ Waiting for frontend to start...${NC}"
    for i in {1..30}; do
        if curl -s http://localhost:$FRONTEND_PORT >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Frontend is running on port $FRONTEND_PORT${NC}"
            return 0
        fi
        sleep 2
        echo -n "."
    done
    
    echo -e "${RED}❌ Frontend failed to start${NC}"
    return 1
}

# Function to cleanup on exit
cleanup() {
    echo -e "${YELLOW}🧹 Cleaning up...${NC}"
    if [ -f "$PROJECT_ROOT/backend.pid" ]; then
        BACKEND_PID=$(cat "$PROJECT_ROOT/backend.pid")
        kill $BACKEND_PID 2>/dev/null || true
        rm -f "$PROJECT_ROOT/backend.pid"
    fi
    
    if [ -f "$PROJECT_ROOT/frontend.pid" ]; then
        FRONTEND_PID=$(cat "$PROJECT_ROOT/frontend.pid")
        kill $FRONTEND_PID 2>/dev/null || true
        rm -f "$PROJECT_ROOT/frontend.pid"
    fi
}

# Set up signal handlers
trap cleanup EXIT INT TERM

# Main execution
echo -e "${BLUE}🔍 Pre-startup checks...${NC}"

# Kill any existing processes on our ports
kill_port_processes $BACKEND_PORT
kill_port_processes $FRONTEND_PORT

# Start backend
if start_backend; then
    echo -e "${GREEN}✅ Backend started successfully${NC}"
else
    echo -e "${RED}❌ Failed to start backend${NC}"
    exit 1
fi

# Start frontend
if start_frontend; then
    echo -e "${GREEN}✅ Frontend started successfully${NC}"
else
    echo -e "${RED}❌ Failed to start frontend${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 BlackRent Application is running!${NC}"
echo -e "${BLUE}📱 Frontend: http://localhost:$FRONTEND_PORT${NC}"
echo -e "${BLUE}🔧 Backend:  http://localhost:$BACKEND_PORT${NC}"
echo -e "${YELLOW}📋 Logs: backend.log, frontend.log${NC}"
echo -e "${YELLOW}🛑 Press Ctrl+C to stop${NC}"

# Keep script running and monitor processes
while true; do
    sleep 10
    
    # Check if backend is still running
    if ! curl -s http://localhost:$BACKEND_PORT/api/health >/dev/null 2>&1; then
        echo -e "${RED}❌ Backend is down! Restarting...${NC}"
        start_backend
    fi
    
    # Check if frontend is still running
    if ! curl -s http://localhost:$FRONTEND_PORT >/dev/null 2>&1; then
        echo -e "${RED}❌ Frontend is down! Restarting...${NC}"
        start_frontend
    fi
done
