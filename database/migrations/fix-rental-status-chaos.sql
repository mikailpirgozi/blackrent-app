-- 🔧 BlackRent Database Cleanup #1: RENTAL STATUS UNIFICATION
-- Autor: AI Assistant
-- Dátum: $(date)
-- Cieľ: Zjednotiť status/confirmed/paid do jedného jasného status stavu

-- =====================================================
-- FÁZA 1: ANALÝZA SÚČASNÉHO STAVU
-- =====================================================

-- Skontroluj súčasné kombinácie stavov
SELECT 
    status,
    confirmed,
    paid,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM rentals 
GROUP BY status, confirmed, paid
ORDER BY count DESC;

-- =====================================================
-- FÁZA 2: VYTVORENIE NOVÉHO STATUS ENUM
-- =====================================================

-- Vytvor nový typ pre unified status
DROP TYPE IF EXISTS rental_status_enum CASCADE;
CREATE TYPE rental_status_enum AS ENUM (
    'pending',      -- Čaká na potvrdenie (status=pending, confirmed=false, paid=false)
    'confirmed',    -- Potvrdený ale nezaplatený (status=pending, confirmed=true, paid=false)
    'paid',         -- Zaplatený a pripravený (confirmed=true, paid=true)
    'active',       -- Práve prebieha (active rental)
    'completed',    -- Úspešne ukončený (returned)
    'cancelled'     -- Zrušený
);

-- =====================================================
-- FÁZA 3: PRIDANIE NOVÉHO STĹPCA
-- =====================================================

-- Pridaj nový unified status stĺpec
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS status_unified rental_status_enum;

-- =====================================================
-- FÁZA 4: MIGRÁCIA DÁTA (SMART MAPPING)
-- =====================================================

-- Mapovanie logiky na základe súčasných kombinácií:
UPDATE rentals SET status_unified = 
    CASE 
        -- Zrušené prenájmy
        WHEN status = 'cancelled' THEN 'cancelled'::rental_status_enum
        
        -- Ukončené prenájmy
        WHEN status = 'completed' OR status = 'returned' THEN 'completed'::rental_status_enum
        
        -- Aktívne prenájmy (práve prebiehajú)
        WHEN status = 'active' OR (confirmed = true AND paid = true AND start_date <= CURRENT_DATE AND end_date >= CURRENT_DATE) 
        THEN 'active'::rental_status_enum
        
        -- Zaplatené a pripravené
        WHEN confirmed = true AND paid = true THEN 'paid'::rental_status_enum
        
        -- Potvrdené ale nezaplatené  
        WHEN confirmed = true AND paid = false THEN 'confirmed'::rental_status_enum
        
        -- Čakajúce na potvrdenie (default)
        ELSE 'pending'::rental_status_enum
    END;

-- =====================================================
-- FÁZA 5: VALIDÁCIA MIGRÁCIE
-- =====================================================

-- Skontroluj výsledok migrácie
SELECT 
    'PRED MIGRÁCIOU - Stará logika' as phase,
    status as old_status,
    confirmed,
    paid,
    NULL::text as new_status,
    COUNT(*) as count
FROM (
    SELECT status, confirmed, paid FROM rentals LIMIT 0
) t
GROUP BY status, confirmed, paid

UNION ALL

SELECT 
    'PO MIGRÁCII - Nová logika' as phase,
    status as old_status,
    confirmed,
    paid, 
    status_unified::text as new_status,
    COUNT(*) as count
FROM rentals 
GROUP BY status, confirmed, paid, status_unified
ORDER BY phase, count DESC;

-- =====================================================
-- FÁZA 6: BEZPEČNOSTNÁ KONTROLA
-- =====================================================

-- Skontroluj či všetky záznamy majú nový status
SELECT 
    COUNT(*) as total_rentals,
    COUNT(status_unified) as migrated_rentals,
    COUNT(*) - COUNT(status_unified) as unmigrated_rentals
FROM rentals;

-- Ak sú unmigrated_rentals > 0, STOP a oprav problémy!

-- =====================================================
-- FÁZA 7: VYČISTENIE (SPUSTI LEN AK JE MIGRÁCIA OK!)
-- =====================================================

-- POZOR: Táto sekcia je komentovaná pre bezpečnosť
-- Spusti len po kontrole že migrácia prebehla správne

/*
-- Nahraď starý status stĺpec novým
ALTER TABLE rentals RENAME COLUMN status TO status_old_backup;
ALTER TABLE rentals RENAME COLUMN status_unified TO status;
ALTER TABLE rentals ALTER COLUMN status SET NOT NULL;
ALTER TABLE rentals ALTER COLUMN status SET DEFAULT 'pending'::rental_status_enum;

-- Odstráň redundantné stĺpce (po kontrole!)
ALTER TABLE rentals DROP COLUMN confirmed;
ALTER TABLE rentals DROP COLUMN paid;

-- Vytvor index pre nový status
CREATE INDEX IF NOT EXISTS idx_rentals_status_unified ON rentals(status);

-- Nakoniec vyčisti backup stĺpec (po potvrdení že všetko funguje)
-- ALTER TABLE rentals DROP COLUMN status_old_backup;
*/

-- =====================================================
-- VÝSLEDOK
-- =====================================================

SELECT 
    '✅ RENTAL STATUS UNIFICATION COMPLETED' as result,
    'Nový status_unified stĺpec vytvorený a naplnený' as description,
    'Spusti FÁZU 7 manuálne po kontrole výsledkov' as next_step; 