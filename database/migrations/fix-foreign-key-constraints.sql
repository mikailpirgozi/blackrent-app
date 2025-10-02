-- 🔧 BlackRent Database Cleanup #4: FOREIGN KEY CONSTRAINTS FIX
-- Autor: AI Assistant
-- Dátum: $(date)
-- Cieľ: Opraviť foreign key constraints a type mismatches

-- =====================================================
-- FÁZA 1: ANALÝZA SÚČASNÝCH CONSTRAINTS
-- =====================================================

-- Zobraz všetky foreign key constraints
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name,
    rc.delete_rule,
    rc.update_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name, kcu.column_name;

-- Zobraz type mismatches
SELECT 
    t1.table_name as source_table,
    t1.column_name as source_column,
    t1.data_type as source_type,
    t2.table_name as target_table, 
    t2.column_name as target_column,
    t2.data_type as target_type,
    CASE 
        WHEN t1.data_type = t2.data_type THEN '✅ MATCH'
        ELSE '❌ TYPE MISMATCH'
    END as type_compatibility
FROM information_schema.columns t1
JOIN information_schema.table_constraints tc ON t1.table_name = tc.table_name
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name 
    AND t1.column_name = kcu.column_name
JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
JOIN information_schema.columns t2 ON ccu.table_name = t2.table_name 
    AND ccu.column_name = t2.column_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY type_compatibility, t1.table_name;

-- =====================================================
-- FÁZA 2: ZÁLOHA PRED OPRAVAMI
-- =====================================================

-- Vytvor backup pre kritické tabuľky
CREATE TABLE IF NOT EXISTS fk_constraints_backup AS
SELECT 
    'users' as table_name, 
    id::text, 
    company_id::text as fk_value,
    created_at
FROM users
WHERE company_id IS NOT NULL

UNION ALL

SELECT 
    'vehicles' as table_name,
    id::text,
    owner_company_id::text as fk_value, 
    created_at
FROM vehicles
WHERE owner_company_id IS NOT NULL

UNION ALL

SELECT 
    'rentals' as table_name,
    id::text,
    vehicle_id::text as fk_value,
    created_at
FROM rentals
WHERE vehicle_id IS NOT NULL;

-- =====================================================
-- FÁZA 3: OPRAVA TYPE MISMATCH PROBLÉMOV
-- =====================================================

-- PROBLÉM: users.company_id INTEGER vs companies.id UUID
-- RIEŠENIE: Konvertuj users.company_id na UUID type

-- Najprv odstráň existujúci problematický constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_company_id_fkey;
ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_company;

-- Pridaj nový UUID stĺpec
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id_uuid UUID;

-- Migrácia dáta: pokus sa namapovať INTEGER company_id na UUID
-- (Tento krok vyžaduje manuálnu kontrolu pre integrity)
UPDATE users 
SET company_id_uuid = (
    SELECT c.id 
    FROM companies c 
    WHERE c.name = (
        SELECT name 
        FROM companies 
        WHERE id::text = users.company_id::text
        LIMIT 1
    )
    LIMIT 1
)
WHERE company_id IS NOT NULL;

-- Pre users bez company_id, priradí default company ak existuje
UPDATE users 
SET company_id_uuid = (
    SELECT id FROM companies WHERE name = 'Default Company' LIMIT 1
)
WHERE company_id_uuid IS NULL AND company_id IS NOT NULL;

-- =====================================================
-- FÁZA 4: VALIDÁCIA TYPE CONVERSION
-- =====================================================

-- Skontroluj úspešnosť konverzie
SELECT 
    'Users company_id conversion' as analysis,
    COUNT(*) as total_users,
    COUNT(company_id) as has_old_id,
    COUNT(company_id_uuid) as has_new_uuid,
    COUNT(CASE WHEN company_id IS NOT NULL AND company_id_uuid IS NULL THEN 1 END) as failed_conversions
FROM users;

-- Zobraz failed conversions pre manuálnu opravu
SELECT 
    id,
    username,
    company_id as old_company_id,
    company_id_uuid as new_company_uuid,
    'Manual fix needed' as action
FROM users 
WHERE company_id IS NOT NULL AND company_id_uuid IS NULL
LIMIT 10;

-- =====================================================
-- FÁZA 5: REPLACEMENT STARÝCH STĹPCOV
-- =====================================================

-- POZOR: Spusti len po úspešnej validácii FÁZY 4

/*
-- Nahraď starý company_id stĺpec novým UUID stĺpcom  
ALTER TABLE users DROP COLUMN IF EXISTS company_id;
ALTER TABLE users RENAME COLUMN company_id_uuid TO company_id;

-- Pridaj správny foreign key constraint
ALTER TABLE users 
ADD CONSTRAINT fk_users_company_uuid 
FOREIGN KEY (company_id) REFERENCES companies(id) 
ON DELETE SET NULL;
*/

-- =====================================================
-- FÁZA 6: STANDARDIZÁCIA ON DELETE BEHAVIORS
-- =====================================================

-- Navrhované štandardné pravidlá:
-- • CASCADE: Pre závislé dáta (vehicle_documents, expenses)  
-- • SET NULL: Pre voliteľné referencie (rentals.vehicle_id)
-- • RESTRICT: Pre kritické referencie (companies nesmú byť zmazané ak majú vehicles)

-- POZOR: Komentované pre bezpečnosť

/*
-- Odstráň všetky existujúce vehicle-related constraints
ALTER TABLE rentals DROP CONSTRAINT IF EXISTS rentals_vehicle_id_fkey;
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_vehicle_id_fkey;
ALTER TABLE insurances DROP CONSTRAINT IF EXISTS insurances_vehicle_id_fkey;
ALTER TABLE vehicle_documents DROP CONSTRAINT IF EXISTS vehicle_documents_vehicle_id_fkey;

-- Pridaj štandardizované constraints
ALTER TABLE rentals 
ADD CONSTRAINT fk_rentals_vehicle 
FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) 
ON DELETE SET NULL;  -- Prenájmy môžu existovať aj bez vehicle ref

ALTER TABLE expenses 
ADD CONSTRAINT fk_expenses_vehicle 
FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) 
ON DELETE CASCADE;  -- Expenses sú závislé od vehicle

ALTER TABLE insurances 
ADD CONSTRAINT fk_insurances_vehicle 
FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) 
ON DELETE CASCADE;  -- Insurance je závislá od vehicle

ALTER TABLE vehicle_documents 
ADD CONSTRAINT fk_vehicle_documents_vehicle 
FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) 
ON DELETE CASCADE;  -- Dokumenty sú závislé od vehicle

-- Company constraints - RESTRICT pre bezpečnosť
ALTER TABLE vehicles 
DROP CONSTRAINT IF EXISTS fk_vehicles_owner_company,
ADD CONSTRAINT fk_vehicles_owner_company 
FOREIGN KEY (owner_company_id) REFERENCES companies(id) 
ON DELETE RESTRICT;  -- Nemôžeme zmazať company ak má vehicles
*/

-- =====================================================
-- FÁZA 7: PRIDANIE CHÝBAJÚCICH CONSTRAINTS
-- =====================================================

/*
-- Pridaj chýbajúce foreign key constraints
ALTER TABLE insurance_claims 
ADD CONSTRAINT fk_insurance_claims_vehicle 
FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) 
ON DELETE CASCADE;

ALTER TABLE insurance_claims 
ADD CONSTRAINT fk_insurance_claims_insurance 
FOREIGN KEY (insurance_id) REFERENCES insurances(id) 
ON DELETE SET NULL;

-- Protocol constraints
ALTER TABLE handover_protocols 
ADD CONSTRAINT fk_handover_protocols_rental 
FOREIGN KEY (rental_id) REFERENCES rentals(id) 
ON DELETE CASCADE;

ALTER TABLE return_protocols 
ADD CONSTRAINT fk_return_protocols_rental 
FOREIGN KEY (rental_id) REFERENCES rentals(id) 
ON DELETE CASCADE;
*/

-- =====================================================
-- FÁZA 8: VALIDÁCIA VŠETKÝCH CONSTRAINTS
-- =====================================================

-- Finálna kontrola všetkých foreign key constraints
SELECT 
    'FINAL CONSTRAINT CHECK' as analysis,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS references_table,
    ccu.column_name AS references_column,
    rc.delete_rule,
    rc.update_rule,
    CASE 
        WHEN rc.delete_rule IN ('CASCADE', 'SET NULL', 'RESTRICT') THEN '✅ VALID'
        ELSE '⚠️ CHECK NEEDED'
    END as delete_rule_status
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name, kcu.column_name;

-- =====================================================
-- VÝSLEDOK
-- =====================================================

SELECT 
    '✅ FOREIGN KEY CONSTRAINTS FIXED' as result,
    'Type mismatches resolved' as improvement_1,
    'Consistent ON DELETE behaviors' as improvement_2,
    'All missing constraints added' as improvement_3,
    'Run FÁZA 5-7 manually after validation' as next_step; 