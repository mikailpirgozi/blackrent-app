#!/bin/bash

# Server Control Script pre BlackRent Customer Website
# Použitie: ./server-control.sh [start|stop|restart|status]

SERVER_PORT=3002
PID_FILE="server.pid"
LOG_FILE="server.log"

start_server() {
    if [ -f "$PID_FILE" ] && kill -0 `cat $PID_FILE` 2>/dev/null; then
        echo "Server už beží na porte $SERVER_PORT (PID: $(cat $PID_FILE))"
        return 1
    fi
    
    echo "Spúšťam server..."
    # Vyčistím cache
    rm -rf .next node_modules/.cache
    
    # Spustím server v pozadí
    npm run dev > $LOG_FILE 2>&1 &
    SERVER_PID=$!
    echo $SERVER_PID > $PID_FILE
    
    # Počkám na spustenie
    sleep 5
    
    if curl -s -I http://localhost:$SERVER_PORT > /dev/null; then
        echo "✅ Server úspešne spustený na http://localhost:$SERVER_PORT (PID: $SERVER_PID)"
    else
        echo "❌ Server sa nepodarilo spustiť"
        cat $LOG_FILE | tail -10
        return 1
    fi
}

stop_server() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat $PID_FILE)
        if kill -0 $PID 2>/dev/null; then
            echo "Zastavujem server (PID: $PID)..."
            kill $PID
            rm -f $PID_FILE
            echo "✅ Server zastavený"
        else
            echo "Server už nie je spustený"
            rm -f $PID_FILE
        fi
    else
        echo "PID súbor neexistuje, server pravdepodobne nie je spustený"
    fi
    
    # Zabezpečím zastavenie všetkých Next.js procesov
    pkill -f "next dev" 2>/dev/null || true
}

restart_server() {
    echo "Reštartujem server..."
    stop_server
    sleep 2
    start_server
}

server_status() {
    if [ -f "$PID_FILE" ] && kill -0 `cat $PID_FILE` 2>/dev/null; then
        PID=$(cat $PID_FILE)
        echo "✅ Server beží na http://localhost:$SERVER_PORT (PID: $PID)"
        
        # Skontroluj HTTP response
        if curl -s -I http://localhost:$SERVER_PORT > /dev/null; then
            echo "✅ HTTP server odpovedá"
        else
            echo "❌ HTTP server neodpovedá"
        fi
        
        # Ukáž posledné logy
        echo "Posledné logy:"
        tail -5 $LOG_FILE 2>/dev/null || echo "Log súbor neexistuje"
    else
        echo "❌ Server nie je spustený"
        if [ -f "$PID_FILE" ]; then
            rm -f $PID_FILE
        fi
    fi
}

case "$1" in
    start)
        start_server
        ;;
    stop)
        stop_server
        ;;
    restart)
        restart_server
        ;;
    status)
        server_status
        ;;
    *)
        echo "Použitie: $0 {start|stop|restart|status}"
        echo "  start   - Spustí development server"
        echo "  stop    - Zastaví server"
        echo "  restart - Reštartuje server"
        echo "  status  - Zobrazí stav servera"
        exit 1
        ;;
esac
