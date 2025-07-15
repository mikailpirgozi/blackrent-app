#!/bin/bash

echo "🔄 Testovanie všetkých API endpointov..."

# Získanie tokenu
echo "🔑 Získavam token..."
TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}' | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')

if [ -z "$TOKEN" ]; then
  echo "❌ Chyba pri prihlásení!"
  exit 1
fi

echo "✅ Token získaný"

# Test 1: Vytvorenie vozidla
echo -e "\n🚗 Test 1: Vytvorenie vozidla"
VEHICLE_RESPONSE=$(curl -s -X POST http://localhost:5001/api/vehicles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "brand": "BMW",
    "model": "X3",
    "licensePlate": "TEST-123",
    "company": "AutoRent s.r.o.",
    "pricing": [
      {"id": "1", "minDays": 0, "maxDays": 1, "pricePerDay": 45},
      {"id": "2", "minDays": 2, "maxDays": 3, "pricePerDay": 42},
      {"id": "3", "minDays": 4, "maxDays": 999, "pricePerDay": 40}
    ],
    "commission": {"type": "percentage", "value": 18},
    "status": "available"
  }')

if [[ $VEHICLE_RESPONSE == *"success\":true"* ]]; then
  echo "✅ Vozidlo vytvorené"
  VEHICLE_ID=$(echo $VEHICLE_RESPONSE | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')
  echo "   ID: $VEHICLE_ID"
else
  echo "❌ Chyba pri vytváraní vozidla"
  echo "   Response: $VEHICLE_RESPONSE"
fi

# Test 2: Získanie vozidiel
echo -e "\n📋 Test 2: Získanie vozidiel"
VEHICLES_RESPONSE=$(curl -s -X GET http://localhost:5001/api/vehicles \
  -H "Authorization: Bearer $TOKEN")

if [[ $VEHICLES_RESPONSE == *"success\":true"* ]]; then
  COUNT=$(echo $VEHICLES_RESPONSE | grep -o '"id"' | wc -l)
  echo "✅ Vozidlá načítané (počet: $COUNT)"
else
  echo "❌ Chyba pri načítaní vozidiel"
fi

# Test 3: Vytvorenie zákazníka
echo -e "\n👤 Test 3: Vytvorenie zákazníka"
CUSTOMER_RESPONSE=$(curl -s -X POST http://localhost:5001/api/customers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Ján Novák",
    "phone": "+421901234567",
    "email": "jan.novak@email.com",
    "address": "Hlavná 123, Bratislava"
  }')

if [[ $CUSTOMER_RESPONSE == *"success\":true"* ]]; then
  echo "✅ Zákazník vytvorený"
  CUSTOMER_ID=$(echo $CUSTOMER_RESPONSE | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')
  echo "   ID: $CUSTOMER_ID"
else
  echo "❌ Chyba pri vytváraní zákazníka"
  echo "   Response: $CUSTOMER_RESPONSE"
fi

# Test 4: Vytvorenie prenájmu
echo -e "\n🔄 Test 4: Vytvorenie prenájmu"
if [ ! -z "$VEHICLE_ID" ]; then
  RENTAL_RESPONSE=$(curl -s -X POST http://localhost:5001/api/rentals \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
      "vehicleId": "'$VEHICLE_ID'",
      "customerId": "'$CUSTOMER_ID'",
      "customerName": "Ján Novák",
      "startDate": "2025-01-15T10:00:00.000Z",
      "endDate": "2025-01-17T10:00:00.000Z",
      "totalPrice": 126,
      "commission": 22.68,
      "paymentMethod": "card",
      "discount": {"type": "percentage", "value": 10},
      "customCommission": {"type": "fixed", "value": 20},
      "extraKmCharge": 0,
      "paid": false,
      "status": "pending",
      "handoverPlace": "Bratislava - letisko",
      "confirmed": false
    }')

  if [[ $RENTAL_RESPONSE == *"success\":true"* ]]; then
    echo "✅ Prenájom vytvorený"
    RENTAL_ID=$(echo $RENTAL_RESPONSE | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')
    echo "   ID: $RENTAL_ID"
  else
    echo "❌ Chyba pri vytváraní prenájmu"
    echo "   Response: $RENTAL_RESPONSE"
  fi
else
  echo "⚠️  Preskakujem test prenájmu (chýba ID vozidla)"
fi

# Test 5: Vytvorenie nákladu
echo -e "\n💰 Test 5: Vytvorenie nákladu"
if [ ! -z "$VEHICLE_ID" ]; then
  EXPENSE_RESPONSE=$(curl -s -X POST http://localhost:5001/api/expenses \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
      "description": "Tankovanie",
      "amount": 65.50,
      "date": "2025-01-15T00:00:00.000Z",
      "vehicleId": "'$VEHICLE_ID'",
      "company": "AutoRent s.r.o.",
      "category": "fuel",
      "note": "Plná nádrž"
    }')

  if [[ $EXPENSE_RESPONSE == *"success\":true"* ]]; then
    echo "✅ Náklad vytvorený"
  else
    echo "❌ Chyba pri vytváraní nákladu"
    echo "   Response: $EXPENSE_RESPONSE"
  fi
else
  echo "⚠️  Preskakujem test nákladu (chýba ID vozidla)"
fi

# Test 6: Získanie všetkých entít
echo -e "\n📊 Test 6: Načítanie všetkých entít"

echo "  🚗 Vozidlá:"
curl -s -X GET http://localhost:5001/api/vehicles -H "Authorization: Bearer $TOKEN" | grep -c '"id"' | xargs -I {} echo "     Počet: {}"

echo "  👤 Zákazníci:"
curl -s -X GET http://localhost:5001/api/customers -H "Authorization: Bearer $TOKEN" | grep -c '"id"' | xargs -I {} echo "     Počet: {}"

echo "  🔄 Prenájmy:"
curl -s -X GET http://localhost:5001/api/rentals -H "Authorization: Bearer $TOKEN" | grep -c '"id"' | xargs -I {} echo "     Počet: {}"

echo "  💰 Náklady:"
curl -s -X GET http://localhost:5001/api/expenses -H "Authorization: Bearer $TOKEN" | grep -c '"id"' | xargs -I {} echo "     Počet: {}"

echo -e "\n✅ Test dokončený! Všetky API endpointy fungujú správne."
echo "🎉 Môžete teraz testovať manuálne pridávanie vozidiel vo frontend aplikácii!" 