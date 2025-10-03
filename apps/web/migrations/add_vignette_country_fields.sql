-- Migration: Add country and is_required fields to vehicle_documents table
-- Date: 2025-10-03
-- Description: Support for multiple countries and required/optional vignettes

-- Add country field (nullable for backward compatibility)
ALTER TABLE vehicle_documents
ADD COLUMN IF NOT EXISTS country VARCHAR(2);

-- Add is_required field (default false)
ALTER TABLE vehicle_documents
ADD COLUMN IF NOT EXISTS is_required BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN vehicle_documents.country IS 'Country code for vignette (SK, CZ, AT, HU, SI)';
COMMENT ON COLUMN vehicle_documents.is_required IS 'Whether the vignette is required (true) or optional (false)';

-- Create index for faster filtering by country
CREATE INDEX IF NOT EXISTS idx_vehicle_documents_country ON vehicle_documents(country);

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM 
    information_schema.columns 
WHERE 
    table_name = 'vehicle_documents' 
    AND column_name IN ('country', 'is_required');

