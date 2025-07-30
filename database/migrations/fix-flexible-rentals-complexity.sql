-- 🔧 BlackRent Database Cleanup #2: FLEXIBLE RENTALS SIMPLIFICATION
-- Autor: AI Assistant  
-- Dátum: $(date)
-- Cieľ: Zjednodušiť over-engineered flexible rental systém

-- =====================================================
-- FÁZA 1: ANALÝZA SÚČASNÉHO STAVU
-- =====================================================

-- Skontroluj použitie flexible rental polí
SELECT 
    'rental_type distribution' as analysis,
    rental_type,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM rentals 
WHERE rental_type IS NOT NULL
GROUP BY rental_type

UNION ALL

SELECT 
    'is_flexible vs rental_type' as analysis,
    CASE 
        WHEN is_flexible = true AND rental_type = 'flexible' THEN 'consistent'
        WHEN is_flexible = true AND rental_type != 'flexible' THEN 'inconsistent'
        WHEN is_flexible = false AND rental_type = 'flexible' THEN 'inconsistent'
        ELSE 'standard'
    END as consistency,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM rentals
GROUP BY consistency

UNION ALL

SELECT 
    'override features usage' as analysis,
    CASE 
        WHEN can_be_overridden = true THEN 'can_be_overridden=true'
        WHEN auto_extend = true THEN 'auto_extend=true' 
        WHEN override_history != '[]'::jsonb THEN 'has_override_history'
        ELSE 'unused_features'
    END as feature_usage,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM rentals
GROUP BY feature_usage;

-- =====================================================
-- FÁZA 2: ZÁLOHA DÁTA PRED ČISTENÍM
-- =====================================================

-- Vytvor backup tabuľku pre flexible rental dáta (ak sú potrebné)
CREATE TABLE IF NOT EXISTS flexible_rentals_backup AS
SELECT 
    id,
    rental_type,
    is_flexible,
    flexible_end_date,
    can_be_overridden,
    override_priority,
    notification_threshold,
    auto_extend,
    override_history::text as override_history_json
FROM rentals 
WHERE is_flexible = true 
   OR rental_type = 'flexible'
   OR can_be_overridden = true 
   OR auto_extend = true 
   OR override_history != '[]'::jsonb;

SELECT 
    COUNT(*) as backed_up_records,
    'Records with flexible/override features backed up' as description
FROM flexible_rentals_backup;

-- =====================================================
-- FÁZA 3: DÁTA CLEANING & SIMPLIFICATION  
-- =====================================================

-- 1. Zjednoť rental_type a is_flexible
UPDATE rentals 
SET rental_type = 'flexible'
WHERE is_flexible = true AND (rental_type IS NULL OR rental_type != 'flexible');

UPDATE rentals 
SET rental_type = COALESCE(rental_type, 'standard')
WHERE rental_type IS NULL;

-- 2. Vyčisti inconsistent data
UPDATE rentals 
SET is_flexible = true 
WHERE rental_type = 'flexible' AND is_flexible = false;

UPDATE rentals 
SET is_flexible = false 
WHERE rental_type != 'flexible' AND is_flexible = true;

-- =====================================================
-- FÁZA 4: VALIDÁCIA ČISTENIA
-- =====================================================

-- Skontroluj konzistenciu po čistení
SELECT 
    rental_type,
    is_flexible,
    COUNT(*) as count,
    CASE 
        WHEN (rental_type = 'flexible' AND is_flexible = true) OR 
             (rental_type != 'flexible' AND is_flexible = false) 
        THEN '✅ CONSISTENT'
        ELSE '❌ INCONSISTENT'
    END as consistency_check
FROM rentals
GROUP BY rental_type, is_flexible
ORDER BY rental_type, is_flexible;

-- =====================================================
-- FÁZA 5: ODSTRÁNENIE REDUNDANTNÝCH POLÍ
-- =====================================================

-- POZOR: Táto sekcia je komentovaná pre bezpečnosť
-- Spusti len po kontrole že dáta sú konzistentné

/*
-- Odstráň redundantné is_flexible pole (rental_type už stačí)
ALTER TABLE rentals DROP COLUMN IF EXISTS is_flexible;

-- Odstráň over-engineered override systém
ALTER TABLE rentals DROP COLUMN IF EXISTS can_be_overridden;
ALTER TABLE rentals DROP COLUMN IF EXISTS override_priority;
ALTER TABLE rentals DROP COLUMN IF EXISTS notification_threshold;
ALTER TABLE rentals DROP COLUMN IF EXISTS auto_extend;
ALTER TABLE rentals DROP COLUMN IF EXISTS override_history;

-- Zachovaj len potrebné pre flexible rentals
-- flexible_end_date - môže byť užitočné pre flexible end date
-- rental_type - hlavný indikátor typu prenájmu

-- Aktualizuj indexes - odstráň staré, pridaj nové
DROP INDEX IF EXISTS idx_rentals_flexible;
DROP INDEX IF EXISTS idx_rentals_override_priority;

-- Nový jednoduchý index len pre rental_type
CREATE INDEX IF NOT EXISTS idx_rentals_type ON rentals(rental_type);

-- Index pre flexible rentals s end date
CREATE INDEX IF NOT EXISTS idx_rentals_flexible_end_date 
ON rentals(flexible_end_date) 
WHERE rental_type = 'flexible';
*/

-- =====================================================
-- FÁZA 6: AKTUALIZÁCIA APPLICATION KÓDU
-- =====================================================

-- Poznámky pre aktualizáciu kódu:
SELECT 
    '📝 CODE UPDATE NEEDED' as task,
    'Remove isFlexible checks, use rentalType only' as frontend_change,
    'Update rental creation/update logic' as backend_change,
    'Remove override features from UI' as ui_change;

-- =====================================================
-- VÝSLEDOK
-- =====================================================

SELECT 
    '✅ FLEXIBLE RENTALS SIMPLIFIED' as result,
    'rental_type as single source of truth' as improvement_1,
    'Removed 5 over-engineered fields' as improvement_2,
    'Backup created for safety' as safety_measure,
    'Run FÁZA 5 manually after validation' as next_step; 