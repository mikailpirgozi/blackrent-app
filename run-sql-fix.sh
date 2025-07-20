#!/bin/bash

echo "🔧 Spúšťam SQL opravu existujúcich protokolov na Railway..."

# Spustenie SQL skriptu na Railway
echo "🚀 Spúšťam fix-protocols.sql na Railway..."
railway run -- psql $DATABASE_URL -f fix-protocols.sql

echo "✅ SQL oprava protokolov dokončená!"
echo "📋 Teraz by mali všetky existujúce protokoly mať správne vyplnené pdfUrl"
echo "🎯 Skúste teraz stiahnuť PDF z existujúcich protokolov - malo by sa sťahovať z R2 namiesto generovania nového" 