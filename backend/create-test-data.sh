#!/bin/bash

echo "🔄 Blackrent - Vytvorenie testových dát"
echo "========================================"

API_URL="http://localhost:5001/api"

echo "📋 Vytváranie testových dát cez API..."

# Skontroluj, či backend beží
if ! curl -s ${API_URL}/../../health > /dev/null; then
    echo "❌ Backend nebeží na porte 5001"
    echo "Spustite: npm run dev"
    exit 1
fi

# Funkcia na vytvorenie dát
create_data() {
    local endpoint=$1
    local data=$2
    local description=$3
    
    response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$data" \
        "${API_URL}/${endpoint}")
    
    if [[ $? -eq 0 ]]; then
        echo "✅ $description"
    else
        echo "❌ Chyba pri vytváraní: $description"
        echo "Response: $response"
    fi
}

# Vytvorenie firiem
echo "🏢 Vytváranie firiem..."
create_data "companies" '{
    "id": "company1",
    "name": "ABC Rent",
    "description": "Profesionálne prenájmy vozidiel"
}' "ABC Rent"

create_data "companies" '{
    "id": "company2", 
    "name": "Premium Cars",
    "description": "Luxusné vozidlá na prenájom"
}' "Premium Cars"

create_data "companies" '{
    "id": "company3",
    "name": "City Rent", 
    "description": "Mestské prenájmy za výhodné ceny"
}' "City Rent"

# Vytvorenie poisťovní
echo "🛡️ Vytváranie poisťovní..."
create_data "insurers" '{
    "id": "insurer1",
    "name": "Allianz",
    "description": "Poisťovňa Allianz"
}' "Allianz"

create_data "insurers" '{
    "id": "insurer2",
    "name": "Generali", 
    "description": "Generali Poisťovňa"
}' "Generali"

# Vytvorenie vozidiel
echo "🚗 Vytváranie vozidiel..."
create_data "vehicles" '{
    "id": "vehicle1",
    "brand": "BMW",
    "model": "X5",
    "licensePlate": "BA123AB",
    "company": "ABC Rent",
    "pricing": [
        {"id": "1", "minDays": 0, "maxDays": 1, "pricePerDay": 80},
        {"id": "2", "minDays": 2, "maxDays": 3, "pricePerDay": 75},
        {"id": "3", "minDays": 4, "maxDays": 7, "pricePerDay": 70},
        {"id": "4", "minDays": 8, "maxDays": 14, "pricePerDay": 65},
        {"id": "5", "minDays": 15, "maxDays": 30, "pricePerDay": 60}
    ],
    "commission": {"type": "percentage", "value": 15},
    "status": "available"
}' "BMW X5"

create_data "vehicles" '{
    "id": "vehicle2",
    "brand": "Mercedes",
    "model": "E-Class", 
    "licensePlate": "BA456CD",
    "company": "Premium Cars",
    "pricing": [
        {"id": "1", "minDays": 0, "maxDays": 1, "pricePerDay": 90},
        {"id": "2", "minDays": 2, "maxDays": 3, "pricePerDay": 85},
        {"id": "3", "minDays": 4, "maxDays": 7, "pricePerDay": 80},
        {"id": "4", "minDays": 8, "maxDays": 14, "pricePerDay": 75},
        {"id": "5", "minDays": 15, "maxDays": 30, "pricePerDay": 70}
    ],
    "commission": {"type": "percentage", "value": 18},
    "status": "available"
}' "Mercedes E-Class"

create_data "vehicles" '{
    "id": "vehicle3",
    "brand": "Audi",
    "model": "A4",
    "licensePlate": "BA789EF", 
    "company": "City Rent",
    "pricing": [
        {"id": "1", "minDays": 0, "maxDays": 1, "pricePerDay": 65},
        {"id": "2", "minDays": 2, "maxDays": 3, "pricePerDay": 60},
        {"id": "3", "minDays": 4, "maxDays": 7, "pricePerDay": 55},
        {"id": "4", "minDays": 8, "maxDays": 14, "pricePerDay": 50},
        {"id": "5", "minDays": 15, "maxDays": 30, "pricePerDay": 45}
    ],
    "commission": {"type": "percentage", "value": 12},
    "status": "available"
}' "Audi A4"

# Vytvorenie zákazníkov
echo "👥 Vytváranie zákazníkov..."
create_data "customers" '{
    "id": "customer1",
    "name": "Ján Novák",
    "email": "jan.novak@email.com",
    "phone": "+421901234567"
}' "Ján Novák"

create_data "customers" '{
    "id": "customer2",
    "name": "Mária Svobodová",
    "email": "maria.svobodova@email.com", 
    "phone": "+421907654321"
}' "Mária Svobodová"

create_data "customers" '{
    "id": "customer3",
    "name": "Peter Horváth",
    "email": "peter.horvath@email.com",
    "phone": "+421905111222"
}' "Peter Horváth"

# Vytvorenie prenájmov
echo "📋 Vytváranie prenájmov..."
create_data "rentals" '{
    "id": "rental1",
    "vehicleId": "vehicle1",
    "customerName": "Ján Novák",
    "customerId": "customer1",
    "startDate": "2025-01-10T00:00:00.000Z",
    "endDate": "2025-01-13T00:00:00.000Z",
    "totalPrice": 240,
    "commission": 36,
    "paymentMethod": "bank_transfer",
    "paid": true,
    "confirmed": true,
    "handoverPlace": "Bratislava - Hlavná stanica"
}' "Prenájom BMW X5"

create_data "rentals" '{
    "id": "rental2",
    "vehicleId": "vehicle2",
    "customerName": "Mária Svobodová",
    "customerId": "customer2", 
    "startDate": "2025-01-15T00:00:00.000Z",
    "endDate": "2025-01-20T00:00:00.000Z",
    "totalPrice": 400,
    "commission": 72,
    "paymentMethod": "cash",
    "paid": false,
    "confirmed": true,
    "handoverPlace": "Bratislava - Letisko"
}' "Prenájom Mercedes E-Class"

create_data "rentals" '{
    "id": "rental3",
    "vehicleId": "vehicle3",
    "customerName": "Peter Horváth",
    "customerId": "customer3",
    "startDate": "2025-01-20T00:00:00.000Z",
    "endDate": "2025-01-25T00:00:00.000Z", 
    "totalPrice": 275,
    "commission": 33,
    "paymentMethod": "vrp",
    "paid": true,
    "confirmed": false,
    "handoverPlace": "Košice - Centrum"
}' "Prenájom Audi A4"

# Vytvorenie nákladov
echo "💰 Vytváranie nákladov..."
create_data "expenses" '{
    "id": "expense1",
    "description": "Tankovanie",
    "amount": 65.50,
    "date": "2025-01-12T00:00:00.000Z",
    "category": "fuel",
    "company": "ABC Rent",
    "vehicleId": "vehicle1",
    "note": "Plná nádrž pred prenájmom"
}' "Tankovanie BMW X5"

create_data "expenses" '{
    "id": "expense2",
    "description": "Umytie vozidla",
    "amount": 15.00,
    "date": "2025-01-14T00:00:00.000Z",
    "category": "maintenance",
    "company": "Premium Cars",
    "vehicleId": "vehicle2",
    "note": "Externé umytie"
}' "Umytie Mercedes E-Class"

create_data "expenses" '{
    "id": "expense3",
    "description": "Servis - výmena oleja",
    "amount": 85.00,
    "date": "2025-01-16T00:00:00.000Z",
    "category": "maintenance",
    "company": "City Rent",
    "vehicleId": "vehicle3",
    "note": "Pravidelný servis"
}' "Servis Audi A4"

echo ""
echo "🎉 Všetky testové dáta boli úspešne vytvorené!"
echo "🌐 Otvorte http://localhost:3000 a prihláste sa ako admin/admin123"
echo "📊 Teraz môžete vidieť:"
echo "   - 3 vozidlá (BMW X5, Mercedes E-Class, Audi A4)"
echo "   - 3 zákazníkov (Ján Novák, Mária Svobodová, Peter Horváth)"
echo "   - 3 prenájmy s rôznymi stavmi"
echo "   - 3 náklady (tankovanie, umytie, servis)"
echo "   - 3 firmy (ABC Rent, Premium Cars, City Rent)"
echo "   - 2 poisťovne (Allianz, Generali)" 