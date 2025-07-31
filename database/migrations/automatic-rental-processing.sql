-- 🔧 BlackRent Database Migration: AUTOMATIC RENTAL PROCESSING
-- Autor: AI Assistant  
-- Dátum: 2025-01-30
-- Cieľ: Pridať podporu pre automatické spracovanie prenájmov z emailov

-- =====================================================
-- FÁZA 1: ROZŠÍRENIE RENTALS TABUĽKY
-- =====================================================

BEGIN;

-- Pridanie nových stĺpcev pre automatické spracovanie
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS source_type VARCHAR(20) DEFAULT 'manual'
    CHECK (source_type IN ('manual', 'email_auto', 'api_auto'));

ALTER TABLE rentals ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'approved'
    CHECK (approval_status IN ('pending', 'approved', 'rejected', 'spam'));

ALTER TABLE rentals ADD COLUMN IF NOT EXISTS email_content TEXT;

ALTER TABLE rentals ADD COLUMN IF NOT EXISTS auto_processed_at TIMESTAMP;

ALTER TABLE rentals ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id);

ALTER TABLE rentals ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;

ALTER TABLE rentals ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Komentáre k novým stĺpcom
COMMENT ON COLUMN rentals.source_type IS 'Zdroj prenájmu: manual, email_auto, api_auto';
COMMENT ON COLUMN rentals.approval_status IS 'Stav schválenia: pending, approved, rejected, spam';
COMMENT ON COLUMN rentals.email_content IS 'Originálny obsah emailu pre audit';
COMMENT ON COLUMN rentals.auto_processed_at IS 'Kedy bol automaticky spracovaný';
COMMENT ON COLUMN rentals.approved_by IS 'ID používateľa ktorý schválil/zamietol';
COMMENT ON COLUMN rentals.approved_at IS 'Kedy bol schválený/zamietnutý';
COMMENT ON COLUMN rentals.rejection_reason IS 'Dôvod zamietnutia';

-- =====================================================
-- FÁZA 2: INDEXY PRE VÝKON
-- =====================================================

-- Index pre rýchle vyhľadávanie pending prenájmov
CREATE INDEX IF NOT EXISTS idx_rentals_approval_status ON rentals(approval_status);

-- Index pre filtrovanie podľa zdroja
CREATE INDEX IF NOT EXISTS idx_rentals_source_type ON rentals(source_type);

-- Kompozitný index pre admin dashboard
CREATE INDEX IF NOT EXISTS idx_rentals_auto_pending ON rentals(source_type, approval_status) 
WHERE source_type != 'manual' AND approval_status = 'pending';

-- Index pre chronológie automatického spracovania
CREATE INDEX IF NOT EXISTS idx_rentals_auto_processed_at ON rentals(auto_processed_at) 
WHERE auto_processed_at IS NOT NULL;

-- =====================================================
-- FÁZA 3: AKTUALIZÁCIA EXISTUJÚCICH ZÁZNAMOV
-- =====================================================

-- Všetky existujúce prenájmy označiť ako manuálne a schválené
UPDATE rentals 
SET 
    source_type = 'manual',
    approval_status = 'approved',
    approved_at = created_at
WHERE source_type IS NULL OR approval_status IS NULL;

-- =====================================================
-- FÁZA 4: VYTVORENIE HELPER VIEWS
-- =====================================================

-- View pre pending automatic rentals
CREATE OR REPLACE VIEW pending_automatic_rentals AS
SELECT 
    r.*,
    v.brand || ' ' || v.model AS vehicle_name,
    v.license_plate,
    v.company AS vehicle_company,
    u.username AS approved_by_username
FROM rentals r
LEFT JOIN vehicles v ON r.vehicle_id = v.id
LEFT JOIN users u ON r.approved_by = u.id
WHERE r.source_type != 'manual' 
  AND r.approval_status = 'pending'
ORDER BY r.auto_processed_at DESC;

-- View pre automatické prenájmy štatistiky
CREATE OR REPLACE VIEW automatic_rentals_stats AS
SELECT 
    source_type,
    approval_status,
    COUNT(*) as count,
    MIN(auto_processed_at) as first_processed,
    MAX(auto_processed_at) as last_processed
FROM rentals 
WHERE source_type != 'manual'
GROUP BY source_type, approval_status;

-- =====================================================
-- FÁZA 5: AUDIT LOG
-- =====================================================

-- Tabuľka pre audit log automatického spracovania
CREATE TABLE IF NOT EXISTS automatic_processing_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rental_id UUID REFERENCES rentals(id),
    action VARCHAR(50) NOT NULL, -- 'processed', 'approved', 'rejected', 'spam_filtered'
    details JSONB,
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auto_log_rental_id ON automatic_processing_log(rental_id);
CREATE INDEX IF NOT EXISTS idx_auto_log_action ON automatic_processing_log(action);
CREATE INDEX IF NOT EXISTS idx_auto_log_created_at ON automatic_processing_log(created_at);

COMMIT;

-- =====================================================
-- VERIFIKÁCIA MIGRÁCIE
-- =====================================================

-- Kontrola či sa pridali nové stĺpce
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'rentals' 
  AND column_name IN ('source_type', 'approval_status', 'email_content', 'auto_processed_at', 'approved_by', 'approved_at', 'rejection_reason')
ORDER BY column_name;

-- Kontrola indexov
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'rentals' 
  AND indexname LIKE 'idx_rentals_%'
ORDER BY indexname;

-- Kontrola views
SELECT viewname, definition 
FROM pg_views 
WHERE viewname IN ('pending_automatic_rentals', 'automatic_rentals_stats');

-- Kontrola audit tabuľky
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'automatic_processing_log'
ORDER BY ordinal_position;

-- Test query - počet prenájmov podľa zdroja
SELECT 
    source_type,
    approval_status,
    COUNT(*) as count
FROM rentals 
GROUP BY source_type, approval_status
ORDER BY source_type, approval_status;

-- =====================================================
-- UKÁŽKOVÉ DÁTA PRE TESTOVANIE (VOLITEĽNÉ)
-- =====================================================

-- Vytvorenie test pending rental (zakomentované)
/*
INSERT INTO rentals (
    vehicle_id, 
    customer_name, 
    start_date, 
    end_date, 
    total_price, 
    commission, 
    payment_method,
    source_type,
    approval_status,
    email_content,
    auto_processed_at,
    order_number
) 
SELECT 
    v.id,
    'Test Automatický Zákazník',
    CURRENT_DATE + INTERVAL '1 day',
    CURRENT_DATE + INTERVAL '3 days',
    150.00,
    15.00,
    'bank_transfer',
    'email_auto',
    'pending',
    'Test email content for automatic processing...',
    CURRENT_TIMESTAMP,
    'AUTO-TEST-001'
FROM vehicles v 
WHERE v.status = 'available' 
LIMIT 1;
*/

-- Hotovo!
SELECT '✅ Automatic Rental Processing Migration completed successfully!' as result;