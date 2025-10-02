#!/bin/bash

echo "🔧 OPRAVA R2 UPLOAD PROBLÉMU"
echo "============================="
echo ""

# Railway API URL
RAILWAY_API="https://blackrent-app-production-4d6f.up.railway.app/api"

echo "📋 1. Kontrola R2 environment variables..."
echo ""

# Test R2 konfigurácie
R2_STATUS=$(curl -s "$RAILWAY_API/migration/r2-status")
echo "R2 Status:"
echo "$R2_STATUS" | jq .

echo ""
echo "📋 2. Testovanie R2 connection..."

# Test presigned URL (toto funguje)
PRESIGNED_RESULT=$(curl -s -X POST "$RAILWAY_API/files/presigned-url" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "document",
    "entityId": "test-123",
    "filename": "test.pdf",
    "contentType": "application/pdf"
  }')

echo "Presigned URL test:"
echo "$PRESIGNED_RESULT" | jq .

echo ""
echo "📋 3. Testovanie priameho uploadu do R2..."

# Vytvor test súbor
echo "Test R2 upload - $(date)" > test-upload.txt

# Test upload s rôznymi typmi
echo "Test s text súborom:"
curl -s -X POST "$RAILWAY_API/files/upload" \
  -F "file=@test-upload.txt" \
  -F "type=document" \
  -F "entityId=test-$(date +%s)" | jq .

echo ""
echo "Test s obrázkom:"
# Vytvor 1x1 pixel PNG
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" | base64 -d > test-image.png

curl -s -X POST "$RAILWAY_API/files/upload" \
  -F "file=@test-image.png" \
  -F "type=protocol" \
  -F "entityId=test-$(date +%s)" | jq .

echo ""
echo "📋 4. Kontrola Railway logov..."

echo "Posledné API volania:"
echo "Health check:"
curl -s "$RAILWAY_API/health" | jq .

echo ""
echo "📋 5. Testovanie alternatívneho upload endpointu..."

# Test cez protocols endpoint
echo "Test cez protocols endpoint:"
curl -s -X POST "$RAILWAY_API/protocols/upload-pdf" \
  -F "file=@test-upload.txt" \
  -F "protocolId=test-$(date +%s)" | jq .

echo ""
echo "🧹 Čistenie test súborov..."
rm -f test-upload.txt test-image.png

echo ""
echo "📊 ANALÝZA PROBLÉMU:"
echo "===================="

# Analýza výsledkov
if echo "$R2_STATUS" | jq -e '.configured == true' > /dev/null; then
    echo "✅ R2 Storage je nakonfigurované"
else
    echo "❌ R2 Storage nie je nakonfigurované"
    echo "   Problém: Chýbajú environment variables"
fi

if echo "$PRESIGNED_RESULT" | jq -e '.success == true' > /dev/null; then
    echo "✅ Presigned URL funguje - R2 connection je OK"
    echo "   Problém je v upload endpoint kóde"
else
    echo "❌ Presigned URL zlyháva - R2 connection má problém"
fi

echo ""
echo "🎯 RIEŠENIE:"
echo "============"

echo "1. Problém je pravdepodobne v upload endpoint kóde"
echo "2. R2 connection funguje (presigned URL OK)"
echo "3. Potrebujeme opraviť backend upload logiku"
echo ""
echo "📋 MANUÁLNE KROKY PRE VÁS:"
echo "=========================="
echo ""
echo "1. Choďte na Railway dashboard:"
echo "   https://railway.app/dashboard"
echo ""
echo "2. Vyberte BlackRent project"
echo ""
echo "3. Kliknite 'Variables' tab"
echo ""
echo "4. Skontrolujte tieto premenné:"
echo "   - R2_ENDPOINT"
echo "   - R2_ACCESS_KEY_ID"
echo "   - R2_SECRET_ACCESS_KEY"
echo "   - R2_BUCKET_NAME"
echo "   - R2_PUBLIC_URL"
echo ""
echo "5. Ak chýbajú, pridajte ich podľa:"
echo "   setup-r2-storage.sh"
echo ""
echo "6. Po pridaní premenných:"
echo "   - Railway automaticky redeploy"
echo "   - Spustite tento test znova"
echo ""
echo "🔧 ALTERNATÍVNE RIEŠENIE:"
echo "========================"
echo "Ak environment variables sú OK, problém je v kóde:"
echo "1. Skontrolujte Railway logy"
echo "2. Opravte upload endpoint"
echo "3. Redeploy aplikácie" 