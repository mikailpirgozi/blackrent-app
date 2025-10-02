#!/bin/bash

# 🛡️ BlackRent Safe Development Mode
# Predchádza všetkým možným problémom

echo "🛡️ BlackRent Safe Dev Mode - Preventívne riešenie problémov..."

# 1. Kontrola či beží iná inštancia
echo "🔍 Kontrolujem existujúce procesy..."
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 3000 je obsadený, čistím..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
fi

if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 3001 je obsadený, čistím..."
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
fi

# 2. Kontrola node_modules
echo "📦 Kontrolujem node_modules..."
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
    echo "⚠️  Node modules chýbajú alebo sú poškodené, inštalujem..."
    rm -rf node_modules package-lock.json
    npm install
fi

# 3. Kontrola backend dependencies
echo "🔧 Kontrolujem backend dependencies..."
if [ ! -d "backend/node_modules" ]; then
    echo "⚠️  Backend dependencies chýbajú, inštalujem..."
    cd backend && npm install && cd ..
fi

# 4. Vyčistenie cache preventívne
echo "🧹 Preventívne čistenie cache..."
rm -rf node_modules/.vite 2>/dev/null || true
rm -rf .vite 2>/dev/null || true
rm -f tsconfig.tsbuildinfo 2>/dev/null || true

# 5. Kontrola TypeScript
echo "📝 Kontrolujem TypeScript..."
if ! npx tsc --noEmit --skipLibCheck; then
    echo "❌ TypeScript chyby detekované!"
    echo "💡 Spusti: npx tsc --noEmit pre detaily"
    echo "🔧 Alebo pokračuj s: npm run dev:start --force"
    read -p "Pokračovať aj s TS chybami? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 6. Bezpečné spustenie
echo "🚀 Spúšťam v bezpečnom móde..."
npm run dev:start

echo ""
echo "✅ Safe Dev Mode aktívny!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:3001"
echo ""
echo "💡 Pre budúce použitie: npm run dev:safe"
