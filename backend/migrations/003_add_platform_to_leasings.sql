-- ================================================================
-- 📋 MIGRÁCIA 003: Platform ID pre Leasings
-- ================================================================
-- Pridáva platform_id do leasings tabuľky pre multi-tenancy support
-- ================================================================

DO $$ 
BEGIN
    RAISE NOTICE '📋 Migrácia 003: Pridávanie platform_id do leasings tabuľky...';
    
    -- Add platform_id column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leasings' AND column_name = 'platform_id'
    ) THEN
        ALTER TABLE leasings ADD COLUMN platform_id UUID REFERENCES platforms(id) ON DELETE SET NULL;
        RAISE NOTICE '   ✅ platform_id stĺpec pridaný do leasings';
    ELSE
        RAISE NOTICE '   ℹ️ platform_id stĺpec už existuje v leasings';
    END IF;
    
    -- Create index for platform_id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'leasings' AND indexname = 'idx_leasings_platform'
    ) THEN
        CREATE INDEX idx_leasings_platform ON leasings(platform_id);
        RAISE NOTICE '   ✅ Index idx_leasings_platform vytvorený';
    ELSE
        RAISE NOTICE '   ℹ️ Index idx_leasings_platform už existuje';
    END IF;
    
    -- Migrate existing leasings to Blackrent platform (default)
    -- This assumes all existing leasings belong to Blackrent
    DECLARE
        blackrent_id UUID;
        updated_count INTEGER;
    BEGIN
        SELECT id INTO blackrent_id FROM platforms WHERE name = 'Blackrent' LIMIT 1;
        
        IF blackrent_id IS NOT NULL THEN
            UPDATE leasings 
            SET platform_id = blackrent_id
            WHERE platform_id IS NULL;
            
            GET DIAGNOSTICS updated_count = ROW_COUNT;
            RAISE NOTICE '   ✅ % existujúcich leasingov priradených k Blackrent platforme', updated_count;
        ELSE
            RAISE NOTICE '   ⚠️ Blackrent platforma nenájdená, preskakujem migráciu dát';
        END IF;
    END;
    
    RAISE NOTICE '✅ Migrácia 003: Platform ID pre Leasings úspešne dokončená!';
    RAISE NOTICE '   🚗 Leasings majú teraz platform_id pre multi-tenancy';
    RAISE NOTICE '   🔍 Index vytvorený pre rýchle filtrovanie';
    
END $$;

