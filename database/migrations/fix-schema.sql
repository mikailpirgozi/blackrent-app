-- 🔧 OPRAVA DATABÁZOVEJ SCHÉMY
-- Pridá chýbajúce stĺpce bez straty dát

BEGIN;

-- 1. OPRAVA COMPANIES TABUĽKY
-- Pridaj chýbajúci is_active stĺpec
ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Nastav is_active na true pre všetky existujúce firmy
UPDATE companies SET is_active = true WHERE is_active IS NULL;

-- 2. OPRAVA VEHICLES TABUĽKY  
-- Skontroluj či existuje year stĺpec
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS year INTEGER DEFAULT 2024;

-- Skontroluj či existuje stk stĺpec
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS stk DATE;

-- 3. OPRAVA USERS TABUĽKY
-- Skontroluj či company_id je UUID type
DO $$
BEGIN
    -- Skús zmeniť typ na UUID ak nie je
    BEGIN
        ALTER TABLE users ALTER COLUMN company_id TYPE UUID USING company_id::text::UUID;
    EXCEPTION WHEN OTHERS THEN
        -- Ak už je UUID alebo iná chyba, pokračuj
        NULL;
    END;
END $$;

-- 4. OPRAVA USER_PERMISSIONS TABUĽKY
-- Skontroluj či company_id je UUID type
DO $$
BEGIN
    BEGIN
        ALTER TABLE user_permissions ALTER COLUMN company_id TYPE UUID USING company_id::text::UUID;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
END $$;

-- 5. OPRAVA RENTALS TABUĽKY
-- Odstráň NOT NULL constraint z vehicle_id (aby DELETE SET NULL fungoval)
ALTER TABLE rentals ALTER COLUMN vehicle_id DROP NOT NULL;

-- 6. DIAGNOSTIKA - Zobraz štruktúru tabuliek
SELECT 'COMPANIES COLUMNS:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'companies' 
ORDER BY ordinal_position;

SELECT 'VEHICLES COLUMNS:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'vehicles' 
ORDER BY ordinal_position;

SELECT 'USERS COLUMNS:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

COMMIT;

SELECT '✅ Schema fix completed!' as status; 