#!/bin/bash

# 🔧 Vite Troubleshooting Script
# Rieši bežné Vite problémy

echo "🔧 Vite Troubleshooting - BlackRent"
echo "=================================="

# Funkcia pre vyčistenie Vite cache
clear_vite_cache() {
    echo "🧹 Čistím Vite cache..."
    rm -rf node_modules/.vite
    rm -rf dist
    rm -rf .vite
    echo "✅ Vite cache vyčistená"
}

# Funkcia pre reset HMR
reset_hmr() {
    echo "🔄 Resetujem HMR..."
    pkill -f "vite"
    sleep 2
    echo "✅ HMR resetované"
}

# Funkcia pre kontrolu portov
check_ports() {
    echo "🔌 Kontrolujem porty..."
    
    if lsof -i :3000 > /dev/null 2>&1; then
        echo "⚠️  Port 3000 obsadený:"
        lsof -i :3000 | head -5
    else
        echo "✅ Port 3000 voľný"
    fi
    
    if lsof -i :24678 > /dev/null 2>&1; then
        echo "⚠️  HMR port 24678 obsadený:"
        lsof -i :24678 | head -5
    else
        echo "✅ HMR port 24678 voľný"
    fi
}

# Funkcia pre kontrolu environment variables
check_env() {
    echo "🌍 Kontrolujem environment variables..."
    
    if [ -f ".env.local" ]; then
        echo "✅ .env.local existuje"
        echo "📋 VITE_ premenné:"
        grep "^VITE_" .env.local || echo "❌ Žiadne VITE_ premenné"
    else
        echo "⚠️  .env.local neexistuje"
    fi
}

# Funkcia pre kontrolu importov
check_imports() {
    echo "📦 Kontrolujem problematické importy..."
    
    # Hľadaj importy bez extensions
    MISSING_EXT=$(find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "import.*from ['\"]\\./.*[^.tsx][^.ts]['\"]" 2>/dev/null || true)
    
    if [ -n "$MISSING_EXT" ]; then
        echo "⚠️  Súbory s importmi bez extensions:"
        echo "$MISSING_EXT"
    else
        echo "✅ Všetky importy majú extensions"
    fi
}

# Funkcia pre full reset
full_reset() {
    echo "💥 FULL RESET - všetko vyčistím a reštartujem..."
    
    # Stop všetko
    npm run dev:stop > /dev/null 2>&1
    pkill -f "vite" > /dev/null 2>&1
    pkill -f "node.*3000" > /dev/null 2>&1
    
    # Vyčisti cache
    clear_vite_cache
    
    # Reinstall dependencies
    echo "📦 Reinstalling dependencies..."
    rm -rf node_modules/.cache
    npm install --force > /dev/null 2>&1
    
    # Reštart
    echo "🚀 Reštartujem aplikáciu..."
    npm run daemon:restart
    
    echo "✅ Full reset dokončený"
}

# Main menu
case "$1" in
    "cache")
        clear_vite_cache
        ;;
    "hmr")
        reset_hmr
        ;;
    "ports")
        check_ports
        ;;
    "env")
        check_env
        ;;
    "imports")
        check_imports
        ;;
    "reset")
        full_reset
        ;;
    "all")
        echo "🔍 Spúšťam kompletnú diagnostiku..."
        check_ports
        echo ""
        check_env
        echo ""
        check_imports
        echo ""
        clear_vite_cache
        ;;
    *)
        echo "🎯 Použitie:"
        echo "  $0 cache    - Vyčisti Vite cache"
        echo "  $0 hmr      - Reset HMR"
        echo "  $0 ports    - Skontroluj porty"
        echo "  $0 env      - Skontroluj environment variables"
        echo "  $0 imports  - Skontroluj importy"
        echo "  $0 reset    - Full reset (NUCLEAR OPTION)"
        echo "  $0 all      - Spusti všetky kontroly"
        ;;
esac
