#!/bin/bash

echo "🔧 Spúšťam opravu existujúcich protokolov na Railway..."

# Nastavenie Railway CLI
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI nie je nainštalované. Inštalujte ho cez: npm install -g @railway/cli"
    exit 1
fi

# Spustenie opravy na Railway
echo "🚀 Spúšťam fix-existing-protocols.js na Railway..."
railway run -- npm run fix-protocols

echo "✅ Oprava protokolov dokončená!"
echo "📋 Teraz by mali všetky existujúce protokoly mať správne vyplnené pdfUrl"
echo "🎯 Skúste teraz stiahnuť PDF z existujúcich protokolov - malo by sa sťahovať z R2 namiesto generovania nového" 