#!/bin/bash
cd "$(dirname "$0")"
cp .env.development .env
echo "✅ Prepnuté na DEVELOPMENT databázu"
echo "   Host: switchyard.proxy.rlwy.net:41478"
echo ""
echo "🚀 Môžeš spustiť: npm run dev"
