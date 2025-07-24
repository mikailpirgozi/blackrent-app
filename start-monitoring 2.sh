#!/bin/bash

# 🔍 AI Monitoring Manager
echo "🔍 AI Monitoring Manager"
echo "======================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'  
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PID_FILE="./logs/monitoring.pids"

start_monitoring() {
    echo -e "${BLUE}🚀 Starting all monitoring services...${NC}"
    
    # Create logs directory
    mkdir -p ./logs
    
    # Clear old PIDs
    > "$PID_FILE"
    
    # Start Railway Monitor
    ./railway-monitor.sh &
    echo "railway-monitor:$!" >> "$PID_FILE"
    echo -e "${GREEN}✅ Railway Monitor started (PID: $!)${NC}"
    
    # Start Database Monitor  
    ./db-monitor.sh &
    echo "db-monitor:$!" >> "$PID_FILE"
    echo -e "${GREEN}✅ Database Monitor started (PID: $!)${NC}"
    
    # Start Performance Monitor
    ./performance-monitor.sh &
    echo "performance-monitor:$!" >> "$PID_FILE" 
    echo -e "${GREEN}✅ Performance Monitor started (PID: $!)${NC}"
    
    # Start Error Tracker
    ./error-tracker.sh &
    echo "error-tracker:$!" >> "$PID_FILE"
    echo -e "${GREEN}✅ Error Tracker started (PID: $!)${NC}"
    
    echo ""
    echo -e "${BLUE}📊 All monitoring services are running in background${NC}"
    echo -e "${YELLOW}💡 Use './start-monitoring.sh stop' to stop all services${NC}"
    echo -e "${YELLOW}📁 Logs are written to ./logs/ directory${NC}"
    echo -e "${YELLOW}🔍 Monitor in real-time: tail -f ./logs/*.log${NC}"
}

stop_monitoring() {
    echo -e "${BLUE}⏹️  Stopping all monitoring services...${NC}"
    
    if [ ! -f "$PID_FILE" ]; then
        echo -e "${YELLOW}⚠️  No monitoring services found${NC}"
        return
    fi
    
    while IFS=: read -r name pid; do
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid"
            echo -e "${GREEN}✅ Stopped $name (PID: $pid)${NC}"
        else
            echo -e "${YELLOW}⚠️  $name (PID: $pid) was already stopped${NC}"
        fi
    done < "$PID_FILE"
    
    rm -f "$PID_FILE"
    echo -e "${BLUE}🔄 All monitoring services stopped${NC}"
}

status_monitoring() {
    echo -e "${BLUE}📊 Monitoring Services Status:${NC}"
    echo "================================"
    
    if [ ! -f "$PID_FILE" ]; then
        echo -e "${RED}❌ No monitoring services running${NC}"
        return
    fi
    
    while IFS=: read -r name pid; do
        if kill -0 "$pid" 2>/dev/null; then
            echo -e "${GREEN}✅ $name: RUNNING (PID: $pid)${NC}"
        else
            echo -e "${RED}❌ $name: STOPPED (PID: $pid)${NC}"
        fi
    done < "$PID_FILE"
    
    echo ""
    echo -e "${BLUE}📁 Log Files:${NC}"
    for log in ./logs/*.log; do
        if [ -f "$log" ]; then
            lines=$(wc -l < "$log" 2>/dev/null)
            size=$(du -h "$log" 2>/dev/null | cut -f1)
            echo "📄 $(basename $log): $lines lines ($size)"
        fi
    done
}

# Main execution
case "${1:-start}" in
    "start")
        start_monitoring
        ;;
    "stop")
        stop_monitoring
        ;;
    "status")
        status_monitoring
        ;;
    "restart")
        stop_monitoring
        sleep 2
        start_monitoring
        ;;
    "test")
        echo "🧪 Running monitoring test..."
        ./test-monitoring.sh
        ;;
    *)
        echo "Usage: $0 [start|stop|status|restart|test]"
        echo ""
        echo "Commands:"
        echo "  start   - Start all monitoring services"
        echo "  stop    - Stop all monitoring services"  
        echo "  status  - Show status of all services"
        echo "  restart - Restart all services"
        echo "  test    - Test all services for 10 seconds"
        ;;
esac 