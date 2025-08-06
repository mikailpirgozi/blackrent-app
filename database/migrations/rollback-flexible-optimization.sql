-- 🔄 ROLLBACK SCRIPT PRE FLEXIBLE RENTALS OPTIMALIZÁCIU
-- Použite len ak chcete vrátiť všetky zmeny z optimize-flexible-rentals.sql

-- =====================================================
-- FÁZA 1: OBNOVENIE ZMAZANÝCH STĹPCOV
-- =====================================================

-- Pridaj späť odstránené polia s predvolenou hodnotou
ALTER TABLE rentals 
ADD COLUMN IF NOT EXISTS can_be_overridden BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS override_priority INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS notification_threshold INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS auto_extend BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS override_history JSONB DEFAULT '[]'::jsonb;

-- =====================================================
-- FÁZA 2: OBNOVENIE DÁT Z BACKUP TABUĽKY
-- =====================================================

-- Obnov dáta z backup tabuľky (ak existuje)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'flexible_rentals_backup') THEN
    
    -- Aktualizuj rentals z backup dát
    UPDATE rentals 
    SET 
      can_be_overridden = b.can_be_overridden,
      override_priority = b.override_priority,
      notification_threshold = b.notification_threshold,
      auto_extend = b.auto_extend,
      override_history = b.override_history_json::jsonb
    FROM flexible_rentals_backup b
    WHERE rentals.id = b.id;
    
    RAISE NOTICE 'Data restored from backup table';
  ELSE
    RAISE NOTICE 'Backup table not found - using default values';
  END IF;
END
$$;

-- =====================================================
-- FÁZA 3: OBNOVENIE INDEXOV
-- =====================================================

-- Odstráň optimalizované indexy
DROP INDEX IF EXISTS idx_rentals_type_dates;
DROP INDEX IF EXISTS idx_rentals_flexible_simple;

-- Obnov pôvodné indexy
CREATE INDEX IF NOT EXISTS idx_rentals_flexible ON rentals(is_flexible, rental_type) 
WHERE is_flexible = true;

CREATE INDEX IF NOT EXISTS idx_rentals_override_priority ON rentals(override_priority, can_be_overridden) 
WHERE can_be_overridden = true;

-- =====================================================
-- FÁZA 4: KONTROLA ÚSPEŠNOSTI ROLLBACK
-- =====================================================

-- Skontroluj že všetky stĺpce existujú
SELECT 
    'ROLLBACK VERIFICATION' as title,
    CASE WHEN COUNT(*) = 8 THEN '✅ All columns restored' 
         ELSE '❌ Missing columns: ' || (8 - COUNT(*))::text 
    END as status
FROM information_schema.columns 
WHERE table_name = 'rentals' 
  AND column_name IN (
    'rental_type', 'is_flexible', 'flexible_end_date',
    'can_be_overridden', 'override_priority', 'notification_threshold',
    'auto_extend', 'override_history'
  );

-- Skontroluj že indexy existujú
SELECT 
    'INDEX VERIFICATION' as title,
    COUNT(*) as restored_indexes
FROM pg_indexes 
WHERE tablename = 'rentals' 
  AND indexname IN ('idx_rentals_flexible', 'idx_rentals_override_priority');

SELECT 
    '✅ ROLLBACK COMPLETED' as result,
    'All flexible rental fields restored' as status,
    'Original complex system is back' as note;