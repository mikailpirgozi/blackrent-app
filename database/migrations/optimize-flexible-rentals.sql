-- 🔧 OPTIMALIZÁCIA FLEXIBLE RENTALS - BlackRent
-- Autor: AI Assistant + Mikail
-- Cieľ: Zjednodušiť over-engineered flexible rental systém na 2 jednoduché polia

-- =====================================================
-- FÁZA 1: ANALÝZA SÚČASNÉHO STAVU
-- =====================================================

-- Skontroluj koľko prenájmov používa flexible features
SELECT 
    '📊 FLEXIBLE RENTALS USAGE ANALYSIS' as title,
    COUNT(*) as total_rentals,
    COUNT(*) FILTER (WHERE is_flexible = true) as flexible_count,
    COUNT(*) FILTER (WHERE rental_type = 'flexible') as rental_type_flexible,
    COUNT(*) FILTER (WHERE can_be_overridden = true) as can_be_overridden_count,
    COUNT(*) FILTER (WHERE auto_extend = true) as auto_extend_count,
    COUNT(*) FILTER (WHERE override_history != '[]'::jsonb) as has_override_history,
    COUNT(*) FILTER (WHERE flexible_end_date IS NOT NULL) as has_flexible_end_date,
    ROUND(COUNT(*) FILTER (WHERE is_flexible = true) * 100.0 / COUNT(*), 2) as flexible_percentage
FROM rentals;

-- Skontroluj konzistenciu is_flexible vs rental_type
SELECT 
    '🔍 CONSISTENCY CHECK' as title,
    CASE 
        WHEN is_flexible = true AND rental_type = 'flexible' THEN '✅ Consistent'
        WHEN is_flexible = false AND rental_type = 'standard' THEN '✅ Consistent'
        WHEN is_flexible = true AND rental_type != 'flexible' THEN '❌ Inconsistent: is_flexible=true but rental_type=' || rental_type
        WHEN is_flexible = false AND rental_type = 'flexible' THEN '❌ Inconsistent: is_flexible=false but rental_type=flexible'
        ELSE '⚠️ Other: is_flexible=' || is_flexible || ', rental_type=' || rental_type
    END as consistency_status,
    COUNT(*) as count
FROM rentals
GROUP BY consistency_status
ORDER BY count DESC;

-- =====================================================
-- FÁZA 2: ZÁLOHA PRED ČISTENÍM
-- =====================================================

-- Vytvor backup tabuľku pre flexible rental dáta (pre prípad rollback)
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
    override_history::text as override_history_json,
    created_at,
    updated_at
FROM rentals 
WHERE is_flexible = true 
   OR rental_type = 'flexible'
   OR can_be_overridden = true 
   OR auto_extend = true 
   OR flexible_end_date IS NOT NULL
   OR override_history != '[]'::jsonb;

SELECT 
    '💾 BACKUP CREATED' as title,
    COUNT(*) as backed_up_records,
    'Records with flexible features safely backed up' as description
FROM flexible_rentals_backup;

-- =====================================================
-- FÁZA 3: DÁTA SYNCHRONIZÁCIA
-- =====================================================

-- 1. Zjednoť is_flexible a rental_type (rental_type ako single source of truth)
UPDATE rentals 
SET rental_type = CASE 
    WHEN is_flexible = true THEN 'flexible'
    ELSE 'standard'
END
WHERE (is_flexible = true AND rental_type != 'flexible') 
   OR (is_flexible = false AND rental_type = 'flexible')
   OR rental_type IS NULL;

-- 2. Synchronizuj is_flexible podľa rental_type
UPDATE rentals 
SET is_flexible = (rental_type = 'flexible')
WHERE is_flexible != (rental_type = 'flexible');

-- Kontrola po synchronizácii
SELECT 
    '✅ SYNCHRONIZATION COMPLETED' as title,
    COUNT(*) FILTER (WHERE rental_type = 'flexible' AND is_flexible = true) as consistent_flexible,
    COUNT(*) FILTER (WHERE rental_type = 'standard' AND is_flexible = false) as consistent_standard,
    COUNT(*) FILTER (WHERE rental_type != 'flexible' AND rental_type != 'standard') as other_types,
    COUNT(*) FILTER (WHERE (rental_type = 'flexible') != is_flexible) as still_inconsistent
FROM rentals;

-- =====================================================
-- FÁZA 4: OPTIMALIZÁCIA - ODSTRÁNENIE ZBYTOČNÝCH POLÍ
-- =====================================================

-- Odstráň zbytočné indexy
DROP INDEX IF EXISTS idx_rentals_override_priority;

-- Odstráň zbytočné over-engineered polia
ALTER TABLE rentals 
DROP COLUMN IF EXISTS can_be_overridden,
DROP COLUMN IF EXISTS override_priority,
DROP COLUMN IF EXISTS notification_threshold, 
DROP COLUMN IF EXISTS auto_extend,
DROP COLUMN IF EXISTS override_history;

-- flexible_end_date ponechávame - môže byť užitočné pre približný koniec
-- is_flexible ponechávame - rýchly boolean check
-- rental_type ponechávame - hlavný indikátor typu prenájmu

SELECT '🧹 CLEANUP COMPLETED' as title, 'Removed 5 over-engineered fields' as result;

-- =====================================================
-- FÁZA 5: NOVÉ OPTIMALIZOVANÉ INDEXY
-- =====================================================

-- Aktualizuj index pre flexible rentals (len potrebné polia)
DROP INDEX IF EXISTS idx_rentals_flexible;
CREATE INDEX IF NOT EXISTS idx_rentals_type_dates 
ON rentals(rental_type, start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_rentals_flexible_simple
ON rentals(rental_type) 
WHERE rental_type = 'flexible';

SELECT '⚡ NEW INDEXES CREATED' as title, 'Optimized for simplified flexible rentals' as result;

-- =====================================================
-- FÁZA 6: FINÁLNE ŠTATISTIKY
-- =====================================================

-- Ukáž finálny stav
SELECT 
    '📈 FINAL STATISTICS' as title,
    COUNT(*) as total_rentals,
    COUNT(*) FILTER (WHERE rental_type = 'standard') as standard_rentals,
    COUNT(*) FILTER (WHERE rental_type = 'flexible') as flexible_rentals,
    COUNT(*) FILTER (WHERE flexible_end_date IS NOT NULL) as with_flexible_end_date,
    ROUND(COUNT(*) FILTER (WHERE rental_type = 'flexible') * 100.0 / COUNT(*), 2) as flexible_percentage
FROM rentals;

SELECT 
    '✅ FLEXIBLE RENTALS OPTIMIZATION COMPLETED!' as result,
    'Simplified from 8 fields to 3 essential fields' as improvement,
    'Performance improved, complexity reduced' as benefit,
    'Run real-time updates implementation next!' as next_step;