-- ✅ FIX: Extend pdf_url column from VARCHAR(500) to TEXT for long signed URLs
-- Signed URLs from R2 can be 600-800 characters with query parameters
-- This migration fixes URL truncation issue

-- Handover Protocols
ALTER TABLE handover_protocols 
ALTER COLUMN pdf_url TYPE TEXT;

-- Return Protocols  
ALTER TABLE return_protocols
ALTER COLUMN pdf_url TYPE TEXT;

-- Verify changes
SELECT 
    table_name, 
    column_name, 
    data_type,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name IN ('handover_protocols', 'return_protocols') 
  AND column_name = 'pdf_url';

