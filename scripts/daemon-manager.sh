#!/bin/bash

# 🚀 BlackRent Daemon Manager
# Spravuje BlackRent ako systémový daemon

DAEMON_NAME="blackrent-daemon"
PID_FILE="logs/daemon.pid"
LOG_FILE="logs/daemon.log"

start_daemon() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p $PID > /dev/null 2>&1; then
            echo "✅ Daemon už beží (PID: $PID)"
            return 0
        else
            rm -f "$PID_FILE"
        fi
    fi
    
    echo "🚀 Spúšťam BlackRent daemon..."
    
    # Spusti aplikáciu
    npm run dev:start > /dev/null 2>&1 &
    sleep 5
    
    # Spusti keep-alive v pozadí
    nohup ./scripts/keep-alive.sh >> "$LOG_FILE" 2>&1 &
    DAEMON_PID=$!
    echo $DAEMON_PID > "$PID_FILE"
    
    echo "✅ Daemon spustený (PID: $DAEMON_PID)"
    echo "📊 Log: tail -f $LOG_FILE"
    echo "�� Stop: ./scripts/daemon-manager.sh stop"
}

stop_daemon() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p $PID > /dev/null 2>&1; then
            echo "🛑 Zastavujem daemon (PID: $PID)..."
            kill $PID
            rm -f "$PID_FILE"
            npm run dev:stop > /dev/null 2>&1
            echo "✅ Daemon zastavený"
        else
            echo "⚠️ Daemon nebeží"
            rm -f "$PID_FILE"
        fi
    else
        echo "⚠️ PID file nenájdený"
        npm run dev:stop > /dev/null 2>&1
    fi
}

status_daemon() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p $PID > /dev/null 2>&1; then
            echo "✅ Daemon beží (PID: $PID)"
            echo "📊 Backend: $(lsof -i :3001 > /dev/null 2>&1 && echo "✅" || echo "❌")"
            echo "📊 Frontend: $(lsof -i :3000 > /dev/null 2>&1 && echo "✅" || echo "❌")"
        else
            echo "❌ Daemon nebeží (PID file existuje ale proces nie)"
            rm -f "$PID_FILE"
        fi
    else
        echo "❌ Daemon nebeží"
    fi
}

case "$1" in
    start)
        start_daemon
        ;;
    stop)
        stop_daemon
        ;;
    restart)
        stop_daemon
        sleep 2
        start_daemon
        ;;
    status)
        status_daemon
        ;;
    *)
        echo "Použitie: $0 {start|stop|restart|status}"
        echo ""
        echo "🚀 start   - Spusti BlackRent daemon"
        echo "🛑 stop    - Zastav BlackRent daemon"
        echo "🔄 restart - Reštartuj BlackRent daemon"
        echo "📊 status  - Zobraz stav daemon"
        exit 1
        ;;
esac
