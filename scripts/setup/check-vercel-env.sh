#!/bin/bash

echo "🔍 Kontrola Vercel environment variables..."

# Kontrola či Vercel CLI je nainštalované
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI nie je nainštalované"
    echo "📦 Inštaluj: npm install -g vercel"
    exit 1
fi

echo "✅ Vercel CLI je nainštalované"

# Kontrola environment variables
echo ""
echo "🌍 Environment variables v .env súbore:"
if [ -f ".env" ]; then
    cat .env
else
    echo "❌ .env súbor neexistuje"
fi

echo ""
echo "📋 Potrebné environment variables pre Cloudflare Worker:"
echo "REACT_APP_USE_WORKER_PROXY=true"
echo "REACT_APP_WORKER_URL=https://blackrent-upload-worker.r2workerblackrentapp.workers.dev"
echo "REACT_APP_API_URL=https://blackrent-app-production-4d6f.up.railway.app/api"

echo ""
echo "🚀 Cloudflare Worker URL:"
echo "https://blackrent-upload-worker.r2workerblackrentapp.workers.dev"

echo ""
echo "📝 Inštrukcie pre Vercel:"
echo "1. Choď na https://vercel.com/dashboard"
echo "2. Vyber projekt blackrent-app"
echo "3. Settings → Environment Variables"
echo "4. Pridaj:"
echo "   - REACT_APP_USE_WORKER_PROXY = true"
echo "   - REACT_APP_WORKER_URL = https://blackrent-upload-worker.r2workerblackrentapp.workers.dev"
echo "5. Redeploy projekt" 