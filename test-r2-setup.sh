#!/bin/bash

echo "🔍 AUTOMATICKÁ DIAGNÓSTIKA R2 STORAGE"
echo "======================================"
echo ""

# Railway API URL
RAILWAY_API="https://blackrent-app-production-4d6f.up.railway.app/api"

echo "📋 1. Testovanie API dostupnosti..."
if curl -s "$RAILWAY_API/health" > /dev/null; then
    echo "✅ API je dostupné"
else
    echo "❌ API nie je dostupné"
    exit 1
fi

echo ""
echo "📋 2. Kontrola R2 konfigurácie..."
R2_STATUS=$(curl -s "$RAILWAY_API/migration/r2-status")
echo "$R2_STATUS" | jq .

echo ""
echo "📋 3. Kontrola files API..."
FILES_STATUS=$(curl -s "$RAILWAY_API/files/status")
echo "$FILES_STATUS" | jq .

echo ""
echo "📋 4. Testovanie upload endpointu..."
echo "Vytváram test súbor..."

# Vytvor test súbor
echo "Test R2 upload - $(date)" > test-upload.txt

# Test upload
UPLOAD_RESULT=$(curl -s -X POST "$RAILWAY_API/files/upload" \
  -F "file=@test-upload.txt" \
  -F "type=document" \
  -F "entityId=test-$(date +%s)")

echo "$UPLOAD_RESULT" | jq .

echo ""
echo "📋 5. Kontrola existujúcich protokolov..."
PROTOCOLS=$(curl -s "$RAILWAY_API/protocols/rental/all")
HANDOVER_COUNT=$(echo "$PROTOCOLS" | jq '.handoverProtocols | length')
RETURN_COUNT=$(echo "$PROTOCOLS" | jq '.returnProtocols | length')

echo "Handover protokoly: $HANDOVER_COUNT"
echo "Return protokoly: $RETURN_COUNT"

echo ""
echo "📋 6. Testovanie presigned URL..."
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
echo "🧹 Čistenie test súborov..."
rm -f test-upload.txt

echo ""
echo "📊 SÚHRN DIAGNÓSTIKY:"
echo "====================="

# Analýza výsledkov
if echo "$R2_STATUS" | jq -e '.configured == true' > /dev/null; then
    echo "✅ R2 Storage je nakonfigurované"
else
    echo "❌ R2 Storage nie je nakonfigurované"
    echo "   Potrebné environment variables:"
    echo "   - R2_ENDPOINT"
    echo "   - R2_ACCESS_KEY_ID"
    echo "   - R2_SECRET_ACCESS_KEY"
    echo "   - R2_BUCKET_NAME"
    echo "   - R2_PUBLIC_URL"
fi

if echo "$UPLOAD_RESULT" | jq -e '.success == true' > /dev/null; then
    echo "✅ Upload do R2 funguje"
    UPLOAD_URL=$(echo "$UPLOAD_RESULT" | jq -r '.url')
    echo "   Upload URL: $UPLOAD_URL"
else
    echo "❌ Upload do R2 zlyháva"
    ERROR=$(echo "$UPLOAD_RESULT" | jq -r '.error // .message')
    echo "   Chyba: $ERROR"
fi

if echo "$PRESIGNED_RESULT" | jq -e '.success == true' > /dev/null; then
    echo "✅ Presigned URL funguje"
else
    echo "❌ Presigned URL zlyháva"
fi

if [ "$HANDOVER_COUNT" -gt 0 ] || [ "$RETURN_COUNT" -gt 0 ]; then
    echo "✅ Existujú protokoly na migráciu"
    echo "   Môžete spustiť migráciu cez:"
    echo "   curl -X POST $RAILWAY_API/migration/migrate-to-r2"
else
    echo "ℹ️  Žiadne protokoly na migráciu"
fi

echo ""
echo "🎯 ĎALŠIE KROKY:"
echo "================"

if echo "$R2_STATUS" | jq -e '.configured == true' > /dev/null; then
    if echo "$UPLOAD_RESULT" | jq -e '.success == true' > /dev/null; then
        echo "✅ Všetko je nakonfigurované a funguje!"
        echo "   Môžete používať R2 storage."
    else
        echo "⚠️  R2 je nakonfigurované, ale upload zlyháva"
        echo "   Skontrolujte Railway logy pre detaily"
    fi
else
    echo "🔧 Potrebujete nastaviť R2 Storage:"
    echo "   1. Vytvorte Cloudflare R2 bucket"
    echo "   2. Nastavte environment variables v Railway"
    echo "   3. Spustite tento test znova"
fi

echo ""
echo "📚 Dokumentácia:"
echo "   - R2-IMPLEMENTATION-SUMMARY.md"
echo "   - setup-r2-storage.sh" 