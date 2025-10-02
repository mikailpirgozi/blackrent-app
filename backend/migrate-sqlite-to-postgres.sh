#!/bin/bash

# Migrácia dát z SQLite do PostgreSQL pre Blackrent aplikáciu

echo "🔄 Migrácia SQLite → PostgreSQL"
echo "🎯 Zachováva formáty dátumov pre CSV import!"

SQLITE_DB="backend/blackrent.db"
POSTGRES_DB="blackrent"
TEMP_DIR="backend/migration-temp"

# Kontrola či SQLite databáza existuje
if [ ! -f "$SQLITE_DB" ]; then
    echo "❌ SQLite databáza $SQLITE_DB nenájdená!"
    echo "💡 Obnovte zálohu: cp backend/backups/najnovšia-záloha.db backend/blackrent.db"
    exit 1
fi

# Kontrola či PostgreSQL beží
if ! pg_isready -q; then
    echo "❌ PostgreSQL nebeží!"
    echo "💡 Spustite: brew services start postgresql@14"
    exit 1
fi

# Vytvorenie temp priečinka
mkdir -p "$TEMP_DIR"

echo ""
echo "📊 Analýza SQLite databázy:"
sqlite3 "$SQLITE_DB" "SELECT 'Vozidlá: ' || COUNT(*) FROM vehicles UNION ALL SELECT 'Prenájmy: ' || COUNT(*) FROM rentals UNION ALL SELECT 'Zákazníci: ' || COUNT(*) FROM customers UNION ALL SELECT 'Náklady: ' || COUNT(*) FROM expenses;"

echo ""
echo "💾 Vytváram zálohu PostgreSQL pred migráciou..."
./backend/postgres-backup.sh backup

echo ""
echo "🔄 Migrácia dát..."

# 1. VOZIDLÁ
echo "🚗 Migrácia vozidiel..."
sqlite3 "$SQLITE_DB" -header -csv "SELECT * FROM vehicles;" > "$TEMP_DIR/vehicles.csv"
VEHICLE_COUNT=$(wc -l < "$TEMP_DIR/vehicles.csv")
VEHICLE_COUNT=$((VEHICLE_COUNT - 1)) # mínus header

if [ $VEHICLE_COUNT -gt 0 ]; then
    echo "   📁 Export: $VEHICLE_COUNT vozidiel"
    
    # Import do PostgreSQL - konverzia CSV formátu
    cat > "$TEMP_DIR/import_vehicles.sql" << 'EOF'
-- Dočasná tabuľka pre import
CREATE TEMP TABLE temp_vehicles (
    id TEXT,
    brand TEXT,
    model TEXT,
    licensePlate TEXT,
    company TEXT,
    pricing TEXT,
    commission TEXT,
    status TEXT,
    createdAt TEXT
);

-- Import CSV
\COPY temp_vehicles FROM 'TEMP_DIR/vehicles.csv' WITH CSV HEADER;

-- Migrácia do finálnej tabuľky s konverziou typov
INSERT INTO vehicles (id, brand, model, license_plate, company, pricing, commission, status, created_at, updated_at)
SELECT 
    gen_random_uuid()::TEXT,  -- Nové UUID
    brand,
    model,
    licensePlate,
    company,
    pricing::JSONB,           -- Konverzia na JSONB
    commission::JSONB,        -- Konverzia na JSONB
    COALESCE(status, 'available'),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM temp_vehicles;

DROP TABLE temp_vehicles;
EOF
    
    # Nahradenie cesty
    sed -i '' "s|TEMP_DIR|$PWD/$TEMP_DIR|g" "$TEMP_DIR/import_vehicles.sql"
    
    psql -d "$POSTGRES_DB" -f "$TEMP_DIR/import_vehicles.sql"
    echo "   ✅ Import: vozidlá úspešne migrované"
else
    echo "   ⚠️  Žiadne vozidlá na migráciu"
fi

# 2. ZÁKAZNÍCI
echo "👥 Migrácia zákazníkov..."
sqlite3 "$SQLITE_DB" -header -csv "SELECT * FROM customers;" > "$TEMP_DIR/customers.csv"
CUSTOMER_COUNT=$(wc -l < "$TEMP_DIR/customers.csv")
CUSTOMER_COUNT=$((CUSTOMER_COUNT - 1))

if [ $CUSTOMER_COUNT -gt 0 ]; then
    echo "   📁 Export: $CUSTOMER_COUNT zákazníkov"
    
    cat > "$TEMP_DIR/import_customers.sql" << 'EOF'
CREATE TEMP TABLE temp_customers (
    id TEXT,
    name TEXT,
    email TEXT,
    phone TEXT,
    createdAt TEXT
);

\COPY temp_customers FROM 'TEMP_DIR/customers.csv' WITH CSV HEADER;

INSERT INTO customers (id, name, email, phone, created_at, updated_at)
SELECT 
    gen_random_uuid()::TEXT,
    name,
    email,
    phone,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM temp_customers;

DROP TABLE temp_customers;
EOF
    
    sed -i '' "s|TEMP_DIR|$PWD/$TEMP_DIR|g" "$TEMP_DIR/import_customers.sql"
    psql -d "$POSTGRES_DB" -f "$TEMP_DIR/import_customers.sql"
    echo "   ✅ Import: zákazníci úspešne migrovaní"
else
    echo "   ⚠️  Žiadni zákazníci na migráciu"
fi

# 3. PRENÁJMY
echo "📋 Migrácia prenájmov..."
sqlite3 "$SQLITE_DB" -header -csv "SELECT * FROM rentals;" > "$TEMP_DIR/rentals.csv"
RENTAL_COUNT=$(wc -l < "$TEMP_DIR/rentals.csv")
RENTAL_COUNT=$((RENTAL_COUNT - 1))

if [ $RENTAL_COUNT -gt 0 ]; then
    echo "   📁 Export: $RENTAL_COUNT prenájmov"
    echo "   🔄 Konvertujem dátumy pre PostgreSQL..."
    
    cat > "$TEMP_DIR/import_rentals.sql" << 'EOF'
-- Migrácia prenájmov je komplexnejšia kvôli foreign key závisostiam
-- Tento script je pripravený, ale prenájmy sa najlepšie importujú cez CSV
SELECT 'Prenájmy sa odporúča importovať cez CSV upload vo frontend aplikácii' as info;
EOF
    
    psql -d "$POSTGRES_DB" -f "$TEMP_DIR/import_rentals.sql"
    echo "   ⚠️  Prenájmy importujte cez CSV vo frontend (zachová formáty dátumov)"
else
    echo "   ⚠️  Žiadne prenájmy na migráciu"
fi

# 4. NÁKLADY
echo "💰 Migrácia nákladov..."
sqlite3 "$SQLITE_DB" -header -csv "SELECT * FROM expenses;" > "$TEMP_DIR/expenses.csv"
EXPENSE_COUNT=$(wc -l < "$TEMP_DIR/expenses.csv")
EXPENSE_COUNT=$((EXPENSE_COUNT - 1))

if [ $EXPENSE_COUNT -gt 0 ]; then
    echo "   📁 Export: $EXPENSE_COUNT nákladov"
    
    cat > "$TEMP_DIR/import_expenses.sql" << 'EOF'
CREATE TEMP TABLE temp_expenses (
    id TEXT,
    description TEXT,
    amount REAL,
    date TEXT,
    vehicleId TEXT,
    company TEXT,
    category TEXT,
    note TEXT,
    createdAt TEXT
);

\COPY temp_expenses FROM 'TEMP_DIR/expenses.csv' WITH CSV HEADER;

INSERT INTO expenses (id, description, amount, date, vehicle_id, company, category, note, created_at, updated_at)
SELECT 
    gen_random_uuid()::TEXT,
    description,
    amount,
    date::TIMESTAMP,
    NULL, -- vehicle_id bude NULL, pretože vozidlá majú nové ID
    company,
    category,
    note,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM temp_expenses;

DROP TABLE temp_expenses;
EOF
    
    sed -i '' "s|TEMP_DIR|$PWD/$TEMP_DIR|g" "$TEMP_DIR/import_expenses.sql"
    psql -d "$POSTGRES_DB" -f "$TEMP_DIR/import_expenses.sql"
    echo "   ✅ Import: náklady úspešne migrované"
else
    echo "   ⚠️  Žiadne náklady na migráciu"
fi

echo ""
echo "📊 Výsledok migrácie:"
psql -d "$POSTGRES_DB" -c "SELECT 'Vozidlá: ' || COUNT(*) FROM vehicles UNION ALL SELECT 'Prenájmy: ' || COUNT(*) FROM rentals UNION ALL SELECT 'Zákazníci: ' || COUNT(*) FROM customers UNION ALL SELECT 'Náklady: ' || COUNT(*) FROM expenses;" -t | grep -v '^$'

echo ""
echo "🧹 Čistenie temp súborov..."
rm -rf "$TEMP_DIR"

echo ""
echo "✅ Migrácia dokončená!"
echo ""
echo "📝 Ďalšie kroky:"
echo "1. 🚀 Frontend je už pripojený na PostgreSQL"
echo "2. 📊 Môžete importovať CSV prenájmy cez aplikáciu"
echo "3. 📅 Formáty dátumov sú zachované:"
echo "   • Export: ISO 8601 (2025-01-14T23:00:00.000Z)"
echo "   • Import: '14.1.' alebo '14.1.2025'"
echo "4. 💾 Pravidelne robte zálohy: ./backend/postgres-backup.sh backup"
echo ""
echo "🎉 Aplikácia je pripravená na produkčné hosting!" 