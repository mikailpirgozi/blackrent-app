#!/bin/bash

echo "🔍 TEST R2 API TOKEN"
echo "===================="
echo ""

# Railway API URL
RAILWAY_API="https://blackrent-app-production-4d6f.up.railway.app/api"

echo "📋 1. Testovanie presigned URL (funguje s tokenom)..."
PRESIGNED_RESULT=$(curl -s -X POST "$RAILWAY_API/files/presigned-url" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "document",
    "entityId": "test-123",
    "filename": "test.pdf",
    "contentType": "application/pdf"
  }')

if echo "$PRESIGNED_RESULT" | jq -e '.success == true' > /dev/null; then
    echo "✅ Presigned URL funguje - token je OK"
    echo "   Token je správne nastavený pre presigned URL"
else
    echo "❌ Presigned URL zlyháva - token má problém"
    echo "$PRESIGNED_RESULT" | jq .
fi

echo ""
echo "📋 2. Testovanie direct upload (zlyháva s tokenom)..."
# Vytvor test obrázok
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" | base64 -d > test-image.png

UPLOAD_RESULT=$(curl -s -X POST "$RAILWAY_API/files/upload" \
  -F "file=@test-image.png" \
  -F "type=protocol" \
  -F "entityId=test-$(date +%s)")

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
echo "🧹 Čistenie test súborov..."
rm -f test-image.png

echo ""
echo "🎯 ANALÝZA:"
echo "==========="

if echo "$PRESIGNED_RESULT" | jq -e '.success == true' > /dev/null && echo "$UPLOAD_RESULT" | jq -e '.success == false' > /dev/null; then
    echo "🔍 Problém je v R2_SECRET_ACCESS_KEY"
    echo "   - Presigned URL funguje (token je OK)"
    echo "   - Direct upload zlyháva (SignatureDoesNotMatch)"
    echo ""
    echo "📋 RIEŠENIE:"
    echo "1. Skontrolujte Railway Variables"
    echo "2. Overte R2_SECRET_ACCESS_KEY"
    echo "3. Možno je token skrátený alebo nesprávny"
    echo ""
    echo "🔧 MANUÁLNE KROKY:"
    echo "1. Cloudflare Dashboard → R2 → Manage R2 API tokens"
    echo "2. Vytvorte nový token s Object Read & Write permissions"
    echo "3. Skopírujte CELÝ token (nie len časť)"
    echo "4. Railway → Variables → R2_SECRET_ACCESS_KEY"
    echo "5. Pridajte celý token"
    echo "6. Počkajte na redeploy"
else
    echo "🔍 Iný problém"
    echo "   Skontrolujte Railway logy pre detaily"
fi

echo ""
echo "📋 POTREBNÉ PERMISSIONS PRE R2 TOKEN:"
echo "====================================="
echo "✅ Object Read & Write"
echo "✅ Bucket: blackrent-storage"
echo "✅ Account: 9ccdca0d876e24bd9acefabe56f94f53" 