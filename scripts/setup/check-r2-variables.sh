#!/bin/bash

echo "🔍 KONTROLA R2 ENVIRONMENT VARIABLES"
echo "===================================="
echo ""

# Railway API URL
RAILWAY_API="https://blackrent-app-production-4d6f.up.railway.app/api"

echo "📋 1. Kontrola R2 konfigurácie..."
R2_STATUS=$(curl -s "$RAILWAY_API/migration/r2-status")
echo "$R2_STATUS" | jq .

echo ""
echo "📋 2. Kontrola files API..."
FILES_STATUS=$(curl -s "$RAILWAY_API/files/status")
echo "$FILES_STATUS" | jq .

echo ""
echo "📋 3. Testovanie presigned URL (funguje)..."
PRESIGNED_RESULT=$(curl -s -X POST "$RAILWAY_API/files/presigned-url" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "document",
    "entityId": "test-123",
    "filename": "test.pdf",
    "contentType": "application/pdf"
  }')

echo "$PRESIGNED_RESULT" | jq .

echo ""
echo "📋 4. Testovanie upload s obrázkom..."
# Vytvor test obrázok
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" | base64 -d > test-image.png

UPLOAD_RESULT=$(curl -s -X POST "$RAILWAY_API/files/upload" \
  -F "file=@test-image.png" \
  -F "type=protocol" \
  -F "entityId=test-$(date +%s)")

echo "$UPLOAD_RESULT" | jq .

echo ""
echo "🧹 Čistenie test súborov..."
rm -f test-image.png

echo ""
echo "📊 ANALÝZA PROBLÉMU:"
echo "===================="

# Analýza výsledkov
if echo "$R2_STATUS" | jq -e '.configured == true' > /dev/null; then
    echo "✅ R2 Storage je nakonfigurované"
else
    echo "❌ R2 Storage nie je nakonfigurované"
    echo "   Chýbajú environment variables"
fi

if echo "$PRESIGNED_RESULT" | jq -e '.success == true' > /dev/null; then
    echo "✅ Presigned URL funguje - R2 connection je OK"
    echo "   Account ID a API token sú správne"
else
    echo "❌ Presigned URL zlyháva - R2 connection má problém"
fi

if echo "$UPLOAD_RESULT" | jq -e '.success == true' > /dev/null; then
    echo "✅ Upload funguje!"
    UPLOAD_URL=$(echo "$UPLOAD_RESULT" | jq -r '.url')
    echo "   Upload URL: $UPLOAD_URL"
else
    echo "❌ Upload stále zlyháva"
    ERROR=$(echo "$UPLOAD_RESULT" | jq -r '.error // .message')
    echo "   Chyba: $ERROR"
fi

echo ""
echo "🎯 DIAGNÓZA:"
echo "============"

if echo "$R2_STATUS" | jq -e '.configured == true' > /dev/null && echo "$PRESIGNED_RESULT" | jq -e '.success == true' > /dev/null; then
    echo "🔍 Problém je v upload endpoint kóde"
    echo "   - R2 connection funguje"
    echo "   - Environment variables sú OK"
    echo "   - Problém je v backend logike"
    echo ""
    echo "📋 RIEŠENIE:"
    echo "1. Skontrolujte Railway logy"
    echo "2. Pozrite si backend error logs"
    echo "3. Možno chýba nejaká premenná"
else
    echo "🔍 Problém je v R2 konfigurácii"
    echo "   - Skontrolujte environment variables"
    echo "   - Overte API token"
    echo "   - Skontrolujte bucket permissions"
fi

echo ""
echo "📋 POTREBNÉ ENVIRONMENT VARIABLES:"
echo "=================================="
echo "R2_ENDPOINT=https://9ccdca0d876e24bd9acefabe56f94f53.r2.cloudflarestorage.com"
echo "R2_BUCKET_NAME=blackrent-storage"
echo "R2_ACCESS_KEY_ID=88ac7976656f3c2a9bbff57018c22731"
echo "R2_SECRET_ACCESS_KEY=your-api-token-here"
echo "R2_ACCOUNT_ID=9ccdca0d876e24bd9acefabe56f94f53"
echo "R2_PUBLIC_URL=https://pub-4fec120a8a6a4a0cbadfa55f54b7e8a2.r2.dev"

echo ""
echo "🔧 ĎALŠIE KROKY:"
echo "================"
echo "1. Skontrolujte Railway dashboard → Variables"
echo "2. Overte či sú všetky premenné nastavené"
echo "3. Skontrolujte Railway logy pre detaily"
echo "4. Ak potrebujete, opravte chýbajúce premenné" 