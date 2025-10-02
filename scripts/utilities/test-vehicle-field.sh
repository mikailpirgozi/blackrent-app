#!/bin/bash

# 🧪 TESTER PRE VEHICLE POLIA
# Usage: ./test-vehicle-field.sh fieldName testValue [vehicleId]

FIELD_NAME=$1
TEST_VALUE=$2
VEHICLE_ID=${3:-60}
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmYWVjY2NkOC0zNTU4LTQ1ZTItYmQxNy0wNDcyOWYyNzdlODMiLCJ1c2VybmFtZSI6ImFkbWluIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzU1NjIyNTc1LCJleHAiOjE3NTgyMTQ1NzV9.dqVXoLCpAbCPLrajoPmCTNDFuvNxcBM7hg6exyMSGnU"

if [ -z "$FIELD_NAME" ] || [ -z "$TEST_VALUE" ]; then
  echo "❌ Usage: ./test-vehicle-field.sh fieldName testValue [vehicleId]"
  echo "📝 Examples:"
  echo "   ./test-vehicle-field.sh vin 'WBA123456789'"
  echo "   ./test-vehicle-field.sh color 'červená'"
  echo "   ./test-vehicle-field.sh seatsCount 5"
  exit 1
fi

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                🧪 Vehicle Field Tester                      ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo "🎯 Field: $FIELD_NAME"
echo "💾 Value: $TEST_VALUE"
echo "🚗 Vehicle ID: $VEHICLE_ID"
echo ""

# 1. Get current vehicle data
echo "🔍 1. Getting current vehicle data..."
CURRENT_DATA=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/vehicles/$VEHICLE_ID")

if echo "$CURRENT_DATA" | grep -q '"success":true'; then
  echo "✅ Vehicle found"
  CURRENT_VALUE=$(echo "$CURRENT_DATA" | jq -r ".data.$FIELD_NAME // \"null\"")
  echo "📊 Current $FIELD_NAME: $CURRENT_VALUE"
else
  echo "❌ Vehicle not found"
  exit 1
fi

# 2. Update field
echo ""
echo "💾 2. Updating field..."
UPDATE_DATA=$(echo "$CURRENT_DATA" | jq ".data | .${FIELD_NAME} = \"$TEST_VALUE\"")

RESPONSE=$(curl -s -X PUT \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "$UPDATE_DATA" \
  "http://localhost:3001/api/vehicles/$VEHICLE_ID")

if echo "$RESPONSE" | grep -q '"success":true'; then
  echo "✅ Update successful"
  NEW_VALUE=$(echo "$RESPONSE" | jq -r ".data.$FIELD_NAME // \"null\"")
  echo "📊 New $FIELD_NAME: $NEW_VALUE"
else
  echo "❌ Update failed"
  echo "$RESPONSE" | jq -r '.error // "Unknown error"'
  exit 1
fi

# 3. Verify persistence
echo ""
echo "🔄 3. Testing persistence..."
sleep 2

VERIFY_DATA=$(curl -s -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/vehicles/$VEHICLE_ID")

if echo "$VERIFY_DATA" | grep -q '"success":true'; then
  VERIFY_VALUE=$(echo "$VERIFY_DATA" | jq -r ".data.$FIELD_NAME // \"null\"")
  echo "📊 Verified $FIELD_NAME: $VERIFY_VALUE"
  
  if [ "$VERIFY_VALUE" = "$TEST_VALUE" ]; then
    echo "✅ PERSISTENCE TEST PASSED!"
  else
    echo "❌ PERSISTENCE TEST FAILED!"
    echo "   Expected: $TEST_VALUE"
    echo "   Got: $VERIFY_VALUE"
  fi
else
  echo "❌ Verification failed"
fi

echo ""
echo "🎉 Field test completed!"
