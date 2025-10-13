#!/bin/bash
cd "$(dirname "$0")"
cp .env.production .env
echo "⚠️  VAROVANIE: Prepnuté na PRODUCTION databázu!"
echo "   Host: trolley.proxy.rlwy.net:13400"
echo ""
echo "🛡️  Buď opatrný! Toto je živá databáza!"
echo ""
read -p "Pokračovať? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "❌ Zrušené, zostáva DEV"
    cp .env.development .env
    exit 1
fi
echo "✅ Pripojený k PRODUCTION"
