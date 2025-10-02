#!/bin/bash

# 🔍 Pre-Development Checker
# Skontroluje všetko pred začatím kódenia

echo "🔍 BlackRent Pre-Development Check..."

# 1. Kontrola či aplikácia beží
echo "📡 Kontrolujem či aplikácia beží..."
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Frontend nebeží na porte 3000"
    echo "💡 Spusti: npm run dev:safe"
    exit 1
fi

if ! curl -s http://localhost:3001/api/health > /dev/null; then
    echo "❌ Backend nebeží na porte 3001"
    echo "💡 Spusti: npm run dev:safe"
    exit 1
fi

# 2. TypeScript check
echo "📝 Kontrolujem TypeScript..."
if ! npx tsc --noEmit --skipLibCheck; then
    echo "⚠️  TypeScript chyby detekované!"
    echo "💡 Oprav ich pred kódením aby si predišiel problémom"
fi

# 3. Linter check
echo "🧹 Kontrolujem ESLint..."
if command -v eslint &> /dev/null; then
    npx eslint src/ --ext .ts,.tsx --max-warnings 0 || echo "⚠️  ESLint warnings/errors"
fi

# 4. Kontrola git stavu
echo "📂 Kontrolujem Git stav..."
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Máš uncommitted zmeny:"
    git status --short
    echo "💡 Zváž commit pred veľkými zmenami"
fi

# 5. Kontrola package.json integrity
echo "📦 Kontrolujem package integrity..."
if ! npm ls > /dev/null 2>&1; then
    echo "⚠️  Dependency problémy detekované"
    echo "💡 Spusti: npm install"
fi

echo ""
echo "✅ Pre-Development Check dokončený!"
echo "🚀 Môžeš začať kódovať bezpečne!"
echo ""
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:3001"
