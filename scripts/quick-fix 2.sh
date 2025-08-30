#!/bin/bash

# 🚀 BlackRent Quick Fix Script
# Rieši všetky cache problémy jedným príkazom

echo "🧹 BlackRent Quick Cache Fix - Riešim všetky cache problémy..."

# 1. Zastavím všetky procesy
echo "🛑 Zastavujem všetky procesy..."
npm run dev:stop 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
pkill -f "ts-node" 2>/dev/null || true
pkill -f "nodemon" 2>/dev/null || true

# 2. Vyčistím všetky cache
echo "🧹 Čistím všetky cache súbory..."
rm -rf node_modules/.vite
rm -rf node_modules/.cache
rm -rf dist
rm -rf .vite
rm -rf build
rm -rf backend/dist
rm -rf .next
rm -rf .turbo

# 3. Vyčistím TypeScript cache
echo "📝 Čistím TypeScript cache..."
rm -f tsconfig.tsbuildinfo
rm -f backend/tsconfig.tsbuildinfo

# 4. Vyčistím browser cache pomocou timestamp
echo "🌐 Generujem nový cache-busting timestamp..."
TIMESTAMP=$(date +%s)
echo "export const CACHE_BUST = '$TIMESTAMP';" > src/utils/cache-bust.ts

# 5. Vyčistím porty
echo "🔧 Čistím porty..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

# 6. Spustím aplikáciu
echo "🚀 Spúšťam aplikáciu s čistou cache..."
sleep 2
npm run dev:restart

echo ""
echo "✅ Quick Fix dokončený!"
echo "📱 Frontend: http://localhost:3000"
echo "🎯 Root-3: http://localhost:3000/root-3"
echo ""
echo "💡 Ak sa problém opakuje, spusti: npm run quick-fix"
